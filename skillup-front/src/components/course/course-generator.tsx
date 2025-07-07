'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface CourseGenerationRequest {
  course_topic: string;
  search_web: boolean;
  user_id: string;
}

interface StreamMessage {
  type: 'log' | 'progress' | 'success' | 'error' | 'course_generated';
  message: string;
  data?: any;
  timestamp: string;
}

interface CourseGeneratorProps {
  userId: string;
  onCourseGenerated?: (courseId: string, courseData: any) => void;
}

export function CourseGenerator({ userId, onCourseGenerated }: CourseGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [courseTopic, setCourseTopic] = useState('');
  const [searchWeb, setSearchWeb] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<StreamMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Setup WebSocket connection when session starts
  useEffect(() => {
    if (sessionId && !socket) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const newSocket = io(backendUrl, {
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket');
        newSocket.emit('join_session', sessionId);
      });

      newSocket.on('course_generation_update', (message: StreamMessage) => {
        setLogs(prev => [...prev, message]);
      });

      newSocket.on('course_generation_complete', (result: any) => {
        setIsGenerating(false);
        if (result.success) {
          setLogs(prev => [...prev, {
            type: 'success',
            message: `✅ Course generation completed! Course ID: ${result.courseId}`,
            timestamp: new Date().toISOString()
          }]);
          onCourseGenerated?.(result.courseId, result.course);
        } else {
          setLogs(prev => [...prev, {
            type: 'error',
            message: `❌ Course generation failed: ${result.error}`,
            timestamp: new Date().toISOString()
          }]);
        }
      });

      newSocket.on('session_status', (status: any) => {
        console.log('Session status:', status);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
      });

      setSocket(newSocket);
    }

    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [sessionId, socket, onCourseGenerated]);

  const startGeneration = async () => {
    if (!courseTopic.trim()) {
      alert('Please enter a course topic');
      return;
    }

    setIsGenerating(true);
    setLogs([]);
    setSessionId(null);

    const request: CourseGenerationRequest = {
      course_topic: courseTopic.trim(),
      search_web: searchWeb,
      user_id: userId
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/v1/course-generation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();

      if (result.success) {
        setSessionId(result.sessionId);
        setLogs([{
          type: 'log',
          message: `🚀 Course generation started! Session: ${result.sessionId}`,
          timestamp: new Date().toISOString()
        }]);
      } else {
        setIsGenerating(false);
        setLogs([{
          type: 'error',
          message: `❌ Failed to start generation: ${result.error}`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      setIsGenerating(false);
      setLogs([{
        type: 'error',
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const stopGeneration = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setIsGenerating(false);
    setSessionId(null);
    setLogs(prev => [...prev, {
      type: 'log',
      message: '🛑 Generation stopped by user',
      timestamp: new Date().toISOString()
    }]);
  };

  const clearLogs = () => {
    setLogs([]);
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
              onClick={startGeneration}
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