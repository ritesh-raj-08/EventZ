import { useStoreUser } from "./use-store-user";
import { useEffect } from "react";

export function StoreUserEffect() {
  const { isLoading } = useStoreUser();
  
  // This component just renders the hook to ensure storeUser runs globally
  useEffect(() => {
    console.log("Global StoreUserEffect mounted, user loading:", isLoading);
  }, [isLoading]);
  
  return null;
}
