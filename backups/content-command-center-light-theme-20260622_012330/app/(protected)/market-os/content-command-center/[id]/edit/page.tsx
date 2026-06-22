import ContentEditPage from "@/components/market-os/content-command/content-edit-page"
export const dynamic="force-dynamic"
export default function Page({params}:{params:{id:string}}){return <ContentEditPage id={params.id}/>}
