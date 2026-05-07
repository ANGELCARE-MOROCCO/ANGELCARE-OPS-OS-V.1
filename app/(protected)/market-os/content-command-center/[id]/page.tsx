import ContentDetailPage from "@/components/market-os/content-command/content-detail-page"
export const dynamic="force-dynamic"
export default function Page({params}:{params:{id:string}}){return <ContentDetailPage id={params.id}/>}
