'use client'

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

interface ClerkClientProviderProps {
  children: React.ReactNode;
}

export function ClerkClientProvider({ children }: ClerkClientProviderProps) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
