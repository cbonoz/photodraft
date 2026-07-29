import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { password } = await req.json();

  const supabase = getSupabase();
  const { data: session } = await supabase
    .from("sessions")
    .select("admin_password")
    .eq("id", id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.admin_password) {
    return NextResponse.json({ error: "No admin password set" }, { status: 400 });
  }

  if (password !== session.admin_password) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
