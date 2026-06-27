"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, X, Search, Filter, AlertCircle, Loader2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type OrderStatus = "menunggu_pembayaran" | "menunggu_konfirmasi" | "diproses" | "siap_diambil" | "selesai" | "dibatalkan";

interface Order {
  id_pesanan: string;
  kode_unik: string;
  total_harga: number;
  status_pesanan: OrderStatus;
  metode_pengambilan: string;
  tgl_pesan: string;
  dicatat_oleh: string | null;
  pengguna: { nama: string; email: string } | null;
  pembayaran: { metode_pembayaran: string; status_bayar: string } | null;
  detail_pesanan: { jumlah: number; produk: { nama_produk: string } | null }[];
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_konfirmasi: "Menunggu Konfirmasi",
  diproses: "Diproses",
  siap_diambil: "Siap Diambil",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-slate-100 text-slate-600",
  menunggu_konfirmasi: "bg-amber-100 text-amber-700",
  diproses: "bg-blue-100 text-blue-700",
  siap_diambil: "bg-violet-100 text-violet-700",
  selesai: "bg-emerald-100 text-emerald-700",
  dibatalkan: "bg-red-100 text-red-600",
};

const METHOD_COLOR: Record<string, string> = {
  qris: "bg-purple-100 text-purple-700",
  transfer: "bg-blue-100 text-blue-700",
  tunai: "bg-emerald-100 text-emerald-700",
};

const FILTER_TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Konfirmasi", value: "menunggu_konfirmasi" },
  { label: "Diproses", value: "diproses" },
  { label: "Siap Ambil", value: "siap_diambil" },
  { label: "Selesai", value: "selesai" },
  { label: "Batal", value: "dibatalkan" },
];

export default function OrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [idSubToko, setIdSubToko] = useState<string | null>(null);
  const [idMember, setIdMember] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");

  const fetchOrders = useCallback(async (subTokoId: string) => {
    const { data, error } = await supabase
      .from("pesanan")
      .select(`
        id_pesanan, kode_unik, total_harga, status_pesanan, metode_pengambilan, tgl_pesan, dicatat_oleh,
        pengguna:id_pengguna(nama, email),
        pembayaran(metode_pembayaran, status_bayar),
        detail_pesanan(jumlah, id_produk, produk:id_produk(nama_produk))
      `)
      .eq("id_sub_toko", subTokoId)
      .order("tgl_pesan", { ascending: false });

    if (error) {
      console.error("[OrdersPage - fetchOrders] Error detail:", JSON.stringify(error));
      return;
    }

    setOrders((data as any) ?? []);
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setLoading(false); return; }

      const { data: memberData } = await supabase
        .from("sub_toko_member")
        .select("id_sub_toko, id_member")
        .eq("id_pengguna", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!memberData) { setLoading(false); return; }
      setIdSubToko(memberData.id_sub_toko);
      setIdMember(memberData.id_member);
      await fetchOrders(memberData.id_sub_toko);
      setLoading(false);
    });
  }, [supabase, fetchOrders]);

  const updateStatus = async (id_pesanan: string, newStatus: OrderStatus) => {
    if (!idMember || !idSubToko) return;
    setProcessingId(id_pesanan);
    try {
      const updatePayload: any = { status_pesanan: newStatus };
      // Record who processed this order when first confirming
      if (newStatus === "diproses") {
        updatePayload.dicatat_oleh = idMember;
      }
      const { error } = await supabase
        .from("pesanan")
        .update(updatePayload)
        .eq("id_pesanan", id_pesanan);

      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) =>
          o.id_pesanan === id_pesanan
            ? { ...o, status_pesanan: newStatus, dicatat_oleh: newStatus === "diproses" ? idMember : o.dicatat_oleh }
            : o
        )
      );
    } catch (err) {
      console.error("[OrdersPage - updateStatus] Error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "all" || o.status_pesanan === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || o.kode_unik.toLowerCase().includes(q) || o.pengguna?.nama.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingCount = orders.filter((o) => o.status_pesanan === "menunggu_konfirmasi").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pesanan Masuk</h1>
          <p className="text-sm text-slate-500">Kelola dan verifikasi pesanan dari pembeli.</p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900 text-sm">{pendingCount} Pesanan Perlu Konfirmasi</h3>
            <p className="text-xs text-amber-700">Segera proses pesanan yang menunggu konfirmasi.</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filterStatus === tab.value
                ? "bg-primary-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({orders.filter((o) => o.status_pesanan === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode pesanan atau nama pembeli..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">Tidak ada pesanan ditemukan.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((order, i) => {
              const itemSummary = order.detail_pesanan
                ?.map((d) => `${d.produk?.nama_produk ?? "?"} (${d.jumlah}x)`)
                .join(", ") ?? "—";
              const isProcessing = processingId === order.id_pesanan;

              return (
                <motion.div
                  key={order.id_pesanan}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 sm:gap-4 items-start sm:items-center">
                      {/* Kode + Status */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-slate-800 text-sm">{order.kode_unik}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLOR[order.status_pesanan]}`}>
                          {STATUS_LABEL[order.status_pesanan]}
                        </span>
                      </div>

                      {/* Detail */}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{order.pengguna?.nama ?? "—"}</p>
                        <p className="text-xs text-slate-500 truncate">{itemSummary}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(order.tgl_pesan).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      {/* Harga + Metode */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
                        <span className="font-bold text-primary-600 text-sm">Rp {Number(order.total_harga).toLocaleString("id-ID")}</span>
                        {order.pembayaran && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${METHOD_COLOR[order.pembayaran.metode_pembayaran] ?? "bg-slate-100 text-slate-600"}`}>
                            {order.pembayaran.metode_pembayaran.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                      {order.status_pesanan === "menunggu_konfirmasi" && (
                        <>
                          <button
                            disabled={isProcessing}
                            onClick={() => updateStatus(order.id_pesanan, "diproses")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Terima
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => updateStatus(order.id_pesanan, "dibatalkan")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white text-xs font-bold rounded-lg border border-red-200 hover:border-red-500 transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak
                          </button>
                        </>
                      )}
                      {order.status_pesanan === "diproses" && (
                        <button
                          disabled={isProcessing}
                          onClick={() => updateStatus(order.id_pesanan, "siap_diambil")}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          Siap Ambil
                        </button>
                      )}
                      {order.status_pesanan === "siap_diambil" && (
                        <button
                          disabled={isProcessing}
                          onClick={() => updateStatus(order.id_pesanan, "selesai")}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Selesai
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
