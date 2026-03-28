import { query } from "./_generated/server";
import { v } from "convex/values";

export const getFeaturedEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .withIndex("by_start_date")
            .filter((q) => q.gte(q.field("startTime"), now))
            .order("desc")
            .collect();

        const featured = events
            .sort((a, b) => b.registrationCount - a.registrationCount)
            .slice(0, args.limit || 3);

        return featured;

    },

});

// Get events by Location (city, state, country)

export const getEventsByLocation = query({
    args: {
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        let events = await ctx.db
            .query("events")
            .withIndex("by_start_date")
            .filter((q) => q.gte(q.field("startTime"), now))
            .order("desc")
            .collect();

        // Filter by cities or states

        if (args.city) {
            events = events.filter(
                (e) => e.city && e.city.toLowerCase() == args.city!.toLowerCase()
            );
        }

        else if (args.state) {
            events = events.filter(
                (e) => e.state && e.state.toLowerCase() == args.state!.toLowerCase()
            );
        }

        return events.slice(0, args.limit ?? 10);

    },
});

// Get Popular events(by registration count)

export const getPopularEvents = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .withIndex("by_start_date")
            .filter((q) => q.gte(q.field("startTime"), now))
            .order("desc")
            .collect();

        const popular = events
            .sort((a, b) => b.registrationCount - a.registrationCount)
            .slice(0, args.limit ?? 6);

        return popular;

    },
});

// Get events by category
export const getEventsByCategory = query({
    args: {
        category: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .filter((q) => q.gte(q.field("startTime"), now))
            .order("desc")
            .collect();

        const filtered = events.filter((e) => e.category === args.category);

        return filtered.slice(0, args.limit ?? 6);

    }   ,   
});

export const getCategoryCounts = query({
    handler: async (ctx) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .withIndex("by_start_date")
            .filter((q) => q.gte(q.field("startTime"), now))
            .order("desc")
            .collect();

             const counts: Record<string, number> = {};
            events.forEach((events) => {
                counts[events.category] = (counts[events.category] || 0) + 1;
            });
            return counts;
    },
});