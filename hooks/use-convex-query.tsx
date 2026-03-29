import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { useMutation } from "convex/react";


export const useConvexQuery = <T = any>(query: any, args?: any) => {
    const result = useQuery(query, args);
    // Convex returns undefined while loading AND when the query is skipped — treat skip as idle, not loading
    const skipped = args === "skip";
    const isLoading = !skipped && result === undefined;

    return { data: skipped ? undefined : result, loading: isLoading, error: null };
}

export const useConvexMutation = (mutation: any, args?: any) => {
    const mutationFn = useMutation(mutation);

    const [data, setData] = useState(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = async (args?: any) => {
        setLoading(true);
        setError(null);
        
        try {
            console.log("🔄 Mutation starting with args:", args);
            const response = await mutationFn(args);
            console.log("✅ Mutation completed, response:", response);
            setData(response);
            return response;

        }

        catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            console.error("❌ Mutation failed:", errorMsg);
            setError(errorMsg);
            
            // Don't auto-toast authorization errors - let the caller handle them
            if (!errorMsg.toLowerCase().includes("not authorized") && 
                !errorMsg.toLowerCase().includes("unauthorized")) {
              toast.error(errorMsg);
            }
            
            throw err; // Re-throw so caller can catch it
        }
        finally {
            setLoading(false);
        }
    };

    return { data, loading, error, mutate };
        


};