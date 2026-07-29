"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useSession,
  usePickPhoto,
  useReturnPhoto,
  useResetDraft,
} from "@/lib/hooks";
import type { Photo } from "@/lib/api";

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
    </div>
  );
}

export default function DraftPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useSession(id);
  const pickMutation = usePickPhoto(id);
  const returnMutation = useReturnPhoto(id);
  const resetMutation = useResetDraft(id);
  const [message, setMessage] = useState("");

  if (isLoading) return <Spinner />;

  const session = data?.session;
  const allPhotos = data?.photos ?? [];
  const players = data?.players ?? [];
  const picks = data?.picks ?? [];

  if (!session) return <div className="p-8">Session not found</div>;

  if (!session.closed && picks.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-4">Draft Not Started</h1>
        <p className="text-neutral-400 mb-6">
          The admin needs to start the draft first.
        </p>
        <button
          onClick={() => router.push(`/session/${id}`)}
          className="px-6 py-3 rounded-lg bg-white text-neutral-900 font-medium hover:bg-neutral-200"
        >
          Back to Admin
        </button>
      </main>
    );
  }

  const pickedPhotoIds = new Set(picks.map((p) => p.photo_id));
  const available = allPhotos.filter((p) => !pickedPhotoIds.has(p.id));

  const playerIndex = session.current_turn % players.length;
  const currentPlayer = players[playerIndex];

  const picksByPlayer = new Map<string, Photo[]>();
  for (const p of players) picksByPlayer.set(p.id, []);
  for (const pick of picks) {
    const photo = allPhotos.find((ph) => ph.id === pick.photo_id);
    if (photo) picksByPlayer.get(pick.player_id)?.push(photo);
  }

  async function handlePick(photoId: string) {
    setMessage("");
    try {
      await pickMutation.mutateAsync(photoId);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Pick failed");
    }
  }

  const draftComplete = available.length === 0;

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <a
          href={`/session/${id}`}
          className="text-neutral-500 hover:text-neutral-300 text-sm"
        >
          &larr; Admin
        </a>
        <h1 className="text-2xl font-bold">{session.title}</h1>
        <div />
      </div>

      {draftComplete ? (
        <>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-3">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-4xl font-bold">Draft Complete!</h2>
            </div>
            <p className="text-neutral-400 mb-6">
              All {allPhotos.length} photos have been picked.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push(`/session/${id}`)}
                className="px-6 py-3 rounded-lg bg-white text-neutral-900 font-medium hover:bg-neutral-200"
              >
                Back to Admin
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Reset all picks and start over?"))
                    resetMutation.mutate();
                }}
                disabled={resetMutation.isPending}
                className="px-6 py-3 rounded-lg bg-neutral-800 text-neutral-100 font-medium hover:bg-neutral-700 disabled:opacity-50"
              >
                {resetMutation.isPending ? "..." : "Draft Again"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const playerPicks = picksByPlayer.get(player.id) ?? [];
              return (
                <div key={player.id} className="bg-neutral-900 rounded-xl p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    {player.name}
                    <span className="text-neutral-500 text-sm ml-auto">
                      {playerPicks.length} photo
                      {playerPicks.length !== 1 && "s"}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {playerPicks.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group aspect-square rounded-lg overflow-hidden bg-neutral-800"
                      >
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => returnMutation.mutate(photo.id)}
                          disabled={returnMutation.isPending}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-neutral-200 hover:text-white font-medium"
                        >
                          Return to pool
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-8">
            <p className="text-xl font-semibold">
              <span className="text-blue-400">{currentPlayer?.name}</span>
              {"'"}s turn to pick
            </p>
            <p className="text-neutral-500">
              Pick {picks.length + 1} of {allPhotos.length}
            </p>
          </div>

          {message && (
            <p className="text-center text-red-400 text-sm mb-4">{message}</p>
          )}

          <div className="mb-8">
            <h2 className="font-semibold mb-3 text-neutral-400">
              Available ({available.length})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {available.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePick(p.id)}
                  disabled={pickMutation.isPending}
                  className="aspect-square rounded-lg overflow-hidden bg-neutral-800 border-2 border-transparent hover:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <img
                    src={p.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const playerPicks = picksByPlayer.get(player.id) ?? [];
              const isCurrent = player.id === currentPlayer?.id;
              return (
                <div
                  key={player.id}
                  className={`rounded-xl p-4 ${
                    isCurrent
                      ? "bg-blue-900/30 ring-2 ring-blue-500"
                      : "bg-neutral-900"
                  }`}
                >
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    {player.name}
                    {isCurrent && (
                      <span className="text-xs text-blue-400">Picking...</span>
                    )}
                    <span className="text-neutral-500 text-sm ml-auto">
                      {playerPicks.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 min-h-[100px]">
                    {playerPicks.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square rounded-lg overflow-hidden bg-neutral-800"
                      >
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {playerPicks.length === 0 && (
                      <p className="text-neutral-600 text-sm col-span-2">
                        No picks yet
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
