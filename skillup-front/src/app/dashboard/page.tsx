'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FullPageSpinner } from '@/components/ui/loading-spinner'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import UserCourses from '@/components/dashboard/user-courses'
import { 
  User, 
  Trophy, 
  Coins, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  Target,
  Plus,
  Zap,
  Award,
  Clock
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading, initialized } = useAuth()

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, initialized, router])

  if (!initialized || loading) {
    return <FullPageSpinner text="Loading dashboard..." />
  }

  if (!user) {
    return null
  }

  const memberSince = userProfile?.created_at 
    ? new Date(userProfile.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Recently'

  const breadcrumbItems = [
    { label: 'Dashboard', isActive: true }
  ]

  const quickStats = [
    {
      title: 'Skill Score',
      value: userProfile?.skill_score || 0,
      icon: Trophy,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      change: '+12%',
      changeColor: 'text-emerald-600'
    },
    {
      title: 'Available Tokens',
      value: userProfile?.tokens || 0,
      icon: Coins,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      change: '-5 today',
      changeColor: 'text-red-600'
    },
    {
      title: 'Courses Created',
      value: '0',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: 'Start your first',
      changeColor: 'text-gray-500'
    },
    {
      title: 'Learning Streak',
      value: '0 days',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 'Begin today',
      changeColor: 'text-gray-500'
    }
  ]

  const quickActions = [
    {
      title: 'Create Course',
      description: 'Build a new course with AI assistance',
      icon: Plus,
      href: '/generate-course',
      primary: true
    },
    {
      title: 'View Courses',
      description: 'Browse your existing courses',
      icon: BookOpen,
      href: '/my-courses'
    },
    {
      title: 'Analytics',
      description: 'Track your learning progress',
      icon: TrendingUp,
      href: '/analytics'
    },
    {
      title: 'Goals',
      description: 'Set and track learning goals',
      icon: Target,
      href: '/goals'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Welcome Section */}
        <Card variant="elevated" className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  Welcome back, {userProfile?.full_name || user.email?.split('@')[0]}!
                </h1>
                <p className="text-blue-100 mt-1">
                  Ready to continue your learning journey? Let's create something amazing today.
                </p>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Calendar className="h-3 w-3 mr-1" />
                  Member since {memberSince}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} variant="default" className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className={`text-xs mt-1 ${stat.changeColor}`}>{stat.change}</p>
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Get started with these common tasks to accelerate your learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Card 
                    key={index} 
                    variant="interactive"
                    className={action.primary ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                    onClick={() => router.push(action.href)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center mb-3 ${
                        action.primary 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Learning Path */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="default" className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Your latest learning activities and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h4>
                <p className="text-gray-600 mb-4">
                  Start creating courses or completing lessons to see your activity here.
                </p>
                <Button onClick={() => router.push('/generate-course')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="default">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span>Achievements</span>
              </CardTitle>
              <CardDescription>Your learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h4>
                <p className="text-gray-600 text-sm">
                  Complete courses and reach milestones to unlock achievements.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Courses */}
        <UserCourses />
      </div>
    </div>
  )
} 