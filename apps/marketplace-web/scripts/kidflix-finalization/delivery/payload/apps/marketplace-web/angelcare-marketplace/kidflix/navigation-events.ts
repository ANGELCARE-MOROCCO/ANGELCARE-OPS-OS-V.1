export const navigationEvent = "kidflix:navigation";
export function navigateKidFlix(href: string) {
  const target = new URL(href, location.href);
  if (target.origin !== location.origin || !/^\/kidflix\/(en|fr|ar)(\/|$)/.test(target.pathname)) return;
  const event=new CustomEvent(navigationEvent,{cancelable:true,detail:{phase:"navigate",href:target.href}});
  if(!window.dispatchEvent(event))return;
  try { location.assign(target.href); }
  catch { window.dispatchEvent(new CustomEvent(navigationEvent,{detail:{phase:"error",href:target.href}})); }
}
export function failKidFlixNavigation() {
  window.dispatchEvent(new CustomEvent(navigationEvent,{detail:{phase:"error",href:location.href}}));
}
