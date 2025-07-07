'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CourseService, type Course } from '@/lib/services'
import { useAuth } from '../../hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BookOpen, Clock, DollarSign, Plus, Edit, Eye, ExternalLink, Star, PlayCircle } from 'lucide-react'

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

  const getDifficultyVariant = (difficulty: string | undefined | null) => {
    if (!difficulty) {
      return 'secondary';
    }
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'success'
      case 'intermediate':
        return 'warning'
      case 'advanced':
        return 'danger'
      default:
        return 'secondary'
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
      <Card variant="default" className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Your Courses</span>
            </CardTitle>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
          <CardDescription>Manage and track your created courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8">
            <LoadingSpinner text="Loading your courses..." />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card variant="default" className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Your Courses</span>
            </CardTitle>
            <Button onClick={() => router.push('/generate-course')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
          <CardDescription>Manage and track your created courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">Failed to load courses</div>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="default" className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span>Your Courses</span>
          </CardTitle>
          <Button onClick={() => router.push('/generate-course')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
        <CardDescription>Manage and track your created courses</CardDescription>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No courses created yet</h4>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Start building your first course with our AI-powered course generator. 
              Share your knowledge and expertise with learners worldwide.
            </p>
            <Button 
              onClick={() => router.push('/generate-course')}
              className="inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Course
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} variant="interactive" className="group">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-t-lg flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-blue-600 group-hover:text-blue-700 transition-colors" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                          {course.title}
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant={getDifficultyVariant(course.difficulty || course.difficulty_level)} size="sm">
                            {course.difficulty || course.difficulty_level}
                          </Badge>
                          <Badge variant={course.is_published ? 'success' : 'secondary'} size="sm">
                            {course.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {course.category && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>{course.category}</span>
                          </div>
                        )}
                        {(course.estimated_hours || course.total_duration) && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{course.estimated_hours ? `${course.estimated_hours}h` : course.total_duration}</span>
                          </div>
                        )}
                        {course.price && course.currency && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{formatPrice(course.price, course.currency)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span>0.0</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/course/${course.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          // TODO: Add edit functionality
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          // TODO: Add share functionality
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 