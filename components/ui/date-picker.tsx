"use client"

import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** 오늘 이전 날짜 비활성화 여부 (기본: false) */
  disablePast?: boolean
  /** 팝오버 열리는 방향 (기본: auto) */
  side?: "top" | "bottom" | "left" | "right"
}

export function DatePicker({
  value,
  onChange,
  placeholder = "날짜 선택",
  disabled,
  className,
  disablePast = false,
  side,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          aria-label={value ? format(value, "PPP", { locale: ko }) : placeholder}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {value ? format(value, "yyyy년 MM월 dd일", { locale: ko }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(340px,calc(100vw-2rem))] p-0"
        collisionPadding={8}
        side={side}
        avoidCollisions={side === undefined}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disablePast ? (date) => date < new Date(new Date().setHours(0, 0, 0, 0)) : undefined}
          locale={ko}
          className="w-full [--cell-size:auto]"
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
