import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_SUPABASE!);
}

export async function GET() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("toko")
      .select("id_toko, nama_toko, status, tgl_dibuat, organisasi(nama_organisasi)")
      .order("tgl_dibuat", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[Toko API - GET] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id_toko, status } = await req.json();
    const supabase = getClient();
    const { error } = await supabase.from("toko").update({ status }).eq("id_toko", id_toko);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Toko API - PATCH] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
