"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parse as parseDate } from "date-fns";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface Props {
  date: {
    start: Date | string;
    end: Date | string;
  };
  setDate: (date: { start: string; end: string }) => void;
  showHeader?: boolean;
  className?: string;
}

const parseInputDate = (d: Date | string): Date | undefined => {
  if (!d) return undefined;
  if (d instanceof Date) return d;
  try {
    // Attempt to parse dd/MM/yyyy
    const parsed = parseDate(d, 'dd/MM/yyyy', new Date());
    if (!isNaN(parsed.getTime())) return parsed;
    // Fallback to native Date constructor
    const native = new Date(d);
    if (!isNaN(native.getTime())) return native;
  } catch (e) {
    console.error("Error parsing date:", d, e);
  }
  return undefined;
};

export default function DateRangePicker({
  date,
  setDate,
  showHeader = true,
  className
}: Props) {
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: parseInputDate(date?.start),
    to: parseInputDate(date?.end),
  }));

  // Sync internal range with props when they change externally
  useEffect(() => {
    const from = parseInputDate(date?.start);
    const to = parseInputDate(date?.end);

    // Only update if they are actually different to avoid extra renders
    setRange(prev => {
      if (prev?.from?.getTime() === from?.getTime() && prev?.to?.getTime() === to?.getTime()) {
        return prev;
      }
      return { from, to };
    });
  }, [date?.start, date?.end]);

  // Handle date selection
  const handleSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange);

    if (selectedRange?.from && selectedRange.to) {
      const fromStr = format(selectedRange.from, 'dd/MM/yyyy');
      const calamities = format(selectedRange.to, 'dd/MM/yyyy');

      // Notify parent only when both are selected and different from current props
      const currentStart = date?.start instanceof Date ? format(date.start, 'dd/MM/yyyy') : date?.start;
      const currentEnd = date?.end instanceof Date ? format(date.end, 'dd/MM/yyyy') : date?.end;

      if (fromStr !== currentStart || calamities !== currentEnd) {
        setDate({
          start: fromStr,
          end: calamities
        });
      }
    }
  };

  return (
    <div className={className || "flex flex-col items-center space-y-4 p-6 bg-white shadow rounded-xl w-fit mx-auto"}>
      {showHeader && <h2 className="text-lg font-semibold text-center">Pilih Rentang Tanggal</h2>}

      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        numberOfMonths={1}
        pagedNavigation
        defaultMonth={range?.from}
      />
    </div>
  );
}
