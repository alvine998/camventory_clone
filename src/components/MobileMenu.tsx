import { INavigation } from "@/types/navigation";
import { ChevronDown, XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

interface Props {
  navigations: INavigation[];
  showMenu: boolean;
  setShowMenu: (any: boolean) => void;
}

export default function MobileMenu({
  navigations,
  showMenu,
  setShowMenu,
}: Props) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  return (
    <div
      className={`fixed top-0 left-0 z-[100] w-full h-full will-change-transform bg-gray-800 text-white p-6 shadow-lg transform transition-transform duration-500 ease-in-out ${
        showMenu ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex justify-between items-center">
        <Image
          alt="logo"
          src={"/images/logo.png"}
          className={"w-auto h-auto"}
          layout="relative"
          width={170}
          height={25}
        />
        <button type="button" onClick={() => setShowMenu(false)}>
          <XIcon className="w-6 h-6 text-white" />
        </button>
      </div>
      <div className="py-5 px-4 mt-5 w-full border-t-2 border-t-white overflow-y-auto max-h-[calc(100vh-100px)]">
        {navigations.map((navigation, index) => (
          <div key={index} className="my-2">
            <Link
              href={navigation.children ? "#" : navigation.href}
              onClick={() => {
                if (navigation.children) {
                  setIsDropdownOpen(!isDropdownOpen);
                } else {
                  setShowMenu(false);
                }
              }}
              className={`${
                pathname === navigation.href
                  ? "bg-orange-500 gap-4"
                  : "bg-transparent hover:bg-orange-500 duration-200 gap-4 transition-all"
              } py-4 px-4 w-full flex items-center justify-start rounded-full`}
            >
              <Image
                alt={navigation.title}
                src={`${navigation.icon}`}
                className="w-auto h-auto"
                layout="relative"
                width={5}
                height={5}
              />
              <p className="text-white">{navigation.title}</p>
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
                {navigation.children.map((child, childIndex) => (
                  <Link
                    href={child.href}
                    key={childIndex}
                    onClick={() => setShowMenu(false)}
                    className={`${
                      pathname === child.href
                        ? "bg-orange-500 gap-4"
                        : "bg-transparent hover:bg-orange-500 duration-200 gap-4 transition-all"
                    } py-4 px-4 w-full flex items-center justify-start rounded-full mb-2`}
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
