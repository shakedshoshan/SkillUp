'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  type Lesson, 
  type Quiz, 
  type QuizQuestion, 
  type QuizOption,
  type QuizSubmission,
  type QuizResult,
  CourseService
} from '../../lib/services/course.service'
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Award, 
  RotateCcw,
  Send,
  Clock
} from 'lucide-react'

interface QuizViewerProps {
  lesson: Lesson
  userId: string
  isLessonCompleted: boolean // Renamed for clarity
  onQuizComplete: (score: number, total: number) => void
}

interface SelectedAnswers {
  [questionId: string]: string
}

export function QuizViewer({ lesson, userId, isLessonCompleted, onQuizComplete }: QuizViewerProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({})
  const [submitted, setSubmitted] = useState(false) // Always start fresh
  const [results, setResults] = useState<QuizResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false) // Always start without showing answers
  const [quizCompleted, setQuizCompleted] = useState(false) // Track quiz completion separately

  // Reset all quiz state when lesson changes
  useEffect(() => {
    setSelectedAnswers({})
    setSubmitted(false)
    setResults(null)
    setLoading(false)
    setShowAnswers(false)
    setQuizCompleted(false)
  }, [lesson.id]) // Reset when lesson ID changes

  // Check if quiz was previously completed by checking lesson completion data
  useEffect(() => {
    const checkQuizCompletion = async () => {
      if (!userId || !lesson.quiz) return

      try {
        // Check lesson completion to see if it has quiz score
        const result = await CourseService.getLessonCompletion(userId, lesson.id)
        if (result.success && result.data && result.data.quiz_score !== undefined && result.data.quiz_total !== undefined) {
          // Quiz was previously completed
          setQuizCompleted(true)
          // Create a basic result object from lesson completion data
          setResults({
            score: result.data.quiz_score,
            total: result.data.quiz_total,
            passed: result.data.quiz_score >= Math.ceil(result.data.quiz_total * 0.7), // Assume 70% passing
            results: [] // We don't have detailed results, but that's ok
          })
        }
      } catch (error) {
        console.error('Failed to check quiz completion:', error)
      }
    }

    checkQuizCompletion()
  }, [userId, lesson.id, lesson.quiz])

  if (!lesson.quiz || !lesson.quiz.questions || lesson.quiz.questions.length === 0) {
    return null
  }

  const quiz = lesson.quiz

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    if (submitted) return
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }))
  }

  const handleSubmit = async () => {
    if (loading) return

    const unansweredQuestions = quiz.questions.filter(q => !selectedAnswers[q.id])
    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`)
      return
    }

    try {
      setLoading(true)

      const submission: QuizSubmission = {
        quiz_id: quiz.id,
        answers: Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
          question_id: questionId,
          selected_option_id: optionId
        }))
      }

      const result = await CourseService.submitQuiz(userId, lesson.id, submission)
      
      if (result.success && result.data) {
        setResults(result.data)
        setSubmitted(true)
        setShowAnswers(true)
        setQuizCompleted(true)
        onQuizComplete(result.data.score, result.data.total)
      } else {
        throw new Error(result.error || 'Failed to submit quiz')
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error)
      alert('Failed to submit quiz. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRetake = () => {
    setSelectedAnswers({})
    setSubmitted(false)
    setShowAnswers(false)
    // Keep quizCompleted true to show that user has completed it before
  }

  const handleViewResults = () => {
    if (results) {
      setShowAnswers(true)
      setSubmitted(true)
      // We don't have detailed results to populate answers, so just show the score
    }
  }

  const getOptionClass = (questionId: string, option: QuizOption) => {
    const isSelected = selectedAnswers[questionId] === option.id
    const isCorrect = option.is_correct
    
    if (!showAnswers) {
      return isSelected 
        ? 'bg-blue-100 border-blue-500 text-blue-900' 
        : 'bg-white border-gray-200 hover:bg-gray-50'
    }
    
    if (isSelected && isCorrect) {
      return 'bg-green-100 border-green-500 text-green-900'
    } else if (isSelected && !isCorrect) {
      return 'bg-red-100 border-red-500 text-red-900'
    } else if (isCorrect) {
      return 'bg-green-50 border-green-300 text-green-800'
    } else {
      return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  const getQuestionResult = (questionId: string) => {
    if (!results || !results.results) return null
    return results.results.find(r => r.question_id === questionId)
  }

  const completedQuestions = Object.keys(selectedAnswers).length
  const totalQuestions = quiz.questions.length
  const progress = (completedQuestions / totalQuestions) * 100

  return (
    <div className="space-y-6">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>Debug:</strong> Lesson ID: {lesson.id}, submitted: {submitted.toString()}, showAnswers: {showAnswers.toString()}, quizCompleted: {quizCompleted.toString()}
        </div>
      )}

      {/* Quiz Header */}
      <div className="bg-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-indigo-600" />
            <h3 className="text-xl font-semibold text-indigo-900">Knowledge Check</h3>
          </div>
          
          {results && (
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-indigo-900">
                Best Score: {results.score}/{results.total} ({Math.round((results.score / results.total) * 100)}%)
              </span>
            </div>
          )}
        </div>

        {/* Quiz Status and Actions */}
        {!submitted && !quizCompleted && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-indigo-700">
              <span>Progress: {completedQuestions}/{totalQuestions} questions</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!submitted && quizCompleted && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-indigo-700">
              You have already completed this quiz. You can retake it or view your previous results.
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewResults}
                className="bg-white"
              >
                View Results
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetake}
                className="bg-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            </div>
          </div>
        )}

        {submitted && results && (
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${results.passed ? 'text-green-700' : 'text-red-700'}`}>
              {results.passed ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="font-medium">
                {results.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetake}
              className="bg-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question, questionIndex) => {
          const questionResult = getQuestionResult(question.id)
          
          return (
            <div key={question.id} className="bg-white border rounded-lg p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold">
                      {question.question_number}
                    </div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {question.question}
                    </h4>
                  </div>
                </div>
                
                {questionResult && showAnswers && (
                  <div className="ml-4">
                    {questionResult.correct ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 mb-4">
                {question.options.map((option) => {
                  const isSelected = selectedAnswers[question.id] === option.id
                  const optionClass = getOptionClass(question.id, option)
                  
                  return (
                    <div
                      key={option.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${optionClass} ${
                        submitted ? 'cursor-default' : 'hover:shadow-sm'
                      }`}
                      onClick={() => handleAnswerSelect(question.id, option.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? showAnswers 
                              ? option.is_correct 
                                ? 'bg-green-500 border-green-500'
                                : 'bg-red-500 border-red-500'
                              : 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                          {showAnswers && option.is_correct && !isSelected && (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                        <span className="font-medium text-sm">
                          {option.option_letter}.
                        </span>
                        <span className="text-sm flex-1">
                          {option.option_text}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Explanation */}
              {showAnswers && question.explanation && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                  <div className="flex items-start gap-2">
                    <div className="text-gray-600 font-medium text-sm">💡</div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm mb-1">Explanation:</div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleSubmit}
            disabled={loading || completedQuestions < totalQuestions}
            size="lg"
            className="px-8"
          >
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Quiz
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 