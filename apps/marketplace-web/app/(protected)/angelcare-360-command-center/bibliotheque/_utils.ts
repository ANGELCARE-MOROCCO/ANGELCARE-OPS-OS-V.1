import { getLibraryCommandSnapshot } from '@/lib/angelcare360/server/library-circulation-command'

export async function loadLibrarySnapshot() {
  return getLibraryCommandSnapshot()
}
