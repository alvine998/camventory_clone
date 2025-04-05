import Layout from "@/components/Layout";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  useEffect(() => {
    setCurrentPath(router.pathname); // Update after component mounts
  }, [router.pathname]);
  if (currentPath?.includes("/main")) {
    return <Layout>{<Component {...pageProps} />}</Layout>;
  }
  return <Component {...pageProps} />;
}
