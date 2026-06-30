import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_SUPABASE!);
}

export async function GET() {
  try {
    const supabase = getClient();
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [onlineRes, offlineRes, penarikanRes] = await Promise.all([
      supabase.from("pesanan").select("total_harga, tgl_pesan").eq("status_pesanan", "selesai").gte("tgl_pesan", sixMonthsAgo.toISOString()),
      supabase.from("rekap_jualan_offline").select("total_harga, tanggal").gte("tanggal", sixMonthsAgo.toISOString().slice(0, 10)),
      supabase.from("penarikan_saldo").select("id, jumlah, nama_bank, no_rekening, nama_pemilik, tgl_tarik, sub_toko(nama_proker)").order("tgl_tarik", { ascending: false }),
    ]);

    const onlineList = onlineRes.data ?? [];
    const offlineList = offlineRes.data ?? [];
    const penarikanList = penarikanRes.data ?? [];

    const gmvOnline = onlineList.reduce((s: number, o: any) => s + Number(o.total_harga), 0);
    const gmvOffline = offlineList.reduce((s: number, r: any) => s + Number(r.total_harga), 0);
    const totalPenarikan = penarikanList.reduce((s: number, p: any) => s + Number(p.jumlah), 0);

    const buckets: { key: string; label: string; online: number; offline: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      buckets.push({ key, label, online: 0, offline: 0 });
    }
    onlineList.forEach((o: any) => {
      const key = o.tgl_pesan.slice(0, 7);
      const b = buckets.find((b) => b.key === key);
      if (b) b.online += Number(o.total_harga);
    });
    offlineList.forEach((r: any) => {
      const key = r.tanggal.slice(0, 7);
      const b = buckets.find((b) => b.key === key);
      if (b) b.offline += Number(r.total_harga);
    });

    return NextResponse.json({
      gmvOnline,
      gmvOffline,
      totalPenarikan,
      penarikanList,
      monthBuckets: buckets,
    });
  } catch (err) {
    console.error("[Keuangan API - GET] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
