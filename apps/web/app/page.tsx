/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Heart, Users, Shield, ArrowRight, Loader2, Copy } from "lucide-react";
import { authApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingFamily, setCheckingFamily] = useState(false);
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkUserStatus() {
      if (user?.email) {
        setCheckingFamily(true);
        try {
          const status = await authApi.checkStatus(user.email);
          if (status.hasFamily) {
            router.push("/dashboard");
          } else {
            setHasFamily(false);
          }
        } catch (err) {
          console.error("Status check failed", err);
        } finally {
          setCheckingFamily(false);
        }
      }
    }
    
    if (user && !authLoading) {
      checkUserStatus();
    }
  }, [user, authLoading, router]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
    if (error) setError(error.message);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Silakan login dengan Google terlebih dahulu");
      return;
    }
    if (!inviteCode) return;
    
    setLoading(true);
    setError("");
    
    try {
      const name = user.user_metadata?.full_name || user.email || "Partner";
      const email = user.email || "";
      
      await authApi.join(name, email, inviteCode);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      handleGoogleLogin();
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const name = user.user_metadata?.full_name || user.email || "User";
      const email = user.email || "";

      const result = await authApi.register(name, email);
      const inviteCode = result.inviteCode ?? "";
      
      toast.success(
        <div className="flex flex-col gap-2">
          <span className="font-bold">🎉 Keluarga berhasil dibuat!</span>
          <span className="text-xs text-zinc-500">Bagikan kode ini ke pasanganmu:</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(inviteCode);
              toast.success("Kode disalin!", { duration: 2000 });
            }}
            className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl font-mono text-lg tracking-wider hover:bg-pink-600 transition-colors"
          >
            {inviteCode}
            <Copy className="w-4 h-4" />
          </button>
        </div>,
        {
          duration: 10000, // 10 detik
          icon: null,
        }
      );
      
      // Delay redirect agar user bisa lihat kode
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col font-sans text-zinc-900 relative">
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-6 md:px-12 bg-white/60 backdrop-blur-xl sticky top-0 z-10 border-b border-white/50 shadow-sm shadow-zinc-200/50">
        <div className="flex items-center gap-2">
          <div className="bg-linear-to-br from-pink-500 to-rose-600 p-2 rounded-xl shadow-lg shadow-pink-500/20">
            <Heart className="w-5 h-5 text-white fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900">Fam Finance</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-bold text-zinc-500 uppercase tracking-wider">
          <a href="#features" className="hover:text-pink-600 transition-colors">Fitur</a>
          <a href="#about" className="hover:text-pink-600 transition-colors">Tentang Kami</a>
        </nav>
      </header>

      <main className="flex-1 relative">
        {/* Hero Section */}
        <section className="px-6 py-20 md:py-32 flex flex-col items-center text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md text-pink-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-white/60 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            Didesain Khusus untuk Pasangan
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-zinc-900 drop-shadow-sm">
            Kelola Keuangan Bersama,<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-600 to-purple-600">Lebih Harmonis.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mb-12 leading-relaxed font-medium">
            Aplikasi keuangan yang mengutamakan kesetaraan, komunikasi, dan pengakuan kontribusi non-finansial dalam rumah tangga.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg justify-center items-stretch min-h-[64px]">
            {authLoading || checkingFamily ? (
              <div className="flex items-center justify-center gap-2 text-zinc-500 font-bold w-full py-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/40">
                <Loader2 className="w-5 h-5 animate-spin" />
                MENGECEK STATUS...
              </div>
            ) : !user ? (
              <Button 
                variant="glass"
                size="xl"
                onClick={handleGoogleLogin}
                className="w-full shadow-xl shadow-zinc-200/50 border border-white/60 bg-white/70 hover:bg-white/90 backdrop-blur-xl group relative overflow-hidden"
                leftIcon={<Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} className="w-5 h-5 relative z-10" />}
              >
                <span className="relative z-10">Masuk dengan Google</span>
                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/50 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>
            ) : hasFamily === false ? (
              <>
                <Button 
                  variant="primary"
                  size="xl"
                  onClick={handleRegister}
                  loading={loading}
                  className="w-full sm:flex-1 shadow-2xl shadow-zinc-900/20"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Daftar Keluarga
                </Button>
                <div className="w-full sm:flex-1 relative group">
                  <form onSubmit={handleJoin} className="relative h-full">
                    <input
                      type="text"
                      placeholder="KODE UNDANGAN"
                      value={inviteCode}
                      disabled={loading}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full h-16 bg-white/60 backdrop-blur-md border border-white/40 rounded-[32px] px-6 pr-14 focus:outline-none focus:border-pink-500 transition-all text-lg font-bold placeholder:text-zinc-400 disabled:opacity-50"
                    />
                    <button 
                      type="submit"
                      disabled={loading || !inviteCode}
                      className="absolute right-2 top-2 bottom-2 aspect-square bg-zinc-900 text-white p-2 rounded-full hover:bg-pink-600 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
              </>
            ) : null}
          </div>
          {user && (
            <p className="mt-6 text-zinc-400 text-xs font-bold uppercase tracking-widest bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              Masuk sebagai <span className="text-zinc-900">{user.email}</span>
            </p>
          )}
          {error && <p className="mt-4 text-red-500 font-bold uppercase text-xs tracking-wider">{error}</p>}
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white/20 backdrop-blur-sm py-24 px-6 md:px-12 border-y border-white/20">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center group">
              <div className="bg-blue-100/50 backdrop-blur-md p-6 rounded-[32px] mb-6 border border-blue-200/50 transition-all group-hover:scale-110 group-hover:rotate-3 duration-500 shadow-xl shadow-blue-500/5">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800">Kesetaraan Penuh</h3>
              <p className="text-zinc-600 leading-relaxed font-medium">
                Tidak ada pembedaan peran berdasarkan gender atau status pekerjaan. Semua kontribusi dihargai setara.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="bg-pink-100/50 backdrop-blur-md p-6 rounded-[32px] mb-6 border border-pink-200/50 transition-all group-hover:scale-110 group-hover:-rotate-3 duration-500 shadow-xl shadow-pink-500/5">
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800">Kontribusi Non-Finansial</h3>
              <p className="text-zinc-600 leading-relaxed font-medium">
                Mengakui nilai dari mengurus rumah tangga dan pengasuhan sebagai bagian dari kontribusi keluarga.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="bg-zinc-100/50 backdrop-blur-md p-6 rounded-[32px] mb-6 border border-zinc-200/50 transition-all group-hover:scale-110 group-hover:rotate-3 duration-500 shadow-xl shadow-zinc-500/5">
                <Shield className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800">Kesepakatan Bersama</h3>
              <p className="text-zinc-600 leading-relaxed font-medium">
                Setiap keputusan penting memerlukan persetujuan kedua belah pihak untuk menjaga keharmonisan.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-white/20 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
        <p>© 2026 Fam Finance. Dibuat dengan cinta untuk keluarga Indonesia.</p>
      </footer>
    </div>
  );
}
