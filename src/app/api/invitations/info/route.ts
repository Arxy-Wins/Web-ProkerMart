import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token undangan harus disertakan." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const { data: invitation, error } = await admin
    .from("sub_toko_invitation")
    .select("email, role, status, expires_at")
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return NextResponse.json(
      { error: "Undangan tidak ditemukan atau sudah tidak berlaku." },
      { status: 404 },
    );
  }

  return NextResponse.json({ invitation });
}
