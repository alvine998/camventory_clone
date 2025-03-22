import Layout from "@/components/Layout";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  useEffect(() => {
    setCurrentPath(pathname); // Update after component mounts
  }, [pathname]);
  if (currentPath?.includes("/main")) {
    return <Layout>{<Component {...pageProps} />}</Layout>;
  }
  return <Component {...pageProps} />;
}
