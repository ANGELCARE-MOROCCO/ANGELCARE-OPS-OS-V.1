import { campaignDynamicCommand } from "../_shared"
export const POST = campaignDynamicCommand("create-campaign", ["create-campaign"])
export const PATCH = campaignDynamicCommand("edit-campaign", ["edit-campaign", "transition-campaign"])
