import React from "react";
import { X } from "lucide-react";

interface FilterPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onReset: () => void;
    className?: string;
}

const FilterPopup: React.FC<FilterPopupProps> = ({
    isOpen,
    onClose,
    onReset,
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

            </div>
        </div>
    );
};

export default FilterPopup;
