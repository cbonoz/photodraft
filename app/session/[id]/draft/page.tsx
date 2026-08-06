"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useSession,
  usePickPhoto,
  useSkipTurn,
  useReturnPhoto,
  useResetDraft,
  useResumeDraft,
  useVerifyAdmin,
} from "@/lib/hooks";
import type { Photo } from "@/lib/api";
import { PhotoTile } from "@/components/PhotoTile";
import { playerForPick } from "@/lib/draft-order";

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-[var(--border)] border-t-cyan-400 rounded-full animate-spin" />
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
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-[90vw] max-w-[700px] overflow-hidden shadow-2xl">
        <div
          className="flex items-center justify-center bg-[var(--elevated)]"
          style={{ height: "50vh", maxHeight: "600px" }}
        >
          <img
            src={photo.url}
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
        <div className="p-6 text-center">
          <p className="text-xs text-[var(--text-muted)] mb-1 font-mono truncate max-w-full">
            {photo.filename}
          </p>
          <p className="text-lg font-semibold text-[var(--text)] mb-1">
            Assign to <span className="text-cyan-400">{playerName}</span>?
          </p>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            This photo will be added to {playerName}&apos;s pile.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              disabled={pending}
              className="px-6 py-2.5 rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] font-medium hover:bg-[var(--elevated2)] disabled:opacity-50 transition-all border border-[var(--border)]"
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
  const skipMutation = useSkipTurn(id);
  const returnMutation = useReturnPhoto(id);
  const resetMutation = useResetDraft(id);
  const resumeMutation = useResumeDraft(id);
  const verifyMutation = useVerifyAdmin(id);
  const [message, setMessage] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<Photo | null>(null);
  const [copied, setCopied] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdmin, setIsAdmin] = useState(
    () => !!sessionStorage.getItem(`admin_${id}`)
  );

  async function elevateToAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminError("");
    try {
      await verifyMutation.mutateAsync(adminPassword);
      sessionStorage.setItem(`admin_${id}`, "1");
      setIsAdmin(true);
      setAdminModalOpen(false);
      router.push(`/session/${id}`);
    } catch {
      setAdminError("Wrong password");
    }
  }

  if (isLoading) return <Spinner />;

  const session = data?.session;
  const allPhotos = data?.photos ?? [];
  const players = data?.players ?? [];
  const picks = data?.picks ?? [];

  if (!session) return <div className="p-8 text-[var(--text)]">Draft not found</div>;

  if (!session.closed && picks.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-4">
          Draft Not Started
        </h1>
        <p className="text-[var(--text-muted)] mb-6">
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

  const currentPlayer =
    players.length > 0
      ? players[
          playerForPick(
            session.current_turn,
            players.length,
            session.snake_draft ?? false
          )
        ]
      : undefined;

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
  const draftPaused = !session.closed && picks.length > 0 && !draftComplete;

  const csvUrl = `/api/sessions/${id}/draft/export`;

  async function copyShareLink() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: session?.title ?? "PhotoDraft", url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => (isAdmin ? router.push(`/session/${id}`) : setAdminModalOpen(true))}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm transition-colors"
        >
          &larr; {isAdmin ? "Admin" : "Admin Access"}
        </button>
        <h1 className="text-xl font-bold text-[var(--text)]">
          {session.title}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={copyShareLink}
            className="px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--elevated2)] transition-all border border-[var(--border)] flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            {copied ? "Copied!" : "Share"}
          </button>
          {draftComplete ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
              Complete
            </span>
          ) : draftPaused ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-300 border border-amber-700/50">
              Paused
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-300 border border-amber-700/50">
              {available.length} remaining
            </span>
          )}
        </div>
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

      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-[var(--text)] mb-1">
              Admin Access
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-5">
              Enter the admin password to manage this draft.
            </p>
            <form onSubmit={elevateToAdmin} className="flex flex-col gap-3">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="w-full px-4 py-3 rounded-xl bg-[var(--elevated)] border border-[var(--border)] focus:outline-none focus:border-cyan-500/50 text-sm transition-colors placeholder:text-[var(--text-muted)]"
                required
                autoFocus
              />
              {adminError && (
                <p className="text-red-400 text-sm text-center">{adminError}</p>
              )}
              <button
                type="submit"
                disabled={verifyMutation.isPending}
                className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
              >
                {verifyMutation.isPending ? "Checking..." : "Continue as Admin"}
              </button>
            </form>
            <button
              onClick={() => setAdminModalOpen(false)}
              className="w-full mt-3 px-6 py-2.5 rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] font-medium hover:bg-[var(--elevated2)] transition-all border border-[var(--border)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {draftComplete || draftPaused ? (
        <>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-3">
              <div
                className={`w-3 h-3 rounded-full shadow-lg ${
                  draftComplete
                    ? "bg-emerald-400 shadow-emerald-400/30"
                    : "bg-amber-400 shadow-amber-400/30"
                }`}
              />
              <h2
                className={`text-4xl font-bold bg-clip-text text-transparent ${
                  draftComplete
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-300"
                    : "bg-gradient-to-r from-amber-400 to-amber-300"
                }`}
              >
                {draftComplete ? "Draft Complete!" : "Draft Paused"}
              </h2>
            </div>
            <p className="text-[var(--text-muted)] mb-6">
              {draftComplete
                ? `All ${allPhotos.length} photos have been picked.`
                : `${available.length} photo(s) returned to pool. Resume to continue.`}
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => router.push(`/session/${id}`)}
                className="px-6 py-3 rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] font-medium hover:bg-[var(--elevated2)] transition-all border border-[var(--border)]"
              >
                Back to Admin
              </button>
              <a
                href={csvUrl}
                className="px-6 py-3 rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] font-medium hover:bg-[var(--elevated2)] transition-all border border-[var(--border)]"
              >
                Download CSV
              </a>
              {draftPaused && (
                <button
                  onClick={() => resumeMutation.mutate()}
                  disabled={resumeMutation.isPending}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
                >
                  {resumeMutation.isPending ? "..." : "Resume Draft"}
                </button>
              )}
              <button
                onClick={() => {
                  if (window.confirm("Reset all picks and start over?"))
                    resetMutation.mutate();
                }}
                disabled={resetMutation.isPending}
                className="px-6 py-3 rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] font-medium hover:bg-[var(--elevated2)] disabled:opacity-50 transition-all border border-[var(--border)]"
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
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"
                >
                  <h3 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
                    {player.name}
                    <span className="text-[var(--text-muted)] text-sm font-normal ml-auto">
                      {playerPicks.length} photo
                      {playerPicks.length !== 1 && "s"}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {playerPicks.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group aspect-square rounded-xl overflow-hidden bg-[var(--elevated)]"
                      >
                        <PhotoTile photo={photo} className="h-full">
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </PhotoTile>
                        <button
                          onClick={() => returnMutation.mutate(photo.id)}
                          disabled={returnMutation.isPending}
                          className="absolute top-1.5 right-1.5 px-2 py-1 rounded-full bg-black/70 text-[10px] text-neutral-300 hover:text-white font-medium backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                        >
                          Return
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
            <p className="text-lg text-[var(--text)]">
              <span className="text-cyan-400 font-semibold">
                {currentPlayer?.name}
              </span>
              {"'"}s turn to pick
            </p>
            <button
              onClick={() => {
                if (window.confirm(`Skip ${currentPlayer?.name}'s turn?`))
                  skipMutation.mutate();
              }}
              disabled={skipMutation.isPending}
              className="mt-3 px-4 py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--elevated2)] disabled:opacity-50 transition-all border border-[var(--border)]"
            >
              {skipMutation.isPending ? "Skipping..." : "Skip turn"}
            </button>
          </div>

          {message && (
            <p className="text-center text-red-400 text-sm mb-4">{message}</p>
          )}

          <div className="lg:flex lg:gap-6 lg:items-start">
            <div className="lg:flex-1 lg:min-w-0">
              <div className="mb-10 lg:mb-0">
                <h2 className="font-semibold text-[var(--text-muted)] text-sm mb-3 flex items-center gap-2">
                  Photo Pool
                  <span className="px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300 text-xs border border-amber-700/40">
                    {available.length} remaining
                  </span>
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {available.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPendingPhoto(p)}
                      className="aspect-square rounded-xl overflow-hidden bg-[var(--elevated)] border-2 border-transparent hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
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
            </div>

            <div className="lg:w-72 lg:flex-shrink-0">
              <div className="space-y-3">
                {players.map((player) => {
                  const playerPicks = picksByPlayer.get(player.id) ?? [];
                  const isCurrent = player.id === currentPlayer?.id;
                  return (
                    <div
                      key={player.id}
                      className={`rounded-2xl p-4 transition-all ${
                        isCurrent
                          ? "bg-cyan-950/30 border border-cyan-500/30 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-500/5"
                          : "bg-[var(--surface)] border border-[var(--border)]"
                      }`}
                    >
                      <h3 className="font-semibold text-[var(--text)] mb-2.5 flex items-center gap-2">
                        {player.name}
                        {isCurrent && (
                          <span className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">
                            Picking
                          </span>
                        )}
                        <span className="text-[var(--text-muted)] text-sm font-normal ml-auto">
                          {playerPicks.length}
                        </span>
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {playerPicks.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--elevated)]"
                          >
                            <PhotoTile photo={photo} className="h-full">
                              <img
                                src={photo.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </PhotoTile>
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Return this photo to the pool? It will be available to pick again.`
                                    )
                                  )
                                    returnMutation.mutate(photo.id);
                                }}
                                disabled={returnMutation.isPending}
                                className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-black/70 text-[9px] text-neutral-300 hover:text-white font-medium backdrop-blur-sm sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                                title="Return to pool"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                        {playerPicks.length === 0 && (
                          <p className="text-[var(--text-muted)] text-xs col-span-3">
                            No picks yet
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
