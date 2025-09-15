export interface INavigation {
  title: string;
  href: string;
  icon: string;
  children?: { title: string; href: string }[];
}
