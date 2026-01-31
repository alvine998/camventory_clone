"use client";

import { useEffect, useState } from "react";
import { format, parse as parseDate, differenceInDays } from "date-fns";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface Props {
  date: {
    start: Date | string;
    end: Date | string;
  };
  onSave?: (date: { start: string; end: string }) => void;
  onCancel?: () => void;
  setDate?: (date: { start: string; end: string }) => void; // Legacy immediate update
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
  onSave,
  onCancel,
  setDate,
  showHeader = true,
  className
}: Props) {
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: parseInputDate(date?.start),
    to: parseInputDate(date?.end),
  }));
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    if (selectedRange?.from && selectedRange.to) {
      // Validate 31 days limit
      const days = differenceInDays(selectedRange.to, selectedRange.from);
      if (days >= 31) {
        setError("Maksimal rentang adalah 31 hari");
      }

      // If we still have immediate setDate (legacy)
      if (days < 31 && setDate) {
        const fromStr = format(selectedRange.from, 'dd/MM/yyyy');
        const toStr = format(selectedRange.to, 'dd/MM/yyyy');
        setDate({ start: fromStr, end: toStr });
      }
    }
  };

  const handleSaveClick = () => {
    if (range?.from && range.to && !error) {
      onSave?.({
        start: format(range.from, 'dd/MM/yyyy'),
        end: format(range.to, 'dd/MM/yyyy')
      });
    }
  };

  return (
    <div className={className || "flex flex-col items-center space-y-4 p-6 bg-white shadow rounded-xl w-fit mx-auto"}>
      {showHeader && <h2 className="text-lg font-semibold text-center">Select Date Range</h2>}

      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        numberOfMonths={1}
        pagedNavigation
        defaultMonth={range?.from}
      />

      {error && (
        <p className="text-red-500 text-sm font-medium animate-bounce">
          {error}
        </p>
      )}

      {(onSave || onCancel) && (
        <div className="flex justify-end gap-3 w-full pt-4 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          {onSave && (
            <button
              type="button"
              disabled={!!error || !range?.from || !range?.to}
              onClick={handleSaveClick}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Simpan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
