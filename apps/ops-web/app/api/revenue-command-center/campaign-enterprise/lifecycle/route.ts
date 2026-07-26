import { campaignDynamicCommand } from "../_shared"
export const PATCH = campaignDynamicCommand("pause-campaign", ["pause-campaign", "resume-campaign", "emergency-stop", "transition-campaign"])
