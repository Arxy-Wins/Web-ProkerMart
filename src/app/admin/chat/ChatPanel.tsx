"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, CheckCheck, MessageSquare } from "lucide-react";
import type { Percakapan } from "./ChatList";

type Pesan = {
  id: string;
  isi: string;
  is_admin: boolean;
  created_at: string;
  id_pengirim: string | null;
};

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

type Props = {
  percakapan: Percakapan;
  onStatusChange: (id: string, status: string) => void;
};

export default function ChatPanel({ percakapan, onStatusChange }: Props) {
  const [pesan, setPesan] = useState<Pesan[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchPesan = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`/api/admin/chat/${percakapan.id}`);
      if (!res.ok) throw new Error("Gagal memuat pesan.");
      const data = await res.json();
      setPesan((prev) => {
        if (silent && prev.length === data.pesan.length) return prev;
        return data.pesan;
      });
    } catch (err) {
      console.error("[ChatPanel - fetchPesan] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [percakapan.id]);

  useEffect(() => {
    setLoading(true);
    setPesan([]);
    fetchPesan();

    const interval = setInterval(() => fetchPesan(true), 3000);
    return () => clearInterval(interval);
  }, [percakapan.id, fetchPesan]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pesan]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/chat/${percakapan.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isi: input.trim() }),
      });
      if (!res.ok) throw new Error("Gagal mengirim pesan.");
      setInput("");
    } catch (err) {
      console.error("[ChatPanel - handleSend] Error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleMarkSelesai = async () => {
    setMarking(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: percakapan.id, status: "selesai" }),
      });
      if (!res.ok) throw new Error("Gagal mengubah status.");
      onStatusChange(percakapan.id, "selesai");
    } catch (err) {
      console.error("[ChatPanel - handleMarkSelesai] Error:", err);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <div>
          <p className="font-black text-slate-900 text-sm">{percakapan.judul}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {percakapan.pengguna ? `${percakapan.pengguna.nama} · ${percakapan.pengguna.email}` : "Pengguna dihapus"}
          </p>
        </div>
        {percakapan.status === "aktif" && (
          <button
            onClick={handleMarkSelesai}
            disabled={marking}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {marking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Tandai Selesai
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        ) : pesan.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <MessageSquare className="w-8 h-8" />
            <p className="text-xs">Belum ada pesan</p>
          </div>
        ) : (
          pesan.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${p.is_admin ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                p.is_admin
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-800 rounded-bl-sm"
              }`}>
                <p className="leading-relaxed">{p.isi}</p>
                <p className={`text-[10px] mt-1 ${p.is_admin ? "text-blue-200" : "text-slate-400"}`}>
                  {formatTime(p.created_at)}
                </p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {percakapan.status === "aktif" ? (
        <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-3 border-t border-slate-100 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      ) : (
        <div className="px-4 py-3 border-t border-slate-100 shrink-0 text-center text-xs text-slate-400">
          Percakapan ini sudah selesai
        </div>
      )}
    </div>
  );
}
