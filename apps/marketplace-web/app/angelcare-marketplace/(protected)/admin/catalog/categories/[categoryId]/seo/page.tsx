import { CategoryPage } from '@/angelcare-marketplace/commerce-studio/admin-pages'
export default async function Page({params}:{params:Promise<{categoryId:string}>}){const {categoryId}=await params;return CategoryPage({categoryId,section:'filters'})}
