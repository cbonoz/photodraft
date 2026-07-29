import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  await supabase.from("picks").delete().eq("session_id", id);

  const { error } = await supabase
    .from("sessions")
    .update({ closed: false, current_turn: 0 })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
