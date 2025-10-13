// Template data for showcasing and guiding users
export const groupTemplates = [
  {
    id: 'family-memories',
    title: 'Family Memories',
    name: 'Family Memories',
    description:
      'Share special moments with your loved ones throughout the year',
    icon: '👨‍👩‍👧‍👦',
    category: 'Family',
    photoCategory: 'family',
    sampleImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80',
    suggestedEvents: [
      'Birthday Celebrations',
      'Holiday Gatherings',
      'Family Reunions',
      'Vacation Photos'
    ],
    example: 'Perfect for keeping grandparents, aunts, uncles, and cousins connected with photo updates'
  },
  {
    id: 'wedding-chronicles',
    title: 'Wedding Chronicles',
    name: 'Wedding Chronicles',
    description: 'Document your wedding journey from engagement to honeymoon',
    icon: '💍',
    category: 'Special Events',
    photoCategory: 'wedding',
    sampleImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
    suggestedEvents: [
      'Engagement Photos',
      'Bridal Shower',
      'Bachelor/Bachelorette Party',
      'Wedding Day',
      'Honeymoon Adventures'
    ],
    example: 'Share the magic with your wedding party and guests who couldn\'t attend'
  },
  {
    id: 'baby-first-year',
    title: "Baby's First Year",
    name: "Baby's First Year",
    description: 'Chronicle every precious milestone of your little one\'s first year',
    icon: '👶',
    category: 'Milestones',
    photoCategory: 'baby',
    sampleImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80',
    suggestedEvents: [
      'Coming Home',
      'Monthly Milestones',
      'First Smile',
      'First Steps',
      'First Birthday'
    ],
    example: 'Keep family near and far updated on every adorable moment'
  },
  {
    id: 'travel-adventures',
    title: 'Travel Adventures',
    name: 'Travel Adventures',
    description: 'Create a visual diary of your journeys around the world',
    icon: '✈️',
    category: 'Travel',
    photoCategory: 'travel',
    sampleImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80',
    suggestedEvents: [
      'Trip Planning',
      'Day-by-Day Highlights',
      'Local Cuisine',
      'Scenic Views',
      'Travel Companions'
    ],
    example: 'Share your adventures with friends who love to explore'
  },
  {
    id: 'school-year',
    title: 'School Year Memories',
    name: 'School Year Memories',
    description: 'Capture every moment from first day to graduation',
    icon: '🎒',
    category: 'Education',
    photoCategory: 'education',
    sampleImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=80',
    suggestedEvents: [
      'First Day of School',
      'School Events & Field Trips',
      'Sports & Activities',
      'Academic Achievements',
      'End of Year Celebration'
    ],
    example: 'Share school memories with extended family and create a year-end keepsake'
  },
  {
    id: 'pet-chronicles',
    title: 'Pet Chronicles',
    name: 'Pet Chronicles',
    description: 'Document the adorable moments with your furry family members',
    icon: '🐾',
    category: 'Pets',
    photoCategory: 'pets',
    sampleImage: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400&q=80',
    suggestedEvents: [
      'Adoption Day',
      'Training Progress',
      'Playtime Moments',
      'Vet Visits',
      'Birthday Celebrations'
    ],
    example: 'Share your pet\'s antics with fellow animal lovers'
  },
  {
    id: 'garden-seasons',
    title: 'Garden Through Seasons',
    name: 'Garden Through Seasons',
    description: 'Track your garden\'s transformation throughout the year',
    icon: '🌱',
    category: 'Hobbies',
    photoCategory: 'garden',
    sampleImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
    suggestedEvents: [
      'Spring Planting',
      'Garden Progress',
      'Harvest Time',
      'Garden Visitors',
      'Winter Preparation'
    ],
    example: 'Share gardening tips and progress with your green-thumb community'
  },
  {
    id: 'home-renovation',
    title: 'Home Renovation Journey',
    name: 'Home Renovation Journey',
    description: 'Document your home transformation from start to finish',
    icon: '🏠',
    category: 'Projects',
    photoCategory: 'renovation',
    sampleImage: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400&q=80',
    suggestedEvents: [
      'Before Photos',
      'Demolition Day',
      'Progress Updates',
      'Design Choices',
      'Final Reveal'
    ],
    example: 'Keep interested friends and family updated on your renovation adventure'
  }
]

export const newsletterExamples = [
  {
    title: 'Monthly Family Digest',
    description: 'A monthly roundup of family activities, milestones, and fun moments',
    frequency: 'Monthly'
  },
  {
    title: 'Weekly Photo Journal',
    description: 'Quick weekly updates with highlights from the past 7 days',
    frequency: 'Weekly'
  },
  {
    title: 'Special Event Edition',
    description: 'Dedicated coverage of birthdays, holidays, and celebrations',
    frequency: 'Event-based'
  },
  {
    title: 'Quarterly Highlights',
    description: 'Season-by-season recap of the best moments',
    frequency: 'Quarterly'
  }
]

export const getTemplatesByCategory = () => {
  const categories = {}
  groupTemplates.forEach(template => {
    if (!categories[template.category]) {
      categories[template.category] = []
    }
    categories[template.category].push(template)
  })
  return categories
}

export const getRandomTemplates = (count = 3) => {
  const shuffled = [...groupTemplates].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
