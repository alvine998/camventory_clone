import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./ui/tooltip";

interface TooltipComponentProps {
  content: string;
  children: React.ReactNode;
}

export default function TooltipComponent({
  content,
  children,
}: TooltipComponentProps) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex items-center justify-center">
        {children}
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
