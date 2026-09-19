import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { DemoModeBanner } from '../ui/Banner';

export function MainLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Persistent / Responsive Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset by 64 = 16rem on large screens) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopNavbar onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <DemoModeBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
