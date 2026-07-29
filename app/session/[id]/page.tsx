"use client";

import { FormEvent, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useSession,
  useUploadPhotos,
  useDeletePhoto,
  useAddPlayer,
  useRemovePlayer,
  useStartDraft,
  useResetDraft,
  useVerifyAdmin,
} from "@/lib/hooks";
import type { PhotoUploadResult } from "@/lib/api";

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
  const [authed, setAuthed] = useState(
    () => !!sessionStorage.getItem(`admin_${id}`)
  );
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [newPlayer, setNewPlayer] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useSession(id);
  const uploadMutation = useUploadPhotos(id);
  const deleteMutation = useDeletePhoto(id);
  const addPlayer = useAddPlayer(id);
  const removePlayer = useRemovePlayer(id);
  const startMutation = useStartDraft(id);
  const resetMutation = useResetDraft(id);
  const verifyMutation = useVerifyAdmin(id);

  const session = data?.session;
  const photos = data?.photos ?? [];
  const players = data?.players ?? [];
  const picks = data?.picks ?? [];

  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

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

    // Client-side check: 200-photo draft limit
    const remaining = 200 - photos.length;
    if (remaining <= 0) {
      setMsg({ text: "This draft already has 200 photos — delete some before uploading more", ok: false });
      setTimeout(() => setMsg(null), 6000);
      fileRef.current.value = "";
      return;
    }
    if (files.length > remaining) {
      setMsg({ text: `Can only add ${remaining} more photo${remaining !== 1 ? "s" : ""} (max 200 per draft)`, ok: false });
      setTimeout(() => setMsg(null), 6000);
      fileRef.current.value = "";
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync(files);
      // Check for per-file errors in the server response
      const hasError = (r: PhotoUploadResult): r is { filename: string; error: string } =>
        "error" in r && typeof r.error === "string";
      const errors = (result ?? []).filter(hasError);
      if (errors.length > 0) {
        const summary = errors
          .slice(0, 3)
          .map((e) => `${e.filename}: ${e.error}`)
          .join("; ");
        const suffix = errors.length > 3 ? ` (+${errors.length - 3} more)` : "";
        setMsg({ text: `Uploaded ${files.length - errors.length}/${files.length} — ${summary}${suffix}`, ok: false });
      } else {
        setMsg({ text: `Uploaded ${files.length} photo(s)`, ok: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setMsg({ text: message, ok: false });
    }
    fileRef.current.value = "";
    setTimeout(() => setMsg(null), 6000);
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
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8 text-[var(--text)]">Admin</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); login(); }}
          className="flex gap-3 w-full max-w-sm"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-[var(--text-muted)]"
            required
          />
          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
          >
            {verifyMutation.isPending ? "..." : "Enter"}
          </button>
        </form>
        {authError && <p className="text-red-400 mt-3 text-sm">{authError}</p>}
        <a
          href="/"
          className="text-[var(--text-muted)] text-sm mt-6 hover:text-[var(--text-secondary)] transition-colors"
        >
          &larr; Back to home
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="font-semibold text-[var(--text)] mb-4">Photos</h2>
          {!draftActive && (
            <form onSubmit={onUpload} className="flex gap-2 mb-5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[var(--surface-hover)] file:text-[var(--text)] hover:file:bg-[var(--elevated2)] cursor-pointer transition-colors"
              />
              <button
                type="submit"
                disabled={uploadMutation.isPending}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all whitespace-nowrap"
              >
                {uploadMutation.isPending ? "..." : "Upload"}
              </button>
            </form>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-[var(--elevated)]"
              >
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                {!draftActive && (
                  <button
                    onClick={() =>
                      confirmAction(
                        () => deleteMutation.mutate(p.id),
                        "Delete this photo?"
                      )
                    }
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
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
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {photos.length > 0 && players.length > 0 && !session.closed && (
          <button
            onClick={() => {
              startMutation.mutate();
              router.push(`/session/${id}/draft`);
            }}
            disabled={startMutation.isPending}
            className="px-10 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
          >
            {startMutation.isPending ? "Starting..." : "Start Draft"}
          </button>
        )}
        {session.closed && (
          <button
            onClick={() => router.push(`/session/${id}/draft`)}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
          >
            {draftComplete ? "View Results" : "Go to Draft Board"}
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
