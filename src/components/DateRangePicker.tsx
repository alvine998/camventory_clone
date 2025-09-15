"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface Props {
  date: any;
  setDate: (date: any) => void;
}

export default function DateRangePicker({ date, setDate }: Props) {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(date?.start) || new Date(),
    to: new Date(date?.end) || new Date(),
  });

  useEffect(() => {
    if (range?.from && range?.to) {
      setDate({
        start: format(range.from, "DD/MM/YYYY"),
        end: format(range.to, "DD/MM/YYYY"),
      });
    }
  }, [range]);

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white shadow rounded-xl w-fit mx-auto">
      <h2 className="text-lg font-semibold">Pilih Rentang Tanggal</h2>

      <DayPicker
        mode="range"
        selected={range}
        onSelect={setRange}
        numberOfMonths={1}
        pagedNavigation
      />

      <div className="text-sm text-gray-600">
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
      </div>
    </div>
  );
}
