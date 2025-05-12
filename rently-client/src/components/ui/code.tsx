"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  language?: string;
}

export function Code({ className, language, children, ...props }: CodeProps) {
  return (
    <pre
      className={cn(
        "rounded-md bg-gray-100 p-4 font-mono text-sm overflow-auto",
        className
      )}
      data-language={language}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
}
