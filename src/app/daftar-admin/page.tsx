"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function DaftarAdminForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<{ email: string } | null>(null);
  const [loadingInv, setLoadingInv] = useState(true);
  const [invError, setInvError] = useState("");

  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) { setInvError("Token undangan tidak valid."); setLoadingInv(false); return; }
    async function loadInvitation() {
      const res = await fetch(`/api/daftar-admin?token=${token}`);
      if (!res.ok) { setInvError("Undangan tidak ditemukan atau sudah digunakan."); setLoadingInv(false); return; }
      const data = await res.json();
      setInvitation(data);
      setLoadingInv(false);
    }
    loadInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (password !== confirmPassword) { setFormError("Password tidak cocok."); return; }
    if (password.length < 6) { setFormError("Password minimal 6 karakter."); return; }
    if (!nama.trim()) { setFormError("Nama wajib diisi."); return; }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setFormError("Sesi tidak valid. Pastikan kamu mengklik link dari email undangan.");
        setSubmitting(false);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError || !sessionData.user) throw sessionError;

      const { error: pwError } = await supabase.auth.updateUser({ password });
      if (pwError) throw pwError;

      const res = await fetch("/api/daftar-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nama }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal mendaftar.");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("[DaftarAdmin] Error:", err);
      setFormError(err.message ?? "Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (invError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-red-500 font-bold">{invError}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">Akun admin berhasil dibuat!</h2>
          <p className="text-sm text-slate-500">Kamu sekarang bisa masuk ke panel admin ProkerMart.</p>
          <Link href="/login"
            className="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors">
            Masuk Sekarang
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Daftar Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Kamu diundang sebagai admin ProkerMart</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Nama Lengkap</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} required
              placeholder="Nama admin"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Email</label>
            <input type="email" value={invitation?.email ?? ""} disabled
              className="w-full border border-slate-100 rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="Minimal 6 karakter"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Konfirmasi Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              placeholder="Ulangi password"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          {formError && <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Buat Akun Admin
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function DaftarAdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <DaftarAdminForm />
    </Suspense>
  );
}
