# PhotoDraft

A turn-based photo draft app. Upload photos, add players, and take turns picking — like a fantasy draft but for images.

Built with Next.js 15, Supabase (Postgres + Storage), Tailwind CSS, and React Query.

## How it works

1. **Create a session** — set a title and admin password
2. **Upload photos** — drag-and-drop or select files (stored in Supabase Storage)
3. **Add players** — enter names in order (draft order)
4. **Start the draft** — players take turns picking photos from the pool
5. **Each pick** — click an available photo → see it full-size in a modal → confirm the pick
6. **Draft complete** — review who got what, return photos to the pool, or reset and redraft

## Setup

### Prerequisites

- Node.js 22+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone and install

```bash
git clone <repo> && cd photodraft
npm install
```

### 2. Environment variables

Copy these into `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
DB_PW=<database-password>
```

`DB_PW` is only needed if running `supabase db push` from the CLI.

### 3. Database

Run the migrations:

```bash
npx supabase link --project-ref <ref> --password <db-pw>
npx supabase db push
```

Or paste `supabase/schema.sql` into the Supabase SQL editor.

### 4. Storage

Create a public bucket named `photos` in the Supabase Storage dashboard.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Deploy

Push to GitHub and import into Vercel. Add the four env vars in the Vercel project settings.

## Tech

- **Next.js 15** (App Router)
- **Supabase** (Postgres + Storage)
- **Tailwind CSS** (dark theme)
- **@tanstack/react-query** (client-side caching)
- **nanoid** (short session IDs)
