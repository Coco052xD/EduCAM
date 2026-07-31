import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aula Puente IA", template: "%s · Aula Puente IA" },
  description: "Planeación pedagógica inclusiva con revisión humana.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
