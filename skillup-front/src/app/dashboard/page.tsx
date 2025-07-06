'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { FullPageSpinner } from '@/components/ui/loading-spinner'
import UserCourses from '@/components/dashboard/user-courses'
import { User, LogOut, Mail, Calendar, Trophy, Coins } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user, userProfile, loading, initialized, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, initialized, router])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setSigningOut(false)
    }
  }

  if (!initialized || loading) {
    return <FullPageSpinner text="Loading dashboard..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">SkillUp Dashboard</h1>
            <Button
              onClick={handleSignOut}
              variant="outline"
              disabled={signingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {signingOut ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Welcome back, {userProfile?.full_name || user.email}!
                </h2>
                <p className="text-gray-600">Ready to continue your learning journey?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">Email</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">{user.email}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-600">Skill Score</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {userProfile?.skill_score || 0}
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Coins className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-gray-600">Tokens</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {userProfile?.tokens || 0}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm text-gray-600">Member Since</span>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {userProfile?.created_at 
                    ? new Date(userProfile.created_at).toLocaleDateString()
                    : 'Recently'
                  }
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Full Name: </span>
                  <span className="text-sm text-gray-900">
                    {userProfile?.full_name || 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Username: </span>
                  <span className="text-sm text-gray-900">
                    {userProfile?.username || 'Not set'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Bio: </span>
                  <span className="text-sm text-gray-900">
                    {userProfile?.bio || 'No bio added yet'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">User ID: </span>
                  <span className="text-sm text-gray-900 font-mono">{user.id}</span>
                </div>
              </div>
            </div>
          </div>

          <UserCourses />
        </div>
      </div>
    </div>
  )
} 