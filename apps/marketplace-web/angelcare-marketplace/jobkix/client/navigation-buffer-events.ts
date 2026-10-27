/** Public UI navigation signals only; never a login/session/authorization channel. */
export const JOBKIX_NAV_START = 'jobkix:navigation-buffer:start';
export const JOBKIX_NAV_CANCEL = 'jobkix:navigation-buffer:cancel';

export function announceJobkixNavigation(destination: string, retryable = true) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(JOBKIX_NAV_START, {detail:{destination,retryable}}));
  }
}
export function cancelJobkixNavigation() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(JOBKIX_NAV_CANCEL));
}
