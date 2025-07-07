'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/use-auth'
import { Button } from '@/components/ui/button'
import { FullPageSpinner } from '@/components/ui/loading-spinner'
import { ArrowRight, BookOpen, Target, Users } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user, loading, initialized } = useAuth()

  useEffect(() => {
    if (initialized && !loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, initialized, router])

  if (!initialized || loading) {
    return <FullPageSpinner text="Loading..." />
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">SkillUp</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Your personalized learning platform designed to help you grow your skills, 
            track your progress, and achieve your career goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/auth/register')}
              size="lg"
              className="text-lg px-8 py-3"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Personalized Learning
            </h3>
            <p className="text-gray-600">
              AI-powered course recommendations tailored to your goals and learning style.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Goal Tracking
            </h3>
            <p className="text-gray-600">
              Set and track your learning goals with detailed progress analytics.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Community
            </h3>
            <p className="text-gray-600">
              Connect with fellow learners and share your progress and achievements.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to start your learning journey?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of learners who are already advancing their careers with SkillUp.
          </p>
          <Button
            onClick={() => router.push('/auth/register')}
            size="lg"
            className="text-lg px-8 py-3"
          >
            Join SkillUp Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
