import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim();
    const name = String(body.name || "").trim();
    const role = String(body.role || "").trim();

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, nama, dan jabatan harus diisi." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.user) {
      return NextResponse.json(
        { error: "Anda harus login dulu untuk mengundang anggota." },
        { status: 401 },
      );
    }

    const userId = sessionData.session.user.id;
    const admin = createAdminClient();

    const { data: directSubToko, error: directSubTokoError } = await admin
      .from("sub_toko")
      .select("id_sub_toko")
      .eq("id_pengguna", userId)
      .maybeSingle();

    if (directSubTokoError) {
      return NextResponse.json(
        { error: `Gagal mencari sub toko: ${directSubTokoError.message}` },
        { status: 500 },
      );
    }

    let subTokoId = directSubToko?.id_sub_toko;

    if (!subTokoId) {
      const { data: organisasi, error: organisasiError } = await admin
        .from("organisasi")
        .select("id_organisasi")
        .eq("id_pengguna", userId)
        .maybeSingle();

      if (organisasiError) {
        return NextResponse.json(
          { error: `Gagal mencari organisasi: ${organisasiError.message}` },
          { status: 500 },
        );
      }

      if (organisasi?.id_organisasi) {
        const { data: toko, error: tokoError } = await admin
          .from("toko")
          .select("id_toko")
          .eq("id_organisasi", organisasi.id_organisasi)
          .maybeSingle();

        if (tokoError) {
          return NextResponse.json(
            { error: `Gagal mencari toko organisasi: ${tokoError.message}` },
            { status: 500 },
          );
        }

        if (toko?.id_toko) {
          const { data: subTokoList, error: subTokoListError } = await admin
            .from("sub_toko")
            .select("id_sub_toko, nama_proker")
            .eq("id_toko", toko.id_toko);

          if (subTokoListError) {
            return NextResponse.json(
              { error: `Gagal mencari sub toko organisasi: ${subTokoListError.message}` },
              { status: 500 },
            );
          }

          if (subTokoList?.length === 1) {
            subTokoId = subTokoList[0].id_sub_toko;
          } else if (subTokoList?.length > 1) {
            return NextResponse.json(
              {
                error:
                  "Akun ini mengelola beberapa sub toko. Pilih satu sub toko terlebih dahulu sebelum mengirim undangan.",
              },
              { status: 400 },
            );
          }
        }
      }
    }

    if (!subTokoId) {
      return NextResponse.json(
        {
          error:
            "Sub toko tidak ditemukan untuk akun ini. Pastikan Anda login sebagai pengelola proker atau pemilik organisasi dengan satu sub toko.",
        },
        { status: 404 },
      );
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    const { error: insertError } = await admin.from("sub_toko_invitation").insert({
      id_sub_toko: subTokoId,
      email,
      invited_by: userId,
      token,
      role,
      status: "pending",
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json(
        { error: `Gagal menyimpan undangan: ${insertError.message}` },
        { status: 500 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/invite/${token}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h1 style="color: #0f172a;">Undangan Bergabung ke Proker</h1>
        <p>Halo ${name},</p>
        <p>Anda diundang untuk bergabung sebagai <strong>${role}</strong> di sub toko Proker kami.</p>
        <p>Klik tombol di bawah ini untuk menerima undangan dan memasuki sub toko:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none;">Terima Undangan</a>
        </p>
        <p>Jika tautan di atas tidak bekerja, salin dan tempel URL ini di browser Anda:</p>
        <p><a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a></p>
        <p>Terima kasih,<br/>Tim ProkerMart</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Undangan Bergabung ke Proker",
      html,
    });

    return NextResponse.json({
      message: "Undangan berhasil dikirim.",
      inviteUrl,
    });
  } catch (error) {
    console.error("[API /invitations] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
