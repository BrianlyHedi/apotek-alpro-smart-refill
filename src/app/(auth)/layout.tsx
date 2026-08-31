export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Kolom Kiri — Branding (Tersembunyi di mobile) */}
      <div className="hidden bg-green-700 lg:flex flex-col justify-center px-12 text-white">
        <div className="max-w-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-white p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-8 w-8 text-green-600"
              >
                <path
                  fillRule="evenodd"
                  d="M11.484 2.17a.75.75 0 0 1 1.032 0 11.209 11.209 0 0 0 7.877 3.08.75.75 0 0 1 .722.515 12.74 12.74 0 0 1 .222 2.368c0 5.438-2.616 10.37-6.848 13.567a.75.75 0 0 1-.89 0c-4.231-3.197-6.847-8.13-6.847-13.567a12.74 12.74 0 0 1 .222-2.368.75.75 0 0 1 .722-.515 11.21 11.21 0 0 0 7.877-3.08ZM12 8a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 12 8Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Apotek Alpro</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Smart Prescription & Refill System
          </h2>
          <p className="text-green-100 text-lg">
            Solusi cerdas untuk manajemen resep obat kronis, cek stok realtime, dan jadwal refill otomatis di seluruh cabang.
          </p>
        </div>
      </div>

      {/* Kolom Kanan — Form */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 bg-zinc-50">
        {children}
      </div>
    </div>
  );
}
