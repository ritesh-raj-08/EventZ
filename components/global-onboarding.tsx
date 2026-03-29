"use client";

import { useOnboarding } from "@/hooks/use-onboarding";
import OnboardingModal from "./ui/onboarding-modal";

export function GlobalOnboarding() {
  const { showOnboarding, handleOnboardingComplete, handleOnboardingSkip } = useOnboarding();

  return (
    <OnboardingModal
      isOpen={showOnboarding}
      onClose={handleOnboardingSkip}
      onComplete={handleOnboardingComplete}
    />
  );
}

