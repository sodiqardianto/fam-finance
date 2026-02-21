"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { transactionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { SearchableSelect } from "@/components/ui/select";
import { toast } from "sonner";

interface TransactionFormProps {
  onSuccess?: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { user, dbUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"income" | "expense" | "non_financial">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [fundSource, setFundSource] = useState<"family" | "private" | "savings">("family");

  const categories = {
    income: [
      { value: "gaji", label: "Gaji" },
      { value: "bonus", label: "Bonus" },
      { value: "hadiah", label: "Hadiah" },
      { value: "investasi", label: "Investasi" },
    ],
    expense: [
      { value: "makanan", label: "Makanan & Minuman" },
      { value: "transport", label: "Transportasi" },
      { value: "tagihan", label: "Tagihan" },
      { value: "hiburan", label: "Hiburan" },
      { value: "kesehatan", label: "Kesehatan" },
      { value: "belanja", label: "Belanja Bulanan" },
    ],
    non_financial: [
      { value: "masak", label: "Memasak" },
      { value: "bersih", label: "Membersihkan Rumah" },
      { value: "anak", label: "Mengasuh Anak" },
      { value: "belanja_hemat", label: "Menghemat Pengeluaran" },
      { value: "perbaikan", label: "Perbaikan Rumah" },
    ]
  };

  const fundSources = [
    { value: "family", label: "Uang Keluarga" },
    { value: "private", label: "Uang Pribadi" },
    { value: "savings", label: "Tabungan" },
  ];

  // Helper to format string to thousands separator
  const formatDisplayAmount = (val: string) => {
    // Remove all non-digits
    const clean = val.replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("id-ID");
  };

  // Helper to get raw number from formatted string
  const getRawAmount = (val: string) => {
    return val.replace(/\D/g, "");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDisplayAmount(e.target.value);
    setAmount(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dbUser || !dbUser.familyId) {
      toast.error("Data keluarga tidak ditemukan", {
        description: "Pastikan Anda sudah terdaftar dalam keluarga.",
      });
      return;
    }
    
    setLoading(true);
    const rawAmount = Number(getRawAmount(amount));

    try {
      await transactionsApi.create({
        amount: rawAmount,
        category,
        description,
        type,
        fundSource,
        source: categories[type].find(c => c.value === category)?.label || category
      });

      const typeLabel = type === "income" ? "Pemasukan" : type === "expense" ? "Pengeluaran" : "Kontribusi";
      
      toast.success(`${typeLabel} berhasil dicatat! ❤️`, {
        description: `Jumlah Rp ${rawAmount.toLocaleString("id-ID")} telah diperbarui di dashboard.`,
      });
      
      onSuccess?.();
    } catch (error: unknown) {
      toast.error("Gagal mencatat transaksi", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Type Toggle */}
      <div className="flex p-1 bg-zinc-100/50 backdrop-blur-md rounded-2xl border border-zinc-200/50">
        {(["income", "expense", "non_financial"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory("");
            }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              type === t 
                ? "bg-zinc-900 text-white shadow-md" 
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {t === "income" ? "Pemasukan" : t === "expense" ? "Pengeluaran" : "Non-Finansial"}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-zinc-400 ml-1">
            {type === "non_financial" ? "Estimasi Nilai (Rp)" : "Jumlah (Rp)"}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0"
            className="w-full h-16 bg-white/50 border border-white/60 rounded-[20px] px-6 focus:outline-none focus:border-zinc-900 transition-all text-2xl font-black placeholder:text-zinc-200"
            required
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-zinc-400 ml-1">Kategori</label>
          <SearchableSelect 
            options={categories[type]}
            value={category}
            onChange={setCategory}
            placeholder="Pilih Kategori"
            searchPlaceholder="Cari kategori..."
          />
        </div>

        {type !== "non_financial" && (
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-zinc-400 ml-1">Sumber Dana</label>
            <SearchableSelect 
              options={fundSources}
              value={fundSource}
              onChange={(val) => setFundSource(val as "family" | "private" | "savings")}
              placeholder="Pilih Sumber Dana"
            />
          </div>
        )}

        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 block text-zinc-400 ml-1">Keterangan</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Berikan catatan singkat..."
            className="w-full min-h-[100px] bg-white/50 border border-white/60 rounded-[20px] p-6 focus:outline-none focus:border-zinc-900 transition-all font-medium text-zinc-700"
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="xl"
        loading={loading}
        className="w-full shadow-2xl shadow-zinc-900/20"
        rightIcon={<Send className="w-5 h-5" />}
      >
        Simpan Catatan
      </Button>
    </form>
  );
}
