export const finalMediaRuntimePlan = {
  buckets: [
    'market-content-images',
    'market-content-videos',
    'market-content-pdfs',
    'market-content-documents',
  ],
  rules: [
    'signed uploads only',
    'validate file type',
    'validate file size',
    'record media metadata',
    'link media to content asset',
    'audit upload events',
  ],
};