import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SERVICE_SUPABASE!);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token tidak valid." }, { status: 400 });

  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("undangan_toko")
      .select("email, nama_toko, status")
      .eq("token", token)
      .single();

    if (error || !data) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
    if (data.status === "accepted") return NextResponse.json({ error: "Undangan sudah digunakan." }, { status: 410 });

    return NextResponse.json({ email: data.email, nama_toko: data.nama_toko });
  } catch (err) {
    console.error("[DaftarToko - GET] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token, nama, nama_toko } = await req.json();
    if (!token || !nama?.trim() || !nama_toko?.trim()) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const supabase = getClient();

    // Validate & get invitation
    const { data: inv, error: invErr } = await supabase
      .from("undangan_toko")
      .select("id, email, status")
      .eq("token", token)
      .single();

    if (invErr || !inv) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
    if (inv.status === "accepted") return NextResponse.json({ error: "Undangan sudah digunakan." }, { status: 410 });

    // Get auth user by email
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const authUser = usersData?.users?.find((u) => u.email === inv.email);
    if (!authUser) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

    // Insert pengguna
    const { error: penggunaErr } = await supabase.from("pengguna").upsert({
      id_pengguna: authUser.id,
      nama: nama.trim(),
      email: inv.email,
      password: "",
      role: "organisasi",
    }, { onConflict: "id_pengguna" });
    if (penggunaErr) throw penggunaErr;

    // Insert organisasi
    const { data: org, error: orgErr } = await supabase
      .from("organisasi")
      .insert({ id_pengguna: authUser.id, nama_organisasi: nama_toko.trim() })
      .select("id_organisasi")
      .single();
    if (orgErr) throw orgErr;

    // Insert toko
    const { error: tokoErr } = await supabase.from("toko").insert({
      id_organisasi: org.id_organisasi,
      nama_toko: nama_toko.trim(),
      status: "active",
    });
    if (tokoErr) throw tokoErr;

    // Mark invitation accepted
    await supabase.from("undangan_toko").update({ status: "accepted" }).eq("id", inv.id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[DaftarToko - POST] Error:", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}
