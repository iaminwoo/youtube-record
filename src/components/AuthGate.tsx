"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

const AuthContext = createContext<{ signOut: () => Promise<void> }>({ signOut: async () => undefined });
export const useAuth = () => useContext(AuthContext);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => { if (!isSupabaseConfigured()) return; const supabase = getSupabaseClient(); void supabase.auth.getSession().then(({ data }) => setSession(data.session)); const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next)); return () => data.subscription.unsubscribe(); }, []);
  async function signIn(event: React.FormEvent) { event.preventDefault(); setIsSubmitting(true); setError(""); const { error: authError } = await getSupabaseClient().auth.signInWithPassword({ email, password }); if (authError) { console.error(authError); setError("이메일 또는 비밀번호를 확인해주세요."); } setIsSubmitting(false); }
  async function signOut() { const { error: authError } = await getSupabaseClient().auth.signOut(); if (authError) console.error(authError); }
  if (!isSupabaseConfigured()) return <main className="auth-screen"><section className="auth-card"><h1>같이 보기</h1><p>Supabase 환경 변수를 설정해주세요.</p></section></main>;
  if (session === undefined) return <main className="auth-screen"><p>불러오는 중...</p></main>;
  if (!session) return <main className="auth-screen"><form className="auth-card" onSubmit={signIn}><h1>같이 보기</h1><label>이메일<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>비밀번호<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="auth-error">{error}</p>}<button className="primary-button" disabled={isSubmitting}>{isSubmitting ? "로그인 중..." : "로그인"}</button></form></main>;
  return <AuthContext.Provider value={{ signOut }}>{children}</AuthContext.Provider>;
}
