export function haptic(pattern: "light" | "medium" | "heavy" | "success") {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    const patterns: Record<string, number[]> = {
      light: [12],
      medium: [24],
      heavy: [36],
      success: [12, 60, 12],
    };
    navigator.vibrate(patterns[pattern]);
  }
}
