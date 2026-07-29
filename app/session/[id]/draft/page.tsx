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
      <div className="w-6 h-6 border-2 border-neutral-700 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

function PickModal({
  photo,
  playerName,
  onConfirm,
  onCancel,
  pending,
}: {
  photo: Photo;
  playerName: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl w-[90vw] max-w-[700px] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-center bg-[#0a0a12]" style={{ height: '70vh', maxHeight: '600px' }}>
          <img
            src={photo.url}
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
        <div className="p-6 text-center">
          <p className="text-lg font-semibold text-neutral-200 mb-1">
            Assign to <span className="text-cyan-400">{playerName}</span>?
          </p>
          <p className="text-neutral-500 text-sm mb-6">
            This photo will be added to {playerName}&apos;s pile.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              disabled={pending}
              className="px-6 py-2.5 rounded-xl bg-[#1c1c2e] text-neutral-300 font-medium hover:bg-[#252540] disabled:opacity-50 transition-all border border-[#2a2a3e]"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={pending}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
            >
              {pending ? "Picking..." : "Confirm Pick"}
            </button>
          </div>
        </div>
      </div>
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
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);

  if (isLoading) return <Spinner />;

  const session = data?.session;
  const allPhotos = data?.photos ?? [];
  const players = data?.players ?? [];
  const picks = data?.picks ?? [];

  if (!session) return <div className="p-8">Session not found</div>;

  if (!session.closed && picks.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold text-neutral-200 mb-4">
          Draft Not Started
        </h1>
        <p className="text-neutral-500 mb-6">
          The admin needs to start the draft first.
        </p>
        <button
          onClick={() => router.push(`/session/${id}`)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-all"
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
    setPendingPhoto(null);
    try {
      await pickMutation.mutateAsync(photoId);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Pick failed");
    }
  }

  const draftComplete = available.length === 0;

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <a
          href={`/session/${id}`}
          className="text-neutral-600 hover:text-neutral-400 text-sm transition-colors"
        >
          &larr; Admin
        </a>
        <h1 className="text-xl font-bold text-neutral-100">
          {session.title}
        </h1>
        {draftComplete ? (
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
            Complete
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-300 border border-amber-700/50">
            Pick {picks.length + 1} of {allPhotos.length}
          </span>
        )}
      </div>

      {pendingPhoto && currentPlayer && (
        <PickModal
          photo={pendingPhoto}
          playerName={currentPlayer.name}
          onConfirm={() => handlePick(pendingPhoto.id)}
          onCancel={() => setPendingPhoto(null)}
          pending={pickMutation.isPending}
        />
      )}

      {draftComplete ? (
        <>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30" />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                Draft Complete!
              </h2>
            </div>
            <p className="text-neutral-500 mb-6">
              All {allPhotos.length} photos have been picked.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push(`/session/${id}`)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                Back to Admin
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Reset all picks and start over?"))
                    resetMutation.mutate();
                }}
                disabled={resetMutation.isPending}
                className="px-6 py-3 rounded-xl bg-[#1c1c2e] text-neutral-300 font-medium hover:bg-[#252540] disabled:opacity-50 transition-all border border-[#2a2a3e]"
              >
                {resetMutation.isPending ? "..." : "Draft Again"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const playerPicks = picksByPlayer.get(player.id) ?? [];
              return (
                <div
                  key={player.id}
                  className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-5"
                >
                  <h3 className="font-semibold text-neutral-200 mb-3 flex items-center gap-2">
                    {player.name}
                    <span className="text-neutral-500 text-sm font-normal ml-auto">
                      {playerPicks.length} photo
                      {playerPicks.length !== 1 && "s"}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {playerPicks.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group aspect-square rounded-xl overflow-hidden bg-[#0a0a12]"
                      >
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => returnMutation.mutate(photo.id)}
                          disabled={returnMutation.isPending}
                          className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-neutral-300 hover:text-white font-medium backdrop-blur-sm"
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
            <p className="text-lg text-neutral-200">
              <span className="text-cyan-400 font-semibold">
                {currentPlayer?.name}
              </span>
              {"'"}s turn to pick
            </p>
          </div>

          {message && (
            <p className="text-center text-red-400 text-sm mb-4">{message}</p>
          )}

          <div className="mb-10">
            <h2 className="font-semibold text-neutral-400 text-sm mb-3">
              Available ({available.length})
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2">
              {available.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPendingPhoto(p)}
                  className="aspect-square rounded-xl overflow-hidden bg-[#0a0a12] border-2 border-transparent hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
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
                  className={`rounded-2xl p-5 transition-all ${
                    isCurrent
                      ? "bg-cyan-950/30 border border-cyan-500/30 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-500/5"
                      : "bg-[#12121a] border border-[#2a2a3e]"
                  }`}
                >
                  <h3 className="font-semibold text-neutral-200 mb-3 flex items-center gap-2">
                    {player.name}
                    {isCurrent && (
                      <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">
                        Picking
                      </span>
                    )}
                    <span className="text-neutral-600 text-sm font-normal ml-auto">
                      {playerPicks.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 min-h-[100px]">
                    {playerPicks.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square rounded-xl overflow-hidden bg-[#0a0a12]"
                      >
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {playerPicks.length === 0 && (
                      <p className="text-neutral-700 text-sm col-span-2">
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
