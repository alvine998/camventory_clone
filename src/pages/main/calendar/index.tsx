import { FilterIcon } from "lucide-react";
import React from "react";

export default function DashboardPage() {
  return (
    <div>
      <div className="flex lg:flex-row flex-col gap-2 items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <button className="py-1 px-3 bg-white rounded border-2 border-gray-500 flex items-center hover:bg-gray-200 duration-200 transition-all">
          <FilterIcon className="w-4 h-4" />
          <p className="text-xs">Filter</p>
        </button>
      </div>
    </div>
  );
}
