import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_SUPABASE!);
}

export async function GET() {
  try {
    const supabase = getClient();

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [usersRes, tokoRes, subTokoRes, ordersRes, offlineRes, recentRes, pendingRes] = await Promise.all([
      supabase.from("pengguna").select("id_pengguna", { count: "exact", head: true }),
      supabase.from("toko").select("id_toko", { count: "exact", head: true }),
      supabase.from("sub_toko").select("id_sub_toko", { count: "exact", head: true }),
      supabase.from("pesanan").select("total_harga", { count: "exact" }).eq("status_pesanan", "selesai"),
      supabase.from("rekap_jualan_offline").select("total_harga"),
      supabase.from("pesanan").select("id_pesanan, total_harga, status_pesanan, tgl_pesan, sub_toko(nama_proker)").order("tgl_pesan", { ascending: false }).limit(10),
      supabase.from("toko").select("id_toko", { count: "exact", head: true }).eq("status", "active"),
    ]);

    const gmvOnline = (ordersRes.data ?? []).reduce((s: number, o: any) => s + Number(o.total_harga), 0);
    const gmvOffline = (offlineRes.data ?? []).reduce((s: number, r: any) => s + Number(r.total_harga), 0);

    const buckets: { key: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
      buckets.push({ key, label, count: 0 });
    }
    (recentRes.data ?? []).forEach((o: any) => {
      const key = o.tgl_pesan.slice(0, 10);
      const b = buckets.find((b) => b.key === key);
      if (b) b.count++;
    });

    return NextResponse.json({
      totalUsers: usersRes.count ?? 0,
      totalToko: tokoRes.count ?? 0,
      totalSubToko: subTokoRes.count ?? 0,
      totalOrders: ordersRes.count ?? 0,
      gmv: gmvOnline + gmvOffline,
      pendingToko: pendingRes.count ?? 0,
      recentOrders: recentRes.data ?? [],
      dayBuckets: buckets,
    });
  } catch (err) {
    console.error("[Stats API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
