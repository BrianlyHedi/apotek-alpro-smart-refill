const IDR_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/// Format angka ke format Rupiah (Rp 50.000)
export function formatCurrency(amount: number | string): string {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return "Rp 0";
  }

  return IDR_FORMATTER.format(numericAmount);
}

/// Format angka ke format singkat (50rb, 1,5jt)
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(".0", "")}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace(".0", "")}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return formatCurrency(amount);
}
