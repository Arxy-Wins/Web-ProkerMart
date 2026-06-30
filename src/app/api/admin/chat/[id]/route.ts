import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_SUPABASE!);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = getServiceClient();

    const { data: percakapan, error: pcErr } = await supabase
      .from("percakapan")
      .select("id, judul, kategori, status, created_at, updated_at, pengguna:id_pengguna(nama, email, role)")
      .eq("id", id)
      .single();
    if (pcErr) throw pcErr;

    const { data: pesan, error: pesanErr } = await supabase
      .from("pesan_chat")
      .select("id, isi, is_admin, created_at, id_pengirim")
      .eq("id_percakapan", id)
      .order("created_at", { ascending: true });
    if (pesanErr) throw pesanErr;

    return NextResponse.json({ percakapan, pesan: pesan ?? [] });
  } catch (err: any) {
    console.error("[AdminChatDetail - GET] Error:", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { isi } = await req.json();
    if (!isi?.trim()) return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });

    const supabase = getServiceClient();

    const { error: insertErr } = await supabase.from("pesan_chat").insert({
      id_percakapan: id,
      isi: isi.trim(),
      is_admin: true,
      id_pengirim: null,
    });
    if (insertErr) throw insertErr;

    await supabase
      .from("percakapan")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[AdminChatDetail - POST] Error:", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}
