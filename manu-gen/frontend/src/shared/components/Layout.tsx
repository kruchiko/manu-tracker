import { Sidebar, type PageId } from "./Sidebar";

interface LayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
