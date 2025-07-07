'use client';

import { useState } from 'react';
import { CourseGenerator } from '@/components/course/course-generator';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function GenerateCoursePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleCourseGenerated = (courseId: string, courseData: any) => {
    console.log('Course generated:', { courseId, courseData });
    setGeneratedCourseId(courseId);
    
    // Show success message and offer to view course
    if (confirm(`Course generated successfully! Would you like to view the course?`)) {
      router.push(`/course/${courseId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Course Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create comprehensive courses on any topic using our AI-powered course builder. 
            Watch the generation process in real-time and get detailed course content with lessons, 
            examples, and quizzes.
          </p>
        </div>

        <CourseGenerator 
          userId={user.id}
          onCourseGenerated={handleCourseGenerated}
        />

        {generatedCourseId && (
          <div className="mt-8 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Course Generated Successfully!
              </h3>
              <p className="text-green-600 mb-4">
                Your course has been saved with ID: {generatedCourseId}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/course/${generatedCourseId}`)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  View Course
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Enter Topic</h3>
                <p className="text-gray-600 text-sm">
                  Provide a course topic and choose whether to include web search for current information.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">AI Generation</h3>
                <p className="text-gray-600 text-sm">
                  Watch as our AI creates structured course content with lessons, examples, and quizzes in real-time.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Ready to Learn</h3>
                <p className="text-gray-600 text-sm">
                  Your complete course is saved and ready for learners with all content and assessments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 