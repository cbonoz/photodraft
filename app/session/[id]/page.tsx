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

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-neutral-700 border-t-cyan-400 rounded-full animate-spin" />
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
    await uploadMutation.mutateAsync(files);
    fileRef.current.value = "";
    setMsg({ text: `Uploaded ${files.length} photo(s)`, ok: true });
    setTimeout(() => setMsg(null), 3000);
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
        <h1 className="text-3xl font-bold mb-8 text-neutral-200">Admin</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); login(); }}
          className="flex gap-3 w-full max-w-sm"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="flex-1 px-4 py-3 rounded-xl bg-[#12121a] border border-[#2a2a3e] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-neutral-600"
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
        {authError && (
          <p className="text-red-400 mt-3 text-sm">{authError}</p>
        )}
        <a
          href="/"
          className="text-neutral-600 text-sm mt-6 hover:text-neutral-400 transition-colors"
        >
          &larr; Back to home
        </a>
      </main>
    );
  }

  if (isLoading) return <Spinner />;
  if (!session) return <div className="p-8">Session not found</div>;

  const draftComplete = picks.length > 0 && picks.length === photos.length;
  const draftActive = session.closed && !draftComplete;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <a
            href="/"
            className="text-neutral-600 hover:text-neutral-400 text-sm transition-colors"
          >
            &larr; Home
          </a>
          <h1 className="text-3xl font-bold mt-1 text-neutral-100">
            {session.title}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {photos.length} photo{photos.length !== 1 && "s"}
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
                : "bg-[#1a1a2e] text-neutral-500 border border-[#2a2a3e]"
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
        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-6">
          <h2 className="font-semibold text-neutral-200 mb-4">Photos</h2>
          {!draftActive && (
            <form onSubmit={onUpload} className="flex gap-2 mb-5">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-sm text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1c1c2e] file:text-neutral-200 hover:file:bg-[#252540] cursor-pointer transition-colors"
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
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-[#0a0a12]"
              >
                <img
                  src={p.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                {!draftActive && (
                  <button
                    onClick={() =>
                      confirmAction(
                        () => deleteMutation.mutate(p.id),
                        "Delete this photo?"
                      )
                    }
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-6">
          <h2 className="font-semibold text-neutral-200 mb-4">Players</h2>
          {!draftActive && (
            <form onSubmit={onAddPlayer} className="flex gap-2 mb-5">
              <input
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                placeholder="Player name"
                className="flex-1 px-3 py-2 rounded-xl bg-[#0a0a12] border border-[#2a2a3e] focus:outline-none focus:border-cyan-500/50 text-sm transition-colors placeholder:text-neutral-600"
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
            <p className="text-neutral-600 text-sm">No players yet</p>
          ) : (
            <ul className="space-y-1">
              {players.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#0a0a12] text-neutral-300"
                >
                  <span>
                    <span className="text-neutral-600 mr-2 text-sm">#{i + 1}</span>
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
            className="px-8 py-3 rounded-xl bg-[#1c1c2e] text-neutral-300 font-semibold hover:bg-[#252540] disabled:opacity-50 transition-all border border-[#2a2a3e]"
          >
            {resetMutation.isPending ? "..." : "Reset Draft"}
          </button>
        )}
      </div>
    </main>
  );
}
