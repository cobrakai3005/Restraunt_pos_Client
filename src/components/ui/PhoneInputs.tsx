"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const digitsOnly = (s: string) => s.replace(/\D/g, "");

const formatIndianMobile = (digits: string): string => {
  const d = digits.slice(0, 10);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
};

interface PhoneInputProps {
  value: string;                    
  onChange: (digits: string) => void;
  onBlur?: () => void;
  hasError?: boolean;            
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  hasError,
  disabled,
  placeholder = "98765 43210",
  className,
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  const displayValue = formatIndianMobile(value);
  const digitCount = value.length;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = digitsOnly(e.target.value);
    onChange(raw.slice(0, 10));
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "flex items-center rounded-md border border-input bg-background ",
        "ring-offset-background transition-colors cursor-text",
        focused && "ring-2 ring-ring ring-offset-2",
        hasError && "border-red-500",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 px-3 h-10 border-r border-input shrink-0 select-none">
        <span className="text-xs font-medium text-foreground">+91</span>
      </div>

      {/* Number input - now with padding to accommodate counter */}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Mobile number"
          className={cn(
            "w-full h-10 bg-transparent outline-none text-xs",
            "placeholder:text-muted-foreground",
            disabled && "cursor-not-allowed",
            // Add right padding based on whether counter is visible
            digitCount > 0 ? "pr-10 pl-3" : "px-3"
          )}
          style={{ paddingRight: digitCount > 0 ? "2.5rem" : "0.75rem" }}
        />
        
        {/* Digit counter - positioned absolutely inside the input */}
        {digitCount > 0 && (
          <span className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums font-mono pointer-events-none",
            digitCount === 10 ? "text-green-500" : "text-muted-foreground"
          )}>
            {digitCount}/10
          </span>
        )}
      </div>
    </div>
  );
}

export default PhoneInput;
