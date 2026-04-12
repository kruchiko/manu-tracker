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
import styles from "./Sidebar.module.css";

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
    <div className={styles.logoDots} aria-hidden>
      <div className={`${styles.dot} ${styles.dotTeal}`} />
      <div className={styles.connector} />
      <div className={`${styles.dot} ${styles.dotTeal}`} />
      <div className={styles.connector} />
      <div className={`${styles.dot} ${styles.dotOrange}`} />
      <div className={styles.connector} />
      <div className={`${styles.dot} ${styles.dotTeal}`} />
    </div>
  );
}

function SidebarBrand(): React.JSX.Element {
  return (
    <div className={styles.brand}>
      <div className={styles.brandInner}>
        <div className={styles.logoText}>
          <span className={styles.logoManu}>Manu</span>
          <span className={styles.logoTracker}>Tracker</span>
        </div>
        <LogoDots />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: string }): React.JSX.Element {
  return <div className={styles.sectionLabel}>{children}</div>;
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
      className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
    >
      <Icon
        size={15}
        strokeWidth={1.5}
        className={isActive ? undefined : styles.iconDim}
      />
      {item.label}
    </button>
  );
}

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
          {sectionIndex > 0 && <div className={styles.sectionDivider} />}
          <div className={styles.section}>
            <SectionLabel>{section.label}</SectionLabel>
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
        className={styles.mobileToggle}
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
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileOpen(false);
          }}
          role="presentation"
        />
      )}

      <aside
        className={`${styles.aside} ${mobileOpen ? styles.asideOpen : ""}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
