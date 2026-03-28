// Define Category type
export interface Category {
  id: string;
  label: string;
  icon: string;
  description: string;
}

// Event Categories
export const CATEGORIES: Category[] = [
  {
    id: "tech",
    label: "Technology",
    icon: "💻",
    description: "Tech meetups, hackathons, and developer conferences",
  },
  {
    id: "music",
    label: "Music",
    icon: "🎵",
    description: "Concerts, festivals, and live performances",
  },
  {
    id: "sports",
    label: "Sports",
    icon: "⚽",
    description: "Sports events, tournaments, and fitness activities",
  },
  {
    id: "art",
    label: "Art & Culture",
    icon: "🎨",
    description: "Art exhibitions, cultural events, and creative workshops",
  },
  {
    id: "food",
    label: "Food & Drink",
    icon: "🍕",
    description: "Food festivals, cooking classes, and culinary experiences",
  },
  {
    id: "business",
    label: "Business",
    icon: "💼",
    description: "Networking events, conferences, and startup meetups",
  },
  {
    id: "health",
    label: "Health & Wellness",
    icon: "🧘",
    description: "Yoga, meditation, wellness workshops, and health seminars",
  },
  {
    id: "education",
    label: "Education",
    icon: "📚",
    description: "Workshops, seminars, and learning experiences",
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: "🎮",
    description: "Gaming tournaments, esports, and gaming conventions",
  },
  {
    id: "networking",
    label: "Networking",
    icon: "🤝",
    description: "Professional networking and community building events",
  },
  {
    id: "outdoor",
    label: "Adventure",
    icon: "🏕️",
    description: "Hiking, camping, and outdoor activities",
  },
  {
    id: "community",
    label: "Community",
    icon: "👥",
    description: "Local community gatherings and social events",
  },
];

// Get category by ID
export const getCategoryById = (id: string): Category | undefined => {
  return CATEGORIES.find((cat) => cat.id === id);
};

// Get category label by ID
export const getCategoryLabel = (id: string): string => {
  const category = getCategoryById(id);
  return category ? category.label : id;
};

// Get category icon by ID
export const getCategoryIcon = (id: string): string => {
  const category = getCategoryById(id);
  return category ? category.icon : "📅";
};
