"use client"

import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** 오늘 이전 날짜 비활성화 여부 (기본: false) */
  disablePast?: boolean
  /** 'month': 연도+월 select만 표시 */
  granularity?: 'month'
}

const selectCls =
  "h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"

export function DatePicker({
  value,
  onChange,
  placeholder = "날짜 선택",
  disabled,
  className,
  disablePast = false,
  granularity,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (granularity === 'month') {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: currentYear - 1959 }, (_, i) => currentYear - i)
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const selectedYear = value?.getFullYear()
    const selectedMonth = value ? value.getMonth() + 1 : undefined

    function handleYear(y: string) {
      const year = parseInt(y)
      onChange?.(new Date(year, (selectedMonth ?? 1) - 1, 1))
    }
    function handleMonth(m: string) {
      const month = parseInt(m)
      onChange?.(new Date(selectedYear ?? currentYear, month - 1, 1))
    }

    return (
      <div className={cn("flex gap-1", className)}>
        <select
          className={`${selectCls} flex-1`}
          value={selectedYear ?? ''}
          onChange={(e) => handleYear(e.target.value)}
          disabled={disabled}
        >
          <option value="">연도</option>
          {years.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select
          className={`${selectCls} flex-1`}
          value={selectedMonth ?? ''}
          onChange={(e) => handleMonth(e.target.value)}
          disabled={disabled}
        >
          <option value="">월</option>
          {months.map((m) => <option key={m} value={m}>{m}월</option>)}
        </select>
      </div>
    )
  }

  const disabledDays = disablePast
    ? (date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))
    : undefined

  const triggerButton = (
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
  )

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent
          className="w-auto min-w-[320px] p-0"
          align="start"
          collisionPadding={{ top: 16, bottom: 16, left: 8, right: 8 }}
          avoidCollisions
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
            disabled={disabledDays}
            locale={ko}
            autoFocus
            className="w-full"
            classNames={{ root: "w-full" }}
            style={{ '--cell-size': '2.5rem' } as React.CSSProperties}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false} repositionInputs={false}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>날짜 선택</DrawerTitle>
        </DrawerHeader>
        <div
          className="overflow-y-auto px-2"
          style={{
            maxHeight: 'calc(100dvh - 8rem)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
          }}
        >
          <Calendar
            mode="single"
            fixedWeeks
            selected={value}
            onSelect={(date) => {
              onChange?.(date)
              setOpen(false)
            }}
            disabled={disabledDays}
            locale={ko}
            className="w-full"
            classNames={{ root: "w-full" }}
            style={{ '--cell-size': '2.75rem' } as React.CSSProperties}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
