export type AcCapitalResearchResult = {
  sourceUrl?: string;
  sourceTitle?: string;
  sourceConfidence: number;
  sourceFreshness: string;
  detectedAt: string;
  needsHumanReview: boolean;
  title: string;
  summary: string;
};
