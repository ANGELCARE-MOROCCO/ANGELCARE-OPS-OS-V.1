/**
 * Flashcards OS CSS Module typing bridge.
 *
 * The application uses Next.js CSS Modules. This bounded declaration keeps
 * repository-local strict TypeScript verification compatible with every
 * existing and newly added `*.module.css` import without changing runtime CSS.
 */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
