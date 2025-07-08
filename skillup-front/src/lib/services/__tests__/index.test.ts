import * as Services from '../index';

describe('Services Index', () => {
  it('should export CourseService', () => {
    expect(Services.CourseService).toBeDefined();
    expect(typeof Services.CourseService.getCoursesByUser).toBe('function');
    expect(typeof Services.CourseService.getCourseById).toBe('function');
    expect(typeof Services.CourseService.enrollInCourse).toBe('function');
  });

  it('should export CourseGenerationService', () => {
    expect(Services.CourseGenerationService).toBeDefined();
    expect(typeof Services.CourseGenerationService.startGeneration).toBe('function');
    expect(typeof Services.CourseGenerationService.getBackendUrl).toBe('function');
  });

  it('should export WebSocketService', () => {
    expect(Services.WebSocketService).toBeDefined();
    expect(typeof Services.WebSocketService).toBe('function'); // Constructor function
  });

  it('should have the correct service methods available', () => {
    // Test that the main service methods exist
    const courseServiceMethods = [
      'getCoursesByUser',
      'getCourseById',
      'enrollInCourse',
      'getCourseEnrollment',
      'updateProgress',
      'completeLesson',
      'getLessonCompletion',
      'submitQuiz',
      'getEnrolledCourses',
      'getCourseCompletions'
    ] as const;

    courseServiceMethods.forEach(method => {
      expect((Services.CourseService as unknown as Record<string, unknown>)[method]).toBeDefined();
      expect(typeof (Services.CourseService as unknown as Record<string, unknown>)[method]).toBe('function');
    });

    const courseGenerationMethods = [
      'startGeneration',
      'getBackendUrl'
    ] as const;

    courseGenerationMethods.forEach(method => {
      expect((Services.CourseGenerationService as unknown as Record<string, unknown>)[method]).toBeDefined();
      expect(typeof (Services.CourseGenerationService as unknown as Record<string, unknown>)[method]).toBe('function');
    });
  });

  it('should allow instantiation of WebSocketService', () => {
    const wsService = new Services.WebSocketService();
    expect(wsService).toBeInstanceOf(Services.WebSocketService);
    expect(typeof wsService.connect).toBe('function');
    expect(typeof wsService.disconnect).toBe('function');
    expect(typeof wsService.isConnected).toBe('function');
    expect(typeof wsService.getSocket).toBe('function');
  });
}); 