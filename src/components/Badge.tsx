import React from "react";

interface BadgeProps {
  color?: "available" | "empty" | "custom" | "warning" | "freeze";
  text: string;
  children?: React.ReactNode;
}

export default function Badge({
  color = "available",
  text,
}: BadgeProps) {
  return (
    <div
      className={`py-1 px-4 rounded-full border text-[11px] font-bold w-full max-w-[100px] flex items-center justify-center ${color === "available"
        ? "bg-green-50 border-green-500 text-green-600"
        : color === "empty"
          ? "bg-red-50 border-red-500 text-red-600"
          : color === "warning"
            ? "bg-yellow-50 border-yellow-500 text-yellow-600"
            : color === "freeze"
              ? "bg-blue-50 border-blue-400 text-blue-500"
              : "bg-orange-50 border-orange-500 text-orange-600"
        }`}
    >
      {text}
    </div>
  );
}
