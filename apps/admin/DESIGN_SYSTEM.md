# Design System - Unified Layout Components

This document outlines the unified design system for consistent page layouts across The School Quiz application.

## Core Components

### PageLayout
Standard page wrapper with consistent background and header.
- Background: `bg-gray-50 dark:bg-[#1A1A1A]`
- Padding: `pt-24 pb-16`
- Includes SiteHeader

### PageContainer
Consistent container with max-width and padding.
- Max-width options: `sm`, `md`, `lg`, `xl`, `2xl`, `4xl`, `6xl`, `full`
- Padding: `px-4 sm:px-6 lg:px-8`
- Centered: `mx-auto`

### PageHeader
Standard page header with consistent typography.
- Title: `text-4xl md:text-5xl lg:text-6xl font-bold`
- Subtitle: `text-lg md:text-xl`
- Optional centered alignment
- Framer Motion animations

### ContentCard
Standard content card with consistent styling.
- Background: `bg-white dark:bg-gray-900`
- Border: `border-gray-200/50 dark:border-gray-800/50`
- Padding: `sm`, `md`, `lg`, `xl`
- Rounded: `lg`, `xl`, `2xl`, `3xl` (default: `3xl`)
- Shadow: `shadow-sm`
- Framer Motion animations with optional delay

## Design Principles

1. **Consistency**: All pages use the same layout components
2. **Spacing**: Consistent padding and margins throughout
3. **Typography**: Unified heading sizes and text styles
4. **Cards**: All content cards use `rounded-3xl` by default
5. **Backgrounds**: Unified background colors (`bg-gray-50 dark:bg-[#1A1A1A]`)
6. **Animations**: Subtle, consistent Framer Motion animations

## Usage Examples

```tsx
import { PageLayout, PageContainer, PageHeader, ContentCard } from '@/components/layout';

export default function MyPage() {
  return (
    <PageLayout>
      <PageContainer maxWidth="xl">
        <PageHeader 
          title="Page Title" 
          subtitle="Page description"
          centered
        />
        
        <ContentCard padding="lg" rounded="3xl">
          {/* Content */}
        </ContentCard>
      </PageContainer>
    </PageLayout>
  );
}
```

