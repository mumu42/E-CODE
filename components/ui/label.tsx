/**
 * @file components/ui/label.tsx
 * @description shadcn Label 组件
 * @author English Agent Team
 * @date 2026-08-07
 */

"use client"

import * as React from "react"

import { cn } from "@/lib/utils/cn"

/**
 * Label 组件
 * @param props - 标签属性
 * @returns 标签 JSX 元素
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
