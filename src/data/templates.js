// Template data for showcasing and guiding users
export const groupTemplates = [
  {
    id: 'family-memories',
    name: 'Family Memories',
    description: 'Share special moments with your loved ones throughout the year',
    icon: '👨‍👩‍👧‍👦',
    category: 'Family',
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
    name: 'Wedding Chronicles',
    description: 'Document your wedding journey from engagement to honeymoon',
    icon: '💍',
    category: 'Special Events',
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
    name: 'Baby\'s First Year',
    description: 'Chronicle every precious milestone of your little one\'s first year',
    icon: '👶',
    category: 'Milestones',
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
    name: 'Travel Adventures',
    description: 'Create a visual diary of your journeys around the world',
    icon: '✈️',
    category: 'Travel',
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
    name: 'School Year Memories',
    description: 'Capture every moment from first day to graduation',
    icon: '🎒',
    category: 'Education',
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
    name: 'Pet Chronicles',
    description: 'Document the adorable moments with your furry family members',
    icon: '🐾',
    category: 'Pets',
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
    name: 'Garden Through Seasons',
    description: 'Track your garden\'s transformation throughout the year',
    icon: '🌱',
    category: 'Hobbies',
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
    name: 'Home Renovation Journey',
    description: 'Document your home transformation from start to finish',
    icon: '🏠',
    category: 'Projects',
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
