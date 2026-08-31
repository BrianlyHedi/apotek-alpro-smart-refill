import type { PrescriptionStatus } from "@/generated/prisma";

/// Prescription dengan relasi untuk tampilan list
export interface PrescriptionWithItems {
  id: string;
  userId: string;
  imageUrl: string | null;
  status: PrescriptionStatus;
  notes: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    name: string;
    email: string;
  };
  verifiedBy: {
    id: string;
    name: string;
  } | null;
  orders?: {
    id: string;
    status: string;
  }[];
  items: PrescriptionItemDetail[];
}

/// Detail item resep dengan info obat
export interface PrescriptionItemDetail {
  id: string;
  quantity: number;
  dosageInstruction: string;
  medicine: {
    id: string;
    name: string;
    category: string;
    dosageForm: string;
    manufacturer: string;
    price: number;
  };
}

/// Payload untuk upload resep baru
export interface CreatePrescriptionPayload {
  imageUrl?: string;
  items: {
    medicineId: string;
    quantity: number;
    dosageInstruction: string;
  }[];
}

/// Payload untuk verifikasi resep oleh apoteker
export interface VerifyPrescriptionPayload {
  status: "VERIFIED" | "REJECTED";
  notes?: string;
  expiresAt?: string;
}
