"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import {
  ArrowLeft,
  MapPin,
  Truck,
  CreditCard,
  QrCode,
  Wallet,
  CheckCircle,
  ShoppingBag,
  Copy,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();

  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "transfer" | "cod" | null>(null);
  const [hasSavedAddress, setHasSavedAddress] = useState(false); // Toggle ini untuk mensimulasikan sudah ada alamat/belum
  
  // Pick Up States
  const [pickupTime, setPickupTime] = useState("");
  
  // States for Notifications/Modals
  const [showToast, setShowToast] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentGatewayState, setPaymentGatewayState] = useState<"loading" | "qris" | "transfer" | null>(null);

  // Dummy Product Data
  const dummyProduct = {
    name: "Paket Nasi Ayam Geprek Level 3",
    organizer: "HIMAIF - Dies Natalis",
    price: 15000,
    quantity: 1,
    imagePlaceholder: true
  };

  const handleCheckout = () => {
    if (!deliveryMethod || !paymentMethod) return;

    if (paymentMethod === "cod") {
      setShowToast(true);
      setTimeout(() => {
        router.push("/user/purchase");
      }, 2000);
    } else {
      setPaymentGatewayState("loading");
      setShowPaymentModal(true);
      
      // Simulasi loading 1.5 detik, lalu munculkan QRIS/VA
      setTimeout(() => {
        setPaymentGatewayState(paymentMethod === "qris" ? "qris" : "transfer");
      }, 1500);
    }
  };

  const handleFinishPayment = () => {
    setShowPaymentModal(false);
    router.push("/user/purchase");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-6 md:px-8 md:py-10">
        {/* Tombol Kembali */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition mb-6 font-medium text-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <h1 className="text-2xl font-bold text-slate-900 mb-8">Checkout Pesanan</h1>

        <div className="space-y-6">
          {/* 1. Metode Pengambilan */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Metode Pengambilan
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Card Select: Pick Up */}
              <div 
                onClick={() => setDeliveryMethod("pickup")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  deliveryMethod === "pickup" 
                    ? "border-blue-600 bg-blue-50" 
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${deliveryMethod === "pickup" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${deliveryMethod === "pickup" ? "text-blue-900" : "text-slate-700"}`}>Pick Up</h3>
                    <p className="text-xs text-slate-500">Ambil sendiri di stand</p>
                  </div>
                </div>
              </div>

              {/* Card Select: Delivery */}
              <div 
                onClick={() => setDeliveryMethod("delivery")}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  deliveryMethod === "delivery" 
                    ? "border-blue-600 bg-blue-50" 
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-full ${deliveryMethod === "delivery" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${deliveryMethod === "delivery" ? "text-blue-900" : "text-slate-700"}`}>Delivery</h3>
                    <p className="text-xs text-slate-500">Diantar ke lokasi Anda</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Content based on Delivery Method */}
            {deliveryMethod === "pickup" && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">Lokasi Stand</h4>
                  <p className="text-sm text-slate-600">Stand FMIPA, Gedung A Lt.1, Universitas Udayana</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Pilih Jam Pengambilan</h4>
                  <select 
                    className="w-full md:w-1/2 border border-slate-300 rounded-lg px-3 py-2.5 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  >
                    <option value="" disabled>-- Pilih Jam --</option>
                    <option value="09:00 - 11:00">09:00 - 11:00 WITA</option>
                    <option value="12:00 - 14:00">12:00 - 14:00 WITA</option>
                    <option value="15:00 - 17:00">15:00 - 17:00 WITA</option>
                  </select>
                </div>
              </div>
            )}

            {deliveryMethod === "delivery" && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                {hasSavedAddress ? (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-slate-700">Alamat Pengiriman</h4>
                      <button 
                        className="text-xs text-blue-600 font-semibold hover:underline"
                        onClick={() => setHasSavedAddress(false)}
                      >
                        Ganti / Tambah Baru
                      </button>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-3">
                      <p className="font-bold text-sm text-slate-800">Kos Putra Jaya</p>
                      <p className="text-xs text-slate-500 mt-1">Jalan Raya Kampus Unud, Jimbaran. Kamar No. 12 (Pagar Hitam)</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-slate-700">Tambah Alamat Baru</h4>
                      <button 
                        className="text-xs text-blue-600 font-semibold hover:underline"
                        onClick={() => setHasSavedAddress(true)}
                      >
                        Gunakan Alamat Tersimpan
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Nama Tempat (Opsional)</label>
                        <input type="text" placeholder="Contoh: Kos Putra Jaya" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Detail Alamat Lengkap *</label>
                        <textarea placeholder="Nama jalan, nomor rumah/kamar, patokan..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Rincian Produk */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Rincian Produk
            </h2>
            
            <div className="flex gap-4 items-center">
              <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{dummyProduct.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{dummyProduct.organizer}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">{dummyProduct.quantity} x Rp {dummyProduct.price.toLocaleString("id-ID")}</span>
                  <span className="font-bold text-blue-600">Rp {(dummyProduct.price * dummyProduct.quantity).toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Metode Pembayaran */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Metode Pembayaran
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div 
                onClick={() => setPaymentMethod("qris")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                  paymentMethod === "qris" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <QrCode className={`w-6 h-6 ${paymentMethod === "qris" ? "text-blue-600" : "text-slate-400"}`} />
                <span className={`text-sm font-semibold ${paymentMethod === "qris" ? "text-blue-900" : "text-slate-600"}`}>QRIS</span>
              </div>
              
              <div 
                onClick={() => setPaymentMethod("transfer")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                  paymentMethod === "transfer" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <CreditCard className={`w-6 h-6 ${paymentMethod === "transfer" ? "text-blue-600" : "text-slate-400"}`} />
                <span className={`text-sm font-semibold ${paymentMethod === "transfer" ? "text-blue-900" : "text-slate-600"}`}>Transfer Bank</span>
              </div>

              <div 
                onClick={() => setPaymentMethod("cod")}
                className={`cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center gap-2 transition-all text-center ${
                  paymentMethod === "cod" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <Wallet className={`w-6 h-6 ${paymentMethod === "cod" ? "text-blue-600" : "text-slate-400"}`} />
                <span className={`text-sm font-semibold ${paymentMethod === "cod" ? "text-blue-900" : "text-slate-600"}`}>COD (Tunai)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-500 mb-0.5">Total Pembayaran</p>
            <p className="text-xl font-extrabold text-blue-600">Rp {(dummyProduct.price * dummyProduct.quantity).toLocaleString("id-ID")}</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={!deliveryMethod || !paymentMethod}
            className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-sm ${
              (!deliveryMethod || !paymentMethod)
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 active:scale-95 hover:shadow-md"
            }`}
          >
            Buat Pesanan
          </button>
        </div>
      </div>

      {/* TOAST: COD Success */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">Pesanan COD berhasil dibuat! Mengalihkan...</span>
        </div>
      )}

      {/* MODAL: Payment Gateway Simulation */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            {paymentGatewayState === "loading" && (
              <>
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Memproses Pembayaran</h3>
                <p className="text-sm text-slate-500">Mohon tunggu sebentar, kami sedang menyiapkan gateway pembayaran...</p>
              </>
            )}

            {paymentGatewayState === "qris" && (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Pembayaran QRIS</h3>
                <p className="text-sm text-slate-500 mb-6">Scan QR Code di bawah ini menggunakan aplikasi e-wallet atau m-banking Anda.</p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                  {/* Simulasi Gambar QR Code */}
                  <div className="w-48 h-48 bg-white border border-slate-300 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-2 border-4 border-slate-800 rounded-md"></div>
                    <QrCode className="w-24 h-24 text-slate-800" />
                  </div>
                  <div className="mt-3 text-lg font-extrabold text-blue-600">
                    Rp {(dummyProduct.price * dummyProduct.quantity).toLocaleString("id-ID")}
                  </div>
                </div>

                <button
                  onClick={handleFinishPayment}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                >
                  Saya Sudah Bayar
                </button>
              </>
            )}

            {paymentGatewayState === "transfer" && (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Transfer Virtual Account</h3>
                <p className="text-sm text-slate-500 mb-6">Lakukan transfer ke nomor Virtual Account di bawah ini.</p>
                
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 w-full text-left">
                  <p className="text-xs text-slate-500 mb-1 font-semibold">Bank Tujuan</p>
                  <p className="text-sm font-bold text-slate-800 mb-4">Bank BNI (ProkerMart)</p>

                  <p className="text-xs text-slate-500 mb-1 font-semibold">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between bg-white border border-slate-300 px-3 py-2 rounded-lg mb-4">
                    <span className="font-mono font-bold text-slate-800 tracking-wider">8273 1029 3847 1122</span>
                    <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition" title="Salin VA">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mb-1 font-semibold">Total Pembayaran</p>
                  <p className="text-lg font-extrabold text-blue-600">
                    Rp {(dummyProduct.price * dummyProduct.quantity).toLocaleString("id-ID")}
                  </p>
                </div>

                <button
                  onClick={handleFinishPayment}
                  className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                >
                  Saya Sudah Bayar
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
