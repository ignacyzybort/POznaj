export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((r) => r.startsWith("csrf-token="))
    ?.split("=")
    .slice(1)
    .join("=") ?? "";
}
