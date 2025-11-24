# Custom Quiz Branding - School Logo Upload Complete

## Summary

School emblem/logo upload functionality has been implemented for custom quizzes. Users can now upload their school logo to appear on quiz PDFs.

## What Was Implemented

### 1. Logo Upload API ✅

**Endpoint:** `POST /api/premium/custom-quizzes/upload-logo`

**Features:**
- Premium user verification
- File validation (type, size, dimensions)
- Upload to Supabase Storage
- Organized by user ID: `school-logos/{userId}/{timestamp}-{random}.{ext}`
- Returns public URL for storage

**Specifications:**
- **Max file size:** 2MB
- **Max dimensions:** 512x512px (validated client-side)
- **Allowed formats:** PNG, JPG, JPEG, WebP, SVG
- **Recommended:** Square format, PNG with transparent background
- **Storage bucket:** Uses existing `achievements` bucket (or can use `custom-quizzes` bucket)

### 2. School Logo Upload Component ✅

**Component:** `SchoolLogoUpload` (`apps/admin/src/components/premium/SchoolLogoUpload.tsx`)

**Features:**
- Drag-and-drop or click to upload
- Image preview
- Progress indicator
- Error handling with clear messages
- Remove/replace functionality
- Automatic image optimization (except SVG)
- Dimension validation (warns if not square)
- Client-side validation before upload

**Image Processing:**
- PNG/JPG/WebP: Optimized to max 512x512px, WebP format, 90% quality
- SVG: Uploaded as-is (no optimization needed)
- Automatic size reduction for large files

### 3. Branding Section in Quiz Builder ✅

**Location:** `/custom-quizzes/create`

**Features:**
- School logo upload
- Custom heading input (max 100 chars)
- Custom subheading input (max 200 chars)
- All fields optional
- Character counters
- Integrated into save flow

**UI:**
- Clean, intuitive interface
- Helpful descriptions and recommendations
- Preview of uploaded logo
- Validation feedback

### 4. Integration with Save Flow ✅

**Process:**
1. User uploads logo (stored immediately in Supabase)
2. User enters branding text (optional)
3. On save, branding data is sent to `/api/premium/custom-quizzes/{id}/branding`
4. Logo URL, heading, and subheading are saved to quiz record

**Data Flow:**
- Logo upload → Supabase Storage → Returns URL
- URL stored in `quiz.schoolLogoUrl`
- Heading/subheading stored in `quiz.brandHeading` / `quiz.brandSubheading`

## File Format Specifications

### Recommended Format
- **Format:** PNG with transparent background
- **Dimensions:** Square (1:1 aspect ratio)
- **Size:** Up to 512x512px
- **File size:** Up to 2MB (optimized automatically)

### Accepted Formats
- PNG (recommended for transparency)
- JPG/JPEG
- WebP
- SVG (vector, no optimization)

### Validation Rules
- File type must be image
- Max dimensions: 512x512px (warns if not square)
- Max file size: 2MB (before optimization)
- Client-side validation before upload

## Storage Structure

```
Supabase Storage: achievements bucket
└── school-logos/
    └── {userId}/
        ├── {timestamp}-{random}.png
        ├── {timestamp}-{random}.jpg
        └── ...
```

**Benefits:**
- Organized by user
- Unique filenames prevent conflicts
- Easy to manage per-user storage
- Can implement cleanup policies later

## Next Steps (Phase 4)

1. **PDF Generation Integration**
   - Include logo in PDF header
   - Use custom heading/subheading
   - Handle logo sizing and positioning
   - Fallback if logo fails to load

2. **Logo Management**
   - View uploaded logos
   - Delete unused logos
   - Reuse logos across quizzes

3. **Preview**
   - Show branding preview in quiz builder
   - Preview PDF with branding before generating

## Files Created/Modified

**New Files:**
- `apps/admin/src/app/api/premium/custom-quizzes/upload-logo/route.ts`
- `apps/admin/src/components/premium/SchoolLogoUpload.tsx`
- `docs/CUSTOM_QUIZ_BRANDING_COMPLETE.md`

**Modified Files:**
- `apps/admin/src/app/custom-quizzes/create/page.tsx` - Added branding section
- `apps/admin/src/app/api/premium/custom-quizzes/[id]/branding/route.ts` - Already exists, handles branding updates

## Notes

- Logo upload happens immediately (not on save)
- Logo URL is stored in quiz record
- Branding is optional - quizzes work without it
- Logo is optimized automatically (except SVG)
- Storage uses existing Supabase bucket structure
- All validation happens client-side before upload
- Error messages are user-friendly

