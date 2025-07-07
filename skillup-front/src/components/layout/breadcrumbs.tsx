'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
  isActive?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const router = useRouter()

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
        aria-label="Go to dashboard"
      >
        <Home className="h-4 w-4" />
      </button>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          {item.href && !item.isActive ? (
            <button
              onClick={() => router.push(item.href || '/dashboard')}
              className="text-gray-500 hover:text-blue-600 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className={item.isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
} 