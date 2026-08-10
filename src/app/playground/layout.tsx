import { AppShell } from "@/components/layout/app-shell";

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
