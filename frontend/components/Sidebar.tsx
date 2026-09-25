"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import BrandRings from "@/components/BrandRings";

export interface SubMenuItem {
  name: string;
  path: string;
  activeAliases?: string[];
}

export interface MenuItem {
  name: string;
  icon: string;
  path?: string;
  hasSubmenu: boolean;
  submenu?: SubMenuItem[];
  permission?: string;
  activeAliases?: string[];
}

interface SidebarProps {
  menuItems: MenuItem[];
  logoSrc?: string;
}

function iconClass(active: boolean) {
  return active
    ? "brightness-0 invert-[44%] sepia-[96%] saturate-[1518%] hue-rotate-[189deg] dark:invert dark:sepia-0 dark:saturate-100 dark:hue-rotate-0 dark:brightness-200"
    : "brightness-0 opacity-45 group-hover:opacity-80 transition-all dark:invert dark:opacity-80";
}

export default function Sidebar({ menuItems, logoSrc = "/Assets/Logo-helphin-biru.png" }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [collapsed, setCollapsed] = useState(false);

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const isActive = (path?: string, aliases?: string[]) => {
    if (!path) return false;
    if (pathname === path || pathname.startsWith(path + "/")) return true;
    if (aliases && aliases.some((alias) => pathname.startsWith(alias))) return true;
    return false;
  };

  const isSubmenuActive = (submenu?: SubMenuItem[]) => {
    if (!submenu) return false;
    return submenu.some((sub) => isActive(sub.path, sub.activeAliases));
  };

  return (
    <div
      className={`relative flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-300 ease-in-out ${
        collapsed ? "w-[78px]" : "w-64"
      }`}
    >
      <div
        data-sidebar-fill
        className="absolute inset-0 bg-white dark:bg-[#07111d] transition-colors duration-300"
      />
      <div className="absolute -bottom-10 -left-16 w-52 h-52 pointer-events-none opacity-80">
        <BrandRings tone="blue" className="w-full h-full" />
      </div>

      <div className="relative z-10 flex flex-col h-full border-r border-gray-100 dark:border-white/10">
        <div className={`flex items-center py-7 transition-all duration-300 ${collapsed ? "px-3 justify-center" : "px-5 justify-between"}`}>
          {!collapsed && (
            <Image
              data-sidebar-logo
              src={logoSrc}
              alt="Logo"
              width={130}
              height={45}
              priority
              className="object-contain dark:brightness-0 dark:invert"
            />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-[#068DFF] dark:bg-white/8 dark:hover:bg-white/15 dark:text-sky-100 dark:hover:text-white flex items-center justify-center transition-all shrink-0 border border-gray-100 dark:border-white/10"
            title={collapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="relative z-10 flex-1 px-2.5 space-y-1.5 overflow-y-auto pb-4 scrollbar-hide">
          {menuItems.map((item) => {
            if (item.hasSubmenu) {
              const activeParent = isSubmenuActive(item.submenu);

              return (
                <div key={item.name} className="group">
                  <button
                    onClick={() => (collapsed ? item.path && router.push(item.path) : toggleMenu(item.name))}
                    className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 py-2.5 rounded-2xl transition-all duration-200 relative ${
                      activeParent
                        ? "bg-blue-50 text-[#068DFF] dark:bg-white/12 dark:text-white"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    {activeParent && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#068DFF] dark:bg-sky-300 rounded-r-full" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${activeParent ? "bg-blue-100/70 dark:bg-sky-400/20" : "bg-gray-50 dark:bg-white/5"}`}>
                        <Image
                          src={item.icon}
                          alt={item.name}
                          width={20}
                          height={20}
                          priority
                          className={iconClass(activeParent)}
                        />
                      </div>
                      {!collapsed && <span className="font-semibold text-[13.5px]">{item.name}</span>}
                    </div>
                    {!collapsed &&
                      (openMenus[item.name] || activeParent ? (
                        <ChevronDown size={16} className="text-[#068DFF] dark:text-sky-300" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300" />
                      ))}
                  </button>

                  {!collapsed && (openMenus[item.name] || activeParent) && (
                    <div className="ml-8 mt-1.5 space-y-1 border-l border-gray-100 dark:border-white/10 pl-3">
                      {item.submenu?.map((sub) => (
                        <button
                          key={sub.name}
                          onClick={() => router.push(sub.path)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-200 relative ${
                            isActive(sub.path)
                              ? "bg-blue-50 text-[#068DFF] font-semibold dark:bg-[#068DFF]/20 dark:text-white"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                          }`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActive(item.path, item.activeAliases);

            return (
              <button
                key={item.name}
                onClick={() => item.path && router.push(item.path)}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 relative ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-blue-50 text-[#068DFF] dark:bg-white/12 dark:text-white"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
                }`}
                title={collapsed ? item.name : undefined}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#068DFF] dark:bg-sky-300 rounded-r-full" />
                )}
                <div className={`p-1.5 rounded-lg ${active ? "bg-blue-100/70 dark:bg-sky-400/20" : "bg-gray-50 dark:bg-white/5"}`}>
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={20}
                    height={20}
                    priority
                    className={iconClass(active)}
                  />
                </div>
                {!collapsed && <span className="font-semibold text-[13.5px]">{item.name}</span>}
              </button>
            );
          })}
        </nav>
        {!collapsed ? (
          <div className="relative z-10 px-5 py-4 border-t border-gray-100 dark:border-white/10">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
              helPhin Telkom University
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
