-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'PHARMACIST', 'ADMIN');

-- CreateEnum
CREATE TYPE "MedicineCategory" AS ENUM ('OTC', 'PRESCRIPTION');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InteractionSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "phone" TEXT,
    "address" TEXT,
    "pharmacy_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MedicineCategory" NOT NULL,
    "active_ingredients" TEXT NOT NULL,
    "dosage_form" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "requires_prescription" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" UUID NOT NULL,
    "pharmacy_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 10,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "image_url" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by_pharmacist_id" UUID,
    "notes" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dosage_instruction" TEXT NOT NULL,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pharmacy_id" UUID NOT NULL,
    "prescription_id" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "delivery_address" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_at_purchase" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refill_schedules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "frequency_days" INTEGER NOT NULL,
    "next_refill_date" TIMESTAMP(3) NOT NULL,
    "last_refill_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refill_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_interactions" (
    "id" UUID NOT NULL,
    "medicine_a_id" UUID NOT NULL,
    "medicine_b_id" UUID NOT NULL,
    "severity" "InteractionSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drug_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_user_pharmacy" ON "users"("pharmacy_id");

-- CreateIndex
CREATE INDEX "pharmacies_city_idx" ON "pharmacies"("city");

-- CreateIndex
CREATE INDEX "idx_pharmacy_active" ON "pharmacies"("is_active");

-- CreateIndex
CREATE INDEX "medicines_category_idx" ON "medicines"("category");

-- CreateIndex
CREATE INDEX "medicines_name_idx" ON "medicines"("name");

-- CreateIndex
CREATE INDEX "idx_medicine_rx" ON "medicines"("requires_prescription");

-- CreateIndex
CREATE INDEX "idx_inventory_pharmacy" ON "inventory"("pharmacy_id");

-- CreateIndex
CREATE INDEX "idx_inventory_medicine" ON "inventory"("medicine_id");

-- CreateIndex
CREATE INDEX "idx_inventory_updated" ON "inventory"("last_updated");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pharmacy_medicine" ON "inventory"("pharmacy_id", "medicine_id");

-- CreateIndex
CREATE INDEX "idx_prescription_user" ON "prescriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_prescription_status" ON "prescriptions"("status");

-- CreateIndex
CREATE INDEX "idx_prescription_verifier" ON "prescriptions"("verified_by_pharmacist_id");

-- CreateIndex
CREATE INDEX "idx_rx_item_prescription" ON "prescription_items"("prescription_id");

-- CreateIndex
CREATE INDEX "idx_rx_item_medicine" ON "prescription_items"("medicine_id");

-- CreateIndex
CREATE INDEX "idx_order_user" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "idx_order_pharmacy" ON "orders"("pharmacy_id");

-- CreateIndex
CREATE INDEX "idx_order_status" ON "orders"("status");

-- CreateIndex
CREATE INDEX "idx_order_created" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "idx_order_item_order" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "idx_order_item_medicine" ON "order_items"("medicine_id");

-- CreateIndex
CREATE INDEX "idx_refill_user" ON "refill_schedules"("user_id");

-- CreateIndex
CREATE INDEX "idx_refill_next_date" ON "refill_schedules"("next_refill_date");

-- CreateIndex
CREATE INDEX "idx_refill_active" ON "refill_schedules"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_medicine_refill" ON "refill_schedules"("user_id", "medicine_id");

-- CreateIndex
CREATE INDEX "idx_interaction_medicine_a" ON "drug_interactions"("medicine_a_id");

-- CreateIndex
CREATE INDEX "idx_interaction_medicine_b" ON "drug_interactions"("medicine_b_id");

-- CreateIndex
CREATE INDEX "idx_interaction_severity" ON "drug_interactions"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "uq_drug_interaction_pair" ON "drug_interactions"("medicine_a_id", "medicine_b_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_verified_by_pharmacist_id_fkey" FOREIGN KEY ("verified_by_pharmacist_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_schedules" ADD CONSTRAINT "refill_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_schedules" ADD CONSTRAINT "refill_schedules_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_interactions" ADD CONSTRAINT "drug_interactions_medicine_a_id_fkey" FOREIGN KEY ("medicine_a_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_interactions" ADD CONSTRAINT "drug_interactions_medicine_b_id_fkey" FOREIGN KEY ("medicine_b_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
