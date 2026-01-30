import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/utils";

interface DropdownOption {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
}

interface DropdownProps {
    label: string;
    options: DropdownOption[];
    triggerIcon?: React.ReactNode;
    className?: string;
    buttonClassName?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
    label,
    options,
    triggerIcon,
    className,
    buttonClassName,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
            <div>
                <button
                    type="button"
                    className={cn(
                        "flex items-center gap-1 px-4 py-2 bg-[#F37021] text-white rounded-md hover:bg-orange-600 transition-colors text-xs font-medium",
                        buttonClassName
                    )}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {triggerIcon}
                    <span>{label}</span>
                    <ChevronDownIcon className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 border border-gray-100">
                    {options.map((option, index) => (
                        <button
                            key={index}
                            className="flex w-full items-center px-4 py-2 text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors gap-2"
                            onClick={() => {
                                option.onClick();
                                setIsOpen(false);
                            }}
                        >
                            {option.icon}
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
