"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexQuery } from "./use-convex-query";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

// Pages that require onboarding (attendee-centered)
const ATTENDEE_PAGES = ["/explore", "/events", "/my-tickets", "/profile"];

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Get authentication state from Clerk
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();

  // Only fetch currentUser if user is signed in
  const { data: currentUser, loading: isUserLoading, error } = useConvexQuery(
    api.users.getCurrentUser,
    { skip: !isSignedIn } // Skip query if user is not signed in
  );

  useEffect(() => {
    console.log("useOnboarding - Effect running:", {
      isAuthLoaded,
      isSignedIn,
      isUserLoading,
      hasCurrentUser: !!currentUser,
      currentUser,
      pathname,
      error
    });

    // Wait for auth to load
    if (!isAuthLoaded) {
      console.log("Auth not loaded yet");
      return;
    }

    // Check if current page requires onboarding
    const requiresOnboarding = ATTENDEE_PAGES.some((page) => 
      pathname === page || pathname.startsWith(page + "/")
    );

    // If page doesn't require onboarding, don't show modal
    if (!requiresOnboarding) {
      console.log("Page doesn't require onboarding");
      setShowOnboarding(false);
      return;
    }

    // Page requires onboarding - now check user status
    console.log("Page requires onboarding, checking user status");

    // Case 1: User is NOT signed in
    if (!isSignedIn) {
      console.log("User not signed in - showing onboarding modal");
      setShowOnboarding(true);
      return;
    }

    // Case 2: User IS signed in, but still loading user data
    if (isUserLoading) {
      console.log("User signed in but loading user data...");
      return;
    }

    // Case 3: User IS signed in but no user data found (shouldn't happen)
    if (!currentUser) {
      console.log("User signed in but no user data found - showing onboarding");
      setShowOnboarding(true);
      return;
    }

    // Case 4: User IS signed in and has user data
    const needsOnboarding = !currentUser.hasCompletedOnboarding;
    console.log("User onboarding status:", {
      hasCompletedOnboarding: currentUser.hasCompletedOnboarding,
      needsOnboarding
    });

    if (needsOnboarding) {
      console.log("Showing onboarding modal for authenticated user");
      setShowOnboarding(true);
    } else {
      console.log("User already completed onboarding");
      setShowOnboarding(false);
    }
    
  }, [isAuthLoaded, isSignedIn, isUserLoading, currentUser, pathname, error]);

  const handleOnboardingComplete = () => {
    console.log("Onboarding completed, refreshing...");
    setShowOnboarding(false);
    // Refresh to get updated user data
    router.refresh();
  };

  const handleOnboardingSkip = () => {
    console.log("Onboarding skipped, redirecting to home");
    setShowOnboarding(false);
    router.push("/");
  };

  return {
    showOnboarding,
    setShowOnboarding,
    handleOnboardingComplete,
    handleOnboardingSkip,
    needsOnboarding: !isSignedIn || (currentUser && !currentUser.hasCompletedOnboarding),
    isLoading: !isAuthLoaded || (isSignedIn && isUserLoading),
    currentUser,
    isSignedIn,
  };
}