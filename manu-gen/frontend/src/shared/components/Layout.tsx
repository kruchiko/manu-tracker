import { Sidebar, type PageId } from "./Sidebar";
import styles from "./Layout.module.css";

interface LayoutProps {
  currentPage: PageId;
  /**
   * When set, the sidebar highlights this item instead of `currentPage`.
   * Use when the main route is one page but the user’s entry context is another (e.g. job detail opened from Live Operations).
   */
  sidebarActivePage?: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export function Layout({
  currentPage,
  sidebarActivePage,
  onNavigate,
  children,
}: LayoutProps): React.JSX.Element {
  const sidebarHighlight = sidebarActivePage ?? currentPage;

  return (
    <div className={styles.layout}>
      <Sidebar currentPage={sidebarHighlight} onNavigate={onNavigate} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
