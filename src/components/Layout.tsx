import React, { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import { NAVIGATIONS, OFFICE_NAVIGATIONS } from "@/constants/navigation";
import Head from "next/head";
import Topbar from "./Topbar";
import MobileMenu from "./MobileMenu";
import { usePathname } from "next/navigation";
import { TooltipProvider } from "./ui/tooltip";

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const [isWide, setIsWide] = useState<boolean>(true);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const pathname = usePathname();
  return (
    <TooltipProvider>
      <div>
        <Head>
          <title>Camventory</title>
        </Head>
        <div className="flex flex-row max-h-screen h-screen overflow-hidden">
        <div
          className={`bg-black ${
            isWide ? "w-1/4" : "w-[90px]"
          } h-screen duration-300 transition-all lg:block hidden overflow-y-auto`}
        >
          <Sidebar
            navigations={
              pathname?.includes("/office") ? OFFICE_NAVIGATIONS : NAVIGATIONS
            }
            isWide={isWide}
          />
        </div>
        <div className="w-full flex flex-col h-full overflow-y-auto">
          <Topbar
            isWide={isWide}
            setIsWide={setIsWide}
            setShowMenu={setShowMenu}
            showMenu={showMenu}
          />

          <div className="lg:hidden block">
            <MobileMenu
              navigations={
                pathname?.includes("/office") ? OFFICE_NAVIGATIONS : NAVIGATIONS
              }
              showMenu={showMenu}
              setShowMenu={setShowMenu}
            />
          </div>

          <main className="p-4 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
