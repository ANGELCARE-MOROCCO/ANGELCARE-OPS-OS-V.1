export const ACCESS_CONTROL: Record<string, string[]> = {
  '/users': ['users.manage'],
  '/leads': ['leads.view'],
  '/missions': ['missions.view'],
  '/revenue-command-center': ['revenue_center.access'],
  '/voice-center': ['voice_center.access'],
}