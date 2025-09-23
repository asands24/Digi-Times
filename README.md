# Photo Newsletter App

A collaborative photo sharing platform that lets friends create beautiful newsletters together. Built with React and Supabase.

## Features

### Core Features
- **Friend Groups**: Create or join invitation-only groups
- **Photo Upload**: Upload photos from camera roll with drag & drop
- **Newsletter Creation**: Solo or collaborative newsletter building
- **Event Management**: Organize photos by events with details (date, location, description, attendees)
- **Multiple Layouts**: Choose from 6 different newsletter layouts
- **Event Categories**: Organize events by type (social, travel, food, celebration, sports, cultural)

### Newsletter Layouts
1. **Grid**: Clean photo grid with event details
2. **Timeline**: Chronological timeline view
3. **Magazine**: Professional magazine-style layout
4. **Polaroid**: Nostalgic polaroid photo arrangement
5. **Minimal**: Clean, minimalist design
6. **Scrapbook**: Fun scrapbook-style layout

### Authentication
- **Magic Link**: Secure passwordless authentication
- **Invitation-Only**: Groups require invite codes
- **User Profiles**: Display names and avatars

## Tech Stack

- **Frontend**: React 18, React Router, Lucide Icons
- **Backend**: Supabase (Database, Auth, Storage)
- **Styling**: CSS with utility classes
- **Hosting**: Netlify
- **File Handling**: Image compression and validation

## Quick Start

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd photo-newsletter-app
npm install
```

### 2. Setup Supabase
Follow the complete setup guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 3. Configure Environment
```bash
cp .env.example .env
# Add your Supabase credentials to .env
```

### 4. Run Development Server
```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Deploy to Production
Follow the deployment guide in [DEPLOYMENT.md](./DEPLOYMENT.md)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthCallback.js  # Handle auth redirects
│   ├── LoadingSpinner.js
│   ├── NewsletterPreview.js  # Layout previews
│   └── PhotoUpload.js   # File upload component
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication state
├── hooks/               # Custom React hooks
│   ├── useAuth.js       # Authentication operations
│   ├── useEvents.js     # Event CRUD operations
│   ├── useGroups.js     # Group management
│   ├── useInvite.js     # Invitation handling
│   ├── useNewsletters.js # Newsletter operations
│   └── usePhotos.js     # Photo upload/management
├── lib/
│   └── supabase.js      # Supabase client configuration
├── pages/               # Main application pages
│   ├── DashboardPage.js # Groups overview
│   ├── GroupPage.js     # Group newsletters view
│   ├── LoginPage.js     # Authentication
│   └── NewsletterPage.js # Newsletter editor
├── utils/
│   └── imageUtils.js    # Image processing utilities
└── App.js               # Main app component
```

## Database Schema

### Tables
- **profiles**: User information (extends auth.users)
- **friend_groups**: Group information with invite codes
- **group_members**: Many-to-many group membership
- **newsletters**: Newsletter metadata and settings
- **events**: Event details within newsletters
- **event_attendees**: Event attendance tracking
- **photos**: Photo metadata and storage paths
- **newsletter_collaborators**: Collaboration permissions

### Storage
- **photos bucket**: Secure photo storage with RLS policies

## Key Features Explained

### Magic Link Authentication
Users sign in via email magic links. No passwords required. New users are automatically added to the profiles table.

### Invitation System
Groups use 8-character invite codes. Users can join by entering the code during sign-in or after authentication.

### Photo Management
- Client-side validation and compression
- Secure upload to Supabase Storage
- Automatic thumbnail generation
- File size limits (10MB per photo)

### Newsletter Layouts
Six distinct layout engines provide different visual styles:
- Grid: Structured photo grids
- Timeline: Chronological event flow
- Magazine: Editorial-style layouts
- Polaroid: Casual, rotated photo arrangements
- Minimal: Clean, typography-focused
- Scrapbook: Playful, decorated layouts

### Row Level Security
All database operations use RLS policies ensuring users can only access their groups' data.

## Development

### Available Scripts
```bash
npm start          # Development server
npm run build      # Production build
npm test           # Run tests
npm run eject      # Eject from Create React App
```

### Code Style
- Use functional components with hooks
- Implement proper error handling
- Follow existing naming conventions
- Add loading states for async operations

### Adding Features
1. Create hooks for data operations
2. Build reusable components
3. Add proper error handling
4. Update RLS policies if needed
5. Test thoroughly before deployment

## Security

- **RLS Policies**: All data access controlled by Row Level Security
- **File Validation**: Client and server-side file type/size validation
- **Authentication**: Secure magic link authentication
- **Environment Variables**: Sensitive data stored in environment variables
- **CORS**: Properly configured for production domains

## Performance

- **Image Optimization**: Automatic compression and resizing
- **Code Splitting**: React lazy loading for optimal bundle sizes
- **Caching**: Proper cache headers for static assets
- **Database Indexes**: Optimized queries with proper indexing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting sections in setup guides
2. Review Supabase documentation
3. Create an issue in the repository

## Acknowledgments

- Built with [Supabase](https://supabase.com)
- Icons by [Lucide](https://lucide.dev)
- Hosted on [Netlify](https://netlify.com)