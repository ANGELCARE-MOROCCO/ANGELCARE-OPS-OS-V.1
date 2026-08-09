/**
 * Bounded CSS Module typing for CARELINK Service Design OS.
 * Runtime CSS remains handled by Next.js; this file only supplies TypeScript types
 * to isolated and dependency-backed Service Design verification projects.
 */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
