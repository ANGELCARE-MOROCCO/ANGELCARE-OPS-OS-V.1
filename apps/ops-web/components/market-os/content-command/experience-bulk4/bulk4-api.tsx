"use client"

import * as React from "react"
import type { ApiTemplateRecord, CreativeAssetRecord, CreativeDocumentRecord } from "./bulk4-types"
import { contentCommandRequest } from '@/components/market-os/content-command/runtime/content-command-runtime'

type RegistryState = {
  templates: ApiTemplateRecord[]
  assets: CreativeAssetRecord[]
  documents: CreativeDocumentRecord[]
  loading: boolean
  error: string
}

const jsonRequest=contentCommandRequest

export function useBulk4Registry() {
  const [state, setState] = React.useState<RegistryState>({ templates: [], assets: [], documents: [], loading: true, error: "" })

  const refresh = React.useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }))
    try {
      const [templateResult, assetResult, documentResult] = await Promise.all([
        jsonRequest<{ templates?: ApiTemplateRecord[] }>("/api/market-os/content-command-center/templates"),
        jsonRequest<{ assets?: CreativeAssetRecord[] }>("/api/market-os/content-command-center/assets?limit=240"),
        jsonRequest<{ documents?: CreativeDocumentRecord[] }>("/api/market-os/content-command-center/documents?limit=160"),
      ])
      setState({
        templates: templateResult.templates || [],
        assets: assetResult.assets || [],
        documents: documentResult.documents || [],
        loading: false,
        error: "",
      })
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error instanceof Error ? error.message : "CREATIVE_REGISTRY_UNAVAILABLE" }))
    }
  }, [])

  React.useEffect(() => { void refresh() }, [refresh])

  const saveTemplate = React.useCallback(async (template: ApiTemplateRecord) => {
    const result = await jsonRequest<{ template: ApiTemplateRecord }>("/api/market-os/content-command-center/templates", { method: "POST", body: JSON.stringify(template) })
    await refresh()
    return result.template
  }, [refresh])

  const saveAsset = React.useCallback(async (asset: CreativeAssetRecord) => {
    const result = await jsonRequest<{ record: CreativeAssetRecord }>("/api/market-os/content-command-center/assets", { method: "POST", body: JSON.stringify(asset) })
    await refresh()
    return result.record
  }, [refresh])

  const deleteAsset = React.useCallback(async (id: string) => {
    await jsonRequest(`/api/market-os/content-command-center/assets/${encodeURIComponent(id)}`, { method: "DELETE" })
    await refresh()
  }, [refresh])

  const saveDocument = React.useCallback(async (document: CreativeDocumentRecord) => {
    const result = await jsonRequest<{ record: CreativeDocumentRecord }>("/api/market-os/content-command-center/documents", { method: "POST", body: JSON.stringify(document) })
    await refresh()
    return result.record
  }, [refresh])

  return { ...state, refresh, saveTemplate, saveAsset, deleteAsset, saveDocument }
}
