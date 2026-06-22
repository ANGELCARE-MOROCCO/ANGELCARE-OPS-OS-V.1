import type { ContentCommandRole } from './permissions';

export interface ContentCommandRuntimeUser {
  id: string;
  email?: string;
  role: ContentCommandRole;
}

export async function getContentCommandRuntimeUser(): Promise<ContentCommandRuntimeUser> {
  // Replace this with your real auth/session resolver.
  // Keep this server-side for protected mutations.
  return {
    id: 'runtime-user-placeholder',
    role: 'admin',
  };
}