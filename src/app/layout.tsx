import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Centro de control de la panadería',
  description: 'Ventas, costos y utilidad de tu panadería en un solo lugar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
