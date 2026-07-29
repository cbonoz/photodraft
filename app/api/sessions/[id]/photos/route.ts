import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length)
    return NextResponse.json({ error: "No files" }, { status: 400 });

  const { data: existingPhotos } = await supabase
    .from("photos")
    .select("filename")
    .eq("session_id", id);

  const existingFilenames = new Set((existingPhotos ?? []).map((p) => p.filename));

  const { count } = await supabase
    .from("photos")
    .select("*", { count: "exact", head: true })
    .eq("session_id", id);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const results = [];

  for (const [i, file] of files.entries()) {
    if (existingFilenames.has(file.name)) {
      results.push({ filename: file.name, status: "already exists" });
      continue;
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const storagePath = `${id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      results.push({ filename: file.name, error: uploadError.message });
      continue;
    }

    const { data: photo, error: dbError } = await supabase
      .from("photos")
      .insert({ session_id: id, path: storagePath, filename: file.name, sort_order: (count ?? 0) + i })
      .select()
      .single();

    if (dbError) {
      results.push({ filename: file.name, error: dbError.message });
      continue;
    }

    results.push({
      ...photo,
      url: `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`,
    });
  }

  return NextResponse.json({ photos: results });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();
  const { photoId } = await req.json();

  const { data: photo } = await supabase
    .from("photos")
    .select("path")
    .eq("id", photoId)
    .single();

  if (photo) {
    await supabase.storage.from("photos").remove([photo.path]);
  }

  await supabase.from("photos").delete().eq("id", photoId);

  return NextResponse.json({ success: true });
}
