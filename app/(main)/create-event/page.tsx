/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { State, City, IState, ICity } from "country-state-city";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import UnsplashImagePicker from "@/components/ui/unsplash-image-picker";
import AIEventCreator from "./_components/ai-event-creator";
import UpgradeModal from "@/components/upgrade-modal";
import { CATEGORIES } from "@/lib/data";
import Image from "next/image";

// HH:MM in 24h
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Types
interface GeneratedEventData {
  title: string;
  description: string;
  category: string;
  suggestedCapacity: number;
  suggestedTicketType: "free" | "paid";
}

// Update form schema to match Convex event schema
const eventSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Please select a category"),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  startTime: z.string().min(1, "Start time is required").regex(timeRegex, "Start time must be HH:MM"),
  endTime: z.string().min(1, "End time is required").regex(timeRegex, "End time must be HH:MM"),
  locationType: z.enum(["in-person", "online"]).default("in-person"),
  venue: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1").optional(),
  ticketType: z.enum(["free", "paid"]).default("free"),
  price: z.number().min(0, "Price must be 0 or greater").optional(),
  coverImage: z.string().optional(),
  themeColor: z.string().default("#1e3a8a"),
});

type EventFormData = z.infer<typeof eventSchema>;

// Custom hook for auth with proper typing
interface UseAuthReturn {
  has?: (params: { plan: string }) => boolean;
  userId?: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

// User type from Convex schema
interface User {
  _id: string;
  name: string;
  tokenIdentifier: string;
  email: string;
  imageUrl?: string;
  hasCompletedOnboarding: boolean;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  interests?: string[];
  freeEventsCreated: number;
  isPro?: boolean;
  createdAt: number;
  updatedAt: number;
}

// Event type for the create mutation
interface CreateEventInput {
  title: string;
  description: string;
  slug: string;
  organizerId: string;
  organizerName: string;
  category: string;
  tags: string[];
  startTime: number;
  endTime: number;
  timezone: string;
  locationType: "in-person" | "online";
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  ticketType: "free" | "paid";
  price?: number;
  registrationCount: number;
  coverImage?: string;
  themeColor?: string;
  createdAt: number;
  updatedAt: number;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [showImagePicker, setShowImagePicker] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<"limit" | "color">("limit");

  // Check if user has Pro plan
  const { has, userId, isLoaded, isSignedIn } = useAuth() as UseAuthReturn;
  const hasPro = has?.({ plan: "pro" }) ?? false;

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser) as { data: User | undefined };
  const { mutate: createEvent, loading } = useConvexMutation(
    api.events.createEvent
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as any,
    mode: "onChange",
    defaultValues: {
      locationType: "in-person",
      ticketType: "free",
      capacity: 50,
      themeColor: "#1e3a8a",
      category: "",
      state: "",
      city: "",
      country: "India",
      startTime: "",
      endTime: "",
      startDate: null,
      endDate: null,
      title: "",
      description: "",
      venue: "",
      address: "",
      coverImage: "",
      price: undefined,
    },
  });

  const themeColor = watch("themeColor");
  const ticketType = watch("ticketType");
  const selectedState = watch("state");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const coverImage = watch("coverImage");
  const locationType = watch("locationType");

  const indianStates: IState[] = useMemo(() => State.getStatesOfCountry("IN"), []);
  const cities: ICity[] = useMemo(() => {
    if (!selectedState) return [];
    const st = indianStates.find((s) => s.name === selectedState);
    if (!st) return [];
    return City.getCitiesOfState("IN", st.isoCode);
  }, [selectedState, indianStates]);

  // Color presets - show all for Pro, only default for Free
  const colorPresets: string[] = [
    "#1e3a8a", // Default color (always available)
    ...(hasPro ? ["#4c1d95", "#065f46", "#92400e", "#7f1d1d", "#831843"] : []),
  ];

  const handleColorClick = (color: string): void => {
    // If not default color and user doesn't have Pro
    if (color !== "#1e3a8a" && !hasPro) {
      setUpgradeReason("color");
      setShowUpgradeModal(true);
      return;
    }
    setValue("themeColor", color);
  };

  const combineDateTime = (date: Date | undefined | null, time: string | undefined): Date | null => {
    if (!date || !time) return null;
    const [hh, mm] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(hh, mm, 0, 0);
    return d;
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

const onSubmit = async (data: EventFormData): Promise<void> => {
  try {
    if (!isLoaded) {
      toast.error("Authentication is still loading");
      return;
    }

    if (!isSignedIn || !userId) {
      toast.error("You must be logged in to create an event");
      return;
    }

    const start = combineDateTime(data.startDate, data.startTime);
    const end = combineDateTime(data.endDate, data.endTime);

    if (!start || !end) {
      toast.error("Please select both date and time for start and end.");
      return;
    }

    if (end.getTime() <= start.getTime()) {
      toast.error("End date/time must be after start date/time.");
      return;
    }

    // Check event limit for Free users
    if (
      !hasPro &&
      currentUser?.freeEventsCreated &&
      currentUser.freeEventsCreated >= 1
    ) {
      setUpgradeReason("limit");
      setShowUpgradeModal(true);
      return;
    }

    // Check if trying to use custom color without Pro
    if (data.themeColor !== "#1e3a8a" && !hasPro) {
      setUpgradeReason("color");
      setShowUpgradeModal(true);
      return;
    }

    if (!currentUser) {
      toast.error("User data not found");
      return;
    }

    const eventData = {
      title: data.title,
      description: data.description,
      category: data.category,
      tags: [data.category],
      startTime: start.getTime(),
      endTime: end.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locationType: data.locationType,
      venue: data.venue || undefined,
      address: data.address || undefined,
      city: data.city,
      state: data.state || undefined,
      country: data.country || "India",
      capacity: data.capacity || 0,
      ticketType: data.ticketType,
      price: data.price || undefined,
      coverImage: data.coverImage || undefined,
      themeColor: data.themeColor,
    };

    await createEvent(eventData);

    toast.success("Event created successfully! 🎉");
    router.push("/my-events");
  } catch (error: any) {
    toast.error(error.message || "Failed to create event");
  }
};
  const handleAIGenerate = (generatedData: GeneratedEventData): void => {
    setValue("title", generatedData.title);
    setValue("description", generatedData.description);
    setValue("category", generatedData.category);
    setValue("capacity", generatedData.suggestedCapacity);
    setValue("ticketType", generatedData.suggestedTicketType);
    toast.success("Event details filled! Customize as needed.");
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300 px-6 py-8 -mt-6 md:-mt-16 lg:-mt-5 lg:rounded-md"
      style={{ backgroundColor: themeColor }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col gap-5 md:flex-row justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold">Create Event</h1>
          {!hasPro && (
            <p className="text-sm text-muted-foreground mt-2">
              Free: {currentUser?.freeEventsCreated ?? 0}/1 events created
            </p>
          )}
        </div>
        <AIEventCreator onEventGenerated={handleAIGenerate} />
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-[320px_1fr] gap-10">
        {/* LEFT: Image + Theme */}
        <div className="space-y-6">
          <div
            className="aspect-square w-full rounded-xl overflow-hidden flex items-center justify-center cursor-pointer border"
            onClick={() => setShowImagePicker(true)}
          >
            {coverImage ? (
              <Image
                src={coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
                width={500}
                height={500}
                priority
              />
            ) : (
              <span className="opacity-60 text-sm">
                Click to add cover image
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Theme Color</Label>
              {!hasPro && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Sparkles className="w-3 h-3" />
                  Pro
                </Badge>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-10 rounded-full border-2 transition-all ${!hasPro && color !== "#1e3a8a"
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:scale-110"
                    }`}
                  style={{
                    backgroundColor: color,
                    borderColor: themeColor === color ? "white" : "transparent",
                  }}
                  onClick={() => handleColorClick(color)}
                  title={
                    !hasPro && color !== "#1e3a8a"
                      ? "Upgrade to Pro for custom colors"
                      : ""
                  }
                />
              ))}
              {!hasPro && (
                <button
                  type="button"
                  onClick={() => {
                    setUpgradeReason("color");
                    setShowUpgradeModal(true);
                  }}
                  className="w-10 h-10 rounded-full border-2 border-dashed border-purple-300 flex items-center justify-center hover:border-purple-500 transition-colors"
                  title="Unlock more colors with Pro"
                >
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </button>
              )}
            </div>
            {!hasPro && (
              <p className="text-xs text-muted-foreground">
                Upgrade to Pro to unlock custom theme colors
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Form */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
          {/* Title */}
          <div>
            <Input
              {...register("title")}
              placeholder="Event Name"
              className="text-3xl font-semibold bg-transparent border-none focus-visible:ring-0"
            />
            {errors.title && (
              <p className="text-sm text-red-400 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Start */}
            <div className="space-y-2">
              <Label className="text-sm">Start</Label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {startDate ? format(startDate, "PPP") : "Pick date"}
                      <CalendarIcon className="w-4 h-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={startDate || undefined}
                      onSelect={(date: Date | undefined) =>
                        date && setValue("startDate", date)
                      }
                      disabled={(date: Date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  {...register("startTime")}
                  placeholder="hh:mm"
                />
              </div>
              {(errors.startDate || errors.startTime) && (
                <p className="text-sm text-red-400">
                  {errors.startDate?.message || errors.startTime?.message}
                </p>
              )}
            </div>

            {/* End */}
            <div className="space-y-2">
              <Label className="text-sm">End</Label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {endDate ? format(endDate, "PPP") : "Pick date"}
                      <CalendarIcon className="w-4 h-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={endDate || undefined}
                      onSelect={(date: Date | undefined) => date && setValue("endDate", date)}
                      disabled={(date: Date) => date < (startDate || new Date())}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  {...register("endTime")}
                  placeholder="hh:mm"
                />
              </div>
              {(errors.endDate || errors.endTime) && (
                <p className="text-sm text-red-400">
                  {errors.endDate?.message || errors.endTime?.message}
                </p>
              )}
            </div>
          </div>

          {/* Location Type */}
          <div className="space-y-2">
            <Label className="text-sm">Location Type</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="in-person"
                  {...register("locationType")}
                  defaultChecked
                />{" "}
                In-Person
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="online" {...register("locationType")} />{" "}
                Online
              </label>
            </div>
          </div>

          {/* Location Details */}
          {locationType === "in-person" && (
            <div className="space-y-3">
              <Label className="text-sm">Location Details</Label>
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val: string) => {
                        field.onChange(val);
                        setValue("city", "");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {indianStates.map((s) => (
                          <SelectItem key={s.isoCode} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />

                <Controller
                  control={control}
                  name="city"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedState}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            selectedState ? "Select city" : "Select state first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.name} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2 mt-4">
                <Input
                  {...register("venue")}
                  placeholder="Venue link (Google Maps Link)"
                  type="url"
                />
                {errors.venue && (
                  <p className="text-sm text-red-400">{errors.venue.message}</p>
                )}

                <Input
                  {...register("address")}
                  placeholder="Full address / street / building (optional)"
                />
              </div>
            </div>
          )}

          {locationType === "online" && (
            <div className="space-y-2">
              <Label className="text-sm">Online Event Link</Label>
              <Input
                {...register("venue")}
                placeholder="Meeting link (Zoom, Google Meet, etc.)"
                type="url"
              />
              {errors.venue && (
                <p className="text-sm text-red-400">{errors.venue.message}</p>
              )}
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-sm">Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-sm text-red-400">{errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              {...register("description")}
              placeholder="Tell people about your event..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Ticketing */}
          <div className="space-y-3">
            <Label className="text-sm">Tickets</Label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="free"
                  {...register("ticketType")}
                  defaultChecked
                />{" "}
                Free
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="paid" {...register("ticketType")} />{" "}
                Paid
              </label>
            </div>

            {ticketType === "paid" && (
              <Input
                type="number"
                placeholder="Ticket price ₹"
                {...register("price", { valueAsNumber: true })}
              />
            )}
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label className="text-sm">Capacity</Label>
            <Input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              placeholder="Ex: 100 (leave empty for unlimited)"
            />
            {errors.capacity && (
              <p className="text-sm text-red-400">{errors.capacity.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-6 text-lg rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
              </>
            ) : (
              "Create Event"
            )}
          </Button>
        </form>
      </div>

      {/* Unsplash Picker */}
      {showImagePicker && (
        <UnsplashImagePicker
          isOpen={showImagePicker}
          onClose={() => setShowImagePicker(false)}
          onSelect={(url: string) => {
            setValue("coverImage", url);
            setShowImagePicker(false);
          }}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger={upgradeReason}
      />
    </div>
  );
}