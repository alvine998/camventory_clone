import Layout from "@/components/Layout";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();

  useEffect(() => {
    setCurrentPath(router.pathname); // Update after component mounts
  }, [router.pathname]);

  useEffect(() => {
    if (!currentPath || !role) return;

    const isAllowed = (path: string) => {
      if (role === "admin") return true;

      const pathLower = path.toLowerCase();
      const commonPaths = [
        "/main/dashboard",
        "/main/calendar",
        "/main/reservation",
        "/main/customer",
      ];

      // Check common paths
      if (commonPaths.some((p) => pathLower.startsWith(p))) return true;

      // Kepala Staff specific
      if (role === "kepala staff" || role === "kepala_staff") {
        if (pathLower.startsWith("/main/items")) return true;
      }


      // Restrict access to other /main and /office/main paths
      if (
        pathLower.startsWith("/main") ||
        pathLower.startsWith("/office/main")
      ) {
        return false;
      }

      return true;
    };

    if (!isAllowed(currentPath)) {
      router.push("/main/dashboard");
    }
  }, [currentPath, role, router]);

  if (currentPath?.includes("/main")) {
    return (
      <Layout
        notifications={(pageProps as any).notifications}
        unreadNotifications={(pageProps as any).unreadNotifications}
      >
        <Component {...pageProps} />
      </Layout>
    );
  }
  return <Component {...pageProps} />;
}

