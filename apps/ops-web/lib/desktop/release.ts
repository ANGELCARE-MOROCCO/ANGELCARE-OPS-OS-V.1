export const ANGELCARE_DESKTOP_RELEASE = Object.freeze({
  product: "ANGELCARE Desktop",
  version: "1.7.3",
  contract: "11.3.0",
  governanceContract: "3.1.0",
  buildNumber: 173,
  channel: "stable",
})

export function compareDesktopVersions(left: unknown, right: unknown) {
  const parts = (value: unknown) =>
    String(value || "")
      .replace(/^v/i, "")
      .split(/[.-]/)
      .slice(0, 3)
      .map((part) => Number.parseInt(part, 10) || 0)

  const a = parts(left)
  const b = parts(right)
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1
    if ((a[index] || 0) < (b[index] || 0)) return -1
  }
  return 0
}
