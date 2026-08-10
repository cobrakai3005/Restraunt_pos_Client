"use client";

import * as React from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [pendingStartDate, setPendingStartDate] = React.useState(startDate);
  const [pendingEndDate, setPendingEndDate] = React.useState(endDate);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setPendingStartDate(startDate);
      setPendingEndDate(endDate);
    }
  }, [isOpen, startDate, endDate]);

  const handleApply = () => {
    onDateChange(pendingStartDate, pendingEndDate);
    setIsOpen(false);
  };

  const handleReset = () => {
    setPendingStartDate("");
    setPendingEndDate("");
    onDateChange("", "");
    setIsOpen(false);
  };

  const hasActiveFilter = startDate || endDate;

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${format(new Date(startDate), "dd MMM yyyy")} - ${format(new Date(endDate), "dd MMM yyyy")}`;
    }
    if (startDate) {
      return `From ${format(new Date(startDate), "dd MMM yyyy")}`;
    }
    if (endDate) {
      return `Until ${format(new Date(endDate), "dd MMM yyyy")}`;
    }
    return "Filter by Date";
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 rounded-full border-[#d7d0ff] bg-white/80 px-4 text-[#5c47d8] hover:bg-[#f3efff] hover:text-[#4b38c7] dark:border-[#3a3169] dark:bg-[#1b1533] dark:text-[#d8d1ff] dark:hover:bg-[#241c45]",
              !hasActiveFilter && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDisplayText()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 rounded-3xl border border-[#ddd4ff] bg-white/95 p-4 shadow-lg dark:border-[#2c2459] dark:bg-[#0f172a]/95"
          align="end"
          sideOffset={8}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-xs uppercase tracking-tight text-muted-foreground">
                SELECT DATE RANGE
              </h4>
            </div>
            
            <div className="grid gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground/70">
                  FROM
                </Label>
                <Input
                  type="date"
                  value={pendingStartDate}
                  onChange={(e) => setPendingStartDate(e.target.value)}
                  className="h-9 text-sm rounded-xl"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground/70">
                  TO
                </Label>
                <Input
                  type="date"
                  value={pendingEndDate}
                  onChange={(e) => setPendingEndDate(e.target.value)}
                  className="h-9 text-sm rounded-xl"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs text-slate-500 hover:text-[#4b38c7] dark:text-slate-300"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-full bg-[#8b77ff] px-4 text-xs text-white hover:bg-[#7b66ff]"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}