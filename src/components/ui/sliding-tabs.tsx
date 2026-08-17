"use client";

import React, { useRef, useEffect, useState } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SlidingTabsProps {
  tabs: readonly string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  getTabLabel: (tab: string) => string;
  disabled?: boolean;
}

export function SlidingTabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  getTabLabel,
  disabled = false 
}: SlidingTabsProps) {
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    if (!tabsListRef.current) return;

    const activeTrigger = tabsListRef.current.querySelector(
      `[data-state="active"]`
    ) as HTMLElement;

    if (activeTrigger) {
      setSliderStyle({
        width: activeTrigger.offsetWidth,
        left: activeTrigger.offsetLeft,
      });
    }
  }, [activeTab]);

  return (
    <TabsList
      ref={tabsListRef}
      className="relative grid h-auto w-full overflow-visible rounded-[22px] border border-[#e8e2ff] bg-[#f8f6ff] p-1 dark:border-[#32285f] dark:bg-[#120f25]"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
    >
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab}
          value={tab}
          disabled={disabled}
          onClick={() => onTabChange(tab)}
          className={cn(
            'relative z-10 shrink-0 rounded-none border-none bg-transparent px-5 pb-3 pt-3 text-sm font-medium text-slate-600 transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:text-[#4b38c7] data-[state=active]:shadow-none dark:text-slate-300 dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-white'
          )}
        >
          {getTabLabel(tab)}
        </TabsTrigger>
      ))}
      
      {tabs.length > 0 && (
        <div
          className="absolute bottom-0 h-[2.5px] bg-[#8b77ff] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            width: `${sliderStyle.width}px`,
            transform: `translateX(${sliderStyle.left}px) scaleX(0.8)`,
            transformOrigin: 'center',
            willChange: 'transform',
          }}
        />
      )}
    </TabsList>
  );
}