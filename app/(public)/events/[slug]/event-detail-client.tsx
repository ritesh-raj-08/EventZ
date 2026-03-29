/* eslint-disable react-hooks/purity */
"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Share2,
  Ticket,
  ExternalLink,
  Loader2,
  CheckCircle,
  Search,
} from "lucide-react";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCategoryIcon, getCategoryLabel } from "@/lib/data";
import RegisterModal from "./_components/register-modal";

type Event = Doc<"events">;

interface Registration {
  _id: string;
  eventId: string;
  userId: string;
  status: string;
}

function darkenColor(color: string, amount: number): string {
  const colorWithoutHash = color.replace("#", "");
  const num = parseInt(colorWithoutHash, 16);
  const r = Math.max(0, (num >> 16) - amount * 255);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount * 255);
  const b = Math.max(0, (num & 0x0000ff) - amount * 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function EventDetailClient({ slug: propSlug }: { slug: string }) {
  const params = useParams();
  const routerSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const slug = routerSlug || propSlug;
  const router = useRouter();
  const { user } = useUser();
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);

  const { data: currentUser } = useConvexQuery<Doc<"users"> | null>(
    api.users.getCurrentUser
  );

  const { data: event, loading: isLoading } = useConvexQuery<Event | null>(
    api.events.getEventBySlug,
    slug ? { slug } : "skip"
  );

  const { data: registration } = useConvexQuery<Registration>(
    api.registrations.checkRegistration,
    event?._id ? { eventId: event._id } : "skip"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <Search className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Event Not Found
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
          <Button variant="outline" asChild>
            <a href="/explore">
              Explore Events
            </a>
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (!event) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description.slice(0, 100) + "...",
          url: url,
        });
      } catch {
        // User cancelled or error occurred
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleRegister = () => {
    if (!user) {
      toast.error("Please sign in to register");
      return;
    }
    setShowRegisterModal(true);
  };

  const isEventFull = event.capacity
    ? event.registrationCount >= event.capacity
    : false;
  const isEventPast = event.endTime < Date.now();
  const isOrganizer = currentUser?._id === event.organizerId;

  return (
    <div
      style={{
        backgroundColor: event.themeColor || "#1e3a8a",
      }}
      className="min-h-screen py-8 -mt-6 md:-mt-16 lg:-mx-5"
    >
      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3">
            {getCategoryIcon(event.category)}{" "}
            {getCategoryLabel(event.category)}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{format(event.startTime, "EEEE, MMMM dd, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>
                {format(event.startTime, "h:mm a")} -{" "}
                {format(event.endTime, "h:mm a")}
              </span>
            </div>
          </div>
        </div>

        {event.coverImage && (
          <div className="relative h-[400px] rounded-2xl overflow-hidden mb-6">
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-8">
            <Card
              className={"pt-0"}
              style={{
                backgroundColor: event.themeColor
                  ? darkenColor(event.themeColor, 0.04)
                  : "#1e3a8a",
              }}
            >
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            <Card
              className={"pt-0"}
              style={{
                backgroundColor: event.themeColor
                  ? darkenColor(event.themeColor, 0.04)
                  : "#1e3a8a",
              }}
            >
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-purple-500" />
                  Location
                </h2>

                <div className="space-y-3">
                  <p className="font-medium">
                    {event.city}, {event.state || event.country}
                  </p>
                  {event.address && (
                    <p className="text-sm text-muted-foreground">
                      {event.address}
                    </p>
                  )}
                  {event.venue && (
                    <Button variant="outline" asChild className="gap-2">
                      <a
                        href={event.venue}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Map
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card
              className={"pt-0"}
              style={{
                backgroundColor: event.themeColor
                  ? darkenColor(event.themeColor, 0.04)
                  : "#1e3a8a",
              }}
            >
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Organizer</h2>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {event.organizerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{event.organizerName}</p>
                    <p className="text-sm text-muted-foreground">
                      Event Organizer
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <Card
              className={`overflow-hidden py-0`}
              style={{
                backgroundColor: event.themeColor
                  ? darkenColor(event.themeColor, 0.04)
                  : "#1e3a8a",
              }}
            >
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-3xl font-bold">
                    {event.ticketType === "free"
                      ? "Free"
                      : `₹${event.price ?? 0}`}
                  </p>
                  {event.ticketType === "paid" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Pay at event offline
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Attendees</span>
                    </div>
                    <p className="font-semibold">
                      {event.registrationCount} / {event.capacity || "∞"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Date</span>
                    </div>
                    <p className="font-semibold text-sm">
                      {format(event.startTime, "MMM dd")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Time</span>
                    </div>
                    <p className="font-semibold text-sm">
                      {format(event.startTime, "h:mm a")}
                    </p>
                  </div>
                </div>

                <Separator />

                {registration ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">
                        You&apos;re registered!
                      </span>
                    </div>
                    <Button
                      className="w-full gap-2"
                      onClick={() => router.push("/my-tickets")}
                    >
                      <Ticket className="w-4 h-4" />
                      View Ticket
                    </Button>
                  </div>
                ) : isEventPast ? (
                  <Button className="w-full" disabled>
                    Event Ended
                  </Button>
                ) : isEventFull ? (
                  <Button className="w-full" disabled>
                    Event Full
                  </Button>
                ) : isOrganizer ? (
                  <Button
                    className="w-full"
                    onClick={() =>
                      router.push(`/events/${event.slug}/manage`)
                    }
                  >
                    Manage Event
                  </Button>
                ) : (
                  <Button className="w-full gap-2" onClick={handleRegister}>
                    <Ticket className="w-4 h-4" />
                    Register for Event
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                  Share Event
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showRegisterModal && event && (
        <RegisterModal
          event={event}
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
        />
      )}
    </div>
  );
}
