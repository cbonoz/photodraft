import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const { photoIds } = await req.json();

  if (!Array.isArray(photoIds)) {
    return NextResponse.json({ error: "photoIds array required" }, { status: 400 });
  }

  const updates = photoIds.map((photoId: string, i: number) => ({
    id: photoId,
    session_id: id,
    sort_order: i,
  }));

  const { error } = await supabase.from("photos").upsert(updates, {
    onConflict: "id",
    ignoreDuplicates: false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
