"use client";

import { Layers, UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MenuItemCardProps {
  name: string;
  categoryName?: string;
  price: number;
  variantsCount: number;
  isAvailable: boolean;
  imageUrl?: string | null;
  isVeg?: boolean | null;
  inCartCount: number;
  onClick: () => void;
}

function VegMark() {
  return (
    <span className="mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-2 border-green-600 bg-white dark:bg-slate-900">
      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
    </span>
  );
}

function NonVegMark() {
  return (
    <span className="mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-2 border-red-600 bg-white dark:bg-slate-900">
      <span className="h-0 w-0 border-x-[3px] border-b-[5px] border-x-transparent border-b-red-600" />
    </span>
  );
}

export function MenuItemCard({
  name,
  categoryName,
  price,
  variantsCount,
  isAvailable,
  imageUrl,
  isVeg,
  inCartCount,
  onClick,
}: MenuItemCardProps) {
  const isSoldOut = !isAvailable;

  return (
    <Card
      className={`group cursor-pointer transition-all duration-300 flex flex-col overflow-hidden active:scale-[0.97] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/60 dark:border-slate-700/50 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-white/90 dark:hover:bg-slate-800/90 shadow-sm relative ${isSoldOut ? "cursor-not-allowed" : ""} ${inCartCount > 0 ? "ring-2 ring-blue-500/80 bg-blue-50/40 dark:bg-blue-900/20" : ""}`}
      onClick={onClick}
    >
      {/* Photo band */}
      <div className="relative h-28 shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-900">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06] motion-reduce:transform-none ${isSoldOut ? "grayscale" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-800/80 dark:to-slate-900">
            <UtensilsCrossed className="h-7 w-7 text-slate-300 dark:text-slate-600" />
          </div>
        )}

        {inCartCount > 0 && (
          <div className="absolute right-2 top-2 z-20 flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-extrabold text-white shadow-md animate-in zoom-in-50">
            {inCartCount}
          </div>
        )}

        {isSoldOut && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/30 dark:bg-slate-950/50">
            <span className="rotate-[-12deg] rounded-md border-2 border-red-500 bg-red-50/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-red-500 shadow-sm dark:bg-red-950/70">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Ticket stub */}
      <CardContent className="relative flex flex-1 flex-col p-3 pt-2.5">
        <div className="absolute inset-x-2 top-0 border-t border-dashed border-slate-300/80 dark:border-slate-600/60" />

        <div className="flex items-start gap-1.5">
          {isVeg === true && <VegMark />}
          {isVeg === false && <NonVegMark />}
          <h3 className="line-clamp-2 pr-2 text-sm font-bold leading-tight text-slate-900 dark:text-white">
            {name}
          </h3>
        </div>

        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          {categoryName || "Uncategorized"}
        </span>

        <div className="mt-auto flex items-end justify-between pt-2">
          <span className="font-mono text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400">
            ₹{price.toFixed(2)}
          </span>
          {variantsCount > 1 && (
            <span className="flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-800/50 bg-violet-100/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <Layers className="h-3 w-3" /> {variantsCount} Variants
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
