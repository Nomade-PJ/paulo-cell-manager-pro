
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import { useMobile } from '@/hooks/use-mobile';

export default function DashboardLayout() {
  const isMobile = useMobile();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        {!isMobile && <Sidebar />}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      {isMobile && <BottomNav />}
    </div>
  );
}
