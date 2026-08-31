import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";
import { uploadPrescriptionSchema } from "@/lib/validators/prescription";

const BUCKET = "prescriptions";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file");
    const notesValue = formData.get("notes");
    const parsed = uploadPrescriptionSchema.safeParse({
      file,
      notes: typeof notesValue === "string" ? notesValue : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.issues }, { status: 400 });
    }

    const image = parsed.data.file as File;
    const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await image.arrayBuffer());

    let imageUrl = "";

    try {
      // Pastikan bucket tersedia
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.some((b) => b.name === BUCKET)) {
        await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
      }

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: image.type, upsert: true });

      if (uploadError) {
        console.warn("[STORAGE_UPLOAD_WARN]", uploadError.message);
        // Fallback: simpan sebagai data URL jika storage bucket gagal
        imageUrl = `data:${image.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
      } else {
        const { data: publicUrl } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
        imageUrl = publicUrl.publicUrl;
      }
    } catch (storageErr) {
      console.warn("[STORAGE_ERROR_FALLBACK]", storageErr);
      imageUrl = `data:${image.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    }

    const prescription = await prisma.prescription.create({
      data: {
        userId: user.id,
        imageUrl,
        notes: parsed.data.notes,
      },
    });

    return NextResponse.json({ data: prescription }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_PRESCRIPTION]", error);
    const message = error instanceof Error ? error.message : "Gagal mengunggah resep";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
