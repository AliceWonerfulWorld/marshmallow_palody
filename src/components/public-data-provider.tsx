"use client";
import { useState, type ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
export function PublicDataProvider({ children, url }: { children: ReactNode; url: string }) {
  const [client] = useState(() => new ConvexReactClient(url));
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
