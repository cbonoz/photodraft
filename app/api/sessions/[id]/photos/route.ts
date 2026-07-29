import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

  // Enforce 200-photo limit per draft
  const { count } = await supabase
    .from("photos")
    .select("*", { count: "exact", head: true })
    .eq("session_id", id);

  const currentCount = count ?? 0;
  const remaining = 200 - currentCount;
  if (remaining <= 0) {
    return NextResponse.json(
      { error: "This draft already has 200 photos — delete some before uploading more" },
      { status: 400 }
    );
  }
  if (files.length > remaining) {
    return NextResponse.json(
      { error: `Only ${remaining} slot${remaining !== 1 ? "s" : ""} remaining (max 200 per draft, you tried to add ${files.length})` },
      { status: 400 }
    );
  }

  // Client should already enforce this, but defend the server too
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per Supabase bucket limit
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds the 10MB file size limit` },
        { status: 400 }
      );
    }
  }

  const { data: existingPhotos } = await supabase
    .from("photos")
    .select("filename")
    .eq("session_id", id);

  const existingFilenames = new Set((existingPhotos ?? []).map((p) => p.filename));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const results = [];

  for (const [i, file] of files.entries()) {
    if (existingFilenames.has(file.name)) {
      results.push({ filename: file.name, status: "already exists" });
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const storagePath = `${id}/${crypto.randomUUID()}.${ext}`;

    // Infer MIME from extension when browser doesn't send it (e.g. .jpeg → image/jpeg)
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", heic: "image/heic",
      heif: "image/heif", avif: "image/avif", tiff: "image/tiff",
      tif: "image/tiff", bmp: "image/bmp", svg: "image/svg+xml",
    };
    const contentType = file.type || mimeMap[ext] || "application/octet-stream";

    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(storagePath, file, { contentType });

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
