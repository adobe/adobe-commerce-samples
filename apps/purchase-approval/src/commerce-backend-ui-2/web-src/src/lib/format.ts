export function formatDate(ts?: string): string {
  if (!ts) {
    return "—";
  }
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export function formatMoney(
  amount?: number | string,
  currency?: string,
): string {
  try {
    return new Intl.NumberFormat(undefined, {
      currency: currency || "USD",
      style: "currency",
    }).format(Number(amount));
  } catch {
    return `${amount ?? ""} ${currency || ""}`.trim();
  }
}
