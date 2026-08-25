import { ProductPage } from '@/angelcare-marketplace/commerce-studio/admin-pages'
export default async function Page({params}:{params:Promise<{itemId:string}>}){const {itemId}=await params;return ProductPage({itemId,section:'categories'})}
