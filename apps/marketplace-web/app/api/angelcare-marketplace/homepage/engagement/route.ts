import { handleHomepageEngagement } from '@/angelcare-marketplace/homepage-flagship/api-handlers'
export async function GET(request:Request){return handleHomepageEngagement(request)}
export async function POST(request:Request){return handleHomepageEngagement(request)}
