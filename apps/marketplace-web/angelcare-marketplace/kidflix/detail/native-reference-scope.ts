/** Native shared-vault rows have no DCE scope columns. Keep explicit native
 * restrictions when supplied, without sending fictional columns to PostgREST.
 * The caller must first restrict IDs to an authorized published manifest. */
export function nativeReferenceInScope(
  row: Record<string, unknown>,
  release: Record<string, unknown>,
): boolean {
  return ["tenant_id", "territory_id"].every(
    key => row[key] == null || row[key] === release[key],
  );
}
