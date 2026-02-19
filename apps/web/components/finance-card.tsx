"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, animate, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

// Animated Number Component dengan key-based reset
interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  className?: string;
  enabled?: boolean;
  animationKey?: number; // Key untuk trigger re-animate
}

function AnimatedNumber({ value, prefix = "", className = "", enabled = true, animationKey = 0 }: AnimatedNumberProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => prefix + Math.floor(latest).toLocaleString("id-ID"));
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const prevKeyRef = useRef(animationKey);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Cancel animation sebelumnya
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    // Check if this is a fresh animate (key changed) or just value update
    const isFreshAnimate = animationKey !== prevKeyRef.current || !hasAnimatedRef.current;
    prevKeyRef.current = animationKey;
    
    const from = enabled && isFreshAnimate ? 0 : count.get();
    const to = value;
    
    if (enabled) {
      hasAnimatedRef.current = true;
    }
    
    if (from === to) {
      count.set(to);
      return;
    }
    
    count.set(from);
    
    const delta = Math.abs(to - from);
    const duration = Math.min(1.5, Math.max(0.6, delta / 800000));
    
    animationRef.current = animate(count, to, {
      duration,
      ease: "easeOut",
    });
    
    return () => animationRef.current?.stop();
  }, [value, enabled, animationKey, count]);

  if (!enabled) {
    return <span className={className}>{prefix}{Math.floor(value).toLocaleString("id-ID")}</span>;
  }

  return <motion.span className={className}>{rounded}</motion.span>;
}

// Finance Card Component
interface FinanceCardProps {
  title: string;
  value: number;
  isLoading: boolean;
  prefix?: string;
  animate?: boolean;
  animationKey?: number; // Pass refreshKey untuk trigger re-animate
  icon?: LucideIcon;
  iconClassName?: string;
  cardClassName?: string;
  titleClassName?: string;
  valueClassName?: string;
  badge?: React.ReactNode;
}

export function FinanceCard({
  title,
  value,
  isLoading,
  prefix = "Rp ",
  animate = false,
  animationKey = 0,
  icon: Icon,
  iconClassName,
  cardClassName,
  titleClassName,
  valueClassName,
  badge,
}: FinanceCardProps) {
  return (
    <Card className={cn("relative overflow-hidden group", cardClassName)}>
      {Icon && (
        <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Icon className={cn("w-32 h-32", iconClassName)} />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-xs font-bold uppercase tracking-[0.2em]", titleClassName)}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className={cn(
          "text-4xl font-black mb-3 transition-opacity duration-300",
          isLoading ? 'opacity-0' : 'opacity-100',
          valueClassName
        )}>
          <AnimatedNumber 
            value={value} 
            prefix={prefix}
            enabled={animate}
            animationKey={animationKey}
          />
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center px-6 pb-6 pt-2">
            <Skeleton className={cn("h-10 w-3/4", 
              cardClassName?.includes("bg-zinc-900") ? "bg-white/10" : "bg-zinc-900/5"
            )} />
          </div>
        )}
        {badge}
      </CardContent>
    </Card>
  );
}
