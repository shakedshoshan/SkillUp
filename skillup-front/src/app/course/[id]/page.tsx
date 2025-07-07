'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  type Course, 
  type CoursePart, 
  type Lesson, 
  type LessonContent, 
  type Quiz, 
  type QuizQuestion, 
  type QuizOption,
  CourseService
} from '@/lib/services'
import { 
  BookOpen, 
  Clock, 
  Users, 
  CheckCircle, 
  PlayCircle, 
  FileText, 
  ArrowLeft,
  Target,
  Award,
  Brain,
  Play
} from 'lucide-react'
import Link from 'next/link'

export default function CoursePage() {
  const params = useParams()
  const courseId = params.id as string
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      try {
        setLoading(true)
        setError(null)
        
        const result = await CourseService.getCourseById(courseId)
        
        if (result.success) {
          setCourse(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch course')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch course')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const togglePartExpansion = (partId: string) => {
    setExpandedParts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(partId)) {
        newSet.delete(partId)
      } else {
        newSet.add(partId)
      }
      return newSet
    })
  }

  const toggleLessonExpansion = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId)
      } else {
        newSet.add(lessonId)
      }
      return newSet
    })
  }

  const getDifficultyColor = (difficulty: string | undefined | null) => {
    if (!difficulty) {
      return 'bg-gray-100 text-gray-800'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="py-8">
              <LoadingSpinner text="Loading course content..." />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load course</div>
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
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">Course not found</div>
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty_level)}`}>
                {course.difficulty_level}
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
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
          <p className="text-gray-600 mb-4">{course.description}</p>
          
          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
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

          {/* Prerequisites */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Prerequisites:</h3>
              <div className="flex flex-wrap gap-2">
                {course.prerequisites.map((prerequisite, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {prerequisite}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Course Content */}
        <div className="space-y-4">
          {course.parts?.map((part) => (
            <div key={part.id} className="bg-white rounded-lg shadow">
              <div 
                className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => togglePartExpansion(part.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {part.part_number}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{part.title}</h3>
                      <p className="text-sm text-gray-600">{part.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {part.lessons.length} lessons
                    </span>
                    <CheckCircle className={`h-5 w-5 transform transition-transform ${
                      expandedParts.has(part.id) ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>
                
                {/* Learning Goals */}
                {part.learning_goals && part.learning_goals.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Learning Goals:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {part.learning_goals.map((goal, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Lessons */}
              {expandedParts.has(part.id) && (
                <div className="p-4 space-y-3">
                  {part.lessons.map((lesson) => (
                    <div key={lesson.id} className="border rounded-lg">
                      <div 
                        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleLessonExpansion(lesson.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                              {lesson.lesson_number}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                              <p className="text-sm text-gray-600">{lesson.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lesson.content && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {lesson.content.estimated_duration}
                              </div>
                            )}
                            <PlayCircle className={`h-4 w-4 transform transition-transform ${
                              expandedLessons.has(lesson.id) ? 'rotate-180' : ''
                            }`} />
                          </div>
                        </div>
                      </div>

                      {/* Lesson Content */}
                      {expandedLessons.has(lesson.id) && lesson.content && (
                        <div className="p-4 border-t bg-gray-50">
                          <div className="space-y-4">
                            {/* Learning Objectives */}
                            {lesson.content.learning_objectives && lesson.content.learning_objectives.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Target className="h-4 w-4 text-green-600" />
                                  <h5 className="font-medium text-gray-900">Learning Objectives</h5>
                                </div>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                  {lesson.content.learning_objectives.map((objective, index) => (
                                    <li key={index}>{objective}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Content */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <h5 className="font-medium text-gray-900">Content</h5>
                              </div>
                              <div className="prose prose-sm max-w-none text-gray-700">
                                {lesson.content.content.split('\n').map((paragraph, index) => (
                                  <p key={index} className="mb-2">{paragraph}</p>
                                ))}
                              </div>
                            </div>

                            {/* Key Concepts */}
                            {lesson.content.key_concepts && lesson.content.key_concepts.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Brain className="h-4 w-4 text-purple-600" />
                                  <h5 className="font-medium text-gray-900">Key Concepts</h5>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {lesson.content.key_concepts.map((concept, index) => (
                                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                      {concept}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Examples */}
                            {lesson.content.examples && lesson.content.examples.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Award className="h-4 w-4 text-orange-600" />
                                  <h5 className="font-medium text-gray-900">Examples</h5>
                                </div>
                                <div className="space-y-2">
                                  {lesson.content.examples.map((example, index) => (
                                    <div key={index} className="p-3 bg-orange-50 rounded border-l-4 border-orange-200">
                                      <p className="text-sm text-gray-700">{example}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exercises */}
                            {lesson.content.exercises && lesson.content.exercises.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <h5 className="font-medium text-gray-900">Exercises</h5>
                                </div>
                                <div className="space-y-2">
                                  {lesson.content.exercises.map((exercise, index) => (
                                    <div key={index} className="p-3 bg-green-50 rounded border-l-4 border-green-200">
                                      <p className="text-sm text-gray-700">{exercise}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Quiz */}
                            {lesson.quiz && lesson.quiz.questions && lesson.quiz.questions.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Brain className="h-4 w-4 text-indigo-600" />
                                  <h5 className="font-medium text-gray-900">Quiz</h5>
                                </div>
                                <div className="space-y-4">
                                  {lesson.quiz.questions.map((question) => (
                                    <div key={question.id} className="p-4 bg-indigo-50 rounded border">
                                      <div className="mb-3">
                                        <h6 className="font-medium text-gray-900 mb-2">
                                          Question {question.question_number}: {question.question}
                                        </h6>
                                        <div className="space-y-2">
                                          {question.options.map((option) => (
                                            <div key={option.id} className="flex items-center gap-2">
                                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                option.is_correct 
                                                  ? 'bg-green-100 border-green-500' 
                                                  : 'border-gray-300'
                                              }`}>
                                                {option.is_correct && (
                                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                )}
                                              </div>
                                              <span className="text-sm text-gray-700">
                                                {option.option_letter}. {option.option_text}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      {question.explanation && (
                                        <div className="mt-3 pt-3 border-t border-indigo-200">
                                          <p className="text-sm text-gray-600">
                                            <strong>Explanation:</strong> {question.explanation}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <div className="flex items-center justify-center gap-4">
            <Link href={`/course/${courseId}/study`}>
              <Button size="lg" className="px-8 py-3">
                <Play className="h-5 w-5 mr-2" />
                Start Learning
              </Button>
            </Link>
            <Button variant="outline" size="lg" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 