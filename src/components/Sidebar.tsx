import { INavigation } from "@/types/navigation";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface Props {
  navigations: INavigation[];
  isWide: boolean;
}

export default function Sidebar({ navigations, isWide }: Props) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  return (
    <div className="flex flex-col items-center py-6">
      <div className="p-2">
        <Image
          alt="logo"
          src={isWide ? "/images/logo.png" : "/images/logo-camera-only.svg"}
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
              href={navigation.children ? "#" : navigation.href}
              onClick={() => {
                if (navigation.children) {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              className={`${
                pathname === navigation.href
                  ? "bg-orange-500 gap-4"
                  : "bg-transparent hover:bg-orange-500 duration-200 gap-4 transition-all"
              } py-4 px-4 w-full flex items-center ${
                isWide
                  ? "justify-start rounded-full"
                  : "justify-center rounded-xl"
              }`}
            >
              <Image
                alt={navigation.title}
                src={`${navigation.icon}`}
                className="w-auto h-auto"
                layout="relative"
                width={5}
                height={5}
              />
              {isWide ? (
                <div>
                  <p className="text-white">{navigation.title}</p>
                </div>
              ) : (
                ""
              )}
              {navigation.children && (
                <div className="ml-auto">
                  <ChevronDown
                    className={`w-4 h-4 text-white ${
                      isDropdownOpen ? "rotate-180" : ""
                    } duration-150 transition-all`}
                  />
                </div>
              )}
            </Link>
            {navigation.children && isDropdownOpen && (
              <div className="mt-2 border-l border-gray-300 ml-4 pl-2">
                {navigation.children.map((child, index) => (
                  <Link
                    href={child.href}
                    key={index}
                    className={`${
                      pathname === child.href
                        ? "bg-orange-500 gap-4"
                        : "bg-transparent hover:bg-orange-500 duration-200 gap-4 transition-all"
                    } py-4 px-4 w-full flex items-center ${
                      isWide
                        ? "justify-start rounded-full"
                        : "justify-center rounded-xl"
                    }`}
                  >
                    <p className="text-white">{child.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
