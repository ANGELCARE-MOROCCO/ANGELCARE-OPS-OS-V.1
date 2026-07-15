import ContentDeletePage from "@/components/market-os/content-command/content-delete-page"
export const dynamic="force-dynamic"
export default function Page({params}:{params:{id:string}}){return <ContentDeletePage id={params.id}/>}
