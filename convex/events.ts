import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

// Create a new event
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.string(),
    locationType: v.union(v.literal("in-person"), v.literal("online")),
    venue: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    capacity: v.number(),
    ticketType: v.union(v.literal("free"), v.literal("paid")),
    price: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    themeColor: v.optional(v.string()),
    hasPro: v.optional(v.boolean()),
  },
    handler: async (ctx, args) => {
      try {
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

        // Use the server-side Pro status from the database, not the client
        const isProUser = user.isPro ?? false;

        // SERVER-SIDE CHECK: Verify event limit for Free users
        if (!isProUser && user.freeEventsCreated >= 1) {
          throw new Error(
            "Free event limit reached. Please upgrade to Pro to create more events."
          );
        }

        // SERVER-SIDE CHECK: Verify custom color usage
        const defaultColor = "#1e3a8a";
        if (!isProUser && args.themeColor && args.themeColor !== defaultColor) {
          throw new Error(
            "Custom theme colors are a Pro feature. Please upgrade to Pro."
          );
        }

        // Force default color for Free users
        const themeColor = isProUser ? args.themeColor : defaultColor;

      // Generate slug from title
      const slug = args.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Create event
      const eventId = await ctx.db.insert("events", {
        title: args.title,
        description: args.description,
        category: args.category,
        tags: args.tags,
        startTime: args.startTime,
        endTime: args.endTime,
        timezone: args.timezone,
        locationType: args.locationType,
        venue: args.venue,
        address: args.address,
        city: args.city,
        state: args.state,
        country: args.country,
        capacity: args.capacity,
        ticketType: args.ticketType,
        price: args.price,
        coverImage: args.coverImage,
        themeColor, // Use validated color
        slug: `${slug}-${Date.now()}`,
        organizerId: user._id,
        organizerName: user.name,
        registrationCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update user's free event count only for non-Pro users
      if (!isProUser) {
        await ctx.db.patch(user._id, {
          freeEventsCreated: user.freeEventsCreated + 1,
        });
      }

      return eventId;
    } catch (error: any) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  },
});

// Get event by slug
export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    return event;
  },
});

// Get events by organizer
export const getMyEvents = query({
  handler: async (ctx) => {
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

    const events = await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", user._id))
      .order("desc")
      .collect();

    return events;
  },
});

// Get event dashboard data
export const getEventDashboard = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
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

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is the organizer
    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to view this event");
    }

    // Get all registrations for this event
    const registrations = await ctx.db
      .query("registration")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Calculate stats
    const confirmedRegistrations = registrations.filter(
      (reg) => reg.status === "confirmed"
    );
    const checkedInCount = confirmedRegistrations.filter(
      (reg) => reg.checkedIn
    ).length;
    const pendingCount = confirmedRegistrations.length - checkedInCount;

    // Calculate revenue (for paid events only)
    let totalRevenue = 0;
    if (event.ticketType === "paid" && event.price) {
      totalRevenue = checkedInCount * event.price;
    }

    // Calculate time-based stats
    const now = Date.now();
    const isEventPast = now > event.endTime;
    const isEventToday =
      new Date(event.startTime).toDateString() === new Date(now).toDateString();
    const hoursUntilEvent = Math.max(
      0,
      Math.floor((event.startTime - now) / (1000 * 60 * 60))
    );

    // Calculate check-in rate
    const checkInRate =
      confirmedRegistrations.length > 0
        ? Math.round(
            (checkedInCount / confirmedRegistrations.length) * 100
          )
        : 0;

    const stats = {
      totalRegistrations: confirmedRegistrations.length,
      capacity: event.capacity || 0,
      checkedInCount,
      pendingCount,
      totalRevenue,
      checkInRate,
      isEventToday,
      isEventPast,
      hoursUntilEvent,
    };

    return { event, stats };
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
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

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is the organizer
    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to delete this event");
    }

    // Delete all registrations for this event
    const registrations = await ctx.db
      .query("registration")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const registration of registrations) {
      await ctx.db.delete(registration._id);
    }

    // Delete the event
    await ctx.db.delete(args.eventId);

    // Update free event count if it was a free event
    if (event.ticketType === "free" && user.freeEventsCreated > 0) {
      await ctx.db.patch(user._id, {
        freeEventsCreated: user.freeEventsCreated - 1,
      });
    }

    return { success: true };
  },
});