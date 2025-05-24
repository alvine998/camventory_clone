import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";

interface Props {
  isWide: boolean;
  setIsWide: (any: boolean) => void;
  showMenu: boolean;
  setShowMenu: (any: boolean) => void;
}

export default function Topbar({
  isWide,
  setIsWide,
  showMenu,
  setShowMenu,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user } = useAuthStore();

  const handleLogout = async (e: any) => {
    e.preventDefault();
    try {
      await axios.post("/api/office/auth/logout");
      return router.push(pathname?.includes("office") ? "/office/login" : "/");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="px-6 py-6 flex flex-row justify-between bg-white shadow">
      <div className="flex gap-4 items-center">
        <button
          type="button"
          onClick={() => {
            setIsWide(!isWide);
          }}
          className="p-1 bg-gray-200 rounded lg:block hidden"
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
        <h2 className="font-bold lg:text-xl text-md uppercase text-black">
          {pathname?.split("/")[2] || ""}
        </h2>
      </div>

      {/* Profile Only Desktop */}
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
          }}
          className="lg:flex items-center gap-4 border-l-2 border-l-gray-500 pl-6 hidden "
        >
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
            <h5 className="font-bold text-sm uppercase">{user?.email?.split("@")[0]}</h5>
          </div>

          <div
            className={`absolute mt-24 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-10 right-0 transform duration-150 transition-all ease-in-out ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            <ul className="py-0">
              <li
                onClick={handleLogout}
                className="px-4 py-2 hover:bg-red-600 bg-red-500 text-white rounded cursor-pointer text-center"
              >
                Logout
              </li>
            </ul>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className="lg:hidden block">
        <button type="button" onClick={() => setShowMenu(!showMenu)}>
          <MenuIcon className="text-black" />
        </button>
      </div>
    </div>
  );
}
