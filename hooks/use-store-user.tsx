import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export function useStoreUser() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { user } = useUser();

  // ✅ properly typed
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true; // ✅ prevent memory leak

    async function createUser() {
      try {
        const id = await storeUser();
        if (isMounted) {
          setUserId(id);
        }
      } catch (error) {
        console.error("Error storing user:", error);
      }
    }

    createUser();

    return () => {
      isMounted = false;
      setUserId(null);
    };
  }, [isAuthenticated, storeUser, user?.id]);

  return {
    isLoading: isLoading || (isAuthenticated && userId === null),
    isAuthenticated: isAuthenticated && userId !== null,
  };
}