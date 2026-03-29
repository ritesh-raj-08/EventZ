import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";


export const store = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"users">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name });
      }
      return user._id;
    }

    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? "",
      imageUrl: identity.pictureUrl,
      hasCompletedOnboarding: false,
      freeEventsCreated: 0,
      isPro: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      // It's possible the authenticated user has not yet been created in the users table.
      // Return null so client-side flow can continue and the onboarding/store mutation can run.
      return null;
    }

    return user;
  },
});

export const completeOnboarding = mutation({
  args: {
    location: v.object({
      city: v.string(),
      state: v.string(),
      country: v.string(),
    }),
    interests: v.array(v.string()),
  },

  handler: async (ctx, args): Promise<Id<"users">> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    let userId: Id<"users">;
    
    if (!user) {
      // Auto-create user like store mutation
      userId = await ctx.db.insert("users", {
        name: identity.name ?? "Anonymous",
        tokenIdentifier: identity.tokenIdentifier,
        email: identity.email ?? "",
        imageUrl: identity.pictureUrl,
        hasCompletedOnboarding: false,
        freeEventsCreated: 0,
        isPro: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      userId = user._id;
    }

    await ctx.db.patch(userId, {
      hasCompletedOnboarding: true,
      location: args.location,
      interests: args.interests,
      updatedAt: Date.now(),
    });

    return userId;
  },
});

export const upgradeToPro = mutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      isPro: true,
      freeEventsCreated: 0, // Reset free events counter for Pro users
      updatedAt: Date.now(),
    });
  },
});