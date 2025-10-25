// Mock data for Scrapi dashboard

export const mockActors = [
  {
    id: '1',
    name: 'Google Maps Scraper V2',
    description: 'Extract businesses, places, reviews from Google Maps',
    icon: '🗺️',
    category: 'Maps & Location',
    runs: 559,
    lastRun: '2024-10-15 10:16:09',
    lastRunStatus: 'Succeeded',
    lastRunDuration: '7 s',
    isStarred: false,
    isPremium: false
  },
  {
    id: '2',
    name: 'Google Search Results Scraper',
    description: 'Scrape organic search results, ads, and featured snippets',
    icon: '🔍',
    category: 'Search Engines',
    runs: 296,
    lastRun: '2024-10-15 02:15:13',
    lastRunStatus: 'Succeeded',
    lastRunDuration: '3 m 24 m',
    isStarred: false,
    isPremium: false
  },
  {
    id: '3',
    name: 'Google Shopping Scraper',
    description: 'Extract product listings, prices, and reviews from Google Shopping',
    icon: '🛒',
    category: 'E-commerce',
    runs: 128,
    lastRun: '2024-10-14 05:39:51',
    lastRunStatus: 'Succeeded',
    lastRunDuration: '30 m 47 s',
    isStarred: false,
    isPremium: false
  },
  {
    id: '4',
    name: 'Google Images Scraper',
    description: 'Download images from Google Images search results',
    icon: '🖼️',
    category: 'Media',
    runs: 218,
    lastRun: '2024-10-13 12:46:10',
    lastRunStatus: 'Succeeded',
    lastRunDuration: '2 m 23 s',
    isStarred: false,
    isPremium: false
  }
];

export const mockRuns = [
  {
    id: 'run-1',
    actorId: '1',
    actorName: 'Google Maps Scraper V2',
    status: 'Succeeded',
    startedAt: '2024-10-15 10:16:02',
    finishedAt: '2024-10-15 10:16:09',
    duration: '7 s',
    resultsCount: 150,
    cost: 0.12
  },
  {
    id: 'run-2',
    actorId: '2',
    actorName: 'Google Search Results Scraper',
    status: 'Running',
    startedAt: '2024-10-15 10:18:00',
    finishedAt: null,
    duration: '2 m 15 s',
    resultsCount: 85,
    cost: 0.08
  }
];

export const mockDataset = [
  {
    id: '1',
    title: 'Central Park Coffee Shop',
    subtitle: 'Coffee shop',
    category: 'Coffee Shop',
    address: '1234 Park Ave, New York, NY 10021',
    phone: '+1 212-555-0123',
    website: 'https://centralparkcoffe.com',
    rating: 4.5,
    reviewsCount: 1247,
    latitude: 40.7829,
    longitude: -73.9654,
    placeId: 'ChIJXYZ123ABC',
    url: 'https://maps.google.com/place?cid=123456789',
    openingHours: ['Mon-Fri: 7AM-8PM', 'Sat-Sun: 8AM-9PM'],
    priceLevel: '$$',
    isPermanentlyClosed: false
  },
  {
    id: '2',
    title: 'Brooklyn Pizza House',
    subtitle: 'Pizza restaurant',
    category: 'Italian Restaurant',
    address: '567 Brooklyn Ave, Brooklyn, NY 11201',
    phone: '+1 718-555-0456',
    website: 'https://brooklynpizza.com',
    rating: 4.7,
    reviewsCount: 2891,
    latitude: 40.6782,
    longitude: -73.9442,
    placeId: 'ChIJABC456DEF',
    url: 'https://maps.google.com/place?cid=987654321',
    openingHours: ['Mon-Sun: 11AM-11PM'],
    priceLevel: '$$$',
    isPermanentlyClosed: false
  }
];

export const mockUser = {
  id: 'user-1',
  username: 'demo@scrapi.com',
  organizationName: 'Demo Organization',
  avatar: null,
  plan: 'Free',
  usage: {
    memory: 0,
    totalMemory: 32
  }
};
