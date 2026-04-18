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
}

export function DatePicker({
  value,
  onChange,
  placeholder = "날짜 선택",
  disabled,
  className,
  disablePast = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

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
          className="w-auto p-0"
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
            className="[--cell-size:2.5rem]"
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
            className="w-full [--cell-size:2.75rem]"
            classNames={{ root: "w-full" }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
