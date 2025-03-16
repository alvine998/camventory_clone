import Layout from "@/components/Layout";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHydrated(true);
    }
  }, []);
  if (pathname?.includes("/main") && isHydrated) {
    return <Layout>{<Component {...pageProps} />}</Layout>;
  }
  return <Component {...pageProps} />;
}
