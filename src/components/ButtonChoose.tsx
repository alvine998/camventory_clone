import React from "react";

interface ButtonChooseProps {
  label?: string;
  value: string;
  description?: string;
  checked?: boolean;
  onClick?: () => void;
}

interface Props {
  options: ButtonChooseProps[];
}
export default function ButtonChoose({ options }: Props) {
  return (
    <div className="flex md:flex-row flex-col gap-4">
      {options.map((option, index) => (
        <div key={index}>
          <button
            onClick={option.onClick}
            className="bg-transparent border border-gray-300 rounded px-2 py-2 flex items-center justify-center gap-4"
          >
            <div
              className={`border-4 ${
                option.checked
                  ? "border-gray-300 bg-orange-500"
                  : "border-gray-300 bg-white"
              } rounded-full p-1`}
            ></div>
            <p className="text-xs">{option.label}</p>
          </button>
          <p className="text-xs text-gray-500 mt-2">{option.description}</p>
        </div>
      ))}
    </div>
  );
}
