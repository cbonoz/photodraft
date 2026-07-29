import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (!session || !session.closed)
    return NextResponse.json({ error: "Draft not started" }, { status: 400 });

  const { data: players } = await supabase
    .from("players")
    .select("id, name")
    .eq("session_id", id)
    .order("turn_order");

  if (!players?.length)
    return NextResponse.json({ error: "No players" }, { status: 400 });

  const nextTurn = session.current_turn + 1;
  const nextPlayer = players[nextTurn % players.length];

  await supabase
    .from("sessions")
    .update({ current_turn: nextTurn })
    .eq("id", id);

  return NextResponse.json({
    skippedPlayer: { id: players[session.current_turn % players.length].id, name: players[session.current_turn % players.length].name },
    currentPlayer: { id: nextPlayer.id, name: nextPlayer.name },
  });
}
