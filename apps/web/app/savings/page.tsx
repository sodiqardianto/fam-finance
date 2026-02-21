"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PiggyBank, 
  Plus, 
  Target,
  TrendingUp,
  Calendar,
  Loader2,
  Heart,
  Wallet
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
import { SavingsGoalForm } from "@/components/savings-goal-form";
import { FinanceCard } from "@/components/finance-card";
import { transactionsApi, SavingsGoal } from "@/lib/api";

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

export default function SavingsPage() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [isSavingsOpen, setIsSavingsOpen] = useState(false);
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [animatedValues, setAnimatedValues] = useState({
    totalSavings: 0,
    totalGoals: 0,
    achievedGoals: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!dbUser?.familyId) return;
    
    let cancelled = false;
    
    async function loadData() {
      try {
        const savingsData = await transactionsApi.savingsGoals.list();
        
        if (!cancelled) {
          setSavings(savingsData);
          
          const totalSaved = savingsData.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);
          const achieved = savingsData.filter(g => parseFloat(g.currentAmount) >= parseFloat(g.targetAmount)).length;
          
          setTimeout(() => {
            setAnimatedValues({
              totalSavings: totalSaved,
              totalGoals: savingsData.length,
              achievedGoals: achieved,
            });
          }, 50);
        }
      } catch (err) {
        console.error("Failed to fetch savings data", err);
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    }
    
    loadData();
    
    return () => { cancelled = true; };
  }, [dbUser, refreshKey]);

  useEffect(() => {
    const handleRefresh = () => {
      setAnimatedValues({
        totalSavings: 0,
        totalGoals: 0,
        achievedGoals: 0,
      });
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('famfinance:refresh-data', handleRefresh);
    return () => window.removeEventListener('famfinance:refresh-data', handleRefresh);
  }, []);

  const onActionSuccess = () => {
    setIsSavingsOpen(false);
    setAnimatedValues({
      totalSavings: 0,
      totalGoals: 0,
      achievedGoals: 0,
    });
    setRefreshKey(prev => prev + 1);
  };

  const getProgressPercentage = (current: string, target: string) => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    return Math.min(100, Math.round((currentNum / targetNum) * 100));
  };

  const getDaysLeft = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 drop-shadow-sm">
              Tabungan Bersama 🎯
            </h1>
            <p className="text-zinc-500 font-medium mt-1 text-sm md:text-base">
              Wujudkan impian bersama pasanganmu.
            </p>
          </div>
          <div className="flex gap-3">
            <Drawer open={isSavingsOpen} onOpenChange={setIsSavingsOpen}>
              <DrawerTrigger asChild>
                <Button 
                  variant="primary" 
                  size="md"
                  className="shadow-lg shadow-pink-500/20 rounded-2xl bg-pink-600 hover:bg-pink-700"
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Buat Tujuan
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
        </motion.header>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          variants={itemVariants}
        >
          <FinanceCard
            title="Total Tersimpan"
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
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Terus bertumbuh</span>
              </div>
            }
          />

          <FinanceCard
            title="Total Tujuan"
            value={animatedValues.totalGoals}
            isLoading={dataLoading}
            animate={true}
            animationKey={refreshKey}
            icon={Target}
            iconClassName="text-blue-900"
            cardClassName="bg-blue-500/10 border-blue-200/50 shadow-xl shadow-blue-500/5"
            titleClassName="text-blue-600"
            valueClassName="text-blue-900"
            prefix=""
            badge={
              <p className="text-blue-400 text-[10px] font-bold italic uppercase tracking-wider bg-blue-900/5 inline-block px-2 py-1 rounded-lg">
                {animatedValues.achievedGoals} tercapai
              </p>
            }
          />

          <FinanceCard
            title="Progress Rata-rata"
            value={animatedValues.totalGoals > 0 
              ? Math.round(savings.reduce((sum, g) => sum + getProgressPercentage(g.currentAmount, g.targetAmount), 0) / savings.length)
              : 0}
            isLoading={dataLoading}
            animate={true}
            animationKey={refreshKey}
            icon={Wallet}
            iconClassName="text-emerald-900"
            cardClassName="bg-emerald-500/10 border-emerald-200/50 shadow-xl shadow-emerald-500/5"
            titleClassName="text-emerald-600"
            valueClassName="text-emerald-900"
            prefix=""
            badge={
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20 backdrop-blur-md">
                <Target className="w-3.5 h-3.5" />
                <span>Semangat menabung!</span>
              </div>
            }
          />
        </motion.div>

        {/* Savings Goals List */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Daftar Tujuan</h2>
            <span className="text-zinc-400 text-sm font-medium">
              {savings.length} tujuan aktif
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 bg-white/30 border border-white/40 rounded-[28px] shadow-md">
                  <Skeleton className="h-8 w-3/4 mb-4 bg-zinc-900/5" />
                  <Skeleton className="h-4 w-1/2 mb-6 bg-zinc-900/5" />
                  <Skeleton className="h-3 w-full rounded-full bg-zinc-900/5" />
                </div>
              ))
            ) : savings.length > 0 ? (
              savings.map((goal, index) => {
                const percentage = getProgressPercentage(goal.currentAmount, goal.targetAmount);
                const isAchieved = percentage >= 100;
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className={cn(
                      "p-6 rounded-[28px] border shadow-lg transition-all cursor-pointer group",
                      isAchieved 
                        ? "bg-emerald-500/10 border-emerald-200/50 shadow-emerald-500/10" 
                        : "bg-white/40 border-white/60 shadow-zinc-200/30 hover:shadow-xl hover:bg-white/60"
                    )}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-2xl shadow-inner transition-transform group-hover:scale-110",
                          isAchieved ? "bg-emerald-500/20 text-emerald-600" : "bg-pink-500/10 text-pink-600"
                        )}>
                          {isAchieved ? (
                            <Heart className="w-6 h-6 fill-current" />
                          ) : (
                            <PiggyBank className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h3 className={cn(
                            "font-extrabold text-lg tracking-tight",
                            isAchieved ? "text-emerald-900" : "text-zinc-900"
                          )}>
                            {goal.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              {getDaysLeft(goal.createdAt)} hari yang lalu
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1.5 rounded-xl text-sm font-black border backdrop-blur-md",
                        isAchieved 
                          ? "bg-emerald-500 text-white border-emerald-500/50" 
                          : "bg-white/60 text-zinc-900 border-white/40"
                      )}>
                        {percentage}%
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">
                            Tersimpan
                          </div>
                          <div className={cn(
                            "text-xl font-black",
                            isAchieved ? "text-emerald-700" : "text-zinc-900"
                          )}>
                            Rp {parseFloat(goal.currentAmount).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">
                            Target
                          </div>
                          <div className="text-sm font-bold text-zinc-500">
                            Rp {parseFloat(goal.targetAmount).toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>

                      <div className="w-full h-3 bg-zinc-900/5 rounded-full overflow-hidden border border-white/20">
                        <motion.div 
                          className={cn(
                            "h-full rounded-full shadow-sm",
                            isAchieved ? "bg-emerald-500" : "bg-pink-500"
                          )} 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>

                      {isAchieved && (
                        <div className="flex items-center gap-2 mt-4 p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
                          <Heart className="w-4 h-4 text-emerald-600 fill-current" />
                          <span className="text-xs font-bold text-emerald-700">
                            Selamat! Target tercapai 🎉
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-16 bg-white/20 rounded-[32px] border border-dashed border-white/40">
                <div className="bg-pink-100/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PiggyBank className="w-10 h-10 text-pink-500" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 mb-2">Belum Ada Tujuan</h3>
                <p className="text-zinc-500 font-medium mb-6 max-w-sm mx-auto">
                  Mulai buat tujuan tabungan bersama pasanganmu untuk mewujudkan impian kalian.
                </p>
                <Button 
                  variant="primary" 
                  onClick={() => setIsSavingsOpen(true)}
                  className="rounded-2xl"
                >
                  Buat Tujuan Pertama
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Motivation Card */}
        {!dataLoading && savings.length > 0 && (
          <motion.div variants={itemVariants} className="mt-12">
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-white/40 rounded-[32px] p-8 relative overflow-hidden shadow-xl">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="bg-white/60 p-4 rounded-full backdrop-blur-xl border border-white/40 shadow-lg">
                  <Heart className="w-8 h-8 text-pink-600 fill-current" />
                </div>
                <div className="flex-1">
                                      <h3 className="font-black text-xl text-zinc-900 mb-2">
                                        &quot;Tabungan kecil hari ini, impian besar besok.&quot;
                                      </h3>                  <p className="text-zinc-600 font-medium">
                    Teruskan semangat menabung bersama! Setiap rupiah yang tersimpan adalah langkah menuju impian kalian.
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-pink-500/20 rounded-full blur-[60px]" />
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-[60px]" />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
