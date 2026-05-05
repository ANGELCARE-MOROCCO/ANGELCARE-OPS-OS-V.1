import { createClient } from "@supabase/supabase-js";
export function emailOsAdminClient(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url || !key) throw new Error("Supabase env missing for Email OS V8");
  return createClient(url, key, { auth: { persistSession: false }});
}
export function normalizeThreadSubject(subject:string){ return (subject||"").replace(/^(re:|fw:|fwd:)\s*/i,"").trim().toLowerCase(); }
export function safeStatus(value:any, fallback="unknown"){ return typeof value === "string" && value.length ? value : fallback; }
export function mailboxEnvPassword(email:string){
  const key = "EMAIL_PASS_" + email.replace(/[^a-zA-Z0-9]/g,"_").toUpperCase();
  return process.env[key];
}
