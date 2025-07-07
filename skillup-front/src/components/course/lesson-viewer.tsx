'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  type Lesson, 
  type LessonContent 
} from '../../lib/services/course.service'
import { 
  Clock, 
  Target, 
  FileText, 
  Brain, 
  Award, 
  CheckCircle, 
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface LessonViewerProps {
  lesson: Lesson
  isCompleted: boolean
  onComplete: (timeSpentMinutes?: number) => void
}

export function LessonViewer({ lesson, isCompleted, onComplete }: LessonViewerProps) {
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false) // Always start with false to show button initially

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    } else if (!isActive && interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, startTime])

  const startTimer = () => {
    if (!startTime) {
      setStartTime(new Date())
    }
    setIsActive(true)
  }

  const pauseTimer = () => {
    setIsActive(false)
  }

  const resetTimer = () => {
    setStartTime(new Date())
    setElapsedTime(0)
    setIsActive(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleComplete = () => {
    pauseTimer()
    const timeSpentMinutes = Math.floor(elapsedTime / 60)
    onComplete(timeSpentMinutes > 0 ? timeSpentMinutes : undefined)
    setShowCompletion(true)
  }

  if (!lesson.content) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">No content available</div>
        <p className="text-sm text-gray-400">This lesson content is not yet available.</p>
        
        {/* Debug: Show lesson data structure */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-400 cursor-pointer">Debug: Lesson Data</summary>
            <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
              {JSON.stringify(lesson, null, 2)}
            </pre>
          </details>
        )}
      </div>
    )
  }

  const content = lesson.content

  return (
    <div className="space-y-6">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <strong>Debug:</strong> isCompleted: {isCompleted.toString()}, showCompletion: {showCompletion.toString()}
        </div>
      )}
      
      {/* Timer and Progress */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-900">
              Estimated: {content.estimated_duration}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-mono font-medium text-blue-900">
              {formatTime(elapsedTime)}
            </div>
            <div className="flex gap-1">
              {!isActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startTimer}
                  className="bg-white"
                >
                  <Play className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={pauseTimer}
                  className="bg-white"
                >
                  <Pause className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={resetTimer}
                className="bg-white"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {!showCompletion && !isCompleted ? (
          <Button onClick={handleComplete} className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
        ) : isCompleted ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCompletion(false)}
              className="bg-white text-xs"
            >
              Mark Again
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Just Completed!</span>
          </div>
        )}
      </div>

      {/* Learning Objectives */}
      {content.learning_objectives && content.learning_objectives.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Learning Objectives</h3>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <ul className="space-y-2">
              {content.learning_objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2 text-green-800">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Lesson Content</h3>
        </div>
        <div className="prose max-w-none">
          <div className="text-gray-700 leading-relaxed">
            {content.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Key Concepts */}
      {content.key_concepts && content.key_concepts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Key Concepts</h3>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {content.key_concepts.map((concept, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Examples */}
      {content.examples && content.examples.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Examples</h3>
          </div>
          <div className="space-y-3">
            {content.examples.map((example, index) => (
              <div key={index} className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-300">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-orange-200 text-orange-800 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-orange-900 text-sm leading-relaxed">{example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercises */}
      {content.exercises && content.exercises.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Practice Exercises</h3>
          </div>
          <div className="space-y-3">
            {content.exercises.map((exercise, index) => (
              <div key={index} className="bg-green-50 rounded-lg p-4 border-l-4 border-green-300">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-green-200 text-green-800 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-green-900 text-sm leading-relaxed mb-2">{exercise}</p>
                    <div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded inline-block">
                      💡 Try this on your own
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 