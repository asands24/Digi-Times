# Stock Photos Integration Guide

This guide explains how to use the stock legal photos that have been added to your DigiTimes application.

## What Was Added

### 1. Stock Photos Data (`src/data/stockPhotos.js`)
A comprehensive collection of **legal, free-to-use stock photos** from Unsplash organized by category:

- **Family** - Family gatherings and bonding moments
- **Wedding** - Wedding ceremonies and celebrations
- **Baby** - Newborn and milestone moments
- **Travel** - Adventure and scenic destinations
- **Education** - School and learning moments
- **Pets** - Cute pet moments
- **Garden** - Garden and plant care
- **Renovation** - Home improvement projects
- **General** - Celebration and social gatherings

Each photo includes:
- Full-size URL (800px width)
- Thumbnail URL (400px width)
- Alt text for accessibility
- Category classification
- Searchable tags

### 2. Updated Templates (`src/data/templates.js`)
All group templates now include:
- `photoCategory` - Links to corresponding stock photo category
- `sampleImage` - Direct URL to a representative sample image

### 3. Stock Photo Gallery Component (`src/components/StockPhotoGallery.js`)
A ready-to-use React component for displaying stock photos with:
- Grid layout with responsive design
- Click to enlarge functionality
- Category filtering
- Photo attribution (legal compliance)
- Hover effects

### 4. Central Export File (`src/data/index.js`)
Convenient single import for all data:
```javascript
import { stockPhotos, getPhotosByCategory, getRandomPhotos } from '../data'
```

### 5. Images Directory Structure (`public/images/`)
Created for future local image storage with documentation

## How to Use

### Basic Usage - Display Photos by Category

```javascript
import { getPhotosByCategory } from '../data/stockPhotos'

const MyComponent = () => {
  const familyPhotos = getPhotosByCategory('family')

  return (
    <div>
      {familyPhotos.map(photo => (
        <img key={photo.id} src={photo.thumbnail} alt={photo.alt} />
      ))}
    </div>
  )
}
```

### Get Random Photos

```javascript
import { getRandomPhotos } from '../data/stockPhotos'

const MyComponent = () => {
  // Get 6 random photos from all categories
  const randomPhotos = getRandomPhotos(6)

  // Get 3 random photos from a specific category
  const randomFamilyPhotos = getRandomPhotos(3, 'family')

  return <div>{/* Display photos */}</div>
}
```

### Using the Gallery Component

```javascript
import StockPhotoGallery from '../components/StockPhotoGallery'

// Show family photos
<StockPhotoGallery category="family" limit={6} />

// Show random photos from all categories
<StockPhotoGallery limit={9} />
```

### Search Photos by Tag

```javascript
import { searchPhotosByTag } from '../data/stockPhotos'

const celebrationPhotos = searchPhotosByTag('celebration')
const outdoorPhotos = searchPhotosByTag('outdoor')
```

### Access Template Sample Images

```javascript
import { groupTemplates } from '../data/templates'

const TemplateCard = ({ template }) => (
  <div>
    <img src={template.sampleImage} alt={template.name} />
    <h3>{template.name}</h3>
  </div>
)
```

## Legal Information

All photos are from **Unsplash.com** under the **Unsplash License**:

✅ **Free to use** for commercial and non-commercial purposes
✅ **No permission needed**
✅ **Attribution appreciated** but not required

License details: https://unsplash.com/license

The `photoAttribution` object is available in `stockPhotos.js` for easy display:

```javascript
import { photoAttribution } from '../data/stockPhotos'

<p>
  Photos from <a href={photoAttribution.licenseUrl}>
    {photoAttribution.source}
  </a>
</p>
```

## Available Categories

1. `family` - Family moments
2. `wedding` - Wedding events
3. `baby` - Baby milestones
4. `travel` - Travel adventures
5. `education` - School and learning
6. `pets` - Pet moments
7. `garden` - Gardening
8. `renovation` - Home improvement
9. `general` - General celebrations

## Helper Functions Reference

| Function | Description | Parameters |
|----------|-------------|------------|
| `getPhotosByCategory(category)` | Get all photos in a category | category: string |
| `getRandomPhotos(count, category)` | Get random photos | count: number, category?: string |
| `getAllPhotos()` | Get all photos from all categories | none |
| `searchPhotosByTag(tag)` | Search photos by tag | tag: string |

## Example Integration with Template System

```javascript
import { groupTemplates } from '../data/templates'
import { getPhotosByCategory } from '../data/stockPhotos'

const TemplateWithPhotos = ({ templateId }) => {
  const template = groupTemplates.find(t => t.id === templateId)
  const photos = getPhotosByCategory(template.photoCategory)

  return (
    <div>
      <h2>{template.name}</h2>
      <img src={template.sampleImage} alt={template.name} />
      <div className="photo-gallery">
        {photos.slice(0, 3).map(photo => (
          <img key={photo.id} src={photo.thumbnail} alt={photo.alt} />
        ))}
      </div>
    </div>
  )
}
```

## Next Steps

You can now:

1. Use the StockPhotoGallery component in your pages
2. Display sample images with templates
3. Create photo-based UI elements
4. Add local images to `public/images/` directory as needed
5. Extend the stock photos collection in `stockPhotos.js`

All photos are served from Unsplash's CDN, so they load quickly without increasing your bundle size!
