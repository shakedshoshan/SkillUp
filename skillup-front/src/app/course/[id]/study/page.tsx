'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  type Course, 
  type CoursePart, 
  type Lesson, 
  type CourseEnrollment,
  type LessonCompletion,
  CourseService
} from '../../../../lib/services/course.service'
import { useAuth } from '@/hooks/use-auth'
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  ArrowLeft,
  ArrowRight,
  Play,
  Users,
  Target,
  Award,
  Brain,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { LessonViewer } from '../../../../components/course/lesson-viewer'
import { QuizViewer } from '../../../../components/course/quiz-viewer'
import { CourseNavigation } from '../../../../components/course/course-navigation'

export default function CourseStudyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const courseId = params.id as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  
  // Current lesson state
  const [currentPartNumber, setCurrentPartNumber] = useState<number>(1)
  const [currentLessonNumber, setCurrentLessonNumber] = useState<number>(1)
  const [lessonCompletions, setLessonCompletions] = useState<Record<string, LessonCompletion>>({})

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId || !user) return

      try {
        setLoading(true)
        setError(null)
        
        // Fetch course data
        const courseResult = await CourseService.getCourseById(courseId)
        if (!courseResult.success) {
          throw new Error(courseResult.error || 'Failed to fetch course')
        }
        setCourse(courseResult.data)

        // Check enrollment status
        const enrollmentResult = await CourseService.getCourseEnrollment(user.id, courseId)
        if (enrollmentResult.success && enrollmentResult.data) {
          setEnrollment(enrollmentResult.data)
          setCurrentPartNumber(enrollmentResult.data.current_part_number)
          setCurrentLessonNumber(enrollmentResult.data.current_lesson_number)
        }

        // Load lesson completions efficiently
        try {
          const completionsResult = await CourseService.getCourseCompletions(user.id, courseId)
          if (completionsResult.success && completionsResult.data) {
            const completions: Record<string, LessonCompletion> = {}
            completionsResult.data.forEach(completion => {
              completions[completion.lesson_id] = completion
            })
            setLessonCompletions(completions)
          }
        } catch (err) {
          console.error('Failed to load lesson completions:', err)
          // Continue without completions - they'll be loaded as needed
        }

        // Check URL params for specific lesson
        const partParam = searchParams.get('part')
        const lessonParam = searchParams.get('lesson')
        if (partParam && lessonParam) {
          setCurrentPartNumber(parseInt(partParam))
          setCurrentLessonNumber(parseInt(lessonParam))
          // Scroll to top when loading a specific lesson from URL
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch course data')
      } finally {
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [courseId, user, searchParams])

  // Scroll to top whenever the current lesson changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPartNumber, currentLessonNumber])

  const handleEnroll = async () => {
    if (!user || !courseId) return

    try {
      setEnrolling(true)
      const result = await CourseService.enrollInCourse(user.id, courseId)
      
      if (result.success && result.data) {
        setEnrollment(result.data)
        setCurrentPartNumber(1)
        setCurrentLessonNumber(1)
      } else {
        throw new Error(result.error || 'Failed to enroll')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in course')
    } finally {
      setEnrolling(false)
    }
  }

  const handleProgressUpdate = async (partNumber: number, lessonNumber: number) => {
    if (!user || !courseId) return

    try {
      await CourseService.updateProgress(user.id, courseId, partNumber, lessonNumber)
      setCurrentPartNumber(partNumber)
      setCurrentLessonNumber(lessonNumber)
    } catch (err) {
      console.error('Failed to update progress:', err)
    }
  }

  const handleLessonComplete = async (lessonId: string, timeSpent?: number) => {
    if (!user) return

    try {
      const result = await CourseService.completeLesson(user.id, lessonId, timeSpent)
      if (result.success && result.data) {
        setLessonCompletions(prev => ({
          ...prev,
          [lessonId]: result.data!
        }))
      }
    } catch (err) {
      console.error('Failed to complete lesson:', err)
    }
  }

  const getCurrentLesson = (): { part: CoursePart; lesson: Lesson } | null => {
    if (!course?.parts) return null
    
    const part = course.parts.find(p => p.part_number === currentPartNumber)
    if (!part) return null
    
    const lesson = part.lessons.find(l => l.lesson_number === currentLessonNumber)
    if (!lesson) return null
    
    return { part, lesson }
  }

  const navigateToLesson = (partNumber: number, lessonNumber: number) => {
    setCurrentPartNumber(partNumber)
    setCurrentLessonNumber(lessonNumber)
    handleProgressUpdate(partNumber, lessonNumber)
    
    // Scroll to top of the page when navigating to a new lesson
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getNextLesson = (): { partNumber: number; lessonNumber: number } | null => {
    if (!course?.parts) return null
    
    const currentPart = course.parts.find(p => p.part_number === currentPartNumber)
    if (!currentPart) return null
    
    // Try next lesson in current part
    const nextLessonInPart = currentPart.lessons.find(l => l.lesson_number === currentLessonNumber + 1)
    if (nextLessonInPart) {
      return { partNumber: currentPartNumber, lessonNumber: currentLessonNumber + 1 }
    }
    
    // Try first lesson of next part
    const nextPart = course.parts.find(p => p.part_number === currentPartNumber + 1)
    if (nextPart && nextPart.lessons.length > 0) {
      return { partNumber: currentPartNumber + 1, lessonNumber: 1 }
    }
    
    return null
  }

  const getPreviousLesson = (): { partNumber: number; lessonNumber: number } | null => {
    if (!course?.parts) return null
    
    const currentPart = course.parts.find(p => p.part_number === currentPartNumber)
    if (!currentPart) return null
    
    // Try previous lesson in current part
    if (currentLessonNumber > 1) {
      return { partNumber: currentPartNumber, lessonNumber: currentLessonNumber - 1 }
    }
    
    // Try last lesson of previous part
    const previousPart = course.parts.find(p => p.part_number === currentPartNumber - 1)
    if (previousPart && previousPart.lessons.length > 0) {
      const lastLessonNumber = Math.max(...previousPart.lessons.map(l => l.lesson_number))
      return { partNumber: currentPartNumber - 1, lessonNumber: lastLessonNumber }
    }
    
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <LoadingSpinner text="Loading course..." />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Error</div>
              <p className="text-gray-600 text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">Course not found</div>
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not enrolled view
  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link href={`/course/${courseId}`}>
                <Button variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Course Details
                </Button>
              </Link>
            </div>

            <div className="text-center py-8">
              <div className="mb-6">
                <BookOpen className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                <p className="text-gray-600 mb-4">{course.description}</p>
                
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.target_audience}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.total_duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.parts?.length || 0} Parts</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ready to start learning?</h3>
                <p className="text-gray-600 mb-6">
                  Enroll in this course to access all lessons, quizzes, and track your progress.
                </p>
                
                <Button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  size="lg"
                  className="px-8 py-3"
                >
                  {enrolling ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 mr-2" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Enroll & Start Learning
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentLessonData = getCurrentLesson()
  const nextLesson = getNextLesson()
  const previousLesson = getPreviousLesson()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
                <Link href={`/course/${courseId}`}>
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </Link>
              </div>

              <CourseNavigation
                course={course}
                currentPartNumber={currentPartNumber}
                currentLessonNumber={currentLessonNumber}
                lessonCompletions={lessonCompletions}
                onLessonSelect={navigateToLesson}
                enrollment={enrollment}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              {currentLessonData ? (
                <div>
                  {/* Lesson Header */}
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {currentPartNumber}.{currentLessonNumber}
                        </div>
                        <div>
                          <h1 className="text-xl font-bold text-gray-900">
                            {currentLessonData.lesson.title}
                          </h1>
                          <p className="text-sm text-gray-600">
                            Part {currentPartNumber}: {currentLessonData.part.title}
                          </p>
                        </div>
                      </div>
                      
                      {lessonCompletions[currentLessonData.lesson.id] && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700">{currentLessonData.lesson.description}</p>
                  </div>

                  {/* Lesson Content */}
                  <div className="p-6">
                    {currentLessonData.lesson.content && (
                      <LessonViewer
                        lesson={currentLessonData.lesson}
                        isCompleted={!!lessonCompletions[currentLessonData.lesson.id]}
                        onComplete={(timeSpent) => handleLessonComplete(currentLessonData.lesson.id, timeSpent)}
                      />
                    )}

                    {currentLessonData.lesson.quiz && (
                      <div className="mt-8">
                        <QuizViewer
                          lesson={currentLessonData.lesson}
                          userId={user?.id || ''}
                          isLessonCompleted={!!lessonCompletions[currentLessonData.lesson.id]}
                          onQuizComplete={(score, total) => {
                            handleLessonComplete(currentLessonData.lesson.id)
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="p-6 border-t bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        {previousLesson ? (
                          <Button
                            variant="outline"
                            onClick={() => navigateToLesson(previousLesson.partNumber, previousLesson.lessonNumber)}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous Lesson
                          </Button>
                        ) : (
                          <div></div>
                        )}
                      </div>

                      <div>
                        {nextLesson ? (
                          <Button
                            onClick={() => navigateToLesson(nextLesson.partNumber, nextLesson.lessonNumber)}
                          >
                            Next Lesson
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : (
                          <Button variant="outline" disabled>
                            Course Complete!
                            <Award className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-gray-500 mb-4">Lesson not found</div>
                  <Button variant="outline" onClick={() => {
                    setCurrentPartNumber(1)
                    setCurrentLessonNumber(1)
                  }}>
                    Go to First Lesson
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 