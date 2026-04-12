import { Sidebar, type PageId } from "./Sidebar";
import styles from "./Layout.module.css";

interface LayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps): React.JSX.Element {
  return (
    <div className={styles.layout}>
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
