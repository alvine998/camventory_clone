
interface ToggleProps {
    value: boolean;
    setValue: (value: boolean) => void;
}

export default function Toggle({setValue, value}: ToggleProps) {

  return (
    <button
      onClick={() => setValue(!value)}
      className={`w-12 h-6 rounded-full p-1 transition duration-300 ease-in-out
        ${value ? "bg-orange-500" : "bg-gray-300"}`}
    >
      <div
        className={`w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out
          ${value ? "translate-x-6 bg-white" : "translate-x-0 bg-orange-500"}`}
      ></div>
    </button>
  );
}
