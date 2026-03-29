"use client";

import React, { useRef } from 'react'
import { api } from '@/convex/_generated/api';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { Doc } from '@/convex/_generated/dataModel';
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, Loader2, MapPin, Users } from 'lucide-react';
import { format } from "date-fns";
import { Button } from '@/components/ui/button';
import { createLocationSlug } from '@/lib/location-utils';
import EventCard from '@/components/event-card';
import { CATEGORIES } from '@/lib/data';
import { useOnboarding } from '@/hooks/use-onboarding';
import OnboardingModal from '@/components/ui/onboarding-modal';



const ExplorePage = () => {

  const { data: currentUser } = useConvexQuery<Doc<"users"> | null>(api.users.getCurrentUser);
  const { showOnboarding, handleOnboardingComplete, handleOnboardingSkip } = useOnboarding();

  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  const router = useRouter();


  const { data: featuredEvents, loading: loadingFeatured } = useConvexQuery(api.explore.getFeaturedEvents, { limit: 3 });

  console.log(featuredEvents);

  useConvexQuery(api.explore.getEventsByLocation, {
    city: currentUser?.location?.city || "Ranchi",
    state: currentUser?.location?.state || "Jharkhand",
    country: currentUser?.location?.country || "India",
    limit: 4
  });

  const { data: localEvents, loading: loadingLocal } = useConvexQuery(api.explore.getEventsByLocation, {
    city: currentUser?.location?.city || "Ranchi",
    state: currentUser?.location?.state || "Jharkhand",
    country: currentUser?.location?.country || "India",
    limit: 4
  });

  console.log("Error Line", currentUser);

  const { data: popularEvents, loading: loadingPopular } = useConvexQuery(api.explore.getPopularEvents, { limit: 4 });

const { data: categoryCounts } =
  useConvexQuery(api.explore.getCategoryCounts);

const categoriesWithCounts = CATEGORIES.map((category) => ({
  ...category,
  count: categoryCounts?.[category.id] ?? 0,
}));



  const handleEventClick = (slug: string) => {
    // Navigate to event details page
    router.push(`/events/${slug}`);
  }

    const handelCategoryClick = (categoryId: string) => {
    // Navigate to event details page
    router.push(`/explore/${categoryId}`);
  }

  const handleViewLocalEvents = () => {
    const city = currentUser?.location?.city || "Ranchi";
    const state = currentUser?.location?.state || "Jharkhand";
    const country = currentUser?.location?.country || "India";

    const slug = createLocationSlug(city, state);

    router.push(`/explore/${slug}`);
  };

  //loading states
  const isLoading = loadingFeatured || loadingLocal || loadingPopular;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='animate-spin w-8 h-8 text-purple-500' />
      </div>
    )
  }


  return (
    <>

      <div className=' pb-12 text-center'>
        <h1 className=' text-5xl md:text-6xl font-bold mb-4'>
          Discover Events
        </h1>
        <p className=' text-lg text-muted-foreground max-w-3xl mx-auto'>
          Good vibes. Cool people. Great events.
          Discover tech meetups, music festivals, and more happening around you. Pull up, connect, and enjoy the moment.
        </p>

      </div>

      {/* Featured Carousel  */}

      {featuredEvents && featuredEvents.length > 0 && (
        <div className='mb-16'>

          <Carousel className="w-full "
            plugins={[plugin.current]}
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}

          >
            <CarouselContent>
              {featuredEvents.map((event: any) => (
                <CarouselItem key={event._id}>

                  <div onClick={() => handleEventClick(event.slug)}
                    className=' relative h-[400px] rounded-xl overflow-hidden cursor-pointer'>

                    {event.coverImage ? (
                      <Image
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div
                        className=' absolute inset-0'
                        style={{ backgroundColor: event.themeColor }}
                      >

                      </div>
                    )
                    }

                    <div className='absolute inset-0  bg-gradient-to-r from-black/60 to-black/30'>
                    </div>

                    <div className=' relative h-full flex flex-col items-center md:items-start justify-end   p-6 md:p-12'>
                      <Badge
                        className="w-fit mb-4" variant="secondary">
                        {event.city}, {event.state} || {event.country}


                      </Badge>

                      <h2 className="text-3xl md:text-5xl font-bold mb-3 text-white">
                        {event.title}
                      </h2>
                      <p className="text-lg text-white/90 mb-4 max-w-2xl line-clamp-2">
                        {event.description}
                      </p>

                      <div className='flex items-center gap-4 text-white/80'>
                        <div className='flex items-center gap-2'>
                          <Calendar className='w-4 h-4' />
                          <span className="text-sm">
                            {format(new Date(event.startTime), "PPP")}
                          </span>

                        </div>

                        <div className=' flex items-center gap-2'>
                          <MapPin className='w-4 h-4' />
                          <span className="text-sm">
                            {event.city}
                          </span>
                        </div>
                        <div className=' flex items-center gap-2'>
                          <Users className='w-4 h-4' />
                          <span className="text-sm">
                            {event.registrationCount} going
                          </span>
                        </div>

                      </div>
                    </div>

                  </div>

                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className='left-4' />
            <CarouselNext className='right-4' />
          </Carousel>

        </div>
      )}

      {/* Local Events  */}

      {localEvents && localEvents.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-1">Events Near You</h2>
              <p className="text-muted-foreground">
                Happening in {currentUser?.location?.city || "your area"}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleViewLocalEvents}
            >
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {localEvents.map((event: any) => (
              <EventCard
                key={event._id}
                event={event}
                variant="grid"
                onClick={() => handleEventClick(event.slug)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Browse by Category  */}

      <div className="mb-16">
        <h2 className=' text-3xl font-bold mb-6'>Browse by Category</h2>

        <div className=' grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
          {categoriesWithCounts.map((category) => (
            <Card
              key={category.id}
              className=' py-2 group cursor-pointer hover:bg-secondary/50 transition-all
              hover:border-purple-500/50'
              onClick={() => handelCategoryClick(category.id)}
              >
                <CardContent className=' flex items-center flex-col justify-center gap-2'>
                  <div className=' text-3xl sm:text-4xl'>{category.icon}</div>

                  <div className = ' flex-1 min-w-0'>
                    <h3 className = " font-semibold mb-1 group-hover:text-purple-400 transition-all ">
                      {category.label}
                    </h3>
                    <p className = " text-sm text-muted-foreground">
                      {category.count} event{category.count !== 1 ? "" : "s"}
                    </p>
                  </div>
                  </CardContent>
              </Card>
          ))}

          </div>
        </div>

      {/* Popular Events in Your Area  */}
      {popularEvents && popularEvents.length > 0 && (
        <div className="mb-16">
          <div className = " mb-6">
            <h2 className = " text-3xl font-bold mb-1">Hot Picks Across India</h2>
            <p className = " text-muted-foreground">Trending events nationwide
            </p>
          </div>

          <div className = " grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularEvents.map((event: any) => (
              <EventCard
                key={event._id}
                event={event}
                variant="list"
                onClick={() => handleEventClick(event.slug)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State  */}

      { !loadingFeatured && !loadingLocal && !loadingPopular && featuredEvents?.length === 0 && localEvents?.length === 0 && popularEvents?.length === 0 && (
        <Card className='p-12 text-center'>
          <div className = "max-w-md mx-auto space-y-4">
            <div className = "text-6xl mb-4">🧐</div>
            <h2 className = " text-2xl font-bold">No events yet</h2>
            <p className = " text-muted-foreground">
              Looks like your area is empty. Start something!
            </p>
            <Button asChild className = " gap-2">
              <a href="/create-event">
                Create Event <ArrowRight className='w-4 h-4' />
              </a>
            </Button>
          </div>
      

    </Card>
      )}

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingSkip}
        onComplete={handleOnboardingComplete}
      />
    </>
  )
}

export default ExplorePage