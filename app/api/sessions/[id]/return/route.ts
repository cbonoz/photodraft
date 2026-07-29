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

  const { data: pick } = await supabase
    .from("picks")
    .select("*")
    .eq("photo_id", photoId)
    .eq("session_id", id)
    .single();

  if (!pick) {
    return NextResponse.json({ error: "Pick not found" }, { status: 404 });
  }

  await supabase.from("picks").delete().eq("photo_id", photoId).eq("session_id", id);

  await supabase
    .from("sessions")
    .update({ closed: true, current_turn: pick.pick_number })
    .eq("id", id);

  const { data: players } = await supabase
    .from("players")
    .select("id, name")
    .eq("session_id", id)
    .order("turn_order");

  const playerIndex = pick.pick_number % (players?.length ?? 1);
  const currentPlayer = players?.[playerIndex];

  return NextResponse.json({
    success: true,
    currentPlayer: currentPlayer
      ? { id: currentPlayer.id, name: currentPlayer.name }
      : null,
  });
}
