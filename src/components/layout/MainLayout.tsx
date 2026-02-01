import { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="md:ml-64 pt-16 md:pt-0 pb-24 md:pb-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
