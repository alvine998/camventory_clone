import React from "react";
import { X } from "lucide-react";

interface FilterPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onReset: () => void;
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    className?: string;
}

const FilterPopup: React.FC<FilterPopupProps> = ({
    isOpen,
    onClose,
    onReset,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    className,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className={`absolute top-full right-0 mt-2 max-w-3xl bg-white rounded-lg shadow-xl border border-gray-200 z-50 ${className}`}
        >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-orange-500">Filter</h3>
                <button onClick={onClose} className="text-red-500 hover:text-red-700">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4">
                <div className="flex justify-end">
                    <button
                        onClick={onReset}
                        className="text-sm font-bold text-red-500 hover:text-red-700"
                    >
                        Reset
                    </button>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From:
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => onStartDateChange(e.target.value)}
                                className="w-full pl-3 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            To:
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => onEndDateChange(e.target.value)}
                                className="w-full pl-3 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterPopup;
