import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { EyeIcon, PencilLineIcon, TrashIcon } from "lucide-react";

/**
 * Example usage of shadcn/ui Tooltip component
 * 
 * Features:
 * - Powered by Radix UI
 * - Accessible and keyboard navigation
 * - Smooth animations
 * - Multiple positioning options
 * - Customizable styling
 */

export default function TooltipExample() {
  return (
    <TooltipProvider>
      <div className="p-8 space-y-8">
        <h1 className="text-2xl font-bold">shadcn/ui Tooltip Examples</h1>
        
        {/* Basic Tooltip */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Basic Tooltip</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Hover me
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a basic tooltip</p>
            </TooltipContent>
          </Tooltip>
        </section>

        {/* With Icons */}
        <section>
          <h2 className="text-lg font-semibold mb-4">With Icons</h2>
          <div className="flex gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 bg-orange-200 text-orange-500 rounded hover:bg-orange-300">
                  <EyeIcon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View details</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 bg-blue-200 text-blue-500 rounded hover:bg-blue-300">
                  <PencilLineIcon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit item</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 bg-red-200 text-red-500 rounded hover:bg-red-300">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete item</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </section>

        {/* Different Positions */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Different Positions</h2>
          <div className="flex gap-4 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="px-4 py-2 bg-blue-500 text-white rounded">Top</button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Tooltip on top</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="px-4 py-2 bg-green-500 text-white rounded">Bottom</button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Tooltip on bottom</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="px-4 py-2 bg-yellow-500 text-white rounded">Left</button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Tooltip on left</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="px-4 py-2 bg-red-500 text-white rounded">Right</button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Tooltip on right</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </section>

        {/* Custom Styling */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Custom Styling</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="px-4 py-2 bg-gray-500 text-white rounded">Custom Style</button>
            </TooltipTrigger>
            <TooltipContent className="bg-gradient-to-r from-purple-500 to-pink-500 border-none">
              <p className="text-white font-bold">Custom styled tooltip</p>
            </TooltipContent>
          </Tooltip>
        </section>

        {/* With Delay */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Delay</h2>
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <button className="px-4 py-2 bg-indigo-500 text-white rounded">Delayed (500ms)</button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delayed tooltip</p>
            </TooltipContent>
          </Tooltip>
        </section>
      </div>
    </TooltipProvider>
  );
}

