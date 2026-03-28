import { query } from "./_generated/server";
import { v } from "convex/values";

export const searchEvents = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.trim();

    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }

    const now = Date.now();

    const searchResults = await ctx.db
      .query("events")
      .withSearchIndex("search_by_title", (q) =>
        q.search("title", args.query)
      )
      .filter((q) => q.gte(q.field("startTime"), now))
      .take(args.limit ?? 5);

    return searchResults;
  },
});