import Link from "next/link";
import { useRouter } from "next/router";

export default function NotFound() {
  const router = useRouter();
  const pathname = router.asPath;
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-6xl font-bold text-red-500">404</h1>
      <p className="text-2xl text-gray-600 mt-2">Page Not Found</p>
      <Link
        href={pathname?.includes("main") ? "/main/dashboard" : "/"}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg"
      >
        Go Home
      </Link>
    </div>
  );
}
