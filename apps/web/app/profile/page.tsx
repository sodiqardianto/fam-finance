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
    <div className="min-h-screen p-6 md:p-12 font-sans relative text-zinc-900">
      <div className="max-w-md md:max-w-6xl mx-auto pb-32 md:pb-0">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">Profil</h1>
            <p className="text-zinc-500 font-medium mt-1 text-sm md:text-base">Kelola informasi akun dan preferensi aplikasi.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left Column: Identity */}
          <motion.div
            className="md:col-span-5 lg:col-span-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-white/60 shadow-2xl shadow-zinc-200/50 mb-8 overflow-hidden bg-white/40 sticky top-24">
              <div className="bg-zinc-900 h-28 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black opacity-50" />
                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                  Premium Member
                </div>
              </div>
              <CardContent className="pt-0 -mt-14 flex flex-col items-center relative z-10 p-6">
                <div className="relative group mb-5">
                  <div className="w-28 h-28 rounded-[36px] border-4 border-white/80 bg-white overflow-hidden shadow-2xl transition-transform group-hover:scale-105 duration-500 flex items-center justify-center">
                    {user.user_metadata.avatar_url ? (
                      <Image 
                        src={user.user_metadata.avatar_url} 
                        alt="Avatar" 
                        width={112} 
                        height={112}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white shadow-md" />
                </div>
                
                <div className="text-center w-full">
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight truncate">
                    {user.user_metadata.full_name || "User"}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 text-zinc-500 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-sm font-medium truncate max-w-[200px]">{user.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8 w-full">
                  <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl p-4 text-center shadow-sm">
                    <div className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.2em] mb-1">Status</div>
                    <div className="text-sm font-black text-emerald-600">Aktif</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl p-4 text-center shadow-sm">
                    <div className="text-[10px] uppercase font-black text-zinc-400 tracking-[0.2em] mb-1">Keluarga</div>
                    <div className="text-sm font-black text-blue-600">Verified</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Menu & Actions */}
          <div className="md:col-span-7 lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] ml-2 mb-4">Pengaturan</h3>
              {menuItems.map((item, i) => (
                <motion.button 
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-between p-5 bg-white/40 backdrop-blur-md rounded-[28px] hover:bg-white/60 transition-all group shadow-sm border border-white/60 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3.5 rounded-2xl transition-all shadow-inner", item.bg, item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 tracking-tight">{item.label}</div>
                      <div className="text-[10px] text-zinc-400 font-medium mt-0.5">Kelola {item.label.toLowerCase()} kamu disini.</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </div>

            {/* Logout Section */}
            <div>
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] ml-2 mb-4">Sesi</h3>
              <Button 
                onClick={handleLogout}
                variant="danger" 
                size="xl" 
                className="w-full rounded-[28px] shadow-lg shadow-red-500/5 justify-between px-6"
                rightIcon={<LogOut className="w-5 h-5" />}
              >
                Keluar dari Aplikasi
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 mt-12 opacity-30 py-6">
              <Heart className="w-4 h-4 text-zinc-400 fill-current" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                Fam Finance v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
