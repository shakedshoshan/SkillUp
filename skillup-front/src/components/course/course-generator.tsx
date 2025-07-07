'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useCourseGeneration } from '@/hooks/use-course-generation';
import type { StreamMessage } from '@/lib/services/course-generation.service';

interface CourseGeneratorProps {
  userId: string;
  onCourseGenerated?: (courseId: string, courseData: any) => void;
}

export function CourseGenerator({ userId, onCourseGenerated }: CourseGeneratorProps) {
  const [courseTopic, setCourseTopic] = useState('');
  const [searchWeb, setSearchWeb] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const {
    isGenerating,
    sessionId,
    logs,
    startGeneration,
    stopGeneration,
    clearLogs
  } = useCourseGeneration({
    userId,
    onCourseGenerated
  });

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleStartGeneration = async () => {
    try {
      await startGeneration(courseTopic, searchWeb);
    } catch (error) {
      console.error('Failed to start generation:', error);
      // Error handling is already done in the hook
    }
  };

  const getMessageColor = (type: string): string => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'progress': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">AI Course Generator</h2>
        
        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="courseTopic" className="block text-sm font-medium text-gray-700 mb-2">
              Course Topic
            </label>
            <Input
              id="courseTopic"
              type="text"
              value={courseTopic}
              onChange={(e) => setCourseTopic(e.target.value)}
              placeholder="e.g., Introduction to Machine Learning"
              disabled={isGenerating}
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="searchWeb"
              checked={searchWeb}
              onChange={(e) => setSearchWeb(e.target.checked)}
              disabled={isGenerating}
              className="rounded"
            />
            <label htmlFor="searchWeb" className="text-sm text-gray-700">
              Enable web search for current information
            </label>
          </div>

          <div className="flex space-x-4">
            <Button 
              onClick={handleStartGeneration}
              disabled={isGenerating || !courseTopic.trim()}
              className="flex items-center space-x-2"
            >
              {isGenerating && <LoadingSpinner size="sm" />}
              <span>{isGenerating ? 'Generating...' : 'Generate Course'}</span>
            </Button>

            {isGenerating && (
              <Button 
                onClick={stopGeneration}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Stop Generation
              </Button>
            )}

            {logs.length > 0 && (
              <Button 
                onClick={clearLogs}
                variant="outline"
              >
                Clear Logs
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Console Output */}
      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Console Output</h3>
            <div className="flex items-center space-x-2">
              {isGenerating && (
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Live</span>
                </div>
              )}
              {sessionId && (
                <span className="text-xs text-gray-400">Session: {sessionId}</span>
              )}
            </div>
          </div>

          <div className="bg-black rounded p-3 h-96 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`ml-2 ${getMessageColor(log.type)}`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
} 