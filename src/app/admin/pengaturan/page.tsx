"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, UserPlus, X, Users, Mail } from "lucide-react";

type AdminUser = {
  id_pengguna: string;
  nama: string;
  email: string;
  created_at: string;
};

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function PengaturanPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  async function fetchAdmins() {
    try {
      const res = await fetch("/api/admin/pengguna?role=admin");
      if (!res.ok) throw new Error("Gagal memuat data admin.");
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error("[Pengaturan - fetchAdmins] Error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAdmins(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviting(true);
    try {
      const res = await fetch("/api/admin/invite-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengirim undangan.");
      setInviteSuccess(true);
      setInviteEmail("");
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setInviteEmail("");
    setInviteError("");
    setInviteSuccess(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900">Pengaturan</h2>
        <p className="text-sm text-slate-500 mt-0.5">Kelola akun admin platform</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm">Daftar Admin</h3>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Undang Admin
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">Belum ada admin terdaftar.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {admins.map((admin) => (
              <div key={admin.id_pengguna} className="flex items-center gap-4 px-6 py-4">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-blue-700 font-bold text-sm">
                    {admin.nama?.charAt(0)?.toUpperCase() ?? "A"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{admin.nama}</p>
                  <p className="text-xs text-slate-500 truncate">{admin.email}</p>
                </div>
                <p className="text-xs text-slate-400 shrink-0">{formatDate(admin.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <h3 className="font-black text-slate-900 text-sm">Undang Admin</h3>
                </div>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {inviteSuccess ? (
                <div className="text-center space-y-3">
                  <p className="text-emerald-600 font-bold text-sm">Undangan berhasil dikirim!</p>
                  <p className="text-xs text-slate-500">Link undangan telah dikirim ke email yang dituju.</p>
                  <button onClick={closeModal}
                    className="mt-2 text-sm font-bold text-blue-600 hover:underline">
                    Tutup
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Email Admin Baru</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      placeholder="email@contoh.com"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  {inviteError && (
                    <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{inviteError}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={closeModal}
                      className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                      Batal
                    </button>
                    <button type="submit" disabled={inviting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                      {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Kirim Undangan
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
