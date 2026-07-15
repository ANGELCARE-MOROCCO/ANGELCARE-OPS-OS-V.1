
import { contentCommandProductionApi } from "./client"

export type HydratedWorkspace = {
  digitalAssets: any[]
  printAssets: any[]
  corporateDocuments: any[]
  tasks: any[]
  comments: any[]
}

export async function hydrateContentCommandWorkspaces(): Promise<HydratedWorkspace> {
  const [digital, print, documents, tasks, comments] = await Promise.all([
    contentCommandProductionApi.listAssets("Digital content"),
    contentCommandProductionApi.listAssets("Print & Offline Content"),
    contentCommandProductionApi.listDocuments(),
    contentCommandProductionApi.listTasks(),
    contentCommandProductionApi.listComments(),
  ])

  return {
    digitalAssets: digital.assets || [],
    printAssets: print.assets || [],
    corporateDocuments: documents.documents || [],
    tasks: tasks.tasks || [],
    comments: comments.comments || [],
  }
}
