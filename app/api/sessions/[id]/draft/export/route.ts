import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = getSupabase();

  const [{ data: photos }, { data: players }, { data: picks }] =
    await Promise.all([
      supabase.from("photos").select("*").eq("session_id", id),
      supabase.from("players").select("*").eq("session_id", id).order("turn_order"),
      supabase.from("picks").select("*").eq("session_id", id).order("pick_number"),
    ]);

  const playerMap = new Map((players ?? []).map((p) => [p.id, p.name]));
  const photoMap = new Map((photos ?? []).map((p) => [p.id, p.path]));

  const rows = [
    "pick,player,photo",
    ...(picks ?? []).map(
      (p, i) =>
        `${i + 1},${playerMap.get(p.player_id) ?? "?"},${photoMap.get(p.photo_id) ?? "?"}`
    ),
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="photodraft-${id}.csv"`,
    },
  });
}
