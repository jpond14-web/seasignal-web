"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UnreadBadge } from "./unread-badge";
import { NotificationBell } from "./notification-bell";
import { GlobalSearch, SearchTrigger } from "@/components/ui/global-search";
import { LanguageSelector } from "./LanguageSelector";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge: boolean };

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon, badge: false },
  { href: "/messages", label: "Messages", icon: MessageIcon, badge: true },
  { href: "/community", label: "Community", icon: ForumIcon, badge: false },
  { href: "/intel", label: "Intel", icon: CompanyIcon, badge: false },
  { href: "/career", label: "My Career", icon: CertIcon, badge: false },
  { href: "/welfare", label: "Welfare", icon: RightsIcon, badge: false },
];

function UserAvatar({ avatarUrl, userInitial, size = 28 }: { avatarUrl?: string | null; userInitial: string; size?: number }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }
  return (
    <div
      className="rounded-full bg-navy-600 flex items-center justify-center text-xs font-medium text-slate-200 shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {userInitial}
    </div>
  );
}

function UserPillDropdown({
  userInitial,
  avatarUrl,
  collapsed,
  onSignOut,
}: {
  userInitial: string;
  avatarUrl?: string | null;
  collapsed: boolean;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close dropdown on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const menuItems = [
    { href: "/profile", label: "Profile", icon: ProfileIcon },
    { href: "/profile/edit", label: "Edit Profile", icon: EditProfileIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
    { href: "/changelog", label: "What's New", icon: ChangelogIcon },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Dropdown menu - positioned above the pill */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-navy-800 border border-navy-700 rounded-lg shadow-xl z-50 py-1 min-w-[180px]">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/profile/edit" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "text-teal-400 bg-navy-700/50"
                    : "text-slate-300 hover:text-slate-100 hover:bg-navy-700/50"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="mx-2 my-1 border-t border-navy-600" />
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Language</span>
            <LanguageSelector />
          </div>
          <div className="mx-2 my-1 border-t border-navy-600" />
          <button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-navy-700/50 transition-colors w-full text-left"
          >
            <SignOutIcon className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* User pill button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg transition-colors hover:bg-navy-800/50 ${
          open ? "bg-navy-800" : ""
        }`}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <UserAvatar avatarUrl={avatarUrl} userInitial={userInitial} size={28} />
        {!collapsed && (
          <>
            <span className="text-sm text-slate-300 truncate flex-1 text-left">{userInitial}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              className={`text-slate-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path d="M3 7.5l3-3 3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

function MobileUserDropdown({
  userInitial,
  avatarUrl,
  onSignOut,
}: {
  userInitial: string;
  avatarUrl?: string | null;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const menuItems = [
    { href: "/profile", label: "Profile", icon: ProfileIcon },
    { href: "/profile/edit", label: "Edit Profile", icon: EditProfileIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
    { href: "/changelog", label: "What's New", icon: ChangelogIcon },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-slate-400 hover:text-slate-100 p-1"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <UserAvatar avatarUrl={avatarUrl} userInitial={userInitial} size={24} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-navy-800 border border-navy-700 rounded-lg shadow-xl z-50 py-1 min-w-[180px]">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/profile/edit" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "text-teal-400 bg-navy-700/50"
                    : "text-slate-300 hover:text-slate-100 hover:bg-navy-700/50"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="mx-2 my-1 border-t border-navy-600" />
          <button
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-red-400 hover:bg-navy-700/50 transition-colors w-full text-left"
          >
            <SignOutIcon className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ userInitial = "U", isAdmin = false, avatarUrl }: { userInitial?: string; isAdmin?: boolean; avatarUrl?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={`hidden md:flex flex-col bg-navy-900 border-r border-navy-700 transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <GlobalSearch />
      <div className="flex items-center gap-2 px-4 h-14 border-b border-navy-700">
        <Link href="/home" className="flex items-center gap-2 min-w-0">
          <span className="text-teal-500 font-bold text-lg shrink-0">⚓</span>
          {!collapsed && (
            <span className="font-bold text-slate-100 truncate">SeaSignal</span>
          )}
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <SearchTrigger collapsed={collapsed} />
          <NotificationBell />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-100 shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            {collapsed ? (
              <path d="M6 3l5 5-5 5V3z" />
            ) : (
              <path d="M10 3L5 8l5 5V3z" />
            )}
          </svg>
          </button>
        </div>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset rounded ${
                isActive
                  ? "text-teal-400 bg-navy-800"
                  : "text-slate-400 hover:text-slate-100 hover:bg-navy-800/50"
              }`}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {item.badge && <UnreadBadge />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-navy-700 p-2 flex flex-col gap-0.5">
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-2 py-2 text-sm transition-colors rounded focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset ${
              pathname.startsWith("/admin")
                ? "text-teal-400 bg-navy-800"
                : "text-slate-400 hover:text-slate-100 hover:bg-navy-800/50"
            }`}
            title={collapsed ? "Admin" : undefined}
            aria-label="Admin"
          >
            <AdminIcon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
        <UserPillDropdown
          userInitial={userInitial}
          avatarUrl={avatarUrl}
          collapsed={collapsed}
          onSignOut={handleSignOut}
        />
      </div>
    </aside>
  );
}

export function MobileNav({ userInitial = "U", isAdmin = false, avatarUrl }: { userInitial?: string; isAdmin?: boolean; avatarUrl?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <GlobalSearch />
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-navy-900 border-b border-navy-700">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-teal-500 font-bold text-lg">⚓</span>
          <span className="font-bold text-slate-100">SeaSignal</span>
        </Link>
        <div className="flex items-center gap-2">
          <SearchTrigger />
          <NotificationBell />
          <MobileUserDropdown
            userInitial={userInitial}
            avatarUrl={avatarUrl}
            onSignOut={handleSignOut}
          />
          <button
            onClick={() => setOpen(!open)}
            className="text-slate-400 hover:text-slate-100"
            aria-label="Toggle menu"
          >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          </button>
        </div>
      </header>
      {open && (
        <div className="md:hidden fixed inset-0 top-14 z-50 bg-navy-950/95 backdrop-blur-sm">
          <nav className="flex flex-col p-4 gap-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors ${
                    isActive
                      ? "text-teal-400 bg-navy-800"
                      : "text-slate-300 hover:bg-navy-800/50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && <UnreadBadge />}
                </Link>
              );
            })}
            {isAdmin && (
              <>
                <hr className="border-navy-700 my-2" />
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname.startsWith("/admin")
                      ? "text-teal-400 bg-navy-800"
                      : "text-slate-300 hover:bg-navy-800/50"
                  }`}
                >
                  <AdminIcon className="w-5 h-5" />
                  <span>Admin</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

// Simple SVG icons
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm8 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function CompanyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
    </svg>
  );
}

function VesselIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 14s1 3 7 3 7-3 7-3H3zm7-12l-3 8h6L10 2z" />
    </svg>
  );
}

function PayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
    </svg>
  );
}

function CertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
    </svg>
  );
}

function ForumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
    </svg>
  );
}

function IncidentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}

function RightsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.062 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
    </svg>
  );
}

function SeafarersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  );
}

function JobsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
    </svg>
  );
}

function NotificationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
  );
}

function AgencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.97 5.97 0 00-.75-2.906A3.005 3.005 0 0119 17v1h-3zM1 17v1h3v-1a5.97 5.97 0 01.75-2.906A3.005 3.005 0 001 17z" />
    </svg>
  );
}

function SeaTimeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  );
}

function ContractCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h5a1 1 0 100-2H4V5h4a1 1 0 100-2H3zm11.707 4.293a1 1 0 00-1.414 1.414L14.586 10l-1.293 1.293a1 1 0 001.414 1.414l2-2a1 1 0 000-1.414l-2-2z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M7 10a1 1 0 011-1h8a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function ChangelogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 2a1 1 0 00-1 1v1h12V3a1 1 0 00-1-1H5z" />
      <path fillRule="evenodd" d="M4 6v11a2 2 0 002 2h8a2 2 0 002-2V6H4zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );
}

function EditProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}
