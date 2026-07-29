import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  // Reset session first so it's always in a valid state
  const { error: sessionError } = await supabase
    .from("sessions")
    .update({ closed: false, current_turn: 0 })
    .eq("id", id);

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });

  // Then clear picks — if this fails, session is already reset
  await supabase.from("picks").delete().eq("session_id", id);

  return NextResponse.json({ success: true });
}
