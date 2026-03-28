"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { CATEGORIES } from "@/lib/data";
import { parseLocationSlug } from "@/lib/location-utils";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Loader2 } from "lucide-react";
import EventCard from "@/components/event-card";

// Separate component for event lookup
const EventLookup = ({ slug, onEventFound }: { slug: string; onEventFound: (event: any) => void }) => {
  const { data: event, loading: eventLoading } = useConvexQuery(api.events.getEventBySlug, { slug });

  React.useEffect(() => {
    if (event && !eventLoading) {
      onEventFound(event);
    }
  }, [event, eventLoading, onEventFound]);

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
      </div>
    );
  }

  return null;
};

const ExploreDynamicPage = () => {
  const router = useRouter();
  const params = useParams();

  // ✅ normalize slug safely
  const rawSlug = params.slug;
  const slug =
    typeof rawSlug === "string"
      ? rawSlug
      : Array.isArray(rawSlug)
      ? rawSlug.join("-")
      : "";

  // ✅ check category
  const categoryInfo = CATEGORIES.find((cat) => cat.id === slug);
  const isCategory = !!categoryInfo;

  // ✅ parse location
  const { city, state, isValid } = !isCategory
    ? parseLocationSlug(slug)
    : { city: "", state: "", isValid: false };

  // ✅ If it's a category or valid location, render directly
  if (isCategory || isValid) {
    // Call the appropriate query
    const { data: events, loading: loadingLocal } = useConvexQuery(
      isCategory ? api.explore.getEventsByCategory : api.explore.getEventsByLocation,
      isCategory
        ? { category: slug, limit: 50 }
        : { city, state, country: "India", limit: 50 }
    );

    // ✅ loading state
    if (loadingLocal) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
        </div>
      );
    }

    const handleEventClick = (eventSlug: string) => {
      router.push(`/events/${eventSlug}`);
    };

    // ✅ CATEGORY PAGE
    if (isCategory && categoryInfo) {
      return (
        <>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">{categoryInfo.icon}</div>
            <div>
              <h1 className="text-5xl md:text-6xl font-bold">
                {categoryInfo.label}
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                {categoryInfo.description}
              </p>
            </div>
          </div>
        </div>

        {events && events.length > 0 && (
          <p className="text-muted-foreground px-6">
            {events.length}{" "}
            {events.length === 1 ? "event" : "events"} found in this category.
          </p>
        )}

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {events.map((event: any) => (
              <EventCard
                key={event._id}
                event={event}
                onClick={() => handleEventClick(event.slug)}
                variant="grid"
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground px-6">
            No events found in this category
          </p>
        )}
      </>
      );
    }

    // ✅ LOCATION PAGE
    if (isValid && city && state) {
      return (
        <>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">📍</div>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold">
                  Events in {city}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                  {state}, India
                </p>
              </div>
            </div>
          </div>

          {events && events.length > 0 && (
            <p className="text-muted-foreground px-6">
              {events.length}{" "}
              {events.length === 1 ? "event" : "events"} found here.
            </p>
          )}

          {events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {events.map((event: any) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onClick={() => handleEventClick(event.slug)}
                  variant="grid"
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground px-6">
              No events found in this location
            </p>
          )}
        </>
      );
    }

    // ✅ Neither category nor location - check if it's an event slug
    return (
      <EventLookup
        slug={slug}
        onEventFound={() => {
          router.replace(`/events/${slug}`);
        }}
      />
    );
  }

  // ✅ Fallback - shouldn't reach here
  return null;
}

export default ExploreDynamicPage;