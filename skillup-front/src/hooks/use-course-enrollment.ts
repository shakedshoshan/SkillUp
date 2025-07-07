import { useState, useEffect } from 'react'
import { 
  type CourseEnrollment, 
  type LessonCompletion,
  CourseService 
} from '../lib/services/course.service'

interface UseCourseEnrollmentOptions {
  userId?: string
  courseId?: string
  autoFetch?: boolean
}

interface UseCourseEnrollmentReturn {
  enrollment: CourseEnrollment | null
  lessonCompletions: Record<string, LessonCompletion>
  loading: boolean
  error: string | null
  enrollInCourse: (courseId: string) => Promise<void>
  updateProgress: (partNumber: number, lessonNumber: number) => Promise<void>
  completeLesson: (lessonId: string, timeSpent?: number) => Promise<void>
  fetchEnrollment: () => Promise<void>
  fetchLessonCompletions: (lessonIds: string[]) => Promise<void>
}

export function useCourseEnrollment({ 
  userId, 
  courseId, 
  autoFetch = true 
}: UseCourseEnrollmentOptions = {}): UseCourseEnrollmentReturn {
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null)
  const [lessonCompletions, setLessonCompletions] = useState<Record<string, LessonCompletion>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEnrollment = async () => {
    if (!userId || !courseId) return

    try {
      setLoading(true)
      setError(null)
      
      const result = await CourseService.getCourseEnrollment(userId, courseId)
      if (result.success && result.data) {
        setEnrollment(result.data)
      } else {
        setEnrollment(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch enrollment')
      setEnrollment(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchLessonCompletions = async (lessonIds: string[]) => {
    if (!userId || lessonIds.length === 0) return

    try {
      const completions: Record<string, LessonCompletion> = {}
      
      // Fetch completions for each lesson
      await Promise.all(
        lessonIds.map(async (lessonId) => {
          try {
            const result = await CourseService.getLessonCompletion(userId, lessonId)
            if (result.success && result.data) {
              completions[lessonId] = result.data
            }
          } catch (err) {
            // Lesson not completed, continue
          }
        })
      )
      
      setLessonCompletions(completions)
    } catch (err) {
      console.error('Error fetching lesson completions:', err)
    }
  }

  const enrollInCourse = async (targetCourseId: string) => {
    if (!userId) {
      throw new Error('User ID is required to enroll in course')
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await CourseService.enrollInCourse(userId, targetCourseId)
      if (result.success && result.data) {
        setEnrollment(result.data)
      } else {
        throw new Error(result.error || 'Failed to enroll in course')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enroll in course'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (partNumber: number, lessonNumber: number) => {
    if (!userId || !courseId) return

    try {
      const result = await CourseService.updateProgress(userId, courseId, partNumber, lessonNumber)
      if (result.success && result.data) {
        setEnrollment(result.data)
      }
    } catch (err) {
      console.error('Failed to update progress:', err)
    }
  }

  const completeLesson = async (lessonId: string, timeSpent?: number) => {
    if (!userId) return

    try {
      const result = await CourseService.completeLesson(userId, lessonId, timeSpent)
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

  // Auto-fetch enrollment when userId and courseId are available
  useEffect(() => {
    if (autoFetch && userId && courseId) {
      fetchEnrollment()
    }
  }, [userId, courseId, autoFetch])

  return {
    enrollment,
    lessonCompletions,
    loading,
    error,
    enrollInCourse,
    updateProgress,
    completeLesson,
    fetchEnrollment,
    fetchLessonCompletions
  }
} 