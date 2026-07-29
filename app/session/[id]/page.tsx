"use client";

import { FormEvent, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useSession,
  useUploadPhotos,
  useDeletePhoto,
  useReorderPhotos,
  useAddPlayer,
  useRemovePlayer,
  useStartDraft,
  useResetDraft,
  useVerifyAdmin,
} from "@/lib/hooks";

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
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
  const reorderMutation = useReorderPhotos(id);

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
    setMsg({ text: `${files.length} photo(s) uploaded`, ok: true });
    setTimeout(() => setMsg(null), 3000);
  }

  async function onAddPlayer(e: FormEvent) {
    e.preventDefault();
    if (!newPlayer.trim()) return;
    await addPlayer.mutateAsync(newPlayer.trim());
    setNewPlayer("");
    setMsg({ text: `${newPlayer.trim()} added`, ok: true });
    setTimeout(() => setMsg(null), 3000);
  }

  function confirmAction(action: () => void, label: string) {
    if (window.confirm(`Are you sure? ${label}`)) action();
  }

  if (!authed) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8">Admin</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
          className="flex gap-3 w-full max-w-sm"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="flex-1 px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-neutral-500"
            required
          />
          <button
            type="submit"
            disabled={verifyMutation.isPending}
            className="px-6 py-3 rounded-lg bg-white text-neutral-900 font-semibold hover:bg-neutral-200"
          >
            {verifyMutation.isPending ? "..." : "Enter"}
          </button>
        </form>
        {authError && <p className="text-red-400 mt-3 text-sm">{authError}</p>}
        <a href="/" className="text-neutral-500 text-sm mt-6 hover:text-neutral-300">
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
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-neutral-500 hover:text-neutral-300 text-sm">
              &larr; Home
            </a>
            <h1 className="text-3xl font-bold">{session.title}</h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">
            {photos.length} photo{photos.length !== 1 && "s"}
            {players.length > 0 && (
              <> &middot; {players.length} player{players.length !== 1 && "s"}</>
            )}
            {picks.length > 0 && (
              <> &middot; {picks.length} pick{picks.length !== 1 && "s"}</>
            )}
          </p>
        </div>
        {draftComplete ? (
          <span className="px-3 py-1 rounded-full bg-green-900 text-green-300 text-sm">
            Complete
          </span>
        ) : draftActive ? (
          <span className="px-3 py-1 rounded-full bg-yellow-900 text-yellow-300 text-sm">
            In progress
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-neutral-800 text-neutral-400 text-sm">
            Setup
          </span>
        )}
      </div>

      {msg && (
        <p
          className={`text-sm mb-4 text-center ${
            msg.ok ? "text-green-400" : "text-red-400"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-neutral-900 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Photos</h2>
          {!draftActive && (
            <form onSubmit={onUpload} className="flex gap-2 mb-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-sm text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-neutral-800 file:text-neutral-100 hover:file:bg-neutral-700 cursor-pointer"
              />
              <button
                type="submit"
                disabled={uploadMutation.isPending}
                className="px-4 py-2 rounded-lg bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50"
              >
                {uploadMutation.isPending ? "..." : "Upload"}
              </button>
            </form>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative group aspect-square rounded-lg overflow-hidden bg-neutral-800"
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
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-neutral-900 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Players</h2>
          {!draftActive && (
            <form onSubmit={onAddPlayer} className="flex gap-2 mb-4">
              <input
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                placeholder="Player name"
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-neutral-500 text-sm"
              />
              <button
                type="submit"
                disabled={addPlayer.isPending}
                className="px-4 py-2 rounded-lg bg-white text-neutral-900 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50"
              >
                Add
              </button>
            </form>
          )}
          {players.length === 0 ? (
            <p className="text-neutral-500 text-sm">No players yet</p>
          ) : (
            <ul className="space-y-2">
              {players.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-neutral-300"
                >
                  <span>
                    <span className="text-neutral-500 mr-2">#{i + 1}</span>
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
                      className="text-red-400 hover:text-red-300 text-sm"
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

      {!session.closed && photos.length > 0 && players.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={async () => {
              await startMutation.mutateAsync();
              router.push(`/session/${id}/draft`);
            }}
            disabled={startMutation.isPending}
            className="px-8 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-lg hover:bg-neutral-200 disabled:opacity-50"
          >
            {startMutation.isPending ? "Starting..." : "Start Draft"}
          </button>
        </div>
      )}

      <div className="flex justify-center gap-4 mt-6">
        {session.closed && (
          <button
            onClick={() => router.push(`/session/${id}/draft`)}
            className="px-8 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-lg hover:bg-neutral-200"
          >
            {draftComplete ? "View Results" : "Go to Draft Board"}
          </button>
        )}
        {draftComplete && (
          <button
            onClick={() => confirmAction(() => resetMutation.mutate(), "Reset all picks and start over?")}
            disabled={resetMutation.isPending}
            className="px-8 py-3 rounded-xl bg-neutral-800 text-neutral-100 font-semibold text-lg hover:bg-neutral-700 disabled:opacity-50"
          >
            {resetMutation.isPending ? "..." : "Reset Draft"}
          </button>
        )}
      </div>
    </main>
  );
}
