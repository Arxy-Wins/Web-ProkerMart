import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_SUPABASE!);
}

export async function POST(req: NextRequest) {
  try {
    const { nama_toko, email } = await req.json();
    if (!nama_toko?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nama toko dan email wajib diisi." }, { status: 400 });
    }

    const supabase = getClient();

    const { data: inv, error: invError } = await supabase
      .from("undangan_toko")
      .insert({ email: email.trim(), nama_toko: nama_toko.trim() })
      .select("token")
      .single();

    if (invError) throw invError;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
    const redirectTo = `${baseUrl}/daftar-toko?token=${inv.token}`;

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email.trim(), {
      redirectTo,
    });

    if (inviteError) throw inviteError;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[Toko Invite - POST] Error:", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}
