'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CourseService, type Course } from '@/lib/services'
import { useAuth } from '../../hooks/use-auth'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BookOpen, Clock, DollarSign, Plus, Edit, Eye, Link } from 'lucide-react'

interface UserCoursesProps {
  className?: string
}

export default function UserCourses({ className }: UserCoursesProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        setError(null)
        const response = await CourseService.getCoursesByUser(user.id)
        setCourses(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [user?.id])

  const getDifficultyColor = (difficulty: string | undefined | null) => {
    if (!difficulty) {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price)
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Your Projects</h3>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
        <div className="py-8">
          <LoadingSpinner text="Loading your courses..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Your Projects</h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Failed to load courses</div>
          <p className="text-gray-600 text-sm">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Your Projects</h3>
        <Link href="/generate-course" className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md">
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h4>
          <p className="text-gray-600 mb-4">
            Create your first course to start sharing your knowledge with the world.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Course
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{course.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty || course.difficulty_level)}`}>
                      {course.difficulty || course.difficulty_level}
                    </span>
                    {course.is_published ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {course.category && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.category}</span>
                      </div>
                    )}
                    {course.estimated_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.estimated_hours}h</span>
                      </div>
                    )}
                    {course.total_duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.total_duration}</span>
                      </div>
                    )}
                    {course.price && course.currency && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatPrice(course.price, course.currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push(`/course/${course.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 