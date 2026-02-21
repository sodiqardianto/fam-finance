"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Heart,
  Calendar,
  Filter,
  Search,
  Loader2,
  Wallet,
  X,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { transactionsApi, Transaction } from "@/lib/api";
import { FinanceCard } from "@/components/finance-card";

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

type FilterType = 'all' | 'income' | 'expense' | 'non_financial';

interface GroupedTransactions {
  [key: string]: Transaction[];
}

export default function HistoryPage() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
        const txData = await transactionsApi.list();
        
        if (!cancelled) {
          setTransactions(txData);
        }
      } catch (err) {
        console.error("Failed to fetch transactions", err);
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
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('famfinance:refresh-data', handleRefresh);
    return () => window.removeEventListener('famfinance:refresh-data', handleRefresh);
  }, []);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    if (filter !== 'all') {
      filtered = filtered.filter(t => t.type === filter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.category?.toLowerCase().includes(query) ||
        t.source?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [transactions, filter, searchQuery]);

  // Fungsi harus didefinisikan sebelum digunakan
  const getDateLabel = (dateKey: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateKey === today) return 'Hari Ini';
    if (dateKey === yesterday) return 'Kemarin';
    
    const date = new Date(dateKey);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const groupedTransactions = useMemo(() => {
    const grouped: GroupedTransactions = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateKey = date.toISOString().split('T')[0];
      const label = getDateLabel(dateKey);
      
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(transaction);
    });
    
    return grouped;
  }, [filteredTransactions]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpCircle className="w-6 h-6" />;
      case 'expense':
        return <ArrowDownCircle className="w-6 h-6" />;
      case 'non_financial':
        return <Heart className="w-6 h-6 fill-current" />;
      default:
        return <Wallet className="w-6 h-6" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-600',
          border: 'border-emerald-200/50',
          amount: 'text-emerald-600'
        };
      case 'expense':
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-600',
          border: 'border-rose-200/50',
          amount: 'text-rose-600'
        };
      case 'non_financial':
        return {
          bg: 'bg-pink-500/10',
          text: 'text-pink-600',
          border: 'border-pink-200/50',
          amount: 'text-pink-600'
        };
      default:
        return {
          bg: 'bg-zinc-500/10',
          text: 'text-zinc-600',
          border: 'border-zinc-200/50',
          amount: 'text-zinc-600'
        };
    }
  };

  const getAmountPrefix = (type: string) => {
    return type === 'expense' ? '-' : '+';
  };

  const filterButtons: { type: FilterType; label: string; color: string }[] = [
    { type: 'all', label: 'Semua', color: 'bg-zinc-900 text-white' },
    { type: 'income', label: 'Pemasukan', color: 'bg-emerald-500 text-white' },
    { type: 'expense', label: 'Pengeluaran', color: 'bg-rose-500 text-white' },
    { type: 'non_financial', label: 'Non-Finansial', color: 'bg-pink-500 text-white' },
  ];

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const nonFinancial = transactions.filter(t => t.type === 'non_financial').length;
    
    return { income, expense, nonFinancial };
  }, [transactions]);

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
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 drop-shadow-sm">
              Riwayat Transaksi 📜
            </h1>
            <p className="text-zinc-500 font-medium mt-1 text-sm md:text-base">
              Lihat semua aktivitas keuangan keluarga.
            </p>
          </div>
        </motion.header>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12"
          variants={itemVariants}
        >
          <FinanceCard
            title="Pemasukan"
            value={stats.income}
            isLoading={dataLoading}
            animate={true}
            animationKey={refreshKey}
            icon={ArrowUpCircle}
            iconClassName="text-emerald-900"
            cardClassName="bg-emerald-500/10 border-emerald-200/50 shadow-xl shadow-emerald-500/5"
            titleClassName="text-emerald-600"
            valueClassName="text-emerald-900"
            badge={
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 backdrop-blur-md">
                <TrendingUp className="w-3 h-3" />
                <span>Total Masuk</span>
              </div>
            }
          />

          <FinanceCard
            title="Pengeluaran"
            value={stats.expense}
            isLoading={dataLoading}
            animate={true}
            animationKey={refreshKey}
            icon={ArrowDownCircle}
            iconClassName="text-rose-900"
            cardClassName="bg-rose-500/10 border-rose-200/50 shadow-xl shadow-rose-500/5"
            titleClassName="text-rose-600"
            valueClassName="text-rose-900"
            badge={
              <div className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-rose-500/20 backdrop-blur-md">
                <TrendingDown className="w-3 h-3" />
                <span>Total Keluar</span>
              </div>
            }
          />

          <FinanceCard
            title="Kontribusi"
            value={stats.nonFinancial}
            isLoading={dataLoading}
            animate={true}
            animationKey={refreshKey}
            prefix=""
            icon={Heart}
            iconClassName="text-pink-900"
            cardClassName="bg-pink-500/10 border-pink-200/50 shadow-xl shadow-pink-500/5"
            titleClassName="text-pink-600"
            valueClassName="text-pink-900"
            badge={
              <div className="inline-flex items-center gap-1.5 bg-pink-500/20 text-pink-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-pink-500/20 backdrop-blur-md">
                <Heart className="w-3 h-3 fill-current" />
                <span>Non-Finansial</span>
              </div>
            }
          />
        </motion.div>

        {/* Search & Filter */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 bg-white/60 backdrop-blur-md border border-white/60 rounded-2xl pl-12 pr-4 focus:outline-none focus:border-pink-500 transition-all font-medium text-zinc-700 placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-zinc-200/50 rounded-full hover:bg-zinc-300/50 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="xl"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "rounded-2xl border backdrop-blur-md transition-all",
                showFilters 
                  ? "bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20" 
                  : "bg-white/60 border-white/60 hover:bg-white/80"
              )}
              leftIcon={<Filter className="w-5 h-5" />}
            >
              Filter
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60">
                  {filterButtons.map((btn) => (
                    <button
                      key={btn.type}
                      onClick={() => setFilter(btn.type)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        filter === btn.type
                          ? btn.color + " shadow-lg"
                          : "bg-white/60 text-zinc-600 hover:bg-white/80 border border-white/60"
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Transactions List */}
        <motion.div variants={itemVariants}>
          {dataLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-6 w-32 mb-4 bg-zinc-900/5" />
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, j) => (
                      <Skeleton key={j} className="h-24 w-full rounded-[28px] bg-white/40" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedTransactions).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedTransactions).map(([dateLabel, txs], groupIndex) => (
                <motion.div
                  key={dateLabel}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-black text-zinc-500 uppercase tracking-[0.2em]">
                      {dateLabel}
                    </h2>
                    <div className="flex-1 h-px bg-zinc-200/50" />
                    <span className="text-xs font-bold text-zinc-400 bg-white/60 px-2 py-1 rounded-lg">
                      {txs.length} transaksi
                    </span>
                  </div>

                  <div className="space-y-3">
                    {txs.map((transaction, index) => {
                      const colors = getTransactionColor(transaction.type);
                      
                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ x: 4, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            "p-5 rounded-[28px] border backdrop-blur-md transition-all cursor-pointer group",
                            "bg-white/40 border-white/60 hover:bg-white/60 hover:shadow-lg"
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={cn(
                                "p-3.5 rounded-2xl shadow-inner transition-transform group-hover:scale-110 shrink-0",
                                colors.bg,
                                colors.text
                              )}>
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-zinc-900 text-lg truncate">
                                  {transaction.source || transaction.category}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.15em] truncate">
                                    {transaction.category}
                                  </span>
                                  {transaction.fundSource === 'private' && (
                                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">
                                      Pribadi
                                    </span>
                                  )}
                                </div>
                                {transaction.description && (
                                  <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                                    {transaction.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={cn(
                                "font-black text-lg sm:text-xl",
                                colors.amount
                              )}>
                                {getAmountPrefix(transaction.type)} Rp {parseFloat(transaction.amount).toLocaleString('id-ID')}
                              </div>
                              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                {new Date(transaction.date).toLocaleTimeString('id-ID', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/20 rounded-[32px] border border-dashed border-white/40">
              <div className="bg-zinc-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-zinc-400" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 mb-2">
                {searchQuery ? 'Tidak ada hasil' : 'Belum Ada Transaksi'}
              </h3>
              <p className="text-zinc-500 font-medium mb-6 max-w-sm mx-auto">
                {searchQuery 
                  ? 'Coba kata kunci lain atau reset filter.'
                  : 'Mulai catat transaksi pertama keluarga kamu.'
                }
              </p>
              {(searchQuery || filter !== 'all') && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                  }}
                  className="rounded-2xl"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
