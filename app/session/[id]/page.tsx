"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSession,
  useDeletePhoto,
  useAddPlayer,
  useRemovePlayer,
  useStartDraft,
  useResetDraft,
  useUpdateSnakeDraft,
  useVerifyAdmin,
} from "@/lib/hooks";
import type { Photo, PhotoUploadResult } from "@/lib/api";
import * as api from "@/lib/api";
import { PhotoTile } from "@/components/PhotoTile";

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-[var(--border)] border-t-cyan-400 rounded-full animate-spin" />
    </div>
  );
}

export default function AdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!sessionStorage.getItem(`admin_${id}`));
  }, [id]);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [newPlayer, setNewPlayer] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const { data, isLoading, isError } = useSession(id);
  const queryClient = useQueryClient();
  const deleteMutation = useDeletePhoto(id);
  const addPlayer = useAddPlayer(id);
  const removePlayer = useRemovePlayer(id);
  const startMutation = useStartDraft(id);
  const resetMutation = useResetDraft(id);
  const snakeDraftMutation = useUpdateSnakeDraft(id);
  const verifyMutation = useVerifyAdmin(id);

  const session = data?.session;
  const photos = data?.photos ?? [];
  const players = data?.players ?? [];
  const picks = data?.picks ?? [];

  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  async function login() {
    try {
      await verifyMutation.mutateAsync(password);
      sessionStorage.setItem(`admin_${id}`, "1");
      setAuthed(true);
    } catch {
      setAuthError("Wrong password");
    }
  }

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileRef.current?.files?.length) return;
    const files = Array.from(fileRef.current.files);

    // Client-side validation: check file sizes before sending
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const oversized = files.filter((f) => f.size > MAX_SIZE);
    if (oversized.length > 0) {
      const names = oversized.map((f) => `"${f.name}"`).join(", ");
      setMsg({ text: `${names} ${oversized.length === 1 ? "is" : "are"} too large (max 10MB per file)`, ok: false });
      setTimeout(() => setMsg(null), 6000);
      fileRef.current.value = "";
      return;
    }

    // Client-side check: 200-photo draft limit — truncate instead of hard-failing
    const remaining = 200 - photos.length;
    if (remaining <= 0) {
      setMsg({ text: "This draft already has 200 photos — delete some before uploading more", ok: false });
      setTimeout(() => setMsg(null), 6000);
      fileRef.current.value = "";
      return;
    }
    const uploadFiles = files.length > remaining ? files.slice(0, remaining) : files;
    if (uploadFiles.length < files.length) {
      setMsg({ text: `Only ${remaining} slot${remaining !== 1 ? "s" : ""} remaining — uploading ${uploadFiles.length} of ${files.length}`, ok: true });
      setTimeout(() => setMsg(null), 4000);
    }

    try {
      setUploadProgress({ done: 0, total: uploadFiles.length });
      const results: PhotoUploadResult[] = [];
      for (let i = 0; i < uploadFiles.length; i++) {
        const result = await api.uploadPhoto(id, uploadFiles[i]);
        results.push(result);
        setUploadProgress({ done: i + 1, total: uploadFiles.length });
      }
      queryClient.invalidateQueries({ queryKey: ["session", id] });
      setUploadProgress(null);

      // Categorise results
      type ErrorResult = { filename: string; error: string };
      type SkippedResult = { filename: string; status: string };
      const isError = (r: PhotoUploadResult): r is ErrorResult =>
        "error" in r && typeof (r as ErrorResult).error === "string";
      const isSkipped = (r: PhotoUploadResult): r is SkippedResult =>
        "status" in r && typeof (r as SkippedResult).status === "string";
      const isSuccess = (r: PhotoUploadResult): r is Photo => "id" in r && typeof (r as Photo).id === "string";
      const errors = results.filter(isError);
      const skipped = results.filter(isSkipped);
      const duplicates = results.filter((r) => isSkipped(r) && (r as SkippedResult).status === "already exists");
      const otherSkipped = results.filter((r) => isSkipped(r) && (r as SkippedResult).status !== "already exists");
      const succeeded = results.filter(isSuccess);

      const parts: string[] = [];
      if (succeeded.length > 0) parts.push(`${succeeded.length} uploaded`);
      if (duplicates.length > 0) parts.push(`${duplicates.length} already exist${duplicates.length === 1 ? "s" : ""}`);
      if (otherSkipped.length > 0) parts.push(`${otherSkipped.length} skipped`);
      if (errors.length > 0) {
        const summary = errors.map((e) => (e as ErrorResult).filename).join(", ");
        parts.push(`${summary} failed`);
      }
      const hasIssues = errors.length > 0 || skipped.length > 0;
      setMsg({ text: parts.join(" — "), ok: !hasIssues });

      // Clear on success; errors are sticky until next action
      if (!hasIssues) setTimeout(() => setMsg(null), 5000);
    } catch (err) {
      setUploadProgress(null);
      const message = err instanceof Error ? err.message : "Upload failed";
      setMsg({ text: message, ok: false });
    }
    fileRef.current.value = "";
  }

  async function onAddPlayer(e: FormEvent) {
    e.preventDefault();
    if (!newPlayer.trim()) return;
    await addPlayer.mutateAsync(newPlayer.trim());
    setNewPlayer("");
    setMsg({ text: `Added ${newPlayer.trim()}`, ok: true });
    setTimeout(() => setMsg(null), 3000);
  }

  function confirmAction(action: () => void, label: string) {
    if (window.confirm(label)) action();
  }

  if (!authed) {
    if (isError) {
      return (
        <main className="flex flex-col items-center justify-center min-h-screen p-8">
          <a
            href="/"
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm transition-colors mb-8"
          >
            &larr; Home
          </a>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
            Draft not found
          </h1>
          <p className="text-[var(--text-muted)] text-sm mb-6">
            This draft doesn&apos;t exist or the link is incorrect.
          </p>
          <a
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Create a Draft
          </a>
        </main>
      );
    }

    if (isLoading) {
      return (
        <main className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="w-6 h-6 border-2 border-[var(--border)] border-t-cyan-400 rounded-full animate-spin" />
        </main>
      );
    }

    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <a
          href="/"
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm transition-colors mb-8"
        >
          &larr; Home
        </a>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
            {session?.title ?? "Untitled Draft"}
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Enter the admin password to manage photos, players, and settings.
          </p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); login(); }}
          className="flex flex-col gap-3 w-full max-w-sm"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-[var(--text-muted)]"
            required
            autoFocus
          />
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
          >
            {verifyMutation.isPending ? "Checking..." : "Enter Admin"}
          </button>
        </form>
        <div className="flex items-center gap-3 my-4 w-full max-w-sm">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[var(--text-muted)] text-xs">or</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>
        <a
          href={`/session/${id}/draft`}
          className="w-full max-w-sm px-6 py-3 rounded-xl bg-[var(--surface-hover)] text-[var(--text)] font-semibold hover:bg-[var(--elevated2)] transition-all border border-[var(--border)] text-center"
        >
          Join as Participant
        </a>
      </main>
    );
  }

  if (isLoading) return <Spinner />;
  if (!session) return <div className="p-8 text-[var(--text)]">Draft not found</div>;

  const draftComplete = picks.length > 0 && picks.length === photos.length;
  const draftActive = session.closed && !draftComplete;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <a
            href="/"
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm transition-colors"
          >
            &larr; Home
          </a>
          <h1 className="text-3xl font-bold mt-1 text-[var(--text)]">
            {session.title}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {photos.length} / 200 photo{photos.length !== 1 && "s"}
            {players.length > 0 &&
              <> &middot; {players.length} player{players.length !== 1 && "s"}</>}
            {picks.length > 0 &&
              <> &middot; {picks.length} pick{picks.length !== 1 && "s"}</>}
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            draftComplete
              ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
              : draftActive
                ? "bg-amber-900/50 text-amber-300 border border-amber-700/50"
                : "bg-[var(--elevated2)] text-[var(--text-muted)] border border-[var(--border)]"
          }`}
        >
          {draftComplete ? "Complete" : draftActive ? "In progress" : "Setup"}
        </span>
      </div>

      {msg && (
        <p
          className={`text-sm mb-6 text-center ${
            msg.ok ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {msg.text}
        </p>
      )}

      {!draftActive && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text)]">Snake draft</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Order reverses each round (1,2,3 &rarr; 3,2,1).{" "}
              {session.snake_draft
                ? "Currently enabled."
                : "Currently off — order repeats each round."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={session.snake_draft}
            onClick={() =>
              snakeDraftMutation.mutate(!session.snake_draft)
            }
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
              session.snake_draft
                ? "bg-gradient-to-r from-cyan-500 to-blue-600"
                : "bg-[var(--elevated2)]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                session.snake_draft ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="font-semibold text-[var(--text)] mb-4">
            Photos{" "}
            <span className="text-[var(--text-muted)] text-xs font-normal">
              ({photos.length} / 200)
            </span>
          </h2>
          {!draftActive && (
            <form onSubmit={onUpload} className="mb-5">
              <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--elevated)] cursor-pointer hover:border-cyan-500/50 transition-colors text-center">
                <svg
                  className="w-8 h-8 text-[var(--text-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <p className="text-sm font-medium text-[var(--text)]">
                  Add photos to the draft pool
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Click to select or drag &amp; drop images here
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
              </label>
              {uploadProgress !== null && (
                <p className="text-xs text-[var(--text-secondary)] text-center mt-3">
                  Uploading {uploadProgress.done} / {uploadProgress.total}...
                </p>
              )}
            </form>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-[var(--elevated)]"
              >
                <PhotoTile photo={p} className="h-full">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </PhotoTile>
                {!draftActive && (
                  <button
                    onClick={() =>
                      confirmAction(
                        () => deleteMutation.mutate(p.id),
                        "Delete this photo?"
                      )
                    }
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center z-10"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="font-semibold text-[var(--text)] mb-4">Players</h2>
          {!draftActive && (
            <form onSubmit={onAddPlayer} className="flex gap-2 mb-5">
              <input
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                placeholder="Player name"
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--elevated)] border border-[var(--border)] focus:outline-none focus:border-cyan-500/50 text-sm transition-colors placeholder:text-[var(--text-muted)]"
              />
              <button
                type="submit"
                disabled={addPlayer.isPending}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all whitespace-nowrap"
              >
                Add
              </button>
            </form>
          )}
          {players.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">No players yet</p>
          ) : (
            <ul className="space-y-1">
              {players.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--elevated)] text-[var(--text-secondary)]"
                >
                  <span>
                    <span className="text-[var(--text-muted)] mr-2 text-sm">#{i + 1}</span>
                    {p.name}
                  </span>
                  {!draftActive && (
                    <button
                      onClick={() =>
                        confirmAction(
                          () => removePlayer.mutate(p.id),
                          `Remove ${p.name}?`
                        )
                      }
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      &times;
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {draftActive && (
            <div className="mt-4 p-3 rounded-xl bg-amber-900/20 border border-amber-700/40">
              <p className="text-xs text-amber-300/90 leading-relaxed">
                The draft is currently in progress. To change the player
                order or add photos,{" "}
                <button
                  onClick={() =>
                    confirmAction(
                      () => resetMutation.mutate(),
                      "Abort the in-progress draft and return to setup?"
                    )
                  }
                  className="underline hover:text-amber-200 font-medium"
                >
                  abort the draft
                </button>{" "}
                first. Picks will be cleared but photos and players are kept.
              </p>
            </div>
          )}

          {session.closed && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => router.push(`/session/${id}/draft`)}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                {draftComplete ? "View Results" : "Go to Draft Board"}
              </button>
              {draftActive && (
                <button
                  onClick={() =>
                    confirmAction(
                      () => resetMutation.mutate(),
                      "Abort the in-progress draft and return to setup?"
                    )
                  }
                  disabled={resetMutation.isPending}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--elevated2)] disabled:opacity-50 transition-all border border-[var(--border)]"
                >
                  {resetMutation.isPending ? "..." : "Abort Draft"}
                </button>
              )}
            </div>
          )}

          <button
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) {
                await navigator.share({ title: session?.title ?? "PhotoDraft", url });
              } else {
                await navigator.clipboard.writeText(url);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }
            }}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)] text-sm hover:text-[var(--text-secondary)] hover:bg-[var(--elevated2)] transition-all border border-[var(--border)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            {shareCopied ? "Link copied!" : "Share draft link with players"}
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {photos.length > 0 && players.length > 0 && !session.closed && (
          <button
            onClick={async () => {
              await startMutation.mutateAsync();
              router.push(`/session/${id}/draft`);
            }}
            disabled={startMutation.isPending}
            className="px-10 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
          >
            {startMutation.isPending ? "Starting..." : "Start Draft"}
          </button>
        )}
        {draftComplete && (
          <button
            onClick={() =>
              confirmAction(
                () => resetMutation.mutate(),
                "Reset all picks and start over?"
              )
            }
            disabled={resetMutation.isPending}
            className="px-8 py-3 rounded-xl bg-[var(--surface-hover)] text-[var(--text-secondary)] font-semibold hover:bg-[var(--elevated2)] disabled:opacity-50 transition-all border border-[var(--border)]"
          >
            {resetMutation.isPending ? "..." : "Reset Draft"}
          </button>
        )}
      </div>
    </main>
  );
}
