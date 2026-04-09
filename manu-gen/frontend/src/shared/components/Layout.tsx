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
      <main className="flex-1 p-[--content-padding-sm] lg:p-[--content-padding]">
        {children}
      </main>
    </div>
  );
}
