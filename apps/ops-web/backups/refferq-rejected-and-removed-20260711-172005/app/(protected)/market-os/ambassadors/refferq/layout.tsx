import type React from 'react';

export default function RefferqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-dvh w-full overflow-hidden bg-background text-foreground">{children}</div>;
}
