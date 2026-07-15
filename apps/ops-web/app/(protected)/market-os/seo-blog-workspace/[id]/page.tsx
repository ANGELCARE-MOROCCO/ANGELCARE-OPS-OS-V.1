import { SeoSubpage } from "@/components/market-os/seo-blog/seo-subpage"
export const dynamic="force-dynamic"
export default function Page({params}:{params:{id:string}}){return <SeoSubpage mode="detail" articleId={params.id}/>}
