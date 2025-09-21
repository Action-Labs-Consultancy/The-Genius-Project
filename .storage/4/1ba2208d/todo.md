# Landing Page Builder - MVP Implementation

## Overview
Create a React-based landing page builder with timeline milestones, funnel stages, and media asset management capabilities.

## Core Files to Create/Modify

1. **src/pages/Index.tsx** - Main landing page builder component
2. **src/components/IsolatedInput.tsx** - Controlled input component
3. **src/components/AssetUploadForm.tsx** - Media asset upload form
4. **src/hooks/useStoredState.ts** - Custom hook for persistent state (localStorage)
5. **package.json** - Add required dependencies
6. **index.html** - Update title

## Key Features to Implement

### Edit Tab
- Timeline milestones management (5 milestones)
- Funnel stages (awareness, download, registration, apply)
- Media asset upload with categories
- Budget tracking (USD/BHD)
- Challenge/Solution sections
- Product selection
- Growth percentage tracking

### Preview Tab
- Visual timeline with milestone cards
- Media asset galleries
- Budget displays
- Challenge/solution presentations

## Dependencies Needed
- @tanstack/react-query (already included)
- lucide-react (for icons)
- React hooks for state management

## Implementation Strategy
1. Create persistent state hook using localStorage
2. Build modular components for reusability
3. Implement edit functionality first
4. Create preview visualization
5. Add media upload capabilities
6. Style with Tailwind CSS and Shadcn components

## File Relationships
- Index.tsx imports IsolatedInput and AssetUploadForm
- useStoredState hook provides persistence across page reloads
- Components use Shadcn UI components for consistent styling