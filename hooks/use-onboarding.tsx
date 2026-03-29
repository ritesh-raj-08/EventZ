"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexQuery } from "./use-convex-query";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

// Pages that require onboarding (attendee-centered)
const ATTENDEE_PAGES = ["/explore", "/events", "/my-tickets", "/profile"];

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();

  // Convex only accepts the string "skip", not { skip: true }. Wrong args break getCurrentUser and useQuery throws.
  const shouldFetchUser = isAuthLoaded && isSignedIn;
  const { data: currentUser, loading } = useConvexQuery(
    api.users.getCurrentUser,
    shouldFetchUser ? {} : "skip"
  );

  useEffect(() => {
    // Wait for auth to load
    if (!isAuthLoaded) return;

    // Only show onboarding for signed-in users
    if (!isSignedIn) return;

  // Wait for user data to load
    if (loading || !currentUser) return;

    // Check if user hasn't completed onboarding AND not already shown
    if (!currentUser.hasCompletedOnboarding) {
      // Check if current page requires onboarding
      const requiresOnboarding = ATTENDEE_PAGES.some((page) =>
        pathname.startsWith(page)
      );

      if (requiresOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthLoaded, isSignedIn, loading, currentUser, pathname]);

  // Prevent reopening after complete (debounce with ref)
  useEffect(() => {
    if (currentUser?.hasCompletedOnboarding) {
      setShowOnboarding(false);
    }
  }, [currentUser]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh to get updated user data
    router.refresh();
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    // Redirect back to homepage if they skip
    router.push("/");
  };

  return {
    showOnboarding,
    setShowOnboarding,
    handleOnboardingComplete,
    handleOnboardingSkip,
    needsOnboarding: isSignedIn && currentUser && !currentUser.hasCompletedOnboarding,
  };
}