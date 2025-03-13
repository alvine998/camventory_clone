import Image from "next/image";
import { usePathname } from "next/navigation";
import React from "react";

interface Props {
  isWide: boolean;
  setIsWide: any;
}

export default function Topbar({ isWide, setIsWide }: Props) {
  const pathname = usePathname();
  return (
    <div className="px-6 py-6 flex flex-row justify-between bg-white shadow">
      <div className="flex gap-4 items-center">
        <button
          type="button"
          onClick={() => {
            setIsWide(!isWide);
          }}
          className="p-1 bg-gray-200 rounded"
        >
          <Image
            alt={"icon"}
            src={`/icons/chevron-left-double.svg`}
            className={`w-auto h-auto duration-200 transition-all ${
              isWide ? "" : "rotate-180"
            }`}
            layout="relative"
            width={5}
            height={5}
          />
        </button>
        <h2 className="font-bold text-xl uppercase">
          {pathname.split("/")[2]}
        </h2>
      </div>
      <div className="flex items-center gap-4 border-l-2 border-l-gray-500 pl-6 cursor-pointer">
        <Image
          alt={"photo"}
          src={`/images/default-photo.svg`}
          className={`w-auto h-auto duration-200 transition-all rounded-full`}
          layout="relative"
          width={40}
          height={40}
        />
        <div>
          <h5 className="text-gray-500 text-sm">Welcome</h5>
          <h5 className="font-bold text-sm">Ricky Abdullah</h5>
        </div>
      </div>
    </div>
  );
}
