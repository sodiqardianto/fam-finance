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
      className="fixed bottom-8 left-0 right-0 z-50 px-6 flex justify-center md:bottom-10"
    >
      <nav className="flex items-center justify-around w-full max-w-md md:max-w-2xl h-16 md:h-20 bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[32px] px-2 md:px-6 relative ring-1 ring-black/5 transition-all duration-300">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          const content = (
            <motion.div
              whileTap={{ scale: 0.9 }}
              whileHover={{ y: -2 }}
              className={cn(
                "flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 transition-colors duration-300",
                isActive ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600",
                item.primary && "text-pink-600",
                item.primary && !isActive && "text-pink-500"
              )}
            >
              <div className={cn(
                "transition-all duration-300",
                item.primary && "bg-pink-500/10 p-2 md:p-3 rounded-2xl -mt-6 md:-mt-8 shadow-lg shadow-pink-500/20 border border-white/50 backdrop-blur-xl group-hover:scale-110 group-hover:-translate-y-1"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all",
                  isActive && !item.primary && "scale-110 stroke-[2.5px]",
                  item.primary && "w-6 h-6 md:w-7 md:h-7 stroke-[2.5px]"
                )} />
              </div>
              <span className={cn(
                "text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300",
                item.primary && "mt-1 md:mt-0",
                !item.primary && "md:opacity-100", // Always visible on desktop for clarity
                !item.primary && !isActive && "md:group-hover:text-zinc-600"
              )}>
                {item.label}
              </span>
            </motion.div>
          );

          if (item.trigger) {
            return (
              <Drawer key={item.label} open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                  <button className="relative flex flex-col items-center justify-center w-14 h-14 md:w-20 md:h-20 group outline-none -mt-8 md:-mt-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full shadow-[0_8px_16px_rgba(236,72,153,0.3)] group-hover:shadow-[0_12px_24px_rgba(236,72,153,0.5)] group-hover:scale-110 transition-all duration-300 ring-4 ring-white border border-pink-400/50 flex items-center justify-center">
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-white stroke-[2.5px]" />
                    </div>
                    <span className="absolute -bottom-6 md:-bottom-7 text-[10px] md:text-xs font-black uppercase tracking-wider text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm">
                      {item.label}
                    </span>
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="pb-0 text-zinc-900">
                    <DrawerTitle className="text-zinc-900">Tambah Aktivitas</DrawerTitle>
                    <DrawerDescription className="text-zinc-500">Catat pengeluaran, pemasukan, atau kontribusi kasih sayang kamu.</DrawerDescription>
                  </DrawerHeader>
                  <TransactionForm onSuccess={() => {
                    setIsOpen(false);
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
              className="relative flex flex-col items-center justify-center w-14 h-14 md:w-auto md:px-4 md:h-16 group"
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-1 md:inset-x-2 md:inset-y-3 rounded-2xl bg-zinc-900/[0.04] -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              {content}

              {isActive && (
                <motion.div
                  layoutId="active-dot"
                  className="absolute bottom-1 md:bottom-2 w-1 h-1 rounded-full bg-zinc-900"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}
