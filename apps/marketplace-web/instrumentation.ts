/** JOBKIX R3: additively initializes an in-process scheduler, disabled in DB until activated. */
export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'&&process.env.NODE_ENV==='production'){
  const mod=await import('./angelcare-marketplace/jobkix/supply/r3/scheduler');
  mod.startJobkixSupplyScheduler();
  // Separate explicit opt-in: this drains the existing SHARED Auth email ledger.
  if(process.env.ANGELCARE_AUTH_EMAIL_INLINE_ENABLED==='true'){
   const mail=await import('./angelcare-marketplace/customer-commerce/auth-email-native/inline-runner');
   mail.startAngelcareAuthEmailInline();
  }
 }
}
