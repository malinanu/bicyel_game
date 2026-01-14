import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 w-full max-w-xs mx-auto">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 flex-1 rounded-full transition-all duration-300",
            i < currentStep
              ? "gradient-milo"
              : i === currentStep
              ? "bg-primary/50"
              : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

interface CampaignLayoutProps {
  children: ReactNode;
  showSteps?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export function CampaignLayout({
  children,
  showSteps = false,
  currentStep = 0,
  totalSteps = 5,
}: CampaignLayoutProps) {
  return (
    <div className="min-h-screen gradient-hero flex flex-col safe-area-top safe-area-bottom">
      {showSteps && (
        <div className="px-6 pt-6 pb-4">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </div>
      )}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
