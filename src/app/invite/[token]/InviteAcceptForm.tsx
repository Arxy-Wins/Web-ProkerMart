"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type InviteAcceptFormProps = {
  token: string;
};

type InvitationInfo = {
  email: string;
  role: string;
  status: string;
  expires_at: string | null;
};

export default function InviteAcceptForm({ token }: InviteAcceptFormProps) {
  const [invite, setInvite] = useState<InvitationInfo | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchInvite = async () => {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(`/api/invitations/info?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (!response.ok) {
        setFetchError(data.error || "Undangan tidak dapat dimuat.");
        setLoading(false);
        return;
      }

      setInvite(data.invitation);
      setLoading(false);
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!invite) return;

    setStatus(null);
    setLoading(true);

    const response = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setStatus(data.error || "Terjadi kesalahan saat menerima undangan.");
      return;
    }

    setStatus("Undangan berhasil dikonfirmasi. Anda sekarang sudah menjadi anggota sub toko.");
    setTimeout(() => router.push("/"), 2000);
  };

  if (loading && !invite && !fetchError) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-2xl mx-auto text-center">
        <p className="text-slate-600">Memuat undangan...</p>
      </div>
    );
  }

  if (fetchError || !invite) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-slate-900">Undangan Tidak Ditemukan</h1>
        <p className="mt-4 text-slate-600">{fetchError || "Tautan sudah tidak valid atau sudah digunakan."}</p>
      </div>
    );
  }

  const isExpired = invite.expires_at ? new Date(invite.expires_at) < new Date() : false;
  const isPending = invite.status === "pending" && !isExpired;

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Konfirmasi Undangan</h1>
        <p className="text-sm text-slate-500 mt-2">Email yang diundang: <strong>{invite.email}</strong></p>
        <p className="text-sm text-slate-500">Peran: <strong>{invite.role}</strong></p>
      </div>

      {!isPending ? (
        <div className="rounded-3xl bg-slate-50 border border-slate-200 p-8 text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">Undangan Tidak Aktif</h2>
          <p className="mt-3 text-sm">
            {isExpired
              ? "Undangan ini sudah kadaluarsa."
              : "Undangan ini sudah dikonfirmasi atau tidak lagi tersedia."}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAccept}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-2xl text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Memproses..." : "Terima Undangan dan Masuk Sub Toko"}
        </button>
      )}

      {status && (
        <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
          {status}
        </div>
      )}

      <div className="mt-5 text-xs text-slate-500">
        Jika Anda belum login, silakan login terlebih dahulu dan kembali ke halaman ini.
      </div>
    </div>
  );
}
