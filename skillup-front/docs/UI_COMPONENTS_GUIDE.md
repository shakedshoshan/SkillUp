# SkillUp Frontend UI Components Guide

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [Component Library](#component-library)
4. [Layout Components](#layout-components)
5. [Page Components](#page-components)
6. [User Experience Guidelines](#user-experience-guidelines)
7. [Accessibility](#accessibility)
8. [Development Guidelines](#development-guidelines)

## Overview

The SkillUp frontend is built with Next.js 14, TypeScript, and Tailwind CSS, featuring a modern, accessible, and user-friendly interface. This guide provides comprehensive documentation for all UI components and design patterns.

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: Supabase
- **State Management**: React Context + Hooks
- **TypeScript**: Full type safety

## Design System

### Color Palette

#### Primary Colors
- **Blue**: `blue-50` to `blue-900` - Primary brand color
- **Purple**: `purple-50` to `purple-900` - Secondary brand color
- **Indigo**: `indigo-50` to `indigo-900` - Accent color

#### Semantic Colors
- **Success**: `green-50` to `green-900`
- **Warning**: `yellow-50` to `yellow-900`  
- **Danger**: `red-50` to `red-900`
- **Info**: `indigo-50` to `indigo-900`
- **Gray**: `gray-50` to `gray-900` - Neutral colors

### Typography

#### Font Families
- **Sans**: Geist Sans (Primary)
- **Mono**: Geist Mono (Code/IDs)

#### Text Sizes
- `text-xs` (12px) - Small labels, captions
- `text-sm` (14px) - Body text, descriptions
- `text-base` (16px) - Standard body text
- `text-lg` (18px) - Large body text
- `text-xl` (20px) - Subheadings
- `text-2xl` (24px) - Section headings
- `text-3xl` (30px) - Page titles
- `text-4xl` (36px) - Hero titles

### Spacing System
- `space-1` (4px) to `space-96` (384px)
- Standard spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px

### Border Radius
- `rounded-none` (0px)
- `rounded-sm` (2px)
- `rounded` (4px)
- `rounded-md` (6px)
- `rounded-lg` (8px)
- `rounded-xl` (12px)
- `rounded-full` (9999px)

## Component Library

### Button Component

**Location**: `src/components/ui/button.tsx`

```tsx
import { Button } from '@/components/ui/button'

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>

// With Icons
<Button>
  <Plus className="h-4 w-4 mr-2" />
  Create Course
</Button>
```

### Card Component

**Location**: `src/components/ui/card.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

// Variants
<Card variant="default">Standard card</Card>
<Card variant="elevated">Elevated shadow</Card>
<Card variant="outlined">Outlined border</Card>
<Card variant="interactive">Hover effects</Card>

// With content structure
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### Badge Component

**Location**: `src/components/ui/badge.tsx`

```tsx
import { Badge } from '@/components/ui/badge'

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Outline</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

### Input Component

**Location**: `src/components/ui/input.tsx`

```tsx
import { Input } from '@/components/ui/input'

<Input
  type="text"
  placeholder="Enter text..."
  className="w-full"
/>

// With form integration
<div className="space-y-2">
  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
    Email
  </label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
  />
</div>
```

### Loading Spinner

**Location**: `src/components/ui/loading-spinner.tsx`

```tsx
import { LoadingSpinner, FullPageSpinner } from '@/components/ui/loading-spinner'

// Regular spinner
<LoadingSpinner size="sm" text="Loading..." />
<LoadingSpinner size="md" text="Processing..." />
<LoadingSpinner size="lg" text="Generating course..." />

// Full page spinner
<FullPageSpinner text="Loading application..." />
```

## Layout Components

### Navigation Component

**Location**: `src/components/layout/navigation.tsx`

**Features**:
- Responsive mobile menu
- User dropdown with profile management
- Active state indicators
- Notification bell (placeholder)
- Logo navigation

**Usage**: Automatically included in root layout

### Breadcrumbs Component

**Location**: `src/components/layout/breadcrumbs.tsx`

```tsx
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

<Breadcrumbs 
  items={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Courses', href: '/courses' },
    { label: 'Course Details', isActive: true }
  ]} 
/>
```

## Page Components

### Dashboard Page

**Location**: `src/app/dashboard/page.tsx`

**Features**:
- Welcome header with gradient background
- Quick stats cards with metrics
- Quick actions grid
- Recent activity and achievements sections
- User courses grid

**Key Elements**:
- Personalized greeting
- Member since badge
- Interactive stat cards
- Action cards with icons
- Empty states with clear CTAs

### Course Generation Page

**Location**: `src/app/generate-course/page.tsx`

**Features**:
- Feature highlights
- Step-by-step process explanation
- Real-time course generation
- Success feedback
- Navigation integration

### User Courses Component

**Location**: `src/components/dashboard/user-courses.tsx`

**Features**:
- Grid layout for courses
- Course cards with thumbnails
- Difficulty and status badges
- Action buttons (view, edit, share)
- Empty state with onboarding

## User Experience Guidelines

### Loading States

1. **Page Loading**: Use `FullPageSpinner` for initial page loads
2. **Component Loading**: Use `LoadingSpinner` for component-specific loading
3. **Button Loading**: Disable buttons and show loading text
4. **Progressive Loading**: Show skeleton states where appropriate

### Empty States

1. **Descriptive**: Clear explanation of why the area is empty
2. **Actionable**: Primary action to help users get started
3. **Visual**: Use relevant icons to illustrate the concept
4. **Encouraging**: Positive, motivating copy

### Error Handling

1. **Clear Messages**: Explain what went wrong in user-friendly language
2. **Recovery Actions**: Provide ways for users to recover or retry
3. **Visual Indicators**: Use appropriate colors and icons
4. **Context**: Show errors near the relevant component

### Feedback

1. **Immediate**: Provide instant feedback for user actions
2. **Progress**: Show progress for long-running operations
3. **Success**: Celebrate successful completions
4. **Contextual**: Show feedback where the action occurred

### Navigation

1. **Breadcrumbs**: Help users understand their location
2. **Active States**: Clearly indicate current page/section
3. **Hierarchy**: Logical navigation structure
4. **Mobile-First**: Responsive navigation patterns

## Accessibility

### ARIA Labels
- Use semantic HTML elements
- Add `aria-label` for icon-only buttons
- Include `aria-describedby` for form validation

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Logical tab order
- Focus indicators visible
- Escape key closes modals/dropdowns

### Color Contrast
- All text meets WCAG AA standards
- Don't rely solely on color to convey information
- Use icons and text together for status indicators

### Screen Readers
- Alt text for meaningful images
- Descriptive link text
- Proper heading hierarchy
- Form labels associated with inputs

## Development Guidelines

### File Structure

```
src/
├── components/
│   ├── ui/                    # Base UI components
│   ├── layout/               # Layout components
│   ├── auth/                 # Authentication components
│   ├── course/               # Course-related components
│   └── dashboard/            # Dashboard components
├── app/                      # Next.js app router pages
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities and services
└── docs/                     # Documentation
```

### Naming Conventions

1. **Components**: PascalCase (`UserCourses.tsx`)
2. **Files**: kebab-case (`user-courses.tsx`)
3. **Props**: camelCase (`onCourseGenerated`)
4. **CSS Classes**: Use Tailwind utilities

### Component Guidelines

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition**: Build complex UIs from simple components
3. **Props Interface**: Define clear TypeScript interfaces
4. **Default Props**: Use sensible defaults
5. **Error Boundaries**: Handle errors gracefully

### CSS Guidelines

1. **Tailwind First**: Use Tailwind utilities for styling
2. **Custom CSS**: Only when Tailwind is insufficient
3. **Responsive Design**: Mobile-first approach
4. **Consistent Spacing**: Use design system spacing
5. **Performance**: Minimize custom CSS

### State Management

1. **Local State**: Use `useState` for component-specific state
2. **Global State**: Use Context for shared state
3. **Server State**: Use proper data fetching patterns
4. **Forms**: Use controlled components with validation

### Performance

1. **Code Splitting**: Use dynamic imports for large components
2. **Image Optimization**: Use Next.js Image component
3. **Lazy Loading**: Load components when needed
4. **Memoization**: Use React.memo for expensive components

### Testing

1. **Unit Tests**: Test individual components
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Test with screen readers
4. **Visual Regression**: Test UI changes

## Best Practices

### Component Design

1. **Reusability**: Design components to be reused across the app
2. **Flexibility**: Use props to customize behavior and appearance
3. **Consistency**: Follow established patterns and conventions
4. **Documentation**: Document complex components and their props

### User Interface

1. **Progressive Enhancement**: Basic functionality works without JavaScript
2. **Responsive Design**: Works well on all device sizes
3. **Touch Targets**: Minimum 44px for mobile touch targets
4. **Visual Hierarchy**: Clear information hierarchy with typography and spacing

### Code Quality

1. **TypeScript**: Use strict TypeScript for all components
2. **Linting**: Follow ESLint and Prettier rules
3. **Performance**: Optimize for Core Web Vitals
4. **Security**: Sanitize user inputs and validate data

## Future Enhancements

### Planned Components

1. **Modal/Dialog**: For confirmations and forms
2. **Tooltip**: For additional context
3. **Toast Notifications**: For system feedback
4. **Data Tables**: For course management
5. **Form Components**: Enhanced form inputs
6. **Charts**: For analytics dashboard

### Design System Improvements

1. **Dark Mode**: Toggle between light and dark themes
2. **Animation Library**: Smooth micro-interactions
3. **Design Tokens**: CSS custom properties
4. **Component Variants**: More styling options
5. **Layout Patterns**: Reusable layout components

This guide serves as the foundation for consistent, accessible, and maintainable UI development in the SkillUp application. 