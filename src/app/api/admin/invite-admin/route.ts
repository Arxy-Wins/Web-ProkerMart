import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_SUPABASE!);
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });

    const supabase = getServiceClient();

    const { data: existing } = await supabase
      .from("undangan_admin")
      .select("id, status")
      .eq("email", email.trim())
      .single();

    if (existing?.status === "accepted") {
      return NextResponse.json({ error: "Email sudah terdaftar sebagai admin." }, { status: 409 });
    }

    let token: string;

    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from("undangan_admin")
        .update({ status: "pending" })
        .eq("id", existing.id)
        .select("token")
        .single();
      if (updateErr) throw updateErr;
      token = updated.token;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("undangan_admin")
        .insert({ email: email.trim() })
        .select("token")
        .single();
      if (insertErr) throw insertErr;
      token = inserted.token;
    }

    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/daftar-admin?token=${token}`;

    const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email.trim(), { redirectTo });
    if (inviteErr) throw inviteErr;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[InviteAdmin - POST] Error:", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}
