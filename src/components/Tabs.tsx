// components/Tabs.tsx
import Link from "next/link";
import { useRouter } from "next/router";

export type Tab = {
  label: string;
  href: string;
};

interface TabsProps {
  tabs: Tab[];
}

export default function Tabs({ tabs }: TabsProps) {
  const router = useRouter();

  return (
    <div className="flex space-x-4 border-b border-gray-300">
      {tabs.map((tab) => {
        const isActive = router.asPath === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 font-medium border-b-2 transition-all duration-200 text-xs ${
              isActive
                ? "border-orange-500 text-orange-600 bg-gradient-to-b from-white via-orange-100 to-orange-200"
                : "border-transparent text-gray-900 hover:border-orange-500 hover:text-orange-500 hover:bg-gradient-to-b hover:from-white hover:via-orange-100 hover:to-orange-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
