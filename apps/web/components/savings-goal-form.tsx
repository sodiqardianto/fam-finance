"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { transactionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SavingsGoalFormProps {
  onSuccess?: () => void;
}

export function SavingsGoalForm({ onSuccess }: SavingsGoalFormProps) {
  const { dbUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbUser?.familyId) return;
    
    setLoading(true);

    try {
      await transactionsApi.savingsGoals.create({
        name,
        targetAmount: Number(targetAmount),
      });

      toast.success("Tujuan tabungan berhasil dibuat! 🎯", {
        description: `Target ${name} sebesar Rp ${Number(targetAmount).toLocaleString()} telah ditambahkan.`,
      });
      
      onSuccess?.();
    } catch (error: unknown) {
      toast.error("Gagal membuat tujuan", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="space-y-5">
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-zinc-400 ml-1">Nama Tujuan</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Liburan Akhir Tahun"
            className="w-full h-14 bg-white/50 border border-white/60 rounded-[20px] px-6 focus:outline-none focus:border-zinc-900 transition-all font-bold text-zinc-700"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-zinc-400 ml-1">Target Jumlah (Rp)</label>
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0"
            className="w-full h-16 bg-white/50 border border-white/60 rounded-[20px] px-6 focus:outline-none focus:border-zinc-900 transition-all text-2xl font-black placeholder:text-zinc-200"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="xl"
        loading={loading}
        className="w-full shadow-2xl shadow-zinc-900/20"
        rightIcon={<Plus className="w-5 h-5" />}
      >
        Buat Tujuan
      </Button>
    </form>
  );
}
