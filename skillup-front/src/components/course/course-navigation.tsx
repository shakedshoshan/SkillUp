'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  type Course, 
  type CoursePart, 
  type Lesson, 
  type CourseEnrollment,
  type LessonCompletion
} from '../../lib/services/course.service'
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Clock, 
  Target,
  BookOpen,
  FileText,
  Brain,
  Play,
  Award
} from 'lucide-react'

interface CourseNavigationProps {
  course: Course
  currentPartNumber: number
  currentLessonNumber: number
  lessonCompletions: Record<string, LessonCompletion>
  onLessonSelect: (partNumber: number, lessonNumber: number) => void
  enrollment: CourseEnrollment
}

export function CourseNavigation({
  course,
  currentPartNumber,
  currentLessonNumber,
  lessonCompletions,
  onLessonSelect,
  enrollment
}: CourseNavigationProps) {
  const [expandedParts, setExpandedParts] = useState<Set<number>>(
    new Set([currentPartNumber])
  )

  const togglePartExpansion = (partNumber: number) => {
    setExpandedParts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(partNumber)) {
        newSet.delete(partNumber)
      } else {
        newSet.add(partNumber)
      }
      return newSet
    })
  }

  const isLessonCompleted = (lesson: Lesson) => {
    return !!lessonCompletions[lesson.id]
  }

  const isLessonCurrent = (part: CoursePart, lesson: Lesson) => {
    return part.part_number === currentPartNumber && lesson.lesson_number === currentLessonNumber
  }

  const isLessonAccessible = (part: CoursePart, lesson: Lesson) => {
    // Current lesson is always accessible
    if (isLessonCurrent(part, lesson)) return true
    
    // Completed lessons are always accessible
    if (isLessonCompleted(lesson)) return true
    
    // Check if this is the next lesson in sequence
    if (part.part_number < currentPartNumber) return true
    if (part.part_number === currentPartNumber && lesson.lesson_number <= currentLessonNumber) return true
    
    return false
  }

  const getPartProgress = (part: CoursePart) => {
    const totalLessons = part.lessons.length
    const completedLessons = part.lessons.filter(lesson => isLessonCompleted(lesson)).length
    return { completed: completedLessons, total: totalLessons }
  }

  const getCourseProgress = () => {
    const totalLessons = course.parts?.reduce((acc, part) => acc + part.lessons.length, 0) || 0
    const completedLessons = course.parts?.reduce((acc, part) => 
      acc + part.lessons.filter(lesson => isLessonCompleted(lesson)).length, 0
    ) || 0
    return { completed: completedLessons, total: totalLessons }
  }

  const courseProgress = getCourseProgress()
  const progressPercentage = courseProgress.total > 0 ? (courseProgress.completed / courseProgress.total) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Course Header */}
      <div className="space-y-3">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm leading-tight">
            {course.title}
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            {course.difficulty_level} • {course.total_duration}
          </p>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Overall Progress</span>
            <span>{courseProgress.completed}/{courseProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 text-center">
            {Math.round(progressPercentage)}% Complete
          </div>
        </div>
      </div>

      {/* Parts and Lessons */}
      <div className="space-y-2">
        {course.parts?.map((part) => {
          const partProgress = getPartProgress(part)
          const isPartCompleted = partProgress.completed === partProgress.total
          const isPartExpanded = expandedParts.has(part.part_number)
          
          return (
            <div key={part.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Part Header */}
              <div
                className={`p-3 cursor-pointer transition-colors ${
                  part.part_number === currentPartNumber
                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => togglePartExpansion(part.part_number)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isPartExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    )}
                    
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium flex-shrink-0 ${
                      isPartCompleted
                        ? 'bg-green-100 text-green-800'
                        : part.part_number === currentPartNumber
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {part.part_number}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {part.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">
                          {partProgress.completed}/{partProgress.total} lessons
                        </span>
                        {isPartCompleted && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>Complete</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lessons */}
              {isPartExpanded && (
                <div className="border-t border-gray-200">
                  {part.lessons.map((lesson) => {
                    const isCompleted = isLessonCompleted(lesson)
                    const isCurrent = isLessonCurrent(part, lesson)
                    const isAccessible = isLessonAccessible(part, lesson)
                    
                    return (
                      <div
                        key={lesson.id}
                        className={`border-b last:border-b-0 border-gray-100 ${
                          isAccessible ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'
                        } ${isCurrent ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                          if (isAccessible) {
                            onLessonSelect(part.part_number, lesson.lesson_number)
                          }
                        }}
                      >
                        <div className="p-3 pl-8">
                          <div className="flex items-center gap-2">
                            {/* Completion Status */}
                            {isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : isCurrent ? (
                              <Play className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            ) : isAccessible ? (
                              <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
                            )}
                            
                            {/* Lesson Number */}
                            <div className={`flex items-center justify-center w-5 h-5 rounded text-xs font-medium flex-shrink-0 ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : isCompleted
                                ? 'bg-green-100 text-green-800'
                                : isAccessible
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-gray-50 text-gray-400'
                            }`}>
                              {lesson.lesson_number}
                            </div>
                            
                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${
                                isAccessible ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {lesson.title}
                              </div>
                              
                              {/* Lesson Features */}
                              <div className="flex items-center gap-2 mt-1">
                                {lesson.content && (
                                  <div className={`flex items-center gap-1 text-xs ${
                                    isAccessible ? 'text-gray-500' : 'text-gray-400'
                                  }`}>
                                    <FileText className="h-3 w-3" />
                                    <span>Content</span>
                                  </div>
                                )}
                                {lesson.quiz && (
                                  <div className={`flex items-center gap-1 text-xs ${
                                    isAccessible ? 'text-purple-600' : 'text-gray-400'
                                  }`}>
                                    <Brain className="h-3 w-3" />
                                    <span>Quiz</span>
                                  </div>
                                )}
                                {lesson.content?.estimated_duration && (
                                  <div className={`flex items-center gap-1 text-xs ${
                                    isAccessible ? 'text-gray-500' : 'text-gray-400'
                                  }`}>
                                    <Clock className="h-3 w-3" />
                                    <span>{lesson.content.estimated_duration}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Course Completion */}
      {progressPercentage === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-sm font-medium text-green-900 mb-1">
            Congratulations!
          </div>
          <div className="text-xs text-green-700">
            You've completed this course
          </div>
        </div>
      )}
    </div>
  )
} 