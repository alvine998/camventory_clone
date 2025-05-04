import React from "react";
import ReactSelect, { MultiValue, SingleValue } from "react-select";

interface OptionType {
  value: string | number;
  label: string;
}

interface SelectComponentProps {
  options: OptionType[];
  value?: OptionType | null;
  onChange?: (
    selectedOption: MultiValue<OptionType> | SingleValue<OptionType>
  ) => void;
  placeholder?: string;
  isMulti?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  label?: string;
  required?: boolean;
  name?: string;
  defaultValue?: any;
  fullWidth?: boolean;
}

const Select: React.FC<SelectComponentProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  isMulti = false,
  isClearable = true,
  isDisabled = false,
  label,
  required = false,
  name,
  defaultValue,
  fullWidth = false,
}) => {
  return (
    <div className={`flex flex-col ${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label className="mb-1 text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <ReactSelect
        options={options}
        value={value}
        onChange={(selectedOption) => {
          if (onChange) {
            onChange(selectedOption);
          }
        }}
        placeholder={placeholder}
        isMulti={isMulti}
        isClearable={isClearable}
        isDisabled={isDisabled}
        className={"w-full text-xs"}
        classNamePrefix="custom-select"
        name={name}
        defaultValue={
          defaultValue &&
          options.find((option) => option.value === defaultValue)
        }
      />
    </div>
  );
};

export default Select;
