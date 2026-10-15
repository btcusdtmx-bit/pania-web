import { PaniaLayoutCliente } from '@/components/PaniaLayoutCliente';

export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return <PaniaLayoutCliente>{children}</PaniaLayoutCliente>;
}
