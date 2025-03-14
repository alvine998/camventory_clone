import React, { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import { NAVIGATIONS } from "@/constants/navigation";
import Head from "next/head";
import Topbar from "./Topbar";
import MobileMenu from "./MobileMenu";

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const [isWide, setIsWide] = useState<boolean>(true);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  return (
    <div>
      <Head>
        <title>Camventory</title>
      </Head>
      <div className="flex flex-row h-screen">
        <div
          className={`bg-black ${
            isWide ? "w-1/4" : "w-[90px]"
          } h-screen duration-300 transition-all lg:block hidden`}
        >
          <Sidebar navigations={NAVIGATIONS} isWide={isWide} />
        </div>
        <div className="w-full">
          <Topbar
            isWide={isWide}
            setIsWide={setIsWide}
            setShowMenu={setShowMenu}
            showMenu={showMenu}
          />

          <div className="lg:hidden block">
            <MobileMenu navigations={NAVIGATIONS} showMenu={showMenu} setShowMenu={setShowMenu} />
          </div>

          <main className="p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
