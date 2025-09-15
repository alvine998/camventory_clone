export const NAVIGATIONS = [
  {
    title: "Dashboard",
    href: "/main/dashboard",
    icon: "/icons/graph.svg",
  },
  {
    title: "Calendar",
    href: "/main/calendar",
    icon: "/icons/calendar.svg",
  },
  {
    title: "Reservation",
    href: "/main/reservation",
    icon: "/icons/box-tick.svg",
  },
  {
    title: "Check Out",
    href: "/main/check-out",
    icon: "/icons/shopping-cart.svg",
  },
  {
    title: "Category Items",
    href: "/main/category",
    icon: "/icons/box.svg",
  },
  {
    title: "Items",
    href: "/main/items",
    icon: "/icons/box2.svg",
  },
  {
    title: "Customers",
    href: "/main/customer",
    icon: "/icons/people.svg",
  },
  {
    title: "Reports",
    href: "/main/report",
    icon: "/icons/document-text.svg",
    children: [
      {
        title: "Sales Summary",
        href: "/main/report/sales-summary",
      },
      {
        title: "Sales Trend",
        href: "/main/report/sales-trend",
      },
      {
        title: "Sales Report per Category",
        href: "/main/report/sales-category",
      },
      {
        title: "Sales Report per Product",
        href: "/main/report/sales-product",
      },
      {
        title: "Sales Report per Brand",
        href: "/main/report/sales-brand",
      },
      {
        title: "Sales Report per Customer",
        href: "/main/report/sales-customer",
      },
    ],
  },
];

export const OFFICE_NAVIGATIONS = [
  {
    title: "Administrator",
    href: "/office/main/administrator",
    icon: "/icons/graph.svg",
  },
];
