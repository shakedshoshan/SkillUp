import { useState, useEffect, useCallback, useRef } from 'react';
import { CourseGenerationService, type CourseGenerationRequest, type StreamMessage } from '@/lib/services/course-generation.service';
import { WebSocketService, type WebSocketCallbacks } from '@/lib/services/websocket.service';

interface UseCourseGenerationProps {
  userId: string;
  onCourseGenerated?: (courseId: string, courseData: any) => void;
}

interface UseCourseGenerationReturn {
  isGenerating: boolean;
  sessionId: string | null;
  logs: StreamMessage[];
  startGeneration: (courseTopic: string, searchWeb: boolean) => Promise<void>;
  stopGeneration: () => void;
  clearLogs: () => void;
}

export function useCourseGeneration({ 
  userId, 
  onCourseGenerated 
}: UseCourseGenerationProps): UseCourseGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<StreamMessage[]>([]);
  
  const webSocketService = useRef<WebSocketService>(new WebSocketService());

  // WebSocket callbacks
  const webSocketCallbacks: WebSocketCallbacks = {
    onConnect: () => {
      console.log('WebSocket connected');
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
    },
    onUpdate: (message: StreamMessage) => {
      setLogs(prev => [...prev, message]);
    },
    onComplete: (result: any) => {
      setIsGenerating(false);
      if (result.success) {
        const successMessage: StreamMessage = {
          type: 'success',
          message: `✅ Course generation completed! Course ID: ${result.courseId}`,
          timestamp: new Date().toISOString()
        };
        setLogs(prev => [...prev, successMessage]);
        onCourseGenerated?.(result.courseId, result.course);
      } else {
        const errorMessage: StreamMessage = {
          type: 'error',
          message: `❌ Course generation failed: ${result.error}`,
          timestamp: new Date().toISOString()
        };
        setLogs(prev => [...prev, errorMessage]);
      }
    },
    onStatusChange: (status: any) => {
      console.log('Session status changed:', status);
    }
  };

  // Connect to WebSocket when sessionId changes
  useEffect(() => {
    if (sessionId) {
      const backendUrl = CourseGenerationService.getBackendUrl();
      webSocketService.current.connect(backendUrl, sessionId, webSocketCallbacks);
    }

    return () => {
      webSocketService.current.disconnect();
    };
  }, [sessionId]);

  // Start course generation
  const startGeneration = useCallback(async (courseTopic: string, searchWeb: boolean) => {
    if (!courseTopic.trim()) {
      throw new Error('Please enter a course topic');
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
      const result = await CourseGenerationService.startGeneration(request);

      if (result.success && result.sessionId) {
        setSessionId(result.sessionId);
        const startMessage: StreamMessage = {
          type: 'log',
          message: `🚀 Course generation started! Session: ${result.sessionId}`,
          timestamp: new Date().toISOString()
        };
        setLogs([startMessage]);
      } else {
        setIsGenerating(false);
        const errorMessage: StreamMessage = {
          type: 'error',
          message: `❌ Failed to start generation: ${result.error}`,
          timestamp: new Date().toISOString()
        };
        setLogs([errorMessage]);
      }
    } catch (error) {
      setIsGenerating(false);
      const errorMessage: StreamMessage = {
        type: 'error',
        message: `❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      };
      setLogs([errorMessage]);
      throw error;
    }
  }, [userId]);

  // Stop course generation
  const stopGeneration = useCallback(() => {
    webSocketService.current.disconnect();
    setIsGenerating(false);
    setSessionId(null);
    const stopMessage: StreamMessage = {
      type: 'log',
      message: '🛑 Generation stopped by user',
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [...prev, stopMessage]);
  }, []);

  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isGenerating,
    sessionId,
    logs,
    startGeneration,
    stopGeneration,
    clearLogs
  };
} 