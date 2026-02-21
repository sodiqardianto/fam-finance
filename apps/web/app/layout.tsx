import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fam Finance - Kelola Keuangan Bersama",
  description: "Aplikasi keuangan keluarga yang mengutamakan kesetaraan dan keharmonisan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-[#fafafa] pb-24 md:pb-0 min-h-screen relative overflow-x-hidden`}
      >
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
            },
            className: "font-sans font-bold text-zinc-900",
          }}
        />
        {/* Global Ambient Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* Animated Blobs */}
          <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-pink-200/30 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[50%] rounded-full bg-blue-200/30 blur-[100px]" />
          <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] rounded-full bg-purple-100/40 blur-[80px]" />
          <div className="absolute bottom-[20%] right-[10%] w-[25%] h-[25%] rounded-full bg-yellow-100/30 blur-[90px]" />
          
          {/* Mesh Gradient Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
          
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        {children}
        <BottomNav />
      </body>
    </html>
  );
}
