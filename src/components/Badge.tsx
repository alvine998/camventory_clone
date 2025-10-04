import React from "react";

interface BadgeProps {
  color?: "available" | "empty" | "custom" | "warning";
  text: string;
  children?: React.ReactNode;
}

export default function Badge({
  color = "available",
  text,
  children,
}: BadgeProps) {
  return (
    <div
      className={
        color == "available"
          ? "py-1 px-2 bg-green-100 border border-green-500 rounded"
          : color == "empty"
          ? "py-1 px-2 bg-red-100 border border-red-500 rounded"
          : color == "warning"
          ? "py-1 px-2 bg-yellow-100 border border-yellow-500 rounded"
          : "bg-orange-100 py-1 px-2 border border-orange-500 rounded"
      }
    >
      {color === "available" ? (
        <p
          className={`text-xs ${
            color === "available" ? "text-green-500" : "text-orange-500"
          } `}
        >
          {text}
        </p>
      ) : (
        <div className="text-xs">{children}</div>
      )}
    </div>
  );
}
