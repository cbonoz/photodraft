import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = getSupabase();
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const [{ data: photos }, { data: players }, { data: picks }] =
    await Promise.all([
      supabase.from("photos").select("*").eq("session_id", id).order("sort_order"),
      supabase
        .from("players")
        .select("*")
        .eq("session_id", id)
        .order("turn_order"),
      supabase
        .from("picks")
        .select("*")
        .eq("session_id", id)
        .order("pick_number"),
    ]);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const { admin_password, ...safeSession } = session;

  return NextResponse.json({
    session: safeSession,
    photos: (photos ?? []).map((p) => ({
      ...p,
      url: `${supabaseUrl}/storage/v1/object/public/photos/${p.path}`,
    })),
    players: players ?? [],
    picks: picks ?? [],
  });
}
