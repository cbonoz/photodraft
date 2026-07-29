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
      <h1 className="text-5xl font-bold mb-2">PhotoDraft</h1>
      <p className="text-neutral-400 mb-8">
        Upload photos, add players, and draft them turn by turn.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full max-w-md">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Session title"
          className="w-full px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-neutral-500"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Admin password"
          className="w-full px-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 focus:outline-none focus:border-neutral-500"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 rounded-lg bg-white text-neutral-900 font-semibold hover:bg-neutral-200 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Creating..." : "Create Session"}
        </button>
      </form>
    </main>
  );
}
