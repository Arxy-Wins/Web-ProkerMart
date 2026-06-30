"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ChatList, { type Percakapan } from "./ChatList";
import ChatPanel from "./ChatPanel";

export default function ChatPage() {
  const [list, setList] = useState<Percakapan[]>([]);
  const [filter, setFilter] = useState("aktif");
  const [selected, setSelected] = useState<Percakapan | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "panel">("list");

  async function fetchList(f: string) {
    try {
      const res = await fetch(`/api/admin/chat?status=${f}`);
      if (!res.ok) throw new Error("Gagal memuat percakapan.");
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error("[ChatPage - fetchList] Error:", err);
    }
  }

  useEffect(() => {
    fetchList(filter);

    const supabase = createClient();
    const channel = supabase
      .channel("percakapan_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "percakapan" }, () => {
        fetchList(filter);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const handleSelect = (p: Percakapan) => {
    setSelected(p);
    setMobileView("panel");
  };

  const handleFilterChange = (f: string) => {
    setFilter(f);
    setSelected(null);
  };

  const handleStatusChange = (id: string, status: string) => {
    setList((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    setSelected((prev) => prev?.id === id ? { ...prev, status } : prev);
  };

  return (
    <div className="h-[calc(100vh-65px)] -m-4 md:-m-6 flex">
      {/* List panel */}
      <div className={`${mobileView === "panel" ? "hidden md:flex" : "flex"} md:flex w-full md:w-72 lg:w-80 shrink-0 flex-col`}>
        <ChatList
          list={list}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          filter={filter}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Chat panel */}
      <div className={`${mobileView === "list" ? "hidden md:flex" : "flex"} md:flex flex-1 flex-col`}>
        {selected ? (
          <>
            {/* Mobile back button */}
            <div className="md:hidden px-4 pt-3 shrink-0">
              <button
                onClick={() => setMobileView("list")}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                ← Kembali
              </button>
            </div>
            <ChatPanel key={selected.id} percakapan={selected} onStatusChange={handleStatusChange} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <MessageSquare className="w-10 h-10" />
            <p className="text-sm">Pilih percakapan untuk mulai membalas</p>
          </div>
        )}
      </div>
    </div>
  );
}
