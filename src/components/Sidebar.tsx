import { INavigation } from "@/types/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface Props {
  navigations: INavigation[];
  isWide: boolean;
}

export default function Sidebar({ navigations, isWide }: Props) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col items-center py-6">
      <div className="p-2">
        <Image
          alt="logo"
          src={ isWide ? "/images/logo.png" : "/images/logo-camera-only.svg"}
          className={isWide ? "w-auto h-auto" : "w-7 h-7"}
          layout="relative"
          width={isWide ? 170 : 50}
          height={isWide ? 25 : 50}
        />
      </div>
      <div className="py-5 px-4 mt-5 w-full border-t-2 border-t-white">
        {navigations.map((navigation, index) => (
          <div key={index} className="my-2">
            <Link
              href={navigation.href}
              className={`${
                pathname === navigation.href
                  ? "bg-orange-500 gap-4"
                  : "bg-transparent hover:bg-orange-500 duration-200 gap-4 transition-all"
              } py-4 px-4 w-full flex items-center ${isWide ? "justify-start rounded-full" : "justify-center rounded-xl"}`}
            >
              <Image
                alt={navigation.title}
                src={`${navigation.icon}`}
                className="w-auto h-auto"
                layout="relative"
                width={5}
                height={5}
              />
              {isWide ? <p className="text-white">{navigation.title}</p> : ""}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
