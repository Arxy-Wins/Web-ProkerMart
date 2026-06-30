"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

type Pengguna = { nama: string; email: string; role: string } | null;
type LastMessage = { isi: string; created_at: string; is_admin: boolean } | null;

export type Percakapan = {
  id: string;
  judul: string;
  kategori: string;
  status: string;
  created_at: string;
  updated_at: string;
  pengguna: Pengguna;
  last_message: LastMessage;
};

const KATEGORI_COLOR: Record<string, string> = {
  pembatalan: "bg-red-100 text-red-700",
  bantuan: "bg-blue-100 text-blue-700",
  laporan: "bg-amber-100 text-amber-700",
  kendala: "bg-orange-100 text-orange-700",
  lainnya: "bg-slate-100 text-slate-600",
};

function timeAgo(dt: string) {
  const diff = Date.now() - new Date(dt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

type Props = {
  list: Percakapan[];
  selectedId: string | null;
  onSelect: (p: Percakapan) => void;
  filter: string;
  onFilterChange: (f: string) => void;
};

const FILTERS = [
  { label: "Aktif", value: "aktif" },
  { label: "Selesai", value: "selesai" },
  { label: "Semua", value: "semua" },
];

export default function ChatList({ list, selectedId, onSelect, filter, onFilterChange }: Props) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      <div className="px-4 py-4 border-b border-slate-100 shrink-0">
        <h2 className="font-black text-slate-900 text-sm mb-3">Percakapan</h2>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-12">
            <MessageSquare className="w-8 h-8" />
            <p className="text-xs">Tidak ada percakapan</p>
          </div>
        ) : (
          list.map((p) => (
            <motion.button
              key={p.id}
              onClick={() => onSelect(p)}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-colors ${
                selectedId === p.id ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className={`text-xs font-black truncate ${selectedId === p.id ? "text-blue-700" : "text-slate-900"}`}>
                  {p.judul}
                </p>
                <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(p.updated_at)}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${KATEGORI_COLOR[p.kategori] ?? "bg-slate-100 text-slate-600"}`}>
                  {p.kategori}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  p.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {p.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {p.pengguna ? `${p.pengguna.nama} · ${p.pengguna.role}` : "Pengguna dihapus"}
              </p>
              {p.last_message && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {p.last_message.is_admin ? "Admin: " : ""}{p.last_message.isi}
                </p>
              )}
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
