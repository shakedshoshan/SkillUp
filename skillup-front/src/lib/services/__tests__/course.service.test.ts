import { CourseService } from '../course.service';

// Mock the global fetch function used by CourseService for API calls
// This allows us to control the responses and test different scenarios
global.fetch = jest.fn();

/**
 * Test suite for CourseService
 * Tests all API calls related to course management, enrollment, and progress tracking
 */
describe('CourseService', () => {
  // Cast fetch to a Jest mock function to access mock methods like mockResolvedValueOnce
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  // Use environment variable for consistent API URL testing
  const TEST_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  beforeEach(() => {
    // Clear all mock calls and instances before each test to ensure test isolation
    jest.clearAllMocks();
    // Set up environment variables for consistent testing
    process.env.NEXT_PUBLIC_BACKEND_URL = TEST_API_URL;
  });

  /**
   * Test suite for getCoursesByUser method
   * This method fetches all courses created by a specific user
   */
  describe('getCoursesByUser', () => {
    it('should successfully fetch courses for a user', async () => {
      // Arrange: Set up test data
      const userId = 'test-user-123';
      // Mock the expected API response structure
      const mockResponse = {
        success: true,
        data: [
          {
            id: 'course-1',
            title: 'Test Course',
            description: 'A test course',
            is_published: true,
            created_by_user_id: userId,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        count: 1,
        user_id: userId
      };

      // Mock fetch to return a successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act: Call the method being tested
      const result = await CourseService.getCoursesByUser(userId);

      // Assert: Verify the correct API endpoint was called and result matches expected data
      expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_URL}/api/v1/courses/user/${userId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when the API request fails', async () => {
      // Arrange: Set up test data
      const userId = 'test-user-123';

      // Mock fetch to return a failed HTTP response (404 Not Found)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      // Act & Assert: Verify that the method throws the expected error
      await expect(CourseService.getCoursesByUser(userId)).rejects.toThrow('Failed to fetch courses: 404');
    });

    it('should handle network errors', async () => {
      // Arrange: Set up test data
      const userId = 'test-user-123';

      // Mock fetch to reject with a network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert: Verify that network errors are properly propagated
      await expect(CourseService.getCoursesByUser(userId)).rejects.toThrow('Network error');
    });
  });

  /**
   * Test suite for getCourseById method
   * This method fetches detailed information about a specific course
   */
  describe('getCourseById', () => {
    it('should successfully fetch a course by ID', async () => {
      // Arrange: Set up test data with a complete course object
      const courseId = 'course-123';
      const mockCourse = {
        id: courseId,
        title: 'Test Course',
        description: 'A test course',
        is_published: true,
        created_by_user_id: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Mock fetch to return the course data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCourse,
      } as Response);

      // Act: Call the method being tested
      const result = await CourseService.getCourseById(courseId);

      // Assert: Verify correct API call and returned data
      expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_URL}/api/v1/courses/${courseId}`);
      expect(result).toEqual(mockCourse);
    });

    it('should throw an error when course is not found', async () => {
      // Arrange: Set up test data for non-existent course
      const courseId = 'non-existent-course';

      // Mock fetch to return 404 status (course not found)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      // Act & Assert: Verify that 404 errors are handled correctly
      await expect(CourseService.getCourseById(courseId)).rejects.toThrow('Failed to fetch course: 404');
    });
  });

  /**
   * Test suite for enrollInCourse method
   * This method enrolls a user in a specific course via POST request
   */
  describe('enrollInCourse', () => {
    it('should successfully enroll a user in a course', async () => {
      // Arrange: Set up test data for enrollment
      const userId = 'user-123';
      const courseId = 'course-123';
      // Mock the expected enrollment response with initial progress data
      const mockEnrollment = {
        success: true,
        data: {
          id: 'enrollment-123',
          user_id: userId,
          course_id: courseId,
          enrollment_date: '2024-01-01T00:00:00Z',
          progress_percentage: 0, // New enrollment starts at 0% progress
          current_part_number: 1,
          current_lesson_number: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      };

      // Mock fetch to return successful enrollment
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnrollment,
      } as Response);

      // Act: Call the enrollment method
      const result = await CourseService.enrollInCourse(userId, courseId);

      // Assert: Verify correct POST request was made with proper headers and body
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_API_URL}/api/v1/courses/${courseId}/enroll`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userId }), // User ID sent in request body
        }
      );
      expect(result).toEqual(mockEnrollment);
    });

    it('should throw an error when enrollment fails', async () => {
      // Arrange: Set up test data for failed enrollment
      const userId = 'user-123';
      const courseId = 'course-123';

      // Mock fetch to return 400 Bad Request (e.g., already enrolled, invalid data)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      // Act & Assert: Verify that enrollment failures are handled properly
      await expect(CourseService.enrollInCourse(userId, courseId)).rejects.toThrow('Failed to enroll in course: 400');
    });
  });

  /**
   * Test suite for getCourseEnrollment method
   * This method fetches enrollment status and progress for a user in a specific course
   */
  describe('getCourseEnrollment', () => {
    it('should successfully fetch course enrollment', async () => {
      // Arrange: Set up test data for existing enrollment
      const userId = 'user-123';
      const courseId = 'course-123';
      // Mock enrollment data with progress information
      const mockEnrollment = {
        success: true,
        data: {
          id: 'enrollment-123',
          user_id: userId,
          course_id: courseId,
          enrollment_date: '2024-01-01T00:00:00Z',
          progress_percentage: 50, // User is halfway through the course
          current_part_number: 2,
          current_lesson_number: 3,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      };

      // Mock fetch to return enrollment data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnrollment,
      } as Response);

      // Act: Call the method to get enrollment status
      const result = await CourseService.getCourseEnrollment(userId, courseId);

      // Assert: Verify correct GET request and returned enrollment data
      expect(mockFetch).toHaveBeenCalledWith(`${TEST_API_URL}/api/v1/courses/${courseId}/enrollment/${userId}`);
      expect(result).toEqual(mockEnrollment);
    });

    it('should handle not enrolled status (404)', async () => {
      // Arrange: Set up test data for user not enrolled in course
      const userId = 'user-123';
      const courseId = 'course-123';

      // Mock fetch to return 404 (enrollment not found)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      // Act: Call the method for non-enrolled user
      const result = await CourseService.getCourseEnrollment(userId, courseId);

      // Assert: Verify that 404 is handled gracefully and returns "Not enrolled" message
      expect(result).toEqual({ success: false, error: 'Not enrolled' });
    });

    it('should throw an error for other HTTP errors', async () => {
      // Arrange: Set up test data for server error scenario
      const userId = 'user-123';
      const courseId = 'course-123';

      // Mock fetch to return 500 Internal Server Error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      // Act & Assert: Verify that server errors are thrown (not handled like 404)
      await expect(CourseService.getCourseEnrollment(userId, courseId)).rejects.toThrow('Failed to fetch enrollment: 500');
    });
  });
}); 