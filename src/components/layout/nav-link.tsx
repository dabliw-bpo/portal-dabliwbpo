"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  label,
  exact = false,
}: {
  href: string;
  label: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`border-b-2 pb-0.5 text-sm transition-colors ${
        isActive
          ? "border-[#6e5a35] font-medium text-slate-900"
          : "border-transparent text-slate-600 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}
