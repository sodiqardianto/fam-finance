"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
  searchPlaceholder = "Cari...",
  className,
  disabled
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-full items-center justify-between rounded-[20px] border border-white/60 bg-white/50 px-6 py-4 text-left shadow-sm backdrop-blur-md transition-all focus:outline-none focus:border-zinc-900 disabled:opacity-50",
          isOpen && "border-zinc-900 ring-4 ring-zinc-900/5"
        )}
      >
        <span className={cn("block truncate font-medium", !selectedOption && "text-zinc-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-2">
          {value && !disabled && (
            <div
              onClick={handleClear}
              className="rounded-full p-1 hover:bg-zinc-200/50 text-zinc-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </div>
          )}
          <ChevronDown
            className={cn(
              "h-5 w-5 text-zinc-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[100] mt-2 w-full overflow-hidden rounded-[24px] border border-white/60 bg-white/80 p-2 shadow-2xl backdrop-blur-2xl"
          >
            {/* Search Input */}
            <div className="relative mb-2 flex items-center px-2">
              <Search className="absolute left-5 h-4 w-4 text-zinc-400" />
              <input
                autoFocus
                className="h-11 w-full rounded-xl bg-zinc-900/5 pl-10 pr-4 text-sm font-medium focus:outline-none"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto overflow-x-hidden scrollbar-hide px-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "group flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all hover:bg-zinc-900 hover:text-white",
                      value === option.value ? "bg-zinc-900/5 text-zinc-900" : "text-zinc-600"
                    )}
                  >
                    <span>{option.label}</span>
                    {value === option.value && <Check className="h-4 w-4" />}
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-zinc-400 font-medium">
                  Tidak ditemukan hasil
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
