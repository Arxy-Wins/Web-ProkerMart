"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, PanInfo } from "framer-motion";
import { Search, ArrowLeft, Navigation, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { NearbyShopCard } from "@/components/NearbyShopCard";

// Dynamic import for MapArea to prevent SSR issues with Leaflet
const MapArea = dynamic(() => import("@/components/MapArea"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-500">
      Memuat Peta...
    </div>
  ),
});

// Mock user location (Jimbaran area from the screenshot)
const MOCK_USER_LOCATION = {
  lat: -8.795,
  lng: 115.176,
};

// Mock data for nearby shops based on screenshot details
const MOCK_NEARBY_SHOPS = [
  {
    id: "S001",
    name: "BEM FMIPA - Dies Natalis",
    categories: "Makanan, Minuman",
    rating: 4.8,
    reviewCount: "125",
    distanceKm: 0.6,
    travelTimeMin: 10,
    imageUrl: "/placeholder.jpg",
    promoTag: "Terlaris",
    lat: -8.793,
    lng: 115.172,
  },
  {
    id: "S002",
    name: "HIMA TI - IT Expo",
    categories: "Pakaian, Merchandise",
    rating: 4.9,
    reviewCount: "340",
    distanceKm: 0.9,
    travelTimeMin: 15,
    imageUrl: "/placeholder.jpg",
    lat: -8.798,
    lng: 115.18,
  },
  {
    id: "S003",
    name: "UKM Kesenian - Pentas Seni",
    categories: "Merchandise, Jasa",
    rating: 4.7,
    reviewCount: "89",
    distanceKm: 2.0,
    travelTimeMin: 25,
    imageUrl: "/placeholder.jpg",
    promoTag: "Pre-order",
    lat: -8.81,
    lng: 115.185,
  },
  {
    id: "S004",
    name: "DPM Universitas - Raker",
    categories: "Makanan, Snack",
    rating: 4.9,
    reviewCount: "50+",
    distanceKm: 0.2,
    travelTimeMin: 5,
    imageUrl: "/placeholder.jpg",
    lat: -8.796,
    lng: 115.175,
  },
];

// const TABS = ["Terkait", "Terdekat", "Terlaris", "Rating"];

export default function NearbyShopsPage() {
  // const [activeTab, setActiveTab] = useState("Terdekat");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    // Jika di-drag ke atas (nilai y negatif)
    if (info.offset.y < -30) {
      setIsExpanded(true);
    }
    // Jika di-drag ke bawah (nilai y positif)
    else if (info.offset.y > 30) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-primary-600 text-white pt-4 px-4 relative">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/explore"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari toko atau proker di sekitarmu"
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/70 focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2 relative hover:bg-white/10 rounded-full transition-colors">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-primary-600 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Main Content Area (Map + List) */}
      <div className="flex-1 relative flex flex-col lg:flex-row-reverse  z-10 bg-white rounded-t-3xl overflow-hidden shadow-xl lg:shadow-none lg:mt-0 lg:rounded-none lg:bg-transparent">
        {/* Map Container - Full width on mobile top, half width on desktop */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? "0vh" : "40vh" }}
          transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
          className="lg:h-full! lg:w-1/2 relative bg-slate-200 overflow-hidden"
        >
          <MapArea
            userLocation={MOCK_USER_LOCATION}
            shops={MOCK_NEARBY_SHOPS}
            onMarkerClick={(id) => setActiveShopId(id)}
            activeShopId={activeShopId}
          />

          {/* Location Indicator Over Map */}
          <div className="absolute bottom-4 right-4 z-400 flex flex-col gap-2 items-end">
            <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-600 hover:bg-slate-50">
              <Navigation className="w-5 h-5 fill-current" />
            </button>
          </div>

        </motion.div>

        {/* Bottom Sheet / Sidebar List */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden lg:w-1/2 lg:rounded-tr-3xl  relative z-20">
          {/* Drag Handle for Mobile */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex justify-center pt-4 pb-3 lg:hidden cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
          </motion.div>

          <div className="px-4 py-2 lg:py-4">
            {/* Tabs */}
            {/* <div className="flex border-b border-slate-200 mb-4">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 pb-3 text-sm font-medium text-center transition-colors relative ${
                    activeTab === tab
                      ? "text-primary-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                  )}
                </button>
              ))}
            </div> */}

            {/* Filters */}
            {/* <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-full text-xs font-medium text-slate-600 whitespace-nowrap">
                Jarak Toko <Filter className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-full text-xs font-medium text-slate-600 whitespace-nowrap">
                Promo <Filter className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-full text-xs font-medium text-slate-600 whitespace-nowrap">
                Kategori Produk <Filter className="w-3 h-3" />
              </button>
            </div> */}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {activeShopId ? (
              <div className="flex flex-col gap-4 pt-2">
                <NearbyShopCard {...MOCK_NEARBY_SHOPS.find(s => s.id === activeShopId)!} />
                
                <div className="flex flex-col gap-2 mt-2">
                  <Link href={`/explore/${activeShopId}`} className="w-full">
                    <button className="w-full bg-primary-600 text-white font-medium py-3 px-4 rounded-xl shadow-sm flex justify-center items-center hover:bg-primary-700 transition-colors gap-2">
                      Lihat Penjual <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </Link>
                  <button 
                    onClick={() => setActiveShopId(null)}
                    className="w-full bg-slate-100 text-slate-700 font-medium py-3 px-4 rounded-xl flex justify-center items-center hover:bg-slate-200 transition-colors"
                  >
                    Kembali ke daftar penjual
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {MOCK_NEARBY_SHOPS.map((shop) => (
                  <div
                    key={shop.id}
                    className="cursor-pointer"
                    onClick={() => setActiveShopId(shop.id)}
                  >
                    <NearbyShopCard {...shop} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
