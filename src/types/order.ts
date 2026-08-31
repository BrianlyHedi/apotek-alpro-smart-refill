import type { OrderStatus } from "@/generated/prisma";

/// Order dengan relasi untuk tampilan list
export interface OrderWithItems {
  id: string;
  userId: string;
  pharmacyId: string;
  prescriptionId: string | null;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  pharmacy: {
    id: string;
    name: string;
    address: string;
  };
  items: OrderItemDetail[];
}

/// Detail item pesanan dengan info obat
export interface OrderItemDetail {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  medicine: {
    id: string;
    name: string;
    dosageForm: string;
  };
}

/// Payload untuk buat pesanan baru
export interface CreateOrderPayload {
  pharmacyId: string;
  prescriptionId?: string;
  deliveryAddress?: string;
  notes?: string;
  items: {
    medicineId: string;
    quantity: number;
  }[];
}

/// Payload untuk update status order (oleh apoteker/admin)
export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  notes?: string;
}
