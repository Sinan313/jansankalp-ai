"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "Citizen Voice",
    href: "/citizen",
  },
  {
    name: "Citizen Requests",
    href: "/citizen-requests",
  },
  {
    name: "Public Projects",
    href: "/public-projects",
  },
  {
    name: "Development Coverage",
    href: "/development-coverage",
  },
];

export default function Navigation() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white">

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Main Header */}
        <div className="flex items-center justify-between gap-4 py-4">

          {/* Brand */}
          <Link
            href="/dashboard"
            className="min-w-0 shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <p className="text-lg font-bold text-slate-900">
              JanSankalp AI
            </p>

            <p className="text-xs text-slate-500">
              Citizen Development Intelligence
            </p>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center justify-end gap-2 md:flex">

            {links.map((link) => {
              const active =
                pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <span className="text-xl">✕</span>
            ) : (
              <span className="text-xl">☰</span>
            )}
          </button>

        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="border-t border-slate-100 pb-4 pt-3 md:hidden">

            <div className="flex flex-col gap-1">

              {links.map((link) => {
                const active =
                  pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

            </div>

          </div>
        )}

      </div>

    </nav>
  );
}