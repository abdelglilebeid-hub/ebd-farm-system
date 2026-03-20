import type { Metadata } from 'next';
import './globals.css';
@import tailwindcss from 'tailwindcss/forms';

export const metadata: Metadata = {
  title: 'EBD Farm Management System',
  description: 'Comprehensive farm management system for Egypt microfinance-based farms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-blue-50 to-indigo-100">
        {children}
      </body>
    </html>
  )};
}
