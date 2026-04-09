import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardList,
  Layers,
  GitBranch,
  Radio,
  Menu,
  X,
} from "lucide-react";

export type PageId =
  | "dashboard"
  | "customer-orders"
  | "jobs"
  | "stations"
  | "pipelines";

interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Operations",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "customer-orders", label: "Customer Orders", icon: ClipboardList },
      { id: "jobs", label: "Jobs", icon: Layers },
    ],
  },
  {
    label: "Configuration",
    items: [
      { id: "pipelines", label: "Pipelines", icon: GitBranch },
      { id: "stations", label: "Stations", icon: Radio },
    ],
  },
];

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

function LogoDots(): React.JSX.Element {
  return (
    <div className="flex w-full items-center" aria-hidden>
      <div className="size-[6px] shrink-0 rounded-full bg-[var(--logo-dot-teal)]" />
      <div className="h-[1.5px] flex-1 rounded-[1px] bg-[var(--logo-connector)]" />
      <div className="size-[6px] shrink-0 rounded-full bg-[var(--logo-dot-teal)]" />
      <div className="h-[1.5px] flex-1 rounded-[1px] bg-[var(--logo-connector)]" />
      <div className="size-[6px] shrink-0 rounded-full bg-[var(--logo-dot-orange)]" />
      <div className="h-[1.5px] flex-1 rounded-[1px] bg-[var(--logo-connector)]" />
      <div className="size-[6px] shrink-0 rounded-full bg-[var(--logo-dot-teal)]" />
    </div>
  );
}

function SidebarBrand(): React.JSX.Element {
  return (
    <div className="border-b border-sidebar-border px-[20px] pt-[20px] pb-[18px]">
      <div className="inline-flex flex-col items-stretch gap-[6px]">
        <div className="whitespace-nowrap font-heading text-[length:var(--text-logo)] font-bold uppercase leading-[1] tracking-[0.07em]">
          <span className="text-[var(--logo-manu)]">Manu</span>
          <span className="text-[var(--logo-tracker)]">Tracker</span>
        </div>
        <LogoDots />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: string }): React.JSX.Element {
  return (
    <div className="px-[20px] pb-[6px] font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-text-muted">
      {children}
    </div>
  );
}

function NavItemButton({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}): React.JSX.Element {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-[10px] border-l-[3px] px-[20px] py-[9px] text-left font-body text-[14px] transition-colors duration-[var(--duration-fast)] ${
        isActive
          ? "border-l-sidebar-active-accent bg-sidebar-active font-medium text-white"
          : "border-l-transparent text-sidebar-text hover:bg-sidebar-bg-hover hover:text-white"
      }`}
    >
      <Icon size={15} strokeWidth={1.5} className={isActive ? "opacity-100" : "opacity-65"} />
      {item.label}
    </button>
  );
}

const asideBase = [
  "fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-width)] shrink-0 flex-col overflow-y-auto",
  "bg-[image:var(--sidebar-gradient)] transition-transform",
  "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
].join(" ");

export function Sidebar({ currentPage, onNavigate }: SidebarProps): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleNavigate(page: PageId): void {
    onNavigate(page);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <>
      <SidebarBrand />

      {NAV_SECTIONS.map((section, sectionIndex) => (
        <div key={section.label}>
          {sectionIndex > 0 && (
            <div className="mx-0 my-[8px] h-px bg-sidebar-border" />
          )}
          <div className="pt-[20px] pb-[4px]">
            <SectionLabel>{section.label}</SectionLabel>
          </div>
          <div className="flex flex-col">
            {section.items.map((item) => (
              <NavItemButton
                key={item.id}
                item={item}
                isActive={currentPage === item.id}
                onClick={() => handleNavigate(item.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-[16px] left-[16px] z-50 rounded-[var(--radius-md)] bg-sidebar-bg p-[8px] text-white shadow-md lg:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? (
          <X size={20} strokeWidth={1.5} />
        ) : (
          <Menu size={20} strokeWidth={1.5} />
        )}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileOpen(false);
          }}
          role="presentation"
        />
      )}

      <aside
        className={`${asideBase} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
