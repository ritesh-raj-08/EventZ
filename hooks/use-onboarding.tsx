"use client";

import { useConvexQuery } from "./use-convex-query";
import { api } from "@/convex/_generated/api";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useEffect } from "react";

const ATTENDEE_PAGES = ["/explore", "my-tickets", "events"];

export function useOnboarding() {
    const [ showOnboarding, setShowOnboarding] = React.useState(false);
    const { data: currentUser, loading } = useConvexQuery(api.users.getCurrentUser);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (loading || !currentUser) return;

        if (!currentUser.hasCompletedOnboarding ) {

            const requiresOnboarding = ATTENDEE_PAGES.some(page => pathname.startsWith(page));

            if (requiresOnboarding) {
            setShowOnboarding(true);
            
        }
        }  
        
    }, [loading, currentUser, pathname]);

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        router.refresh();
        
    }

    const handleOnboardingSkip = () => {
        setShowOnboarding(false);
        router.push("/");
    };
    return { showOnboarding,
        handleOnboardingComplete,
        handleOnboardingSkip,
        setShowOnboarding,
        needsOnboarding: !loading && currentUser && !currentUser.hasCompletedOnboarding,};

    };


