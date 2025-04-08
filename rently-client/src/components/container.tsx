import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={`container mx-auto px-8 py-8 ${className || ""}`}>
      {children}
    </div>
  );
}
