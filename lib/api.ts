export interface Session {
  id: string;
  title: string;
  closed: boolean;
  current_turn: number;
  admin_password: string;
}

export interface Photo {
  id: string;
  path: string;
  url: string;
  sort_order: number;
}

export interface Player {
  id: string;
  name: string;
  turn_order: number;
}

export interface Pick {
  id: string;
  photo_id: string;
  player_id: string;
  pick_number: number;
}

export interface SessionData {
  session: Session;
  photos: Photo[];
  players: Player[];
  picks: Pick[];
}

export async function fetchSession(id: string): Promise<SessionData> {
  const res = await fetch(`/api/sessions/${id}`);
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}

export async function createSession(title: string, password: string): Promise<Session> {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.session;
}

export async function uploadPhotos(
  sessionId: string,
  files: File[]
): Promise<Photo[]> {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);
  const res = await fetch(`/api/sessions/${sessionId}/photos`, {
    method: "POST",
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.photos;
}

export async function deletePhoto(
  sessionId: string,
  photoId: string
): Promise<void> {
  const res = await fetch(`/api/sessions/${sessionId}/photos`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoId }),
  });
  if (!res.ok) throw new Error("Failed to delete");
}

export async function addPlayer(
  sessionId: string,
  name: string
): Promise<Player> {
  const res = await fetch(`/api/sessions/${sessionId}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.player;
}

export async function removePlayer(
  sessionId: string,
  playerId: string
): Promise<void> {
  const res = await fetch(`/api/sessions/${sessionId}/players/${playerId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to remove");
}

export async function startDraft(sessionId: string): Promise<void> {
  const res = await fetch(`/api/sessions/${sessionId}/start`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to start");
}

export async function pickPhoto(
  sessionId: string,
  photoId: string
): Promise<{
  pick: Pick;
  currentPlayer: { id: string; name: string };
  nextPlayer: { id: string; name: string } | null;
  done: boolean;
}> {
  const res = await fetch(`/api/sessions/${sessionId}/pick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function reorderPhotos(
  sessionId: string,
  photoIds: string[]
): Promise<void> {
  const res = await fetch(`/api/sessions/${sessionId}/photos/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ photoIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder");
}

export async function resetDraft(sessionId: string): Promise<void> {
  const res = await fetch(`/api/sessions/${sessionId}/reset`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset");
}

export async function verifyAdmin(
  sessionId: string,
  password: string
): Promise<void> {
  const res = await fetch(`/api/sessions/${sessionId}/verify-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error("Wrong password");
}
