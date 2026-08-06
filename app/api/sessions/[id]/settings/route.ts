import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const { snakeDraft } = await req.json();

  const { data: session } = await supabase
    .from("sessions")
    .select("closed")
    .eq("id", id)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  if (session.closed) {
    return NextResponse.json(
      { error: "Cannot change settings while draft is in progress" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sessions")
    .update({ snake_draft: !!snakeDraft })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { admin_password, ...safeSession } = data;
  return NextResponse.json({ session: safeSession });
}
