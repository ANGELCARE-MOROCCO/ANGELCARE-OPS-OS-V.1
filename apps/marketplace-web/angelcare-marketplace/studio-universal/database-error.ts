import { MarketplaceError } from '@/angelcare-marketplace/server/errors'

type DbError = { code?: string; message?: string; details?: string; hint?: string; constraint?: string } | null

export function marketplaceDatabaseError(operation:string,error:DbError){
  const code=String(error?.code||'').trim().toUpperCase()
  const options={cause:error,retryable:false}
  if(code==='42P01')return new MarketplaceError('CONFIGURATION_ERROR','Infrastructure CMS incomplète : une table requise est absente.',{...options,retryable:true})
  if(code==='42703')return new MarketplaceError('CONFIGURATION_ERROR','Infrastructure CMS incomplète : une colonne requise est absente.',{...options,retryable:true})
  if(code==='42883'||code==='PGRST202')return new MarketplaceError('CONFIGURATION_ERROR','Infrastructure CMS incomplète : une fonction requise est indisponible.',{...options,retryable:true})
  if(code==='23505')return new MarketplaceError('CONFLICT','Cette identité de page ou cette URL existe déjà dans ce périmètre. Ouvrez la page existante ou choisissez une autre URL.',options)
  if(code==='23503')return new MarketplaceError('DATA_INTEGRITY','Une référence liée à cette opération n’existe plus ou n’est pas disponible.',options)
  if(code==='23502')return new MarketplaceError('DATA_INTEGRITY','Une donnée obligatoire manque pour terminer cette opération.',options)
  if(code==='22P02')return new MarketplaceError('VALIDATION_ERROR','Une valeur transmise au CMS est invalide.',options)
  if(code==='42501')return new MarketplaceError('PERMISSION_DENIED','La base de données a refusé cette opération pour des raisons d’autorisation.',options)
  if(code.startsWith('PGRST'))return new MarketplaceError('INTERNAL_ERROR',`Le service de données n’a pas pu ${operation}. La référence de requête permet le diagnostic.`,{...options,retryable:true})
  return new MarketplaceError('INTERNAL_ERROR',`Le CMS n’a pas pu ${operation}. La référence de requête permet le diagnostic.`,{...options,retryable:true})
}
