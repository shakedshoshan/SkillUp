'use client';

import { useState } from 'react';
import { CourseGenerator } from '@/components/course/course-generator';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FullPageSpinner } from '@/components/ui/loading-spinner';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Sparkles, Target, Zap, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

export default function GenerateCoursePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null);

  if (loading) {
    return <FullPageSpinner text="Loading course generator..." />;
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleCourseGenerated = (courseId: string, courseData: unknown) => {
    console.log('Course generated:', { courseId, courseData });
    setGeneratedCourseId(courseId);
  };

  const breadcrumbItems = [
    { label: 'Create Course', isActive: true }
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Generation',
      description: 'Advanced AI creates structured course content tailored to your topic'
    },
    {
      icon: Target,
      title: 'Real-time Progress',
      description: 'Watch your course being built with live streaming feedback'
    },
    {
      icon: Zap,
      title: 'Web Search Integration',
      description: 'Include current information with optional web search capability'
    },
    {
      icon: BookOpen,
      title: 'Complete Content',
      description: 'Get lessons, examples, quizzes, and assessments automatically'
    }
  ];

  const steps = [
    { number: 1, title: 'Enter Topic', description: 'Describe what you want to teach' },
    { number: 2, title: 'AI Generation', description: 'Watch real-time course creation' },
    { number: 3, title: 'Review & Publish', description: 'Edit and share your course' }
  ];

  return (
    <div className="bg-gray-50 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Badge variant="info" className="px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Course Creation
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Course with AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Build comprehensive courses on any topic using our advanced AI course builder. 
            Watch the generation process in real-time and get detailed content with lessons, 
            examples, and quizzes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} variant="default" className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Course Generator */}
        <CourseGenerator 
          userId={user.id}
          onCourseGenerated={handleCourseGenerated}
        />

        {/* Success Message */}
        {generatedCourseId && (
          <Card variant="elevated" className="border-green-200 bg-green-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                🎉 Course Generated Successfully!
              </h3>
              <p className="text-green-700 mb-6">
                Your course has been created and is ready for review. You can now view, edit, or publish it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => router.push(`/course/${generatedCourseId}`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Course
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">How It Works</CardTitle>
            <CardDescription className="text-center">
              Simple 3-step process to create professional courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                  
                  {/* Arrow for desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full">
                      <ArrowRight className="h-6 w-6 text-gray-400 mx-auto" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 