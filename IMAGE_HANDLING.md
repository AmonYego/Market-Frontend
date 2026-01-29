# Image Handling Implementation Guide

## Overview

This document explains how images are properly handled across the marketplace application, from upload to display.

## Data Type

**Product Interface** (`src/types.ts`):

```typescript
interface Product {
  // ... other fields
  images: string[]; // Array of public Supabase URLs
}
```

**Critical**: The `images` field is **always an array of strings**, never a single string or File objects.

## Frontend Image Handling

### 1. Image Array Validation (`src/utils/imageValidation.ts`)

A dedicated utility module provides safe image validation:

```typescript
// Check if product has valid images
hasValidImages(product: Product): boolean

// Get safe array of valid image URLs
getValidImageUrls(product: Product): string[]

// Get first image URL
getFirstImageUrl(product: Product): string

// Validate URL is from Supabase
isValidSupabaseUrl(url: string): boolean

// Debug and log image state
validateAndLogImageState(product: Product): void
```

### 2. ProductCard Component (`src/components/ProductCard.tsx`)

**Features:**

- ✅ Validates images array before rendering
- ✅ Filters out empty/invalid URLs
- ✅ Displays image counter (e.g., "1/3")
- ✅ Navigation arrows for multiple images
- ✅ Thumbnail indicators at bottom
- ✅ Graceful fallback placeholder when no images
- ✅ Comprehensive error logging

**Key Logic:**

```typescript
// Only render if images is valid array with items
const validImageUrls = Array.isArray(product.images)
  ? product.images.filter((url) => typeof url === "string" && url.trim() !== "")
  : [];

// Show current image with navigation
if (validImageUrls.length > 0) {
  // Render image gallery with carousel
}
```

### 3. ProductDetailPage Component (`src/App.tsx`)

**Features:**

- ✅ Full-screen image viewer
- ✅ Image carousel navigation (arrows)
- ✅ Thumbnail gallery below main image
- ✅ Image counter in top-right
- ✅ Proper error handling per image
- ✅ Debug logging via utility function

**Image Array Handling:**

```typescript
// Safely extract valid images
const validImages = useMemo(() => {
  if (!Array.isArray(product.images)) return [];
  return product.images.filter(
    url => typeof url === 'string' && url.trim() !== ''
  );
}, [product.images]);

// Map over array for gallery
validImages.map((img, index) => (
  <img key={index} src={img} alt={`Image ${index + 1}`} />
))
```

## Backend Integration

### Image Upload Process

1. **Frontend sends**: `FormData` with `File[]` objects (not URLs)

   ```typescript
   if (product.images && product.images.length > 0) {
     product.images.forEach((image: any) => {
       if (image instanceof File) {
         formData.append("images", image);
       }
     });
   }
   ```

2. **Backend processes**:
   - Receives `UploadFile[]` from form
   - Uploads each to Supabase bucket
   - Generates public URLs
   - Stores URL array in PostgreSQL

3. **Backend returns**: Array of public URLs
   ```json
   {
     "images": [
       "https://nufeuxdqjfithhleezox.supabase.co/storage/v1/object/public/product-images/userId/uuid1.jpg",
       "https://nufeuxdqjfithhleezox.supabase.co/storage/v1/object/public/product-images/userId/uuid2.jpg"
     ]
   }
   ```

### Database Schema

**PostgreSQL**: Images stored as `ARRAY(String)` type

```python
images: List[str] = []  # SQLAlchemy definition
```

## Troubleshooting

### Images Not Displaying

1. **Check Supabase bucket configuration**:
   - Bucket must be named `product-images`
   - Bucket must be **PUBLIC** (not private)
   - Verify in Supabase dashboard

2. **Check image URLs in browser console**:

   ```javascript
   // Open DevTools Console and run:
   console.log(products[0].images);
   // Should show array like:
   // ["https://nufeuxdqjfithhleezox.supabase.co/storage/v1/object/public/product-images/userId/uuid.jpg"]
   ```

3. **Test image URL directly**:
   - Copy URL from console
   - Open in new tab
   - Should display image or show 404 error

4. **Enable debug logging**:
   ```javascript
   // Run in console on home page
   const btn = document.querySelector('button:has-text("Log Full Data")');
   btn?.click(); // Logs all products to console
   ```

### Common Issues

| Issue                            | Cause                                       | Solution                                     |
| -------------------------------- | ------------------------------------------- | -------------------------------------------- |
| "No image available" placeholder | `images` array is empty or null             | Check backend is returning images            |
| 404 errors in console            | Supabase bucket doesn't exist or is private | Create/configure bucket in Supabase          |
| CORS errors                      | Images from different origin                | Ensure `crossOrigin="anonymous"` on img tags |
| Wrong image type                 | `images` is string instead of array         | Verify backend returns `"images": []`        |

## Testing

### Manual Testing Checklist

- [ ] Create product with single image
- [ ] Verify image displays in product card
- [ ] Create product with 3+ images
- [ ] Test image carousel arrows in card
- [ ] Click product to go to detail page
- [ ] Verify all images accessible in detail view
- [ ] Click thumbnails to switch images
- [ ] Test image counter updates (1/3, 2/3, etc.)
- [ ] Delete image from detail page
- [ ] Verify fallback shows when no images

### Debug Commands

```javascript
// In browser console on any page with products:

// 1. Check all products
console.table(window.__products);

// 2. Validate first product images
const p = window.__products?.[0];
console.log("Is array?", Array.isArray(p?.images));
console.log("Length:", p?.images?.length);
console.log("URLs:", p?.images);

// 3. Test image URL
const url = p?.images?.[0];
const img = new Image();
img.onload = () => console.log("✓ Image loads");
img.onerror = () => console.log("✗ Image fails");
img.src = url;

// 4. Detailed validation
import { validateAndLogImageState } from "./utils/imageValidation";
validateAndLogImageState(p);
```

## Code Examples

### Correct: Mapping Over Image Array

```typescript
// ✅ CORRECT - Maps each image
{validImages.map((url, index) => (
  <img
    key={index}
    src={url}
    alt={`Image ${index + 1}`}
  />
))}

// ❌ WRONG - Uses only first image
<img src={product.images[0]} />

// ❌ WRONG - Treats array as single value
<img src={product.images} />
```

### Correct: Fallback Handling

```typescript
// ✅ CORRECT - Checks array validity
if (Array.isArray(images) && images.length > 0) {
  // Show images
} else {
  // Show placeholder
}

// ❌ WRONG - Checks only existence
if (product.images) {
  // Show images - fails if array is empty!
}
```

### Correct: Error Handling

```typescript
// ✅ CORRECT - Per-image error handling
onError={() => {
  console.error(`Image ${index + 1} failed:`, url)
  // Show fallback for this specific image
}}

// ❌ WRONG - Removes all images on single failure
<img
  src={product.images[0]}
  onError={() => setImages([])} // Breaks everything!
/>
```

## Performance Considerations

1. **Image Lazy Loading** (Future Enhancement):
   - Implement lazy loading for products grid
   - Only load images when visible

2. **Image Optimization**:
   - Ensure images are properly sized
   - Consider compression in backend

3. **Array Filtering**:
   - Uses `useMemo` to avoid unnecessary recalculations
   - Memoizes valid images array

## Related Files

- `src/types.ts` - Product interface definition
- `src/components/ProductCard.tsx` - Grid view image rendering
- `src/App.tsx` - Detail page image gallery
- `src/utils/imageValidation.ts` - Image validation utilities
- `src/Services/dbService.ts` - Backend API communication
- `Backend/main.py` - Image upload and URL generation
