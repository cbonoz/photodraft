"use client";

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto p-6 py-12">
      <Link
        href="/"
        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-sm transition-colors"
      >
        &larr; Back
      </Link>

      <h1 className="text-3xl font-bold mt-4 mb-8 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
        How PhotoDraft works
      </h1>

      <section className="space-y-8">
        <Step number={1} title="Create a Draft">
          <p>
            Give your draft a title and set an admin password. You&apos;ll need
            the password to manage photos, players, and settings later.
            Share the draft URL with players when it&apos;s time to pick.
          </p>
        </Step>

        <Step number={2} title="Upload Photos">
          <p>
            Upload the photos you want to draft. Accepted formats: JPG, PNG,
            GIF, WebP. Files are stored securely in Supabase Storage.
            Duplicate filenames are skipped automatically.
          </p>
        </Step>

        <Step number={3} title="Add Players">
          <p>
            Enter player names in draft order (top to bottom). Add or remove
            players anytime before starting. Each player gets one pick per
            round, and the order cycles until all photos are taken.
          </p>
        </Step>

        <Step number={4} title="Start the Draft">
          <p>
            Once you have photos and at least one player, hit Start Draft.
            You&apos;ll be taken to the draft board where the first player
            can make their pick.
          </p>
        </Step>

        <Step number={5} title="Pick Photos">
          <p>
            On the draft board, available photos are shown in a grid. The
            current player&apos;s name is highlighted. Click any photo to see it
            full-size in a preview, then confirm the pick. Each pick is
            immediately assigned to the player and removed from the pool.
          </p>
        </Step>

        <Step number={6} title="Finish &amp; Review">
          <p>
            When all photos are picked, the draft is complete. You can:
          </p>
          <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-1 mt-2">
            <li>
              <strong>Return photos to the pool</strong> — hover any picked
              photo and click &quot;Return to pool&quot; to undo a pick. Return
              as many as you want, then click &quot;Resume Draft&quot; to
              continue.
            </li>
            <li>
              <strong>Download CSV</strong> — export the full results as a
              CSV file showing pick order, player, and photo filename.
            </li>
            <li>
              <strong>Draft Again</strong> — reset all picks and start a new
              draft with the same photos and players.
            </li>
          </ul>
        </Step>

        <Step number={7} title="Admin Controls">
          <p>
            During setup, you can upload and delete photos, add and remove
            players, and reorder photos. Once the draft is in progress,
            these controls are locked to prevent disruption.
          </p>
        </Step>
      </section>
    </main>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </span>
        <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
      </div>
      <div className="text-[var(--text-secondary)] text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
