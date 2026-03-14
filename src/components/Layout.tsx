import React, { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import { NAVIGATIONS, OFFICE_NAVIGATIONS } from "@/constants/navigation";
import Head from "next/head";
import Topbar from "./Topbar";
import MobileMenu from "./MobileMenu";
import { usePathname } from "next/navigation";
import { TooltipProvider } from "./ui/tooltip";
import { NotificationData } from "@/types/notification";
import { useAuthStore } from "@/stores/useAuthStore";

interface Props {
  children: ReactNode;
  notifications?: NotificationData[];
  unreadNotifications?: NotificationData[];
}

export default function Layout({
  children,
  notifications,
  unreadNotifications,
}: Props) {
  const [isWide, setIsWide] = useState<boolean>(true);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const pathname = usePathname();
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();

  const filterNavigations = (navs: typeof NAVIGATIONS) => {
    return navs.filter((nav) => {
      const title = nav.title.toLowerCase();
      if (role === "admin") return true;
      if (role === "kepala staff" || role === "kepala_staff") {
        return ["dashboard", "calendar", "reservation", "customers", "items"].includes(title);
      }
      if (role === "staff") {

        return ["dashboard", "calendar", "reservation", "customers"].includes(title);
      }
      return false;
    });
  };

  const currentNavigations = pathname?.includes("/office") ? OFFICE_NAVIGATIONS : NAVIGATIONS;
  const filteredNavigations = filterNavigations(currentNavigations);

  return (
    <TooltipProvider>
      <div>
        <Head>
          <title>Camventory</title>
        </Head>
        <div className="flex flex-row max-h-screen h-screen overflow-hidden">
          <div
            className={`bg-black ${isWide ? "w-1/4" : "w-[90px]"
              } h-screen duration-300 transition-all lg:block hidden overflow-y-auto`}
          >
            <Sidebar
              navigations={filteredNavigations}
              isWide={isWide}
            />
          </div>
          <div className="w-full flex flex-col h-full overflow-y-auto">
            <Topbar
              isWide={isWide}
              setIsWide={setIsWide}
              setShowMenu={setShowMenu}
              showMenu={showMenu}
              notifications={notifications}
              unreadNotifications={unreadNotifications}
            />

            <div className="lg:hidden block">
              <MobileMenu
                navigations={filteredNavigations}
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

