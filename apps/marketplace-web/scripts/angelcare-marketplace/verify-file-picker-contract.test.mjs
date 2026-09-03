import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../../', import.meta.url)

async function source(path) {
  return readFile(new URL(path, root), 'utf8')
}

test('shared picker keeps native activation synchronous and supports reselection, drop, reset, and validation', async () => {
  const picker = await source('angelcare-marketplace/components/MarketplaceFilePicker.tsx')
  assert.match(picker, /function openPicker\(\)[\s\S]*input\.value = ''[\s\S]*input\.click\(\)/)
  assert.match(picker, /type="file"/)
  assert.match(picker, /onChange=.*selectFiles/)
  assert.match(picker, /onDrop=\{onDrop\}/)
  assert.match(picker, /onDragOver=/)
  assert.match(picker, /maxSizeBytes/)
  assert.match(picker, /Format de fichier non autorisé/)
  assert.match(picker, /dépasse la limite/)
  assert.match(picker, /est vide/)
  assert.match(picker, /onFilesChange\(\[\]\)/)
  assert.doesNotMatch(picker, /fetch\(|XMLHttpRequest|FormData/)
})

test('all Marketplace importer clients use the shared picker and retain explicit execution gates', async () => {
  const paths = [
    'angelcare-marketplace/enterprise-command/components/ProductImportStudio.tsx',
    'angelcare-marketplace/category-native/components/CsvImportStudio.tsx',
    'angelcare-marketplace/commerce-studio/components/ImportExportStudio.tsx',
    'angelcare-marketplace/customer-commerce/components/WalletPolicyImportStudio.tsx',
    'angelcare-marketplace/localization-intelligence/components/CsvCenter.tsx',
    'angelcare-marketplace/commerce-studio/components/MediaLibraryStudio.tsx',
  ]
  for (const path of paths) {
    const component = await source(path)
    assert.match(component, /MarketplaceFilePicker/, path)
  }

  const doctrine = await source(paths[0])
  assert.match(doctrine, /await file\.text\(\)/)
  assert.match(doctrine, /Coller le CSV/)
  assert.match(doctrine, /onClick=\{\(\)=>void dry\(\)\}/)

  const categoryNative = await source(paths[1])
  assert.match(categoryNative, /20\*1024\*1024/)
  assert.match(categoryNative, /new File\(\[csvText\],'category-native-paste\.csv'/)
  assert.match(categoryNative, /Valider le fichier/)
  assert.match(categoryNative, /Exécuter les \{selectedJob\.valid_rows\} lignes valides/)

  const commerce = await source(paths[2])
  assert.match(commerce, /\.csv,\.json,text\/csv,application\/json/)
  assert.match(commerce, /content-type': 'text\/csv'/)
  assert.match(commerce, /onClick=\{\(\) => void run\(true\)\}/)
  assert.match(commerce, /onClick=\{\(\) => void run\(false\)\}/)

  const media = await source(paths[5])
  assert.match(media, /MEDIA_MAX_BYTES/)
  const mediaPolicy = await source('angelcare-marketplace/commerce-studio/media-library-operations.ts')
  assert.match(mediaPolicy, /MEDIA_MAX_BYTES = 40 \* 1024 \* 1024/)
  assert.match(media, /Confirmer le remplacement/)
  assert.doesNotMatch(media, /onFilesChange=\{[^}\n]*replaceAsset/)
})

test('operations today does not claim or mount a file importer', async () => {
  const operationsPage = await source('app/angelcare-marketplace/(protected)/admin/operations/today/page.tsx')
  assert.doesNotMatch(operationsPage, /type="file"|MarketplaceFilePicker|ProductImportStudio/)
})
