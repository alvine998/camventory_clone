import React from "react";

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
      <ol className="list-reset flex">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href ? (
              <a
                href={item.href}
                className={`hover:underline ${items[items.length - 1].label === item.label ? "font-bold text-orange-500" : "text-black"}`}
              >
                {item.label}
              </a>
            ) : (
              <span>{item.label}</span>
            )}
            {index < items.length - 1 && (
              <svg
                className="w-3 h-3 mx-2 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M7.05 4.05a1 1 0 011.414 0L13.414 9a1 1 0 010 1.414l-4.95 4.95a1 1 0 11-1.414-1.414L10.586 10 7.05 6.464a1 1 0 010-1.414z" />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
