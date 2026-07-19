import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase';

export function AuthGate({children}:{children:React.ReactNode}) {
  const [session,setSession]=useState<Session|null>(null);
  const [loading,setLoading]=useState(isSupabaseConfigured);
  const [email,setEmail]=useState(''); const[password,setPassword]=useState('');
  const [message,setMessage]=useState<string|null>(null); const[signup,setSignup]=useState(false);
  useEffect(()=>{if(!isSupabaseConfigured)return;let active=true;void supabase.auth.getSession().then(({data,error})=>{if(active){setSession(data.session);setMessage(error?.message??null);setLoading(false);}});const{data}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setLoading(false);});return()=>{active=false;data.subscription.unsubscribe();};},[]);
  if(!isSupabaseConfigured)return <Centered title="Supabase belum dikonfigurasi"><p>Salin <code>.env.example</code> menjadi <code>.env.local</code>, lalu isi URL dan publishable/anon key proyek Supabase.</p><pre className="mt-3 text-left bg-slate-900 text-slate-100 p-3 rounded-lg">NEXT_PUBLIC_SUPABASE_URL="https://arnibqhytwribuezcngh.supabase.co"{`\n`}NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"</pre></Centered>;
  if(loading)return <Centered title="Menghubungkan ke Supabase..."/>;
  if(session)return <>{children}<button onClick={()=>{void supabase.auth.signOut();}} className="fixed bottom-4 left-4 z-50 text-xs bg-slate-800 text-white px-3 py-2 rounded-lg">Keluar</button></>;
  const submit=async(event:React.FormEvent)=>{event.preventDefault();setMessage(null);const result=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(result.error)setMessage(result.error.message);else if(signup)setMessage('Pendaftaran berhasil. Periksa email jika konfirmasi diwajibkan.');};
  return <Centered title={signup?'Daftar HouseERP':'Masuk HouseERP'}><form onSubmit={event=>{void submit(event);}} className="space-y-3 mt-4"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border rounded-lg p-2"/><input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full border rounded-lg p-2"/><button className="w-full bg-indigo-600 text-white rounded-lg p-2">{signup?'Daftar':'Masuk'}</button></form>{message&&<p className="mt-3 text-sm text-rose-600">{message}</p>}<button onClick={()=>setSignup(v=>!v)} className="mt-4 text-sm text-indigo-600">{signup?'Sudah punya akun? Masuk':'Belum punya akun? Daftar'}</button></Centered>;
}
function Centered({title,children}:{title:string;children?:React.ReactNode}){return <main className="min-h-screen bg-slate-100 grid place-items-center p-6"><section className="w-full max-w-md bg-white border rounded-2xl p-6 shadow-sm"><h1 className="text-xl font-bold">{title}</h1>{children}</section></main>;}
