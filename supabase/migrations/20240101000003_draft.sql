drop table if exists assignments;
drop table if exists votes;

alter table sessions add column if not exists current_turn integer not null default 0;

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references sessions(id) on delete cascade,
  name text not null,
  turn_order integer not null
);

create table if not exists picks (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references sessions(id) on delete cascade,
  photo_id uuid not null references photos(id) on delete cascade unique,
  player_id uuid not null references players(id) on delete cascade,
  pick_number integer not null
);
