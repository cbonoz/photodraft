"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateSession } from "@/lib/hooks";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const { mutateAsync, isPending } = useCreateSession();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const session = await mutateAsync({
      title: title.trim(),
      password: password.trim(),
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
        <p className="text-neutral-500">
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
          placeholder="Session title"
          className="w-full px-4 py-3 rounded-xl bg-[#12121a] border border-[#2a2a3e] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-neutral-600"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Admin password"
          className="w-full px-4 py-3 rounded-xl bg-[#12121a] border border-[#2a2a3e] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors placeholder:text-neutral-600"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
        >
          {isPending ? "Creating..." : "Create Session"}
        </button>
      </form>
    </main>
  );
}
