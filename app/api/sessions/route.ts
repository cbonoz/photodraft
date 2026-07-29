import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  const { title, password } = await req.json();
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("sessions")
    .insert({ id: nanoid(8), title, admin_password: password ?? "" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}
