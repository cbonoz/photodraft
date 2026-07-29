create extension if not exists "uuid-ossp";

create table sessions (
  id text primary key,
  title text not null,
  admin_password text not null default '',
  closed boolean not null default false,
  current_turn integer not null default 0
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references sessions(id) on delete cascade,
  path text not null,
  filename text not null default '',
  sort_order integer not null default 0
);

create table players (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references sessions(id) on delete cascade,
  name text not null,
  turn_order integer not null
);

create table picks (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references sessions(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete cascade unique,
  player_id uuid not null references players(id) on delete cascade,
  pick_number integer not null
);
