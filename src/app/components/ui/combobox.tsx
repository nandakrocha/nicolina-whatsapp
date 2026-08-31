"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  filterByFirstLetter?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  emptyText = "Nenhum resultado encontrado.",
  searchPlaceholder = "Buscar...",
  className,
  disabled = false,
  filterByFirstLetter = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Scroll-detection: track whether the finger is moving inside the list.
  // If it is, onSelect must not fire (user is scrolling, not tapping).
  const listRef = React.useRef<HTMLDivElement>(null);
  const listScrollingRef = React.useRef(false);
  const listTouchStartY = React.useRef(0);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      listTouchStartY.current = e.touches[0].clientY;
      listScrollingRef.current = false;
    };
    const onMove = (e: TouchEvent) => {
      if (Math.abs(e.touches[0].clientY - listTouchStartY.current) > 6) {
        listScrollingRef.current = true;
      }
    };
    const onEnd = () => {
      // Reset after a short delay so the click event (fired right after
      // touchend) can still read the correct value.
      setTimeout(() => { listScrollingRef.current = false; }, 200);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [open]);

  const selectedOption = options.find((option) => option.value === value);

  const normalizarTexto = (texto: string) => {
    return texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  };

  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) return options;
    const searchNormalizado = normalizarTexto(searchValue);
    if (filterByFirstLetter) {
      return options.filter((option) =>
        normalizarTexto(option.label).startsWith(searchNormalizado)
      );
    }
    return options.filter((option) =>
      normalizarTexto(option.label).includes(searchNormalizado)
    );
  }, [options, searchValue, filterByFirstLetter]);

  const handleSelect = (optionValue: string) => {
    // Guard: don't select if the touch gesture was a scroll
    if (listScrollingRef.current) return;
    onValueChange?.(optionValue === value ? "" : optionValue);
    setOpen(false);
    setSearchValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* No onTouchEnd here — Radix handles touch via pointer events.
            touch-action: manipulation removes the 300ms tap delay natively. */}
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            "min-h-[44px]",
            className
          )}
          disabled={disabled}
          style={{
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        // Standard outside-click dismiss — no timing hacks needed since we
        // no longer use onTouchEnd on the trigger.
        onInteractOutside={() => setOpen(false)}
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <Command shouldFilter={false} filter={() => 1}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            // 16px prevents iOS from auto-zooming on focus
            style={{ fontSize: "16px" }}
          />
          {/* ref attached here so passive touch listeners can detect scrolling */}
          <div ref={listRef}>
            <CommandList
              style={{
                // Allow vertical swipe-to-scroll inside the list.
                // pan-y lets the browser handle vertical scroll natively.
                touchAction: "pan-y",
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {filteredOptions.length === 0 ? (
                <CommandEmpty>{emptyText}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label]}
                      // onSelect is called by cmdk on click — the browser
                      // does NOT fire click after a scroll gesture, so
                      // accidental selection during scroll is naturally prevented.
                      onSelect={() => handleSelect(option.value)}
                      style={{
                        minHeight: "44px",
                        WebkitTapHighlightColor: "transparent",
                        // manipulation = pan-x pan-y + no double-tap zoom.
                        // Eliminates 300ms tap delay while keeping scroll.
                        touchAction: "manipulation",
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
