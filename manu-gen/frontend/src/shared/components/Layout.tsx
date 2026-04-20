import { Sidebar, type PageId } from "./Sidebar";
import styles from "./Layout.module.css";

interface LayoutProps {
  activePageId: PageId;
  children: React.ReactNode;
}

export function Layout({ activePageId, children }: LayoutProps): React.JSX.Element {
  return (
    <div className={styles.layout}>
      <Sidebar activePageId={activePageId} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
