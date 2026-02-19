"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  User, 
  Settings, 
  Bell, 
  Shield, 
  ChevronRight,
  Heart,
  Loader2,
  Mail,
  Zap
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading || (!user && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { icon: Settings, label: "Pengaturan Akun", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Bell, label: "Notifikasi", color: "text-orange-500", bg: "bg-orange-500/10" },
    { icon: Shield, label: "Keamanan & Privasi", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: Zap, label: "Langganan Pro", color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-12 font-sans relative">
      <div className="max-w-md mx-auto pb-32">
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">Profil</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 font-bold hover:bg-red-50">
            Keluar
          </Button>
        </header>

        {/* User Identity Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-white/60 shadow-2xl shadow-zinc-200/50 mb-8 overflow-hidden bg-white/40">
            <div className="bg-zinc-900 h-28 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-zinc-800 to-black opacity-50" />
              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                Premium Member
              </div>
            </div>
            <CardContent className="pt-0 -mt-14 flex flex-col items-center relative z-10">
              <div className="relative group">
                <div className="w-28 h-28 rounded-[36px] border-4 border-white/80 bg-white overflow-hidden shadow-2xl transition-transform group-hover:scale-105 duration-500">
                  {user.user_metadata.avatar_url ? (
                    <Image 
                      src={user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      width={112} 
                      height={112}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                      <User className="w-14 h-14" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white shadow-md" />
              </div>
              
              <div className="text-center mt-5">
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                  {user.user_metadata.full_name || "User"}
                </h2>
                <div className="flex items-center justify-center gap-1.5 text-zinc-500 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-8 w-full">
                <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.2em] mb-1">Status</div>
                  <div className="text-sm font-black text-zinc-800">Aktif</div>
                </div>
                <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl p-4 text-center shadow-sm">
                  <div className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.2em] mb-1">Keluarga</div>
                  <div className="text-sm font-black text-zinc-800">Verified</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Menu */}
        <div className="space-y-3 mb-10">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] ml-4 mb-4">Pengaturan</h3>
          {menuItems.map((item, i) => (
            <motion.button 
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-5 bg-white/40 backdrop-blur-md rounded-[28px] hover:bg-white/60 transition-all group shadow-sm border border-white/60"
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl transition-all shadow-inner", item.bg, item.color)}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-zinc-800 tracking-tight">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>

        {/* Logout Section */}
        <div className="px-2">
          <Button 
            onClick={handleLogout}
            variant="danger" 
            size="xl" 
            className="w-full rounded-[28px] shadow-lg shadow-red-500/5"
            leftIcon={<LogOut className="w-5 h-5" />}
          >
            Keluar dari Aplikasi
          </Button>
        </div>

        <div className="flex flex-col items-center mt-12 opacity-30">
          <Heart className="w-5 h-5 text-zinc-400 fill-current mb-2" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
            Fam Finance v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
