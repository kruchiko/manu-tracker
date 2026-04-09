import { Sidebar, type PageId } from "./Sidebar";

interface LayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="min-w-0 flex-1 overflow-y-auto p-[var(--content-padding-sm)] lg:p-[var(--content-padding)]">
        {children}
      </main>
    </div>
  );
}
