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
    <div className="flex items-center gap-0" aria-hidden>
      <div className="size-1.5 rounded-full bg-[--logo-dot-teal]" />
      <div className="h-px flex-1 bg-[--logo-connector]" />
      <div className="size-1.5 rounded-full bg-[--logo-dot-teal]" />
      <div className="h-px flex-1 bg-[--logo-connector]" />
      <div className="size-1.5 rounded-full bg-[--logo-dot-orange]" />
      <div className="h-px flex-1 bg-[--logo-connector]" />
      <div className="size-1.5 rounded-full bg-[--logo-dot-teal]" />
    </div>
  );
}

function SidebarBrand(): React.JSX.Element {
  return (
    <div className="px-[--space-5] pt-[--space-6] pb-[--space-4]">
      <div className="flex flex-col gap-[--space-1]">
        <div
          className="font-heading text-[--text-logo] font-bold uppercase tracking-[0.07em]"
        >
          <span className="text-[--logo-manu]">Manu</span>
          <span className="text-[--logo-tracker]">Tracker</span>
        </div>
        <LogoDots />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: string }): React.JSX.Element {
  return (
    <div className="px-[--space-5] pb-[--space-2] pt-[--space-4] font-mono text-[10px] uppercase tracking-[--tracking-widest] text-sidebar-text-muted">
      {children}
    </div>
  );
}

const navItemBase = [
  "relative flex w-full items-center gap-[--space-3]",
  "rounded-[--radius-sm] px-[--space-5] py-[--space-2]",
  "text-left font-body text-[--text-base] transition-colors duration-[--duration-fast]",
].join(" ");

const navItemActive = "bg-sidebar-active font-medium text-text-on-dark";
const navItemIdle = "text-sidebar-text hover:bg-sidebar-bg-hover hover:text-text-on-dark";

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
      className={`${navItemBase} ${isActive ? navItemActive : navItemIdle}`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-sm bg-sidebar-active-accent" />
      )}
      <Icon size={20} strokeWidth={1.5} />
      {item.label}
    </button>
  );
}

const asideBase = [
  "fixed inset-y-0 left-0 z-40 flex w-[--sidebar-width] flex-col",
  "bg-[image:--sidebar-gradient] transition-transform",
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
            <div className="mx-[--space-4] my-[--space-2] h-px bg-sidebar-border" />
          )}
          <SectionLabel>{section.label}</SectionLabel>
          <div className="flex flex-col gap-px">
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
        className="fixed top-[--space-4] left-[--space-4] z-50 rounded-[--radius-md] bg-sidebar-bg p-[--space-2] text-text-on-dark shadow-md lg:hidden"
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
