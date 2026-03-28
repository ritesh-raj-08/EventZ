import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Types
interface Registration {
  _id: Id<"registration">;
  eventId: Id<"events">;
  userId: Id<"users">;
  attendeeName: string;
  attendeeEmail: string;
  qrCode: string;
  checkedIn: boolean;
  status: "confirmed" | "cancelled";
  registeredAt: number;
  checkedInAt?: number;
}

interface Event {
  _id: Id<"events">;
  title: string;
  description: string;
  organizerId: Id<"users">;
  capacity?: number;
  registrationCount: number;
  [key: string]: any;
}

interface RegistrationWithEvent extends Registration {
  event: Event | null;
}

// Generate unique QR code ID
function generateQRCode(): string {
  return `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Register for an event
export const registerForEvent = mutation({
  args: {
    eventId: v.id("events"),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("User not authenticated");
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

    // Check if event is full
    if (event.capacity !== undefined && event.registrationCount >= event.capacity) {
      throw new Error("Event is full");
    }

    // Check if user already registered
    const existingRegistration = await ctx.db
      .query("registration")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();

    if (existingRegistration) {
      throw new Error("You are already registered for this event");
    }

    // Create registration
    const qrCode = generateQRCode();
    const registrationId = await ctx.db.insert("registration", {
      eventId: args.eventId,
      userId: user._id,
      attendeeName: args.attendeeName,
      attendeeEmail: args.attendeeEmail,
      qrCode: qrCode,
      checkedIn: false,
      status: "confirmed",
      registeredAt: Date.now(),
    });

    // Update event registration count
    await ctx.db.patch(args.eventId, {
      registrationCount: event.registrationCount + 1,
    });

    return registrationId;
  },
});

// Check if user is registered for an event
export const checkRegistration = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const registration = await ctx.db
      .query("registration")
      .withIndex("by_event_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();

    return registration;
  },
});

// Get user's registrations (tickets)
export const getMyRegistrations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      // Return empty array for unauthenticated users instead of throwing
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      // Return empty array if user not found in database
      return [];
    }

    const registrations = await ctx.db
      .query("registration")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Fetch event details for each registration
    const registrationsWithEvents: RegistrationWithEvent[] = [];

    for (const reg of registrations) {
      const event = await ctx.db.get(reg.eventId);
      if (event) {
        registrationsWithEvents.push({
          ...reg,
          event,
        });
      }
    }

    return registrationsWithEvents;
  },
});

// Cancel registration
export const cancelRegistration = mutation({
  args: { registrationId: v.id("registration") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("User not authenticated");
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

    const registration = await ctx.db.get(args.registrationId);
    if (!registration) {
      throw new Error("Registration not found");
    }

    // Check if user owns this registration
    if (registration.userId !== user._id) {
      throw new Error("You are not authorized to cancel this registration");
    }

    const event = await ctx.db.get(registration.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Update registration status
    await ctx.db.patch(args.registrationId, {
      status: "cancelled",
    });

    // Decrement event registration count
    if (event.registrationCount > 0) {
      await ctx.db.patch(registration.eventId, {
        registrationCount: event.registrationCount - 1,
      });
    }

    return { success: true };
  },
});

// Get registrations for an event (for organizers)
export const getEventRegistrations = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("User not authenticated");
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
      throw new Error("You are not authorized to view registrations");
    }

    const registrations = await ctx.db
      .query("registration")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return registrations;
  },
});

// Check-in attendee with QR code
export const checkInAttendee = mutation({
  args: { qrCode: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      throw new Error("User not authenticated");
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

    const registration = await ctx.db
      .query("registration")
      .withIndex("by_qr_code", (q) => q.eq("qrCode", args.qrCode))
      .unique();

    if (!registration) {
      throw new Error("Invalid QR code");
    }

    const event = await ctx.db.get(registration.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if user is the organizer
    if (event.organizerId !== user._id) {
      throw new Error("You are not authorized to check in attendees");
    }

    // Check if already checked in
    if (registration.checkedIn) {
      return {
        success: false,
        message: "Already checked in",
        registration,
      };
    }

    // Check in
    await ctx.db.patch(registration._id, {
      checkedIn: true,
      checkedInAt: Date.now(),
    });

    return {
      success: true,
      message: "Check-in successful",
      registration: {
        ...registration,
        checkedIn: true,
        checkedInAt: Date.now(),
      },
    };
  },
});