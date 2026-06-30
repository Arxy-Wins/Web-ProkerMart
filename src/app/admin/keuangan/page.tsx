"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Wifi, WifiOff, Wallet, Download, Loader2 } from "lucide-react";

interface KeuanganSummary {
  gmvOnline: number;
  gmvOffline: number;
  totalPenarikan: number;
}

interface Penarikan {
  id: string;
  jumlah: number;
  nama_bank: string;
  no_rekening: string;
  nama_pemilik: string;
  tgl_tarik: string;
  sub_toko: { nama_proker: string } | null;
}

interface MonthBucket {
  key: string;
  label: string;
  online: number;
  offline: number;
}

export default function KeuanganPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<KeuanganSummary>({ gmvOnline: 0, gmvOffline: 0, totalPenarikan: 0 });
  const [penarikanList, setPenarikanList] = useState<Penarikan[]>([]);
  const [monthBuckets, setMonthBuckets] = useState<MonthBucket[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/keuangan");
        if (!res.ok) throw new Error("Failed to fetch keuangan");
        const data = await res.json();
        setSummary({ gmvOnline: data.gmvOnline, gmvOffline: data.gmvOffline, totalPenarikan: data.totalPenarikan });
        setPenarikanList(data.penarikanList ?? []);
        setMonthBuckets(data.monthBuckets ?? []);
      } catch (err) {
        console.error("[Keuangan - fetch] Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const exportCSV = () => {
    const header = ["Sub-Toko", "Jumlah", "Bank", "No. Rekening", "Nama Pemilik", "Tgl. Tarik"];
    const rows = penarikanList.map((p) => [
      (p.sub_toko as any)?.nama_proker ?? "—",
      p.jumlah,
      p.nama_bank,
      p.no_rekening,
      p.nama_pemilik,
      new Date(p.tgl_tarik).toLocaleDateString("id-ID"),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "penarikan_saldo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxBucket = Math.max(...monthBuckets.map((b) => b.online + b.offline), 1);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Keuangan Platform</h1>
        <p className="text-sm text-slate-500">Rekap GMV, penarikan saldo, dan grafik bulanan.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total GMV", value: `Rp ${(summary.gmvOnline + summary.gmvOffline).toLocaleString("id-ID")}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "GMV Online", value: `Rp ${summary.gmvOnline.toLocaleString("id-ID")}`, icon: Wifi, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "GMV Offline", value: `Rp ${summary.gmvOffline.toLocaleString("id-ID")}`, icon: WifiOff, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Ditarik", value: `Rp ${summary.totalPenarikan.toLocaleString("id-ID")}`, icon: Wallet, color: "text-violet-600", bg: "bg-violet-50" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-base font-black ${s.color} mt-0.5`}>{s.value}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-900 mb-1">GMV per Bulan (6 Bulan Terakhir)</h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-2 rounded-sm bg-blue-500 inline-block" /> Online</span>
          <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-2 rounded-sm bg-amber-400 inline-block" /> Offline</span>
        </div>
        <div className="flex items-end gap-3 h-36">
          {monthBuckets.map((b) => {
            const onlinePct = (b.online / maxBucket) * 100;
            const offlinePct = (b.offline / maxBucket) * 100;
            return (
              <div key={b.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: "100px" }}>
                  <div className="w-full bg-amber-400 rounded-t-sm" style={{ height: `${offlinePct}%` }} title={`Offline: Rp ${b.offline.toLocaleString("id-ID")}`} />
                  <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${onlinePct}%` }} title={`Online: Rp ${b.online.toLocaleString("id-ID")}`} />
                </div>
                <p className="text-[9px] text-slate-400 text-center leading-tight">{b.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Riwayat Penarikan Saldo</h2>
          <button onClick={exportCSV}
            className="flex items-center gap-2 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-xl transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Sub-Toko", "Jumlah", "Bank", "No. Rekening", "Nama Pemilik", "Tgl. Tarik"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {penarikanList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Belum ada penarikan.</td></tr>
              ) : penarikanList.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700">{(p.sub_toko as any)?.nama_proker ?? "—"}</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">Rp {Number(p.jumlah).toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-slate-600">{p.nama_bank}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.no_rekening}</td>
                  <td className="px-4 py-3 text-slate-600">{p.nama_pemilik}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(p.tgl_tarik).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
