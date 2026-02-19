"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useMotionValue, motion, useTransform, animate, AnimationPlaybackControls } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
}

// Hook untuk detect client-side tanpa useEffect + setState
function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {}, // subscribe (no-op)
    () => true,     // getSnapshot on client
    () => false     // getSnapshot on server
  );
}

export function AnimatedNumber({ value, className, prefix = "" }: AnimatedNumberProps) {
  const count = useMotionValue(value);
  const rounded = useTransform(count, (latest) => {
    return prefix + Math.floor(latest).toLocaleString("id-ID");
  });
  
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const prevValueRef = useRef(value);
  const isClient = useIsClient();

  useEffect(() => {
    const from = prevValueRef.current;
    const to = value;
    
    // Update ref untuk next render
    prevValueRef.current = value;
    
    // Skip jika nilai sama
    if (from === to) {
      return;
    }
    
    // Cancel animation sebelumnya
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    // Set nilai awal
    count.set(from);
    
    // Calculate duration
    const delta = Math.abs(to - from);
    const duration = Math.min(1.5, Math.max(0.5, delta / 1000000));
    
    // Start animation
    animationRef.current = animate(count, to, {
      duration,
      ease: "easeOut",
    });
    
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [value, count]);

  // Render nilai static untuk SSR, motion untuk client
  if (!isClient) {
    return <span className={className}>{prefix}{Math.floor(value).toLocaleString("id-ID")}</span>;
  }

  return <motion.span className={className}>{rounded}</motion.span>;
}
