alter table photos add column filename text not null default '';
create index photos_session_filename_idx on photos(session_id, filename);
