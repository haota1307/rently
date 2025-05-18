import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={`flex flex-col space-y-6 w-full mx-4 p-4`}>{children}</div>
  );
}
