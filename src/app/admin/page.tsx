"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Store, Layers, ShoppingCart, TrendingUp, Clock, Loader2 } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalToko: number;
  totalSubToko: number;
  totalOrders: number;
  gmv: number;
  pendingToko: number;
}

interface RecentOrder {
  id_pesanan: string;
  total_harga: number;
  status_pesanan: string;
  tgl_pesan: string;
  sub_toko: { nama_proker: string } | null;
}

interface DayBucket {
  label: string;
  key: string;
  count: number;
}

const STATUS_COLOR: Record<string, string> = {
  selesai: "bg-emerald-100 text-emerald-700",
  diproses: "bg-blue-100 text-blue-700",
  menunggu_konfirmasi: "bg-amber-100 text-amber-700",
  menunggu_pembayaran: "bg-amber-100 text-amber-700",
  dibatalkan: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalToko: 0, totalSubToko: 0, totalOrders: 0, gmv: 0, pendingToko: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [daybuckets, setDayBuckets] = useState<DayBucket[]>([]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats({
          totalUsers: data.totalUsers,
          totalToko: data.totalToko,
          totalSubToko: data.totalSubToko,
          totalOrders: data.totalOrders,
          gmv: data.gmv,
          pendingToko: data.pendingToko,
        });
        setRecentOrders(data.recentOrders ?? []);
        setDayBuckets(data.dayBuckets ?? []);
      } catch (err) {
        console.error("[Dashboard] Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const statCards = [
    { label: "Total Pengguna", value: stats.totalUsers.toLocaleString("id-ID"), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Toko", value: stats.totalToko.toLocaleString("id-ID"), icon: Store, color: "text-violet-600", bg: "bg-violet-50", badge: stats.pendingToko > 0 ? `${stats.pendingToko} aktif` : undefined },
    { label: "Total Sub-Toko", value: stats.totalSubToko.toLocaleString("id-ID"), icon: Layers, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Order Selesai", value: stats.totalOrders.toLocaleString("id-ID"), icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total GMV", value: `Rp ${stats.gmv.toLocaleString("id-ID")}`, icon: TrendingUp, color: "text-primary", bg: "bg-blue-50", wide: true },
  ];

  const maxCount = Math.max(...daybuckets.map((b) => b.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Ringkasan aktivitas platform ProkerMart.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm ${(s as any).wide ? "col-span-2 lg:col-span-4" : ""}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className={`text-lg font-black ${s.color} truncate`}>{s.value}</p>
                  {s.badge && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">{s.badge}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-900 mb-4">Pesanan 7 Hari Terakhir</h2>
          <div className="flex items-end gap-2 h-32">
            {daybuckets.map((b) => (
              <div key={b.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: "90px" }}>
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all"
                    style={{ height: `${(b.count / maxCount) * 100}%` }}
                    title={`${b.count} pesanan`}
                  />
                </div>
                <p className="text-[9px] text-slate-400 text-center leading-tight">{b.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-slate-900">Pesanan Terbaru</h2>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-52">
            {recentOrders.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Belum ada pesanan.</p>
            ) : recentOrders.map((o) => (
              <div key={o.id_pesanan} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-slate-500 truncate">{o.id_pesanan.slice(0, 8)}…</p>
                  <p className="text-xs text-slate-700 truncate">{(o.sub_toko as any)?.nama_proker ?? "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900">Rp {Number(o.total_harga).toLocaleString("id-ID")}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLOR[o.status_pesanan] ?? "bg-slate-100 text-slate-600"}`}>
                    {o.status_pesanan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
