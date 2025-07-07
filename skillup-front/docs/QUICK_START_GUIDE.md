# SkillUp Frontend Quick Start Guide

## Getting Started

This guide will help you quickly understand and start using the SkillUp UI components.

## Essential Imports

```tsx
// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, FullPageSpinner } from '@/components/ui/loading-spinner'

// Layout Components
import { Navigation } from '@/components/layout/navigation'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

// Icons
import { Plus, BookOpen, User, Settings } from 'lucide-react'
```

## Common Patterns

### Page Layout Structure

```tsx
export default function MyPage() {
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Page', isActive: true }
  ]

  return (
    <div className="bg-gray-50 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Page Header */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Page Title</CardTitle>
            <CardDescription>Page description</CardDescription>
          </CardHeader>
        </Card>

        {/* Page Content */}
        <Card>
          <CardContent>
            {/* Your content here */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### Loading States

```tsx
// Page loading
if (loading) {
  return <FullPageSpinner text="Loading..." />
}

// Component loading
<Card>
  <CardContent>
    {loading ? (
      <LoadingSpinner text="Loading data..." />
    ) : (
      <div>Your content</div>
    )}
  </CardContent>
</Card>
```

### Empty States

```tsx
<Card>
  <CardContent>
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <BookOpen className="h-8 w-8 text-blue-500" />
      </div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2">No items found</h4>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        Get started by creating your first item.
      </p>
      <Button onClick={handleCreate}>
        <Plus className="h-4 w-4 mr-2" />
        Create Item
      </Button>
    </div>
  </CardContent>
</Card>
```

### Error States

```tsx
<Card>
  <CardContent>
    <div className="text-center py-8">
      <div className="text-red-500 mb-2">Failed to load data</div>
      <p className="text-gray-600 text-sm mb-4">{error}</p>
      <Button variant="outline" onClick={retry}>
        Try Again
      </Button>
    </div>
  </CardContent>
</Card>
```

### Form Layout

```tsx
<Card>
  <CardHeader>
    <CardTitle>Form Title</CardTitle>
    <CardDescription>Form description</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  </CardContent>
</Card>
```

### Grid Layouts

```tsx
{/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((stat, index) => (
    <Card key={index}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <stat.icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

{/* Content Cards */}
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <Card key={item.id} variant="interactive">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-2">{item.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{item.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{item.status}</Badge>
          <Button size="sm" onClick={() => handleView(item.id)}>
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

## Color Usage Guide

### Background Colors
- `bg-gray-50` - Page backgrounds
- `bg-white` - Card backgrounds
- `bg-blue-50` - Light accent backgrounds
- `bg-gradient-to-r from-blue-500 to-purple-600` - Hero sections

### Text Colors
- `text-gray-900` - Primary text
- `text-gray-600` - Secondary text
- `text-gray-500` - Tertiary text
- `text-blue-600` - Primary brand text
- `text-green-600` - Success text
- `text-red-600` - Error text

### Interactive States
```tsx
// Hover effects
className="hover:bg-gray-50 hover:text-blue-600 transition-colors"

// Focus states
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"

// Active states
className={`${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
```

## Mobile Responsiveness

### Responsive Grid
```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Hide on mobile
<div className="hidden sm:block">

// Show only on mobile
<div className="sm:hidden">

// Responsive spacing
<div className="px-4 sm:px-6 lg:px-8">
```

### Mobile Navigation
```tsx
// The Navigation component automatically handles mobile responsiveness
// No additional configuration needed
```

## Common Utilities

### Spacing
```tsx
className="space-y-4"     // Vertical spacing between children
className="space-x-2"     // Horizontal spacing between children
className="gap-6"         // Grid/flex gap
```

### Layout
```tsx
className="flex items-center justify-between"
className="grid grid-cols-1 md:grid-cols-2"
className="max-w-7xl mx-auto"
```

### Text Utilities
```tsx
className="line-clamp-2"      // Truncate after 2 lines
className="truncate"          // Truncate with ellipsis
className="font-medium"       // Medium font weight
className="text-sm"           // Small text size
```

## Animation Classes

```tsx
// Transitions
className="transition-colors duration-200"
className="transition-all duration-200"

// Hover effects
className="hover:shadow-md transition-shadow"
className="group-hover:text-blue-700"

// Loading animations
className="animate-spin"
className="animate-pulse"
```

## Best Practices

1. **Always use the component variants** instead of custom CSS
2. **Follow the spacing system** (4, 8, 12, 16, 24px, etc.)
3. **Use semantic HTML elements** (`button`, `nav`, `main`, etc.)
4. **Include proper accessibility attributes** (`aria-label`, `role`, etc.)
5. **Test on mobile devices** early and often
6. **Use TypeScript interfaces** for all component props
7. **Handle loading and error states** consistently

## Quick Reference

### Button Variants
- `default` - Primary blue button
- `outline` - Bordered button
- `ghost` - Text-only button
- `secondary` - Gray button

### Card Variants
- `default` - Standard card
- `elevated` - Elevated shadow
- `interactive` - Hover effects

### Badge Variants
- `success` - Green for positive states
- `warning` - Yellow for warnings
- `danger` - Red for errors
- `secondary` - Gray for neutral states

This quick start guide should help you build consistent, beautiful interfaces with the SkillUp component system! 