"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  PiggyBank, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  TrendingUp,
  Heart,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TransactionForm } from "@/components/transaction-form";
import { SavingsGoalForm } from "@/components/savings-goal-form";
import { FinanceCard } from "@/components/finance-card";
import { transactionsApi, Transaction, SavingsGoal } from "@/lib/api";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function Dashboard() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isSavingsOpen, setIsSavingsOpen] = useState(false);
  
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // State untuk animated values (mulai dari 0)
  const [animatedValues, setAnimatedValues] = useState({
    familyBalance: 0,
    myPrivateBalance: 0,
    totalSavings: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch data
  useEffect(() => {
    if (!dbUser?.familyId) return;
    
    let cancelled = false;
    
    async function loadData() {
      if (refreshKey > 0) setIsRefreshing(true);
      
      try {
        const [summaryData, txData, savingsData] = await Promise.all([
          transactionsApi.summary(),
          transactionsApi.list(),
          transactionsApi.savingsGoals.list()
        ]);
        
        if (!cancelled) {
          setRecentTransactions(txData.slice(0, 5));
          setSavings(savingsData);
          
          // Small delay untuk ensure React render cycle
          setTimeout(() => {
            setAnimatedValues({
              familyBalance: summaryData.familyBalance,
              myPrivateBalance: summaryData.myPrivateBalance,
              totalSavings: summaryData.totalSavings,
            });
          }, 50);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        if (!cancelled) {
          setDataLoading(false);
          setIsRefreshing(false);
        }
      }
    }
    
    loadData();
    
    return () => { cancelled = true; };
  }, [dbUser, refreshKey]);

  // Listen untuk refresh event dari bottom nav
  useEffect(() => {
    const handleRefresh = () => {
      // Reset animated values dan trigger refresh
      setAnimatedValues({
        familyBalance: 0,
        myPrivateBalance: 0,
        totalSavings: 0,
      });
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('famfinance:refresh-data', handleRefresh);
    return () => window.removeEventListener('famfinance:refresh-data', handleRefresh);
  }, []);

  const onActionSuccess = () => {
    setIsTransactionOpen(false);
    setIsSavingsOpen(false);
    // Reset animated values ke 0 untuk trigger animasi ulang
    setAnimatedValues({
      familyBalance: 0,
      myPrivateBalance: 0,
      totalSavings: 0,
    });
    setRefreshKey(prev => prev + 1);
  };

  if (authLoading || (!user && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-6 md:p-12 font-sans relative text-zinc-900">
      <motion.div 
        className="max-w-6xl mx-auto pb-24 md:pb-0"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.header 
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
          variants={itemVariants}
        >
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 drop-shadow-sm">
                Halo, {user.user_metadata.full_name?.split(' ')[0] || 'Partner'} 👋
              </h1>
              {isRefreshing && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
            </div>
            <p className="text-zinc-500 font-medium mt-1 text-sm md:text-base">Berikut adalah ringkasan keuangan keluarga kamu hari ini.</p>
          </div>
          <div className="flex gap-3">
            <Drawer open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
              <DrawerTrigger asChild>
                <Button 
                  variant="primary" 
                  size="md"
                  className="shadow-lg shadow-zinc-900/10 rounded-2xl"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Catat Transaksi
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="pb-0 text-zinc-900">
                  <DrawerTitle className="text-zinc-900">Tambah Aktivitas</DrawerTitle>
                  <DrawerDescription className="text-zinc-500">Catat pengeluaran, pemasukan, atau kontribusi kasih sayang kamu.</DrawerDescription>
                </DrawerHeader>
                <TransactionForm onSuccess={onActionSuccess} />
              </DrawerContent>
            </Drawer>
          </div>
        </motion.header>

        {/* Overview Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          variants={itemVariants}
        >
          {/* Uang Keluarga */}
          <FinanceCard
            title="Uang Keluarga"
            value={animatedValues.familyBalance}
            isLoading={dataLoading}
            animate={true}
            animationKey={refreshKey}
            icon={Wallet}
            iconClassName="text-white"
            cardClassName="bg-zinc-900/90 text-white border-white/10 shadow-2xl shadow-zinc-900/20"
            titleClassName="text-zinc-400"
            valueClassName="text-white"
            badge={
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20 backdrop-blur-md">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Real-time</span>
              </div>
            }
          />

          {/* Uang Pribadi */}
          <FinanceCard
            title="Uang Pribadi Saya"
            value={animatedValues.myPrivateBalance}
            isLoading={dataLoading}
            animate={true}
            animationKey={refreshKey}
            cardClassName="bg-white/40 border-white/60 shadow-xl shadow-zinc-200/30"
            titleClassName="text-zinc-500"
            valueClassName="text-zinc-900"
            badge={
              <p className="text-zinc-400 text-[10px] font-bold italic uppercase tracking-wider bg-zinc-900/5 inline-block px-2 py-1 rounded-lg">
                Privat • Hanya Anda
              </p>
            }
          />

          {/* Tabungan Bersama */}
          <FinanceCard
            title="Tabungan Bersama"
            value={animatedValues.totalSavings}
            isLoading={dataLoading}
            animate={true}
            animationKey={refreshKey}
            icon={PiggyBank}
            iconClassName="text-pink-900"
            cardClassName="bg-pink-500/10 border-pink-200/50 shadow-xl shadow-pink-500/5"
            titleClassName="text-pink-600"
            valueClassName="text-pink-900"
            badge={
              <div className="inline-flex items-center gap-1.5 bg-pink-500/20 text-pink-600 px-3 py-1 rounded-full text-xs font-bold border border-pink-500/20 backdrop-blur-md">
                <PiggyBank className="w-3.5 h-3.5" />
                <span>{savings.length} Tujuan aktif</span>
              </div>
            }
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-zinc-900">
          {/* Recent Transactions */}
          <motion.div className="lg:col-span-2 space-y-8" variants={itemVariants}>
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Transaksi Terakhir</h2>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                  Lihat Semua <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {dataLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-[28px] bg-white/40" />
                ))
              ) : recentTransactions.length > 0 ? recentTransactions.map((t) => (
                <motion.div 
                  key={t.id} 
                  className="bg-white/40 backdrop-blur-md p-5 rounded-[28px] border border-white/60 flex items-center justify-between gap-4 hover:bg-white/60 transition-all shadow-sm group cursor-pointer"
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className={cn(
                      "p-4 rounded-[20px] shadow-inner transition-transform group-hover:scale-110 shrink-0",
                      t.type === "income" ? "bg-emerald-500/10 text-emerald-600" : 
                      t.type === "non_financial" ? "bg-pink-500/10 text-pink-600" : "bg-zinc-500/10 text-zinc-600"
                    )}>
                      {t.type === "income" ? <ArrowUpCircle className="w-6 h-6" /> : 
                       t.type === "non_financial" ? <Heart className="w-6 h-6 fill-current" /> : <ArrowDownCircle className="w-6 h-6" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-zinc-900 group-hover:text-black transition-colors truncate">{t.source || t.category}</div>
                      <div className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.15em] mt-0.5 truncate">
                        {t.category} • {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "font-black text-lg text-right tracking-tight shrink-0",
                    t.type === "income" ? "text-emerald-600" : t.type === "non_financial" ? "text-pink-600" : "text-zinc-900"
                  )}>
                    {t.type === 'expense' ? '-' : '+'} Rp {parseFloat(t.amount).toLocaleString("id-ID")}
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-12 text-zinc-400 font-bold uppercase tracking-widest text-xs bg-white/20 rounded-[32px] border border-dashed border-white/40">
                  Belum ada transaksi
                </div>
              )}
            </div>
          </motion.div>

          {/* Savings Goals */}
          <motion.div className="space-y-8" variants={itemVariants}>
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Tabungan</h2>
              <Drawer open={isSavingsOpen} onOpenChange={setIsSavingsOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-pink-600 font-bold uppercase tracking-widest text-[10px]">
                    Tambah
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="pb-0 text-zinc-900">
                    <DrawerTitle className="text-zinc-900">Buat Tujuan Baru</DrawerTitle>
                    <DrawerDescription className="text-zinc-500">Rencanakan masa depan bersama pasangan kamu.</DrawerDescription>
                  </DrawerHeader>
                  <SavingsGoalForm onSuccess={onActionSuccess} />
                </DrawerContent>
              </Drawer>
            </div>

            <div className="space-y-5">
              {dataLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-3xl bg-white/30" />
                ))
              ) : savings.length > 0 ? savings.map((g) => (
                <motion.div key={g.id} whileHover={{ y: -2 }}>
                  <div className="p-6 bg-white/30 border border-white/40 rounded-2xl shadow-md">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <div className="font-extrabold text-zinc-900">{g.name}</div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                          Rp {parseFloat(g.currentAmount).toLocaleString("id-ID")} / Rp {parseFloat(g.targetAmount).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="bg-white/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-zinc-900 border border-white/40 shadow-sm">
                        {Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100)}%
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-900/5 rounded-full overflow-hidden border border-white/20">
                      <div 
                        className={cn("h-full rounded-full shadow-sm bg-pink-500")} 
                        style={{ width: `${(parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-zinc-400 font-bold uppercase tracking-widest text-[10px] bg-white/10 rounded-[28px] border border-dashed border-white/20">
                  Belum ada tujuan
                </div>
              )}
            </div>

            <motion.div variants={itemVariants}>
              <div className="bg-zinc-900/90 text-white p-8 relative overflow-hidden border border-white/10 rounded-2xl shadow-2xl">
                <div className="relative z-10 flex flex-col items-center text-center text-white">
                  <div className="bg-pink-500/20 p-4 rounded-full mb-6 backdrop-blur-xl border border-pink-500/20">
                    <Heart className="w-8 h-8 text-pink-500 fill-current animate-pulse" />
                  </div>
                  <h3 className="font-black text-lg mb-2 uppercase tracking-widest text-white">Apresiasi Hari Ini</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium italic">
                    &quot;Terima kasih sudah mencatat pengeluaran keluarga dengan teliti. Kerja sama kalian luar biasa!&quot;
                  </p>
                </div>
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-pink-500/10 rounded-full blur-[60px]" />
                <div className="absolute -top-12 -left-12 w-40 h-40 bg-purple-500/10 rounded-full blur-[60px]" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
