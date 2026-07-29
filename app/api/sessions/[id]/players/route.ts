import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const { name } = await req.json();

  if (!name || typeof name !== "string")
    return NextResponse.json({ error: "name required" }, { status: 400 });

  const { count } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("session_id", id);

  const { data, error } = await supabase
    .from("players")
    .insert({ session_id: id, name: name.trim(), turn_order: count ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ player: data });
}
