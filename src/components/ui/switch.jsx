"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Switch({
  className,
  checked,
  onCheckedChange,
  disabled,
  ...props
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={cn(
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        checked 
          ? "bg-primary focus-visible:ring-ring/50" 
          : "bg-input dark:bg-input/80",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block size-4 rounded-full ring-0 transition-transform",
          checked 
            ? "translate-x-[calc(100%-2px)] bg-background dark:bg-primary-foreground" 
            : "translate-x-0 bg-background dark:bg-foreground"
        )}
      />
    </button>
  );
}

export { Switch }
