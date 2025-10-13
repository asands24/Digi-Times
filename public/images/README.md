# Images Directory

This directory contains image assets for the DigiTimes application.

## Structure

- `/placeholders/` - Placeholder images for development and testing
- Stock photos are served from Unsplash CDN (see `src/data/stockPhotos.js`)

## Adding Images

### Local Images
Place your images in this directory and reference them using:
```javascript
<img src={process.env.PUBLIC_URL + '/images/your-image.jpg'} alt="Description" />
```

### Stock Photos
Stock photos from Unsplash are referenced in `src/data/stockPhotos.js` and are served directly from Unsplash's CDN.

## Legal Notice

All stock photos are from Unsplash.com under the Unsplash License:
- Free to use for commercial and non-commercial purposes
- No permission needed
- Attribution appreciated but not required

License details: https://unsplash.com/license
