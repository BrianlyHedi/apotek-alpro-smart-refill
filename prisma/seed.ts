// =============================================================================
// Apotek Alpro — Seed Script
// Mengisi database dengan data dummy realistis untuk demo
// =============================================================================

import { PrismaClient } from "../src/generated/prisma";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Supabase Admin client untuk create auth users
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "⚠️  SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diset.",
    "\n   User akan dibuat dengan Prisma saja (tanpa Supabase Auth).",
    "\n   Untuk auth yang berfungsi, set environment variable lalu jalankan ulang seed."
  );
}

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// =============================================================================
// HELPER
// =============================================================================

function log(section: string, message: string) {
  console.log(`  ✅ [${section}] ${message}`);
}

// =============================================================================
// DATA: PHARMACIES (5 cabang Apotek Alpro)
// =============================================================================

const PHARMACIES = [
  {
    name: "Apotek Alpro Greenville",
    address: "Ruko Greenville Blok A No. 12, Jl. Daan Mogot KM. 1",
    city: "Jakarta Barat",
    latitude: -6.1654,
    longitude: 106.7852,
    phone: "021-56983210",
  },
  {
    name: "Apotek Alpro Bintaro",
    address: "Bintaro Jaya Sektor 7 Blok B2 No. 5, Jl. Bintaro Utama",
    city: "Tangerang Selatan",
    latitude: -6.2784,
    longitude: 106.7153,
    phone: "021-73887654",
  },
  {
    name: "Apotek Alpro Tebet",
    address: "Jl. Tebet Raya No. 45, Tebet Barat",
    city: "Jakarta Selatan",
    latitude: -6.2276,
    longitude: 106.8568,
    phone: "021-83791234",
  },
  {
    name: "Apotek Alpro Pondok Ungu",
    address: "Perumahan Pondok Ungu Permai Blok AD No. 8, Jl. Babelan",
    city: "Bekasi",
    latitude: -6.1902,
    longitude: 107.0148,
    phone: "021-88976543",
  },
  {
    name: "Apotek Alpro Limo",
    address: "Jl. Raya Limo No. 28, Limo",
    city: "Depok",
    latitude: -6.3721,
    longitude: 106.7935,
    phone: "021-77654321",
  },
];

// =============================================================================
// DATA: MEDICINES (28 SKU — mix OTC dan Prescription)
// =============================================================================

const MEDICINES = [
  // --- OTC (Over The Counter) — bisa dibeli bebas ---
  {
    name: "Paracetamol 500mg",
    category: "OTC" as const,
    activeIngredients: "Paracetamol",
    dosageForm: "Tablet",
    manufacturer: "PT Kimia Farma",
    requiresPrescription: false,
    price: 15000,
    description: "Analgesik dan antipiretik untuk nyeri ringan dan demam",
  },
  {
    name: "Vitamin C 1000mg",
    category: "OTC" as const,
    activeIngredients: "Ascorbic Acid",
    dosageForm: "Tablet Effervescent",
    manufacturer: "PT Bayer Indonesia",
    requiresPrescription: false,
    price: 45000,
    description: "Suplemen vitamin C untuk daya tahan tubuh",
  },
  {
    name: "OBH Combi Batuk Plus Flu",
    category: "OTC" as const,
    activeIngredients: "Dextromethorphan HBr, Phenylpropanolamine HCl, Chlorpheniramine Maleate",
    dosageForm: "Sirup",
    manufacturer: "PT Combiphar",
    requiresPrescription: false,
    price: 32000,
    description: "Obat batuk tidak berdahak disertai flu",
  },
  {
    name: "Promag Tablet",
    category: "OTC" as const,
    activeIngredients: "Hydrotalcite, Magnesium Hydroxide, Simethicone",
    dosageForm: "Tablet Kunyah",
    manufacturer: "PT Kalbe Farma",
    requiresPrescription: false,
    price: 18000,
    description: "Antasida untuk sakit maag dan kembung",
  },
  {
    name: "Ibuprofen 400mg",
    category: "OTC" as const,
    activeIngredients: "Ibuprofen",
    dosageForm: "Tablet",
    manufacturer: "PT Kimia Farma",
    requiresPrescription: false,
    price: 12000,
    description: "Anti-inflamasi non-steroid untuk nyeri dan peradangan",
  },
  {
    name: "Antangin JRG Cair",
    category: "OTC" as const,
    activeIngredients: "Jahe, Royal Jelly, Ginseng",
    dosageForm: "Sirup Sachet",
    manufacturer: "PT Deltomed Laboratories",
    requiresPrescription: false,
    price: 5000,
    description: "Jamu masuk angin herbal",
  },
  {
    name: "Cetirizine 10mg",
    category: "OTC" as const,
    activeIngredients: "Cetirizine Dihydrochloride",
    dosageForm: "Tablet",
    manufacturer: "PT Dexa Medica",
    requiresPrescription: false,
    price: 25000,
    description: "Antihistamin untuk alergi dan gatal-gatal",
  },
  {
    name: "Diatabs",
    category: "OTC" as const,
    activeIngredients: "Attapulgite Activated",
    dosageForm: "Tablet",
    manufacturer: "PT Medifarma Laboratories",
    requiresPrescription: false,
    price: 14000,
    description: "Anti diare untuk mengatasi diare akut",
  },
  {
    name: "Betadine Antiseptic Solution 60ml",
    category: "OTC" as const,
    activeIngredients: "Povidone Iodine 10%",
    dosageForm: "Larutan",
    manufacturer: "PT Mahakam Beta Farma",
    requiresPrescription: false,
    price: 28000,
    description: "Antiseptik untuk luka terbuka dan infeksi kulit",
  },
  {
    name: "Vitamin D3 1000 IU",
    category: "OTC" as const,
    activeIngredients: "Cholecalciferol",
    dosageForm: "Kapsul Lunak",
    manufacturer: "PT Kalbe Farma",
    requiresPrescription: false,
    price: 55000,
    description: "Suplemen vitamin D untuk kesehatan tulang",
  },
  {
    name: "Aspirin 100mg",
    category: "OTC" as const,
    activeIngredients: "Acetylsalicylic Acid",
    dosageForm: "Tablet",
    manufacturer: "PT Bayer Indonesia",
    requiresPrescription: false,
    price: 20000,
    description: "Pengencer darah dosis rendah untuk pencegahan kardiovaskular",
  },
  {
    name: "Omeprazole 20mg (OTC)",
    category: "OTC" as const,
    activeIngredients: "Omeprazole",
    dosageForm: "Kapsul",
    manufacturer: "PT Dexa Medica",
    requiresPrescription: false,
    price: 35000,
    description: "Penghambat pompa proton untuk asam lambung",
  },
  {
    name: "Multivitamin Becom-C",
    category: "OTC" as const,
    activeIngredients: "Vitamin B Complex, Vitamin C",
    dosageForm: "Tablet",
    manufacturer: "PT Phapros",
    requiresPrescription: false,
    price: 42000,
    description: "Multivitamin untuk menjaga stamina dan daya tahan tubuh",
  },

  // --- PRESCRIPTION — wajib resep dokter ---
  {
    name: "Metformin 500mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Metformin Hydrochloride",
    dosageForm: "Tablet",
    manufacturer: "PT Dexa Medica",
    requiresPrescription: true,
    price: 8500,
    description: "Antidiabetik oral lini pertama untuk diabetes tipe 2",
  },
  {
    name: "Amlodipine 5mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Amlodipine Besylate",
    dosageForm: "Tablet",
    manufacturer: "PT Kimia Farma",
    requiresPrescription: true,
    price: 12000,
    description: "Calcium channel blocker untuk hipertensi",
  },
  {
    name: "Glibenclamide 5mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Glibenclamide",
    dosageForm: "Tablet",
    manufacturer: "PT Indofarma",
    requiresPrescription: true,
    price: 7500,
    description: "Sulfonilurea untuk diabetes tipe 2 sebagai terapi tambahan",
  },
  {
    name: "Simvastatin 20mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Simvastatin",
    dosageForm: "Tablet",
    manufacturer: "PT Kalbe Farma",
    requiresPrescription: true,
    price: 15000,
    description: "Statin untuk menurunkan kolesterol LDL",
  },
  {
    name: "Captopril 25mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Captopril",
    dosageForm: "Tablet",
    manufacturer: "PT Kimia Farma",
    requiresPrescription: true,
    price: 9000,
    description: "ACE inhibitor untuk hipertensi dan gagal jantung",
  },
  {
    name: "Losartan 50mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Losartan Potassium",
    dosageForm: "Tablet",
    manufacturer: "PT Dexa Medica",
    requiresPrescription: true,
    price: 18000,
    description: "ARB untuk hipertensi sebagai alternatif ACE inhibitor",
  },
  {
    name: "Metformin 850mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Metformin Hydrochloride",
    dosageForm: "Tablet",
    manufacturer: "PT Dexa Medica",
    requiresPrescription: true,
    price: 11000,
    description: "Antidiabetik oral dosis tinggi untuk diabetes tipe 2",
  },
  {
    name: "Amoxicillin 500mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Amoxicillin Trihydrate",
    dosageForm: "Kapsul",
    manufacturer: "PT Sanbe Farma",
    requiresPrescription: true,
    price: 22000,
    description: "Antibiotik spektrum luas golongan penisilin",
  },
  {
    name: "Clopidogrel 75mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Clopidogrel Bisulfate",
    dosageForm: "Tablet",
    manufacturer: "PT Kalbe Farma",
    requiresPrescription: true,
    price: 35000,
    description: "Antiplatelet untuk pencegahan stroke dan serangan jantung",
  },
  {
    name: "Lisinopril 10mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Lisinopril",
    dosageForm: "Tablet",
    manufacturer: "PT Indofarma",
    requiresPrescription: true,
    price: 14000,
    description: "ACE inhibitor untuk hipertensi dan proteksi ginjal diabetik",
  },
  {
    name: "Atorvastatin 20mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Atorvastatin Calcium",
    dosageForm: "Tablet",
    manufacturer: "PT Dexa Medica",
    requiresPrescription: true,
    price: 25000,
    description: "Statin generasi baru untuk kolesterol tinggi",
  },
  {
    name: "Bisoprolol 5mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Bisoprolol Fumarate",
    dosageForm: "Tablet",
    manufacturer: "PT Merck Indonesia",
    requiresPrescription: true,
    price: 20000,
    description: "Beta-blocker selektif untuk hipertensi dan gagal jantung",
  },
  {
    name: "Glimepiride 2mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Glimepiride",
    dosageForm: "Tablet",
    manufacturer: "PT Sanofi Indonesia",
    requiresPrescription: true,
    price: 16000,
    description: "Sulfonilurea generasi baru untuk diabetes tipe 2",
  },
  {
    name: "Candesartan 8mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Candesartan Cilexetil",
    dosageForm: "Tablet",
    manufacturer: "PT Takeda Indonesia",
    requiresPrescription: true,
    price: 22000,
    description: "ARB untuk hipertensi dan gagal jantung",
  },
  {
    name: "Furosemide 40mg",
    category: "PRESCRIPTION" as const,
    activeIngredients: "Furosemide",
    dosageForm: "Tablet",
    manufacturer: "PT Kimia Farma",
    requiresPrescription: true,
    price: 6000,
    description: "Diuretik loop untuk edema dan hipertensi berat",
  },
];

// =============================================================================
// DATA: USERS (3 dummy users)
// =============================================================================

const USERS = [
  {
    email: "budi.pasien@demo.com",
    password: "Demo123!",
    name: "Budi Santoso",
    role: "PATIENT" as const,
    phone: "081234567890",
    address: "Jl. Mangga Besar IV No. 23, Jakarta Barat 11150",
  },
  {
    email: "siti.apoteker@demo.com",
    password: "Demo123!",
    name: "Apt. Siti Aminah, S.Farm",
    role: "PHARMACIST" as const,
    phone: "082198765432",
    address: null,
    // Akan di-assign ke cabang Greenville
  },
  {
    email: "admin.greenville@demo.com",
    password: "Demo123!",
    name: "Admin Greenville",
    role: "ADMIN" as const,
    phone: "081398761234",
    address: null,
    // Akan di-assign ke cabang Greenville
  },
];

// =============================================================================
// DATA: STOK INVENTORY
// Skenario ekstrem untuk demo realtime stock check
// Rows: [Greenville, Bintaro, Tebet, Pondok Ungu, Limo]
// =============================================================================

// Medicine name → stok per cabang [GV, BT, TB, PU, LM]
const STOCK_SCENARIOS: Record<string, number[]> = {
  "Paracetamol 500mg":       [100, 45,  0,  60, 25],
  "Vitamin C 1000mg":        [ 80, 55, 30,  40, 15],
  "OBH Combi Batuk Plus Flu":[ 40, 20, 10,   0, 30],
  "Promag Tablet":           [ 60, 35, 25,  45, 50],
  "Ibuprofen 400mg":         [ 70, 30,  5,  20, 40],
  "Antangin JRG Cair":       [150, 80, 60, 100, 45],
  "Cetirizine 10mg":         [ 35, 15, 20,  10, 25],
  "Diatabs":                 [ 50, 40, 15,  30,  8],
  "Betadine Antiseptic Solution 60ml": [25, 10, 30, 20, 12],
  "Vitamin D3 1000 IU":      [ 40, 20,  0,  15, 30],
  "Aspirin 100mg":           [ 55, 25, 35,  40, 20],
  "Omeprazole 20mg (OTC)":   [ 30,  8, 15,   5, 22],
  "Multivitamin Becom-C":    [ 45, 30, 20,  35, 18],
  // Prescription meds — stok lebih terbatas dan bervariasi
  "Metformin 500mg":         [ 50, 20,  0,   5, 35],
  "Amlodipine 5mg":          [ 30,  8, 15,   0,  3],
  "Glibenclamide 5mg":       [ 20, 10, 25,  15,  0],
  "Simvastatin 20mg":        [ 35, 15,  5,  20, 10],
  "Captopril 25mg":          [ 40, 25, 10,  30, 15],
  "Losartan 50mg":           [ 25,  5, 20,   0, 12],
  "Metformin 850mg":         [ 15,  0, 10,   8, 20],
  "Amoxicillin 500mg":       [ 60, 40, 30,  20, 35],
  "Clopidogrel 75mg":        [ 10,  5,  0,   8,  3],
  "Lisinopril 10mg":         [ 20, 12, 18,  10,  7],
  "Atorvastatin 20mg":       [ 30, 20, 10,  15, 25],
  "Bisoprolol 5mg":          [ 18, 10,  8,  12,  5],
  "Glimepiride 2mg":         [ 22, 15,  0,  10, 14],
  "Candesartan 8mg":         [ 28,  8, 12,  20,  6],
  "Furosemide 40mg":         [ 45, 30, 20,  35, 10],
};

// =============================================================================
// DATA: DRUG INTERACTIONS (7 interaksi umum di Indonesia)
// =============================================================================

const DRUG_INTERACTIONS = [
  {
    medicineA: "Metformin 500mg",
    medicineB: "Glibenclamide 5mg",
    severity: "MODERATE" as const,
    description:
      "Kombinasi dual antidiabetik meningkatkan risiko hipoglikemia. Monitor kadar gula darah secara ketat, terutama saat awal terapi kombinasi.",
  },
  {
    medicineA: "Amlodipine 5mg",
    medicineB: "Simvastatin 20mg",
    severity: "MILD" as const,
    description:
      "Amlodipine dapat meningkatkan kadar simvastatin dalam darah. Dosis simvastatin tidak boleh melebihi 20mg/hari jika dikombinasi dengan amlodipine.",
  },
  {
    medicineA: "Glibenclamide 5mg",
    medicineB: "Aspirin 100mg",
    severity: "MODERATE" as const,
    description:
      "Aspirin dapat meningkatkan efek hipoglikemik sulfonilurea. Monitor gula darah lebih sering dan waspadai gejala hipoglikemia.",
  },
  {
    medicineA: "Metformin 500mg",
    medicineB: "Ibuprofen 400mg",
    severity: "MODERATE" as const,
    description:
      "NSAID seperti ibuprofen dapat mengganggu fungsi ginjal dan meningkatkan risiko asidosis laktat pada pengguna metformin. Gunakan dengan hati-hati.",
  },
  {
    medicineA: "Amlodipine 5mg",
    medicineB: "Omeprazole 20mg (OTC)",
    severity: "MILD" as const,
    description:
      "Omeprazole dapat sedikit meningkatkan bioavailabilitas amlodipine melalui inhibisi CYP3A4. Umumnya tidak signifikan secara klinis.",
  },
  {
    medicineA: "Simvastatin 20mg",
    medicineB: "Amoxicillin 500mg",
    severity: "MILD" as const,
    description:
      "Monitoring fungsi hati disarankan saat penggunaan bersamaan, karena keduanya dimetabolisme di hati. Risiko interaksi rendah.",
  },
  {
    medicineA: "Captopril 25mg",
    medicineB: "Furosemide 40mg",
    severity: "MODERATE" as const,
    description:
      "Kombinasi ACE inhibitor dan diuretik dapat menyebabkan hipotensi berlebihan (first-dose hypotension). Mulai dengan dosis rendah dan monitoring tekanan darah.",
  },
];

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function main() {
  console.log("\n🌱 Memulai seed database Apotek Alpro...\n");

  // ---------------------------
  // 1. CLEANUP — Hapus data lama (urutan penting karena FK constraint)
  // ---------------------------
  console.log("🗑️  Membersihkan data lama...");
  await prisma.drugInteraction.deleteMany();
  await prisma.refillSchedule.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pharmacy.deleteMany();
  log("Cleanup", "Semua data lama dihapus");

  // ---------------------------
  // 2. PHARMACIES — 5 cabang Apotek Alpro
  // ---------------------------
  console.log("\n🏥 Membuat 5 cabang apotek...");
  const pharmacies = await Promise.all(
    PHARMACIES.map((p) =>
      prisma.pharmacy.create({ data: p })
    )
  );
  const pharmacyMap = new Map(pharmacies.map((p) => [p.name, p]));
  log("Pharmacies", `${pharmacies.length} cabang dibuat`);

  // ---------------------------
  // 3. MEDICINES — 28 SKU obat
  // ---------------------------
  console.log("\n💊 Membuat 28 SKU obat...");
  const medicines = await Promise.all(
    MEDICINES.map((m) =>
      prisma.medicine.create({ data: m })
    )
  );
  const medicineMap = new Map(medicines.map((m) => [m.name, m]));
  const otcCount = medicines.filter((m) => m.category === "OTC").length;
  const rxCount = medicines.filter((m) => m.category === "PRESCRIPTION").length;
  log("Medicines", `${medicines.length} obat dibuat (${otcCount} OTC, ${rxCount} Prescription)`);

  // ---------------------------
  // 4. USERS — 3 dummy users
  // ---------------------------
  console.log("\n👤 Membuat 3 user dummy...");
  const greenvillePharmacy = pharmacyMap.get("Apotek Alpro Greenville")!;
  const createdUsers = [];

  for (const userData of USERS) {
    let userId: string | undefined;

    // Coba create user di Supabase Auth dulu (kalau admin client tersedia)
    if (supabaseAdmin) {
      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
        });

      if (authError) {
        // Kalau user sudah ada, fetch ID-nya
        if (authError.message.includes("already been registered") || authError.status === 422) {
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existing = existingUsers?.users?.find((u) => u.email === userData.email);
          userId = existing?.id;
          console.log(`    ℹ️  User ${userData.email} sudah ada di Supabase Auth`);
        } else {
          console.error(`    ❌ Gagal create auth user ${userData.email}:`, authError.message);
        }
      } else {
        userId = authUser.user.id;
      }
    }

    // Hash password sebagai fallback (kalau Supabase Auth tidak tersedia)
    const passwordHash = await bcrypt.hash(userData.password, 10);

    // Tentukan pharmacy assignment untuk staff
    const pharmacyId =
      userData.role === "PHARMACIST" || userData.role === "ADMIN"
        ? greenvillePharmacy.id
        : null;

    const user = await prisma.user.create({
      data: {
        ...(userId ? { id: userId } : {}),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        pharmacyId,
      },
    });

    createdUsers.push(user);
    log("Users", `${userData.role}: ${userData.name} (${userData.email})`);
  }

  const patientUser = createdUsers.find((u) => u.role === "PATIENT")!;

  // ---------------------------
  // 5. INVENTORY — Stok bervariasi per cabang
  // ---------------------------
  console.log("\n📦 Mengisi stok inventory...");
  let inventoryCount = 0;

  for (const [medicineName, stockPerBranch] of Object.entries(STOCK_SCENARIOS)) {
    const medicine = medicineMap.get(medicineName);
    if (!medicine) continue;

    for (let i = 0; i < pharmacies.length; i++) {
      await prisma.inventory.create({
        data: {
          pharmacyId: pharmacies[i].id,
          medicineId: medicine.id,
          quantity: stockPerBranch[i],
          minStock: 10, // Default min stock threshold
        },
      });
      inventoryCount++;
    }
  }
  log("Inventory", `${inventoryCount} record stok dibuat (${Object.keys(STOCK_SCENARIOS).length} obat × ${pharmacies.length} cabang)`);

  // ---------------------------
  // 6. PRESCRIPTION — 1 resep aktif untuk Budi
  // ---------------------------
  console.log("\n📋 Membuat prescription aktif...");
  const metformin = medicineMap.get("Metformin 500mg")!;
  const amlodipine = medicineMap.get("Amlodipine 5mg")!;
  const vitaminC = medicineMap.get("Vitamin C 1000mg")!;

  const prescription = await prisma.prescription.create({
    data: {
      userId: patientUser.id,
      imageUrl: "https://placehold.co/800x600/E8F5E9/2E7D32?text=Resep+Dr.+Ahmad+Wijaya%0ABudi+Santoso%0AMetformin+%2B+Amlodipine",
      status: "PENDING",
      notes: "Resep dari Dr. Ahmad Wijaya, Sp.PD — kontrol rutin diabetes dan hipertensi",
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 hari dari sekarang
      items: {
        create: [
          {
            medicineId: metformin.id,
            quantity: 30,
            dosageInstruction: "3 x 1 tablet sehari, sesudah makan",
          },
          {
            medicineId: amlodipine.id,
            quantity: 30,
            dosageInstruction: "1 x 1 tablet sehari, pagi hari",
          },
          {
            medicineId: vitaminC.id,
            quantity: 15,
            dosageInstruction: "1 x 1 tablet sehari, pagi hari (larutkan dalam air)",
          },
        ],
      },
    },
    include: { items: true },
  });
  log("Prescription", `1 resep PENDING dengan ${prescription.items.length} item (Metformin + Amlodipine + Vitamin C)`);

  // ---------------------------
  // 7. REFILL SCHEDULES — 2 jadwal refill untuk Budi
  // ---------------------------
  console.log("\n🔄 Membuat refill schedules...");
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await prisma.refillSchedule.createMany({
    data: [
      {
        userId: patientUser.id,
        medicineId: metformin.id,
        frequencyDays: 30,
        nextRefillDate: thirtyDaysFromNow,
        lastRefillDate: thirtyDaysAgo,
        isActive: true,
      },
      {
        userId: patientUser.id,
        medicineId: amlodipine.id,
        frequencyDays: 30,
        nextRefillDate: thirtyDaysFromNow,
        lastRefillDate: thirtyDaysAgo,
        isActive: true,
      },
    ],
  });
  log("Refill Schedules", "2 jadwal aktif — Metformin 30 hari, Amlodipine 30 hari");

  // ---------------------------
  // 8. DRUG INTERACTIONS — 7 interaksi obat
  // ---------------------------
  console.log("\n⚠️  Membuat drug interactions...");
  for (const interaction of DRUG_INTERACTIONS) {
    const medA = medicineMap.get(interaction.medicineA);
    const medB = medicineMap.get(interaction.medicineB);

    if (!medA || !medB) {
      console.warn(`    ⚠️  Skip: ${interaction.medicineA} atau ${interaction.medicineB} tidak ditemukan`);
      continue;
    }

    await prisma.drugInteraction.create({
      data: {
        medicineAId: medA.id,
        medicineBId: medB.id,
        severity: interaction.severity,
        description: interaction.description,
      },
    });
  }
  log("Drug Interactions", `${DRUG_INTERACTIONS.length} interaksi obat dibuat`);

  // ---------------------------
  // SUMMARY
  // ---------------------------
  console.log("\n" + "=".repeat(60));
  console.log("✨ Seed selesai! Ringkasan:");
  console.log("=".repeat(60));
  console.log(`  🏥 Cabang apotek   : ${pharmacies.length}`);
  console.log(`  💊 SKU obat        : ${medicines.length} (${otcCount} OTC, ${rxCount} Rx)`);
  console.log(`  👤 User            : ${createdUsers.length}`);
  console.log(`  📦 Stok inventory  : ${inventoryCount} records`);
  console.log(`  📋 Prescriptions   : 1 (PENDING, ${prescription.items.length} items)`);
  console.log(`  🔄 Refill schedules: 2`);
  console.log(`  ⚠️  Drug interactions: ${DRUG_INTERACTIONS.length}`);
  console.log("=".repeat(60));
  console.log("\n📧 Akun demo:");
  console.log("  PATIENT    : budi.pasien@demo.com     / Demo123!");
  console.log("  PHARMACIST : siti.apoteker@demo.com   / Demo123!");
  console.log("  ADMIN      : admin.greenville@demo.com / Demo123!");
  console.log("");
}

main()
  .catch((e) => {
    console.error("\n❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
