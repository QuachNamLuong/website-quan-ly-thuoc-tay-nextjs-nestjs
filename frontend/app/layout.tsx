import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/hooks/use-auth';
import { ToastProvider } from '@/components/common/toast';

export const metadata: Metadata = {
  title: 'Quản lý Nhà thuốc',
  description: 'Hệ thống quản lý nhà thuốc và nhập kho',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
