import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_SUPABASE!);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const supabase = getClient();
    let q = supabase
      .from("pesanan")
      .select("id_pesanan, total_harga, status_pesanan, tgl_pesan, sub_toko(nama_proker), pembayaran(metode_pembayaran, status_bayar)")
      .order("tgl_pesan", { ascending: false })
      .limit(200);

    if (status && status !== "semua") q = q.eq("status_pesanan", status);
    if (dateFrom) q = q.gte("tgl_pesan", dateFrom);
    if (dateTo) q = q.lte("tgl_pesan", dateTo + "T23:59:59");

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[Pesanan API - GET] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
