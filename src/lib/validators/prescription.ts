import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Helper untuk validasi file di browser
export const uploadPrescriptionSchema = z.object({
  file: z
    .any()
    .refine((file) => file !== null && file !== undefined, "Foto resep wajib diunggah")
    .refine(
      (file) => file?.size <= MAX_FILE_SIZE,
      `Ukuran file maksimal adalah 5MB.`
    )
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Hanya format .jpg, .jpeg, .png dan .webp yang didukung."
    ),
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

export type UploadPrescriptionInput = z.infer<typeof uploadPrescriptionSchema>;
