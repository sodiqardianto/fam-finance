"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Home, 
  PlusCircle, 
  PiggyBank, 
  User,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

import { 
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TransactionForm } from "@/components/transaction-form";
import { useState } from "react";

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: History, label: "Riwayat", href: "/history" },
  { icon: PlusCircle, label: "Catat", href: "#", primary: true, trigger: true },
  { icon: PiggyBank, label: "Tabungan", href: "/savings" },
  { icon: User, label: "Profil", href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show BottomNav on landing page
  if (pathname === "/") return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="fixed bottom-6 left-0 right-0 z-50 px-6 md:hidden"
    >
      <nav className="mx-auto max-w-md h-16 bg-white/40 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] rounded-[32px] flex items-center justify-around px-2 relative overflow-hidden">
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-[32px] border border-white/20 pointer-events-none" />
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          const content = (
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex flex-col items-center gap-1",
                isActive ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600 transition-colors",
                item.primary && "text-pink-600",
                item.primary && !isActive && "text-pink-400"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 transition-all",
                isActive && !item.primary && "scale-110",
                item.primary && "w-7 h-7"
              )} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </motion.div>
          );

          if (item.trigger) {
            return (
              <Drawer key={item.label} open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                  <button className="relative flex flex-col items-center justify-center w-12 h-12 group outline-none">
                    {content}
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="pb-0">
                    <DrawerTitle>Tambah Aktivitas</DrawerTitle>
                    <DrawerDescription>Catat pengeluaran, pemasukan, atau kontribusi kasih sayang kamu.</DrawerDescription>
                  </DrawerHeader>
                  <TransactionForm onSuccess={() => {
                    setIsOpen(false);
                    // Trigger global refresh event untuk dashboard
                    window.dispatchEvent(new CustomEvent('famfinance:refresh-data'));
                  }} />
                </DrawerContent>
              </Drawer>
            );
          }

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="relative flex flex-col items-center justify-center w-12 h-12 group"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className={cn(
                    "absolute inset-0 rounded-2xl bg-zinc-900/5 -z-10",
                    item.primary && "bg-pink-500/10"
                  )}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              {content}

              {isActive && (
                <motion.div
                  layoutId="active-dot"
                  className={cn(
                    "absolute -bottom-1 w-1 h-1 rounded-full bg-zinc-900",
                    item.primary && "bg-pink-500"
                  )}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}
