"use client";

import React from "react";
import { Calendar, MapPin, Users, Trash2, X, QrCode, Eye } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Doc } from "@/convex/_generated/dataModel";

import { getCategoryIcon, getCategoryLabel } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type EventCardProps = {
  event: Doc<"events">;
  onClick?: (e?: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  variant?: "grid" | "list";
  action?: "event" | "ticket" | null;
  className?: string;
};

export default function EventCard({
  event,
  onClick,
  onDelete,
  variant = "grid",
  action = null,
  className = "",
}: EventCardProps) {

  // LIST VIEW
  if (variant === "list") {
    return (
      <Card
        className={`py-0 group cursor-pointer hover:shadow-lg transition-all hover:border-purple-500/50 ${className}`}
        onClick={onClick}
      >
        <CardContent className="p-3 flex gap-3">
          
          {/* Image */}
          <div className="w-20 h-20 rounded-lg shrink-0 overflow-hidden relative">
            {event.coverImage ? (
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center text-3xl"
                style={{ backgroundColor: event.themeColor }}
              >
                {getCategoryIcon(event.category)}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 group-hover:text-purple-400 line-clamp-2">
              {event.title}
            </h3>

            <p className="text-xs text-muted-foreground mb-1">
              {format(new Date(event.startTime), "EEE, dd MMM, HH:mm")}
            </p>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">
                {event.locationType === "online" ? "Online Event" : event.city}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{event.registrationCount} attending</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // GRID VIEW
  return (
    <Card
      className={`overflow-hidden group pt-0 ${
        onClick
          ? "cursor-pointer hover:shadow-lg transition-all hover:border-purple-500/50"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {event.coverImage ? (
          <Image
            src={event.coverImage}
            alt={event.title}
            width={500}
            height={192}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            priority
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl"
            style={{ backgroundColor: event.themeColor }}
          >
            {getCategoryIcon(event.category)}
          </div>
        )}

        <div className="absolute top-3 right-3">
          <Badge variant="secondary">
            {event.ticketType === "free" ? "Free" : "Paid"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="space-y-3">
        <div>
          <Badge variant="outline" className="mb-2">
            {getCategoryIcon(event.category)}{" "}
            {getCategoryLabel(event.category)}
          </Badge>

          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-purple-400">
            {event.title}
          </h3>
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(event.startTime), "EEE, dd MMM, HH:mm")}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">
              {event.locationType === "online"
                ? "Online Event"
                : `${event.city}, ${event.state || event.country}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              {event.registrationCount} / {event.capacity ?? "∞"} registered
            </span>
          </div>
        </div>

        {/* Actions */}
        {action && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
              }}
            >
              {action === "event" ? (
                <>
                  <Eye className="w-4 h-4" />
                  View
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Ticket
                </>
              )}
            </Button>

            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-500 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(event._id);
                }}
              >
                {action === "event" ? (
                  <Trash2 className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}