'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  type Course, 
  type CourseEnrollment,
  CourseService 
} from '@/lib/services/course.service'
import { useAuth } from '@/hooks/use-auth'
import { 
  BookOpen, 
  Clock, 
  Users, 
  Award, 
  Play, 
  CheckCircle,
  Calendar,
  Target
} from 'lucide-react'
import Link from 'next/link'

interface CourseWithEnrollment extends Course {
  enrollment: CourseEnrollment
}

export function UserCourses() {
  const { user } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithEnrollment[]>([])
  const [createdCourses, setCreatedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'enrolled' | 'created'>('enrolled')

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Fetch enrolled courses
        const enrolledResult = await CourseService.getEnrolledCourses(user.id)
        if (enrolledResult.success && enrolledResult.data) {
          setEnrolledCourses(enrolledResult.data)
        }

        // Fetch created courses
        const createdResult = await CourseService.getCoursesByUser(user.id)
        if (createdResult.success && createdResult.data) {
          setCreatedCourses(createdResult.data)
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch courses')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [user])

  const getDifficultyColor = (difficulty: string | undefined | null) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800'
    
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

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    if (percentage >= 25) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <LoadingSpinner text="Loading your courses..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Failed to load courses</div>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Courses</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'enrolled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('enrolled')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Enrolled ({enrolledCourses.length})
          </Button>
          <Button
            variant={activeTab === 'created' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('created')}
          >
            <Award className="h-4 w-4 mr-2" />
            Created ({createdCourses.length})
          </Button>
        </div>
      </div>

      {/* Course Content */}
      {activeTab === 'enrolled' ? (
        <div className="space-y-4">
          {enrolledCourses.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No enrolled courses yet</h3>
              <p className="text-gray-600 mb-4">
                Start your learning journey by enrolling in courses that interest you.
              </p>
              <Link href="/courses">
                <Button>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Courses
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {/* Course Header */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                        <Badge className={getDifficultyColor(course.difficulty_level)}>
                          {course.difficulty_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{course.enrollment.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(course.enrollment.progress_percentage)}`}
                          style={{ width: `${course.enrollment.progress_percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{course.total_duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>Part {course.enrollment.current_part_number}</span>
                      </div>
                    </div>

                    {/* Enrollment Info */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Enrolled {formatDate(course.enrollment.enrollment_date)}</span>
                      {course.enrollment.completion_date && (
                        <>
                          <span>•</span>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-green-600">Completed {formatDate(course.enrollment.completion_date)}</span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link 
                        href={`/course/${course.id}/study?part=${course.enrollment.current_part_number}&lesson=${course.enrollment.current_lesson_number}`}
                        className="flex-1"
                      >
                        <Button className="w-full" size="sm">
                          {course.enrollment.progress_percentage === 100 ? (
                            <>
                              <Award className="h-4 w-4 mr-2" />
                              Review Course
                            </>
                          ) : course.enrollment.progress_percentage > 0 ? (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Continue Learning
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Start Learning
                            </>
                          )}
                        </Button>
                      </Link>
                      <Link href={`/course/${course.id}`}>
                        <Button variant="outline" size="sm">
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {createdCourses.length === 0 ? (
            <Card className="p-8 text-center">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses created yet</h3>
              <p className="text-gray-600 mb-4">
                Share your knowledge by creating and publishing your own courses.
              </p>
              <Link href="/generate-course">
                <Button>
                  <Award className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdCourses.map((course) => (
                <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {/* Course Header */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                        <Badge className={course.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                    </div>

                    {/* Course Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{course.target_audience}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{course.total_duration}</span>
                      </div>
                    </div>

                    {/* Creation Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(course.created_at)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/course/${course.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Course
                        </Button>
                      </Link>
                      {course.is_published && (
                        <Link href={`/course/${course.id}/study`}>
                          <Button size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 