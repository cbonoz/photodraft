import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const { id, playerId } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", playerId)
    .eq("session_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
