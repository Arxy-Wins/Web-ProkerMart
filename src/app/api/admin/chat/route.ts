import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_SUPABASE!);
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") ?? "semua";

  try {
    const supabase = getServiceClient();

    let query = supabase
      .from("percakapan")
      .select(`
        id, judul, kategori, status, created_at, updated_at,
        pengguna:id_pengguna (nama, email, role),
        pesan_chat (isi, created_at, is_admin)
      `)
      .order("updated_at", { ascending: false });

    if (status === "aktif") query = query.eq("status", "aktif");
    else if (status === "selesai") query = query.eq("status", "selesai");

    const { data, error } = await query;
    if (error) throw error;

    const result = (data ?? []).map((p: any) => {
      const msgs = (p.pesan_chat ?? []).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const last = msgs[0];
      return {
        id: p.id,
        judul: p.judul,
        kategori: p.kategori,
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
        pengguna: p.pengguna,
        last_message: last ? { isi: last.isi, created_at: last.created_at, is_admin: last.is_admin } : null,
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[AdminChat - GET] Error:", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });

    const supabase = getServiceClient();
    const { error } = await supabase
      .from("percakapan")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[AdminChat - PATCH] Error:", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}
