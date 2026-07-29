import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const { photoId } = await req.json();

  if (!photoId) {
    return NextResponse.json({ error: "photoId required" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!session || !session.closed)
    return NextResponse.json({ error: "Draft not started" }, { status: 400 });

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("session_id", id)
    .order("turn_order");

  if (!players?.length)
    return NextResponse.json({ error: "No players" }, { status: 400 });

  const playerIndex = session.current_turn % players.length;
  const currentPlayer = players[playerIndex];

  const { data: existing } = await supabase
    .from("picks")
    .select("id")
    .eq("photo_id", photoId)
    .maybeSingle();

  if (existing)
    return NextResponse.json({ error: "Already picked" }, { status: 400 });

  const { data: photo } = await supabase
    .from("photos")
    .select("id")
    .eq("id", photoId)
    .eq("session_id", id)
    .single();

  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const { data: picks } = await supabase
    .from("picks")
    .select("id")
    .eq("session_id", id);

  const pickNumber = picks?.length ?? 0;

  const { data: pick, error } = await supabase
    .from("picks")
    .insert({
      session_id: id,
      photo_id: photoId,
      player_id: currentPlayer.id,
      pick_number: pickNumber,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalPhotos = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("session_id", id);

  const done = pickNumber + 1 >= (totalPhotos.count ?? 0);

  const nextTurn = session.current_turn + 1;

  if (done) {
    await supabase
      .from("sessions")
      .update({ current_turn: nextTurn, closed: false })
      .eq("id", id);
  } else {
    await supabase
      .from("sessions")
      .update({ current_turn: nextTurn })
      .eq("id", id);
  }

  const nextPlayer = done
    ? null
    : players[nextTurn % players.length];

  return NextResponse.json({
    pick,
    currentPlayer: { id: currentPlayer.id, name: currentPlayer.name },
    nextPlayer: nextPlayer ? { id: nextPlayer.id, name: nextPlayer.name } : null,
    done,
  });
}
