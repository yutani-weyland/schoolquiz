"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = value ? new Date(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full pl-10 pr-4 py-2 h-10 border border-gray-300/50 dark:border-gray-700/50 rounded-xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] text-sm text-left font-normal relative",
            !date && "text-gray-500 dark:text-gray-400",
            className
          )}
        >
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none z-10" />
          <span className="block truncate">{date ? format(date, "dd/MM/yyyy") : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            if (selectedDate) {
              onChange(format(selectedDate, "yyyy-MM-dd"))
            } else {
              onChange("")
            }
            setOpen(false)
          }}
          initialFocus
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  )
}

