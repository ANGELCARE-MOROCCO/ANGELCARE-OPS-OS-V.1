export const finalSupabaseAdapterTemplate = {
  note: 'Use this as a server-side implementation template only.',
  rules: [
    'Do not import service role key into client components.',
    'Validate input before mutation.',
    'Check permissions before mutation.',
    'Write audit event after mutation.',
    'Return typed result to UI.',
  ],
};