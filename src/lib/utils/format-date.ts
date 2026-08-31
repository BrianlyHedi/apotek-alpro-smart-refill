const ID_DATE_FULL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const ID_DATE_SHORT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const ID_DATETIME = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/// Format tanggal lengkap (31 Agustus 2026)
export function formatDateFull(date: Date | string): string {
  return ID_DATE_FULL.format(new Date(date));
}

/// Format tanggal singkat (31 Agu 2026)
export function formatDateShort(date: Date | string): string {
  return ID_DATE_SHORT.format(new Date(date));
}

/// Format tanggal + waktu (31 Agu 2026, 14:30)
export function formatDateTime(date: Date | string): string {
  return ID_DATETIME.format(new Date(date));
}

/// Hitung selisih hari dari sekarang (misal: "3 hari lagi", "2 hari yang lalu")
export function formatRelativeDay(date: Date | string): string {
  const target = new Date(date);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Besok";
  if (diffDays === -1) return "Kemarin";
  if (diffDays > 0) return `${diffDays} hari lagi`;
  return `${Math.abs(diffDays)} hari yang lalu`;
}
