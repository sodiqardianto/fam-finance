"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "glass" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: "bg-zinc-900/90 text-white border border-white/10 shadow-xl shadow-zinc-900/10 backdrop-blur-md hover:bg-zinc-800 rounded-[inherit]",
      secondary: "bg-zinc-100/80 text-zinc-900 border border-zinc-200/50 backdrop-blur-md hover:bg-zinc-200/80 rounded-[inherit]",
      glass: "bg-white/40 text-zinc-900 border border-white/40 shadow-lg backdrop-blur-xl hover:bg-white/60 rounded-[inherit]",
      danger: "bg-red-500/10 text-red-600 border border-red-200/50 backdrop-blur-md hover:bg-red-500/20 rounded-[inherit]",
      ghost: "bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50 backdrop-blur-sm rounded-[inherit]",
    };

    const sizes = {
      sm: "h-9 px-4 rounded-xl text-xs font-bold",
      md: "h-11 px-6 rounded-2xl text-sm font-bold",
      lg: "h-14 px-8 rounded-[28px] text-base font-bold",
      xl: "h-16 px-10 rounded-[32px] text-lg font-bold",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-zinc-500/20",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
