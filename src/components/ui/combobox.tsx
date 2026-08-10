"use client";

import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  options: {
    value: string;
    label: string;
    searchableText?: string;
    description?: string;
    badge?: string;
    badgeClassName?: string;
  }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  creatable?: boolean;
  onCreate?: (inputValue: string) => Promise<any>;
  className?: string;
  disabled?: boolean;
  selectedOptionClassName?: string;
  inputProps?: Omit<
    React.ComponentPropsWithoutRef<typeof CommandInput>,
    | "value"
    | "onValueChange"
    | "onKeyDown"
    | "onMouseDown"
    | "onFocus"
    | "onBlur"
    | "placeholder"
    | "disabled"
    | "className"
  > & {
    className?: string;
  };
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Enter Name",
  searchPlaceholder = "Enter Name ",
  noResultsText = "No results found.",
  creatable = false,
  onCreate,
  disabled = false,
  className,
  selectedOptionClassName,
  inputProps,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [filteredOptions, setFilteredOptions] = React.useState(options);

  // Sync filteredOptions when options prop changes (e.g. when parent clears the list)
  React.useEffect(() => {
    setFilteredOptions(options);
    // If the dropdown is open, keep it in sync; if searching, don't reset search
    if (!open) {
      const selected = options.find((o) => o.value === value);
      setSearchValue(selected?.label || value || "");
    }
  }, [options]);

  const selectedOption = options.find((option) => option.value === value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pointerActivatedRef = React.useRef(false);

  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (!open) {
      const selected = options.find((o) => o.value === value);
      setSearchValue(selected?.label || value || "");
    }
  }, [open, value, options]);

  const handleCreate = async () => {
    if (onCreate && searchValue) {
      const createdLabel = searchValue.trim();
      setOpen(false);
      const createdValue = await onCreate(createdLabel);

      if (typeof createdValue === "string" && createdValue.trim()) {
        onChange(createdValue);
        setSearchValue(createdLabel);
        window.setTimeout(() => {
          if (inputRef.current) {
            (inputRef.current as any)._programmaticFocus = true;
            inputRef.current.focus();
            inputRef.current.select();
          }
        }, 0);
      } else {
        setSearchValue("");
      }

      setFilteredOptions(options);
    }
  };

  const handleInputChange = (text: string) => {
    setSearchValue(text);

    if (text.trim() === "") {
      setFilteredOptions(options);
      setOpen(true);
      return;
    }

    const cleanSearch = text.toLowerCase().trim().replace(/\s+/g, " ");
    const searchTerms = cleanSearch.split(" ").filter(Boolean);

    const filtered = options
      .map((o) => {
        const searchableContent = `${o.label} ${o.searchableText || ""}`
          .toLowerCase()
          .trim()
          .replace(/\s+/g, " ");

        let score = 0;
        let matchCount = 0;

        const labelLower = o.label.toLowerCase();

        if (labelLower === cleanSearch) {
          score += 150;
          matchCount += 1;
        } else if (labelLower.includes(cleanSearch)) {
          score += 100;
          matchCount += 1;
        }

        if (labelLower.startsWith(cleanSearch)) {
          score += 30;
        }

        for (const term of searchTerms) {
          if (labelLower.includes(term)) {
            score += 25;
            matchCount += 1;
          }
          if (searchableContent.includes(term)) {
            score += 10;
          }
        }

        if (searchTerms.every((term) => searchableContent.includes(term))) {
          score += 15;
        }

        return { option: o, score, matchCount };
      })
      .filter(({ matchCount }) => matchCount > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.option.label.localeCompare(b.option.label);
      })
      .map(({ option }) => option);

    setFilteredOptions(filtered);
    setOpen(true);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    const newSelected = options.find(
      (option) => option.value === selectedValue,
    );
    setSearchValue(newSelected?.label || "");
    setFilteredOptions(options);
    setOpen(false);
  };

  const showCreateOption =
    creatable &&
    searchValue.trim() !== "" &&
    !options.some((opt) => {
      const cleanLabel = opt.label
        .replace(/\s*\([^)]*\)$/, "")
        .toLowerCase()
        .trim();
      const cleanSearch = searchValue.toLowerCase().trim();

      return (
        cleanLabel.replace(/\s+/g, " ") === cleanSearch.replace(/\s+/g, " ")
      );
    });

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div className="relative w-full border border-gray-200 dark:border-gray-800 rounded-md focus-within:border-primary focus-within:ring-1 focus-within:ring-primary py-0">
        <Command className="overflow-visible">
          <CommandInput
            ref={inputRef}
            {...inputProps}
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={handleInputChange}
            onKeyDown={(e) => {
              const hasSelectedOption = !!selectedOption;
              if (e.key === "Tab" && !hasSelectedOption) {
                e.preventDefault();
                setOpen(true);
                setFilteredOptions(options);
                return;
              }
              if (e.key === "Enter" && !open) {
                e.preventDefault();
                setSearchValue("");
                setOpen(true);
                setFilteredOptions(options);
              }
              if (e.key === "ArrowDown" && !open) {
                setOpen(true);
                setFilteredOptions(options);
              }
            }}
            onMouseDown={() => {
              const isAlreadyFocused =
                document.activeElement === inputRef.current;
              if (!isAlreadyFocused) {
                pointerActivatedRef.current = true;
                setSearchValue("");
                setOpen(true);
                setFilteredOptions(options);
              } else {
                const isCleanSelectedState =
                  selectedOption && searchValue === selectedOption.label;

                if (isCleanSelectedState) {
                  setSearchValue("");
                  setOpen(true);
                  setFilteredOptions(options);
                } else {
                  setOpen(true);
                }
              }
            }}
            onFocus={() => {
              // ✅ Check if this is a programmatic focus (from parent form)
              const isProgrammatic = (inputRef.current as any)
                ?._programmaticFocus;
              if (isProgrammatic) {
                (inputRef.current as any)._programmaticFocus = false;
                if (selectedOption) {
                  setSearchValue(selectedOption.label);
                }
                setOpen(false);
                return; // Don't open dropdown for programmatic focus
              }

              // User-initiated focus
              if (selectedOption) {
                if (pointerActivatedRef.current) {
                  setOpen(true);
                  setFilteredOptions(options);
                } else {
                  setSearchValue(selectedOption.label);
                  setOpen(false);
                }
                pointerActivatedRef.current = false;
              } else {
                setSearchValue("");
                setOpen(true);
                setFilteredOptions(options);
              }
            }}
            onBlur={(event) => {
              const relatedTarget = event.relatedTarget as Node | null;
              if (
                wrapperRef.current &&
                relatedTarget &&
                wrapperRef.current.contains(relatedTarget)
              ) {
                return;
              }
              setOpen(false);
              pointerActivatedRef.current = false;
            }}
            disabled={disabled}
            className={cn(inputProps?.className)}
          />

          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 z-[1000]">
              <CommandList
                className="w-full border rounded-md shadow-lg text-black
                  dark:text-white dark:border-gray-800 dark:bg-gray-800
                  max-h-72 overflow-y-auto bg-card text-card-foreground"
              >
                <CommandEmpty>
                  {showCreateOption ? "" : noResultsText}
                </CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.searchableText || ""} ${option.value}`}
                      onSelect={() => handleSelect(option.value)}
                      className={cn(
                        value === option.value && selectedOptionClassName,
                      )}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="block truncate">{option.label}</span>
                          {option.badge && (
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal",
                                option.badgeClassName,
                              )}
                            >
                              {option.badge}
                            </span>
                          )}
                        </span>
                        {option.description && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                  {showCreateOption && (
                    <CommandItem
                      value={searchValue}
                      onSelect={handleCreate}
                      className="flex items-center text-primary"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create "{searchValue}"
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </div>
          )}
        </Command>
      </div>
    </div>
  );
}
