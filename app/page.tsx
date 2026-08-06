"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateSession } from "@/lib/hooks";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [snakeDraft, setSnakeDraft] = useState(false);
  const { mutateAsync, isPending } = useCreateSession();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const session = await mutateAsync({
      title: title.trim(),
      password: password.trim(),
      snakeDraft,
    });
    router.push(`/session/${session.id}`);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold mb-2">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            PhotoDraft
          </span>
        </h1>
        <p className="text-[var(--text-muted)]">
          Upload photos, add players, and draft them turn by turn.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 w-full max-w-sm"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Draft title"
          className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-[var(--text-muted)]"
          required
        />
        <div className="relative">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Set draft admin password"
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-[var(--text-muted)]"
            required
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 ml-1">
            You'll use this to manage photos, players, and settings.
          </p>
        </div>
        <label className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] cursor-pointer select-none">
          <span className="text-sm text-[var(--text-secondary)]">
            Snake draft
            <span className="block text-[11px] text-[var(--text-muted)]">
              Order reverses each round (1,2,3 → 3,2,1)
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={snakeDraft}
            onClick={() => setSnakeDraft((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              snakeDraft ? "bg-gradient-to-r from-cyan-500 to-blue-600" : "bg-[var(--elevated2)]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                snakeDraft ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
        >
          {isPending ? "Creating..." : "Create Draft"}
        </button>
      </form>
      <a
        href="/about"
        className="text-[var(--text-muted)] text-xs mt-6 hover:text-[var(--text-secondary)] transition-colors underline underline-offset-2"
      >
        How PhotoDraft works &rarr;
      </a>
    </main>
  );
}
