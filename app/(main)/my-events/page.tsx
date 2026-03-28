"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EventCard from "@/components/event-card";
import { Doc } from "@/convex/_generated/dataModel";

// Types
interface Event {
  _id: string;
  title: string;
  description: string;
  startTime: number;
  endDate: number;
  category: string;
  locationType: "physical" | "online";
  city: string;
  state?: string;
  country: string;
  capacity: number;
  registrationCount: number;
  ticketType: "free" | "paid";
  ticketPrice?: number;
  coverImage?: string;
  themeColor?: string;
  organizerId: string;
  organizerName: string;
  slug: string;
  [key: string]: any;
}

export default function MyEventsPage() {
  const router = useRouter();
  
  // ALWAYS call these hooks at the top, in the same order every render
  const { isLoaded, isSignedIn } = useAuth();
  const { data: events, loading } = useConvexQuery(api.events.getMyEvents);
  const { mutate: deleteEvent } = useConvexMutation(api.events.deleteEvent);

  // Debug logging
  React.useEffect(() => {
    console.log("📊 My Events Page loaded");
    console.log("Auth loaded:", isLoaded);
    console.log("Is signed in:", isSignedIn);
    console.log("Loading:", loading);
    console.log("Events:", events);
    console.log("Events count:", events?.length || 0);
  }, [events, loading, isLoaded, isSignedIn]);

  // Redirect to login if not signed in
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log("User not signed in, redirecting to sign-in");
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Conditional rendering based on auth and loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null; // Redirect will happen via useEffect above
  }

  const handleDelete = async (eventId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event? This action cannot be undone and will permanently delete the event and all associated registrations."
    );

    if (!confirmed) return;

    try {
      await deleteEvent({ eventId });
      toast.success("Event deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
    }
  };

  // Navigate to event dashboard instead of event detail
  const handleEventClick = (slug: string) => {
    router.push(`/my-events/${slug}`);
  };

  // Show loading while auth is being checked
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Show loading while events are being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Events</h1>
            <p className="text-muted-foreground">Manage your created events</p>
          </div>
        </div>

        {events?.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl mb-4">📅</div>
              <h2 className="text-2xl font-bold">No events yet</h2>
              <p className="text-muted-foreground">
                Create your first event and start managing attendees
              </p>
              <Button asChild className="gap-2">
                <Link href="/create-event">
                  <Plus className="w-4 h-4" />
                  Create Your First Event
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map((event: Doc<"events">) => (
              <EventCard
                key={event._id}
                event={event}
                action="event"
                onClick={() => handleEventClick(event.slug)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}