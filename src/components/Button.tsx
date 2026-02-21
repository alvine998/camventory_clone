import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "secondary"
  | "white"
  | "submit"
  | "custom-color";
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className,
  children,
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 transition duration-300";

  const variantStyles: Record<string, string> = {
    primary:
      "bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-blue-300 text-xs",
    success:
      "bg-green-500 text-white rounded hover:bg-green-600 focus:ring-green-300 text-xs",
    warning:
      "bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:ring-yellow-300 text-xs",
    danger:
      "bg-red-500 text-white rounded hover:bg-red-600 focus:ring-red-300 text-xs",
    secondary:
      "bg-gray-500 text-white rounded hover:bg-gray-600 focus:ring-gray-300 text-xs",
    white:
      "bg-white text-gray-900 rounded border border-gray-300 hover:bg-gray-100 focus:ring-gray-200 text-xs",
    "custom-color": "rounded text-xs",
    submit:
      "bg-orange-500 text-white rounded hover:bg-orange-600 focus:ring-orange-300 text-xs",
    customColor:
      "bg-white text-gray-900 rounded border border-gray-300 hover:bg-gray-100 focus:ring-gray-200 text-xs",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${(disabled || isLoading) ? "opacity-50 cursor-not-allowed" : ""
        }`}
      disabled={disabled || isLoading}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {isLoading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </div>
    </button>
  );
};

export default Button;
