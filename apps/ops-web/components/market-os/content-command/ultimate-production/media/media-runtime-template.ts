export const mediaRuntimeTemplate = {
  buckets: [
    'market-content-images',
    'market-content-videos',
    'market-content-pdfs',
    'market-content-documents',
  ],
  uploadRules: [
    'validate MIME type',
    'validate size',
    'generate signed upload URL server-side',
    'write metadata record',
    'emit audit event',
  ],
};