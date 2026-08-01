import { notFound } from 'next/navigation'
import QualityReviewChamber from '@/components/flashcards-os/production/QualityReviewChamber'
import { requireFlashcardsPageAccess } from '@/lib/flashcards-os/server/access'
import { loadProductionOverview } from '@/lib/flashcards-os/production/server/repository'
export default async function Page({params}:{params:Promise<{reviewId:string}>}){await requireFlashcardsPageAccess('flashcards_os.create_quality_reviews');const {reviewId}=await params;const data=await loadProductionOverview();const review=data.reviews.find(item=>item.id===reviewId||item.code===reviewId);if(!review)notFound();return <QualityReviewChamber review={review}/>}
