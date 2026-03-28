import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    //users table
    users: defineTable({
        name: v.string(),
        tokenIdentifier: v.string(),
        email: v.string(),
        imageUrl: v.optional(v.string()),

        //Onboarding
        hasCompletedOnboarding: v.boolean(),

        location: v.optional(
            v.object({
                city: v.string(),
                state: v.string(),
                country: v.string(),
            })
        ),
        interests:v.optional(v.array(v.string())),

        //Organizer tracking (user subscription)
        freeEventsCreated: v.number(), //Track number of free events created (1 free)
        isPro: v.optional(v.boolean()), //Track if user has Pro subscription

        createdAt: v.number(),
        updatedAt: v.number(),




    }).index("by_token", ["tokenIdentifier"]),

    events: defineTable({
        title: v.string(),
        description: v.string(),
        slug: v.string(),

        // Organizer
        organizerId: v.id("users"),
        organizerName: v.string(),

        // Event Details
        category: v.string(),
        tags: v.array(v.string()),

        // Date & Time 
        startTime: v.number(),
        endTime: v.number(),
        timezone: v.string(),

        // Location
        locationType: v.union(v.literal("in-person"), v.literal("online")), 
        venue: v.optional(v.string()),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        country: v.optional(v.string()),
        
        // Capacity & Tickets
        capacity: v.optional(v.number()),
        ticketType: v.union(v.literal("free"), v.literal("paid")),
        price: v.optional(v.number()), // Paid at event offline only
        registrationCount: v.number(),

        // Customizations
        coverImage: v.optional(v.string()),
        themeColor: v.optional(v.string()),

        // Timestamos
        createdAt: v.number(),
        updatedAt: v.number(),



    })
    .index("by_organizer", ["organizerId"])
    .index("by_category", ["category"])
    .index("by_slug", ["slug"])
    .index("by_start_date", ["startTime"])
    .searchIndex("search_by_title", {
        searchField: "title",
    })  
    ,

    registration: defineTable({
        eventId: v.id("events"),
        userId: v.id("users"),

        // Attendee Details
        attendeeName: v.string(),
        attendeeEmail: v.string(),

        // QR Code for entry
        qrCode: v.string(),

        // Check-in 
        checkedIn: v.boolean(),
        checkedInAt: v.optional(v.number()),

        // Status 
        status: v.union(v.literal("confirmed"), v.literal("cancelled")),

        registeredAt: v.number(),


    })
    
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_event_user", ["eventId", "userId"])
    .index("by_qr_code", ["qrCode"])
    ,
});