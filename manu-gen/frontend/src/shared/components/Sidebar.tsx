import { useState } from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Activity,
  Layers,
  GitBranch,
  Radio,
  Menu,
  X,
} from "lucide-react";
import { pagePath, type PageId } from "../navigation/pageRoutes";
import styles from "./Sidebar.module.css";

export type { PageId };

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
      { id: "live-operations", label: "Live Operations", icon: Activity },
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
  activePageId: PageId;
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

function NavItemLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
}): React.JSX.Element {
  const Icon = item.icon;

  return (
    <NavLink
      to={pagePath(item.id)}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
    >
      <Icon
        size={15}
        strokeWidth={1.5}
        className={isActive ? undefined : styles.iconDim}
      />
      {item.label}
    </NavLink>
  );
}

export function Sidebar({ activePageId }: SidebarProps): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile(): void {
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
              <NavItemLink
                key={item.id}
                item={item}
                isActive={activePageId === item.id}
                onNavigate={closeMobile}
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
