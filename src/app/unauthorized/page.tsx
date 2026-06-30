import Link from "next/link";
import { ShieldOff } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Akses Ditolak</h1>
        <p className="text-slate-400 mb-6">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        <Link
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors inline-block"
        >
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}
