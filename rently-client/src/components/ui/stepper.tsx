import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            {/* Step icon */}
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                index < currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStep
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {index < currentStep ? <Check className="h-5 w-5" /> : step.icon}
            </div>

            {/* Step content */}
            <div className="mt-2 text-center">
              <div
                className={cn(
                  "text-sm font-medium",
                  index <= currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </div>
              <div
                className={cn(
                  "text-xs mt-1 max-w-[120px]",
                  index <= currentStep
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60"
                )}
              >
                {step.description}
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute h-0.5 w-full translate-y-5 -translate-x-1/2 left-1/2",
                  index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{
                  width: `calc(100% / ${steps.length} - 2.5rem)`,
                  left: `calc(50% + 1.25rem)`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
