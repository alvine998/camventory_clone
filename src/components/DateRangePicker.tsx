"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DateRangeType {
  from: Date;
  to: Date;
}

interface Props {
  date: {
    start: Date | string;
    end: Date | string;
  };
  setDate: (date: { start: string; end: string }) => void;
  showHeader?: boolean;
  className?: string;
}

export default function DateRangePicker({
  date,
  setDate,
  showHeader = true,
  className
}: Props) {
  const [range, setRange] = useState<DateRangeType>({
    from: date?.start ? (date.start instanceof Date ? date.start : new Date(date.start)) : (null as any),
    to: date?.end ? (date.end instanceof Date ? date.end : new Date(date.end)) : (null as any),
  });

  // Sync internal range with props (especially for reset)
  useEffect(() => {
    if (!date?.start && !date?.end) {
      setRange({ from: (null as any), to: (null as any) });
    }
  }, [date?.start, date?.end]);

  // Update parent when range changes
  useEffect(() => {
    const updateParent = () => {
      if (!range || !range.from) return;

      const from = range.from;
      const to = range.to || from;

      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        setDate({
          start: format(from, 'dd/MM/yyyy'),
          end: format(to, 'dd/MM/yyyy')
        });
      }
    };

    updateParent();
  }, [range, setDate]);

  // Handle date selection
  const handleSelect = (selectedRange: DateRange | undefined) => {
    if (!selectedRange) return;

    setRange({
      from: selectedRange.from || new Date(),
      to: selectedRange.to || selectedRange.from || new Date()
    });
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

      {/* <div className="text-sm text-gray-600">
        {range?.from && range?.to ? (
          <p>
            Dari:{" "}
            <span className="font-medium">
              {format(range.from, "dd MMM yyyy")}
            </span>{" "}
            sampai{" "}
            <span className="font-medium">
              {format(range.to, "dd MMM yyyy")}
            </span>
          </p>
        ) : (
          <p>Silakan pilih rentang tanggal</p>
        )}
      </div> */}
    </div>
  );
}
