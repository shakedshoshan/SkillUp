import { Request, Response } from 'express';
import { dbConfig } from '../config/db.config';
import { cacheService } from '../services/cache.service';
import { envConfig } from '../config/env.config';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware';
import { ValidationUtils } from '../utils/validation.utils';

export class CourseController {
  
  // Get course by ID with all nested data
  static getCourseById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    ValidationUtils.validateRequiredParam(id, 'Course ID');
    ValidationUtils.validateUUID(id, 'Course ID');

    // Cache key for the course
    const cacheKey = `course:${id}:full`;
    
    // Try to get from cache first
    const cachedCourse = await cacheService.get(cacheKey, {
      ttl: envConfig.redis.courseTTL, // Configurable course cache duration
      keyPrefix: 'skillup:courses:'
    });

    if (cachedCourse) {
      console.log(`Cache hit for course ${id}`);
      res.json({
        success: true,
        data: cachedCourse,
        cached: true
      });
      return;
    }

    console.log(`Cache miss for course ${id}, fetching from database`);

    const supabase = dbConfig.getClient();
    
    // First, get the course basic information
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (courseError) {
      throw courseError;
    }

    // Get course parts
    const { data: courseParts, error: partsError } = await supabase
      .from('course_parts')
      .select('*')
      .eq('course_id', id)
      .order('part_number', { ascending: true });

    if (partsError) {
      throw partsError;
    }

    // Build the complete course structure
    const courseWithParts = {
      ...course,
      parts: []
    };

    // For each part, get lessons and their content
    for (const part of courseParts || []) {
      // Get lessons for this part
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_part_id', part.id)
        .order('lesson_number', { ascending: true });

      if (lessonsError) {
        throw lessonsError;
      }

      const partWithLessons = {
        ...part,
        lessons: []
      };

      // For each lesson, get content and quiz
      for (const lesson of lessons || []) {
        // Get lesson content
        const { data: lessonContent, error: contentError } = await supabase
          .from('lesson_content')
          .select('*')
          .eq('lesson_id', lesson.id)
          .single();

        // Get lesson quiz
        const { data: lessonQuiz, error: quizError } = await supabase
          .from('lesson_quizzes')
          .select('*')
          .eq('lesson_id', lesson.id)
          .single();

        const lessonWithContent = {
          ...lesson,
          content: lessonContent || null,
          quiz: null
        };

        // If quiz exists, get questions and options
        if (lessonQuiz && !quizError) {
          // Get quiz questions
          const { data: questions, error: questionsError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', lessonQuiz.id)
            .order('question_number', { ascending: true });

          if (questionsError) {
            throw questionsError;
          }

          const questionsWithOptions = [];

          // For each question, get options
          for (const question of questions || []) {
            const { data: options, error: optionsError } = await supabase
              .from('quiz_options')
              .select('*')
              .eq('question_id', question.id)
              .order('option_letter', { ascending: true });

            if (optionsError) {
              throw optionsError;
            }

            questionsWithOptions.push({
              ...question,
              options: options || []
            });
          }

          lessonWithContent.quiz = {
            ...lessonQuiz,
            questions: questionsWithOptions
          };
        }

        partWithLessons.lessons.push(lessonWithContent);
      }

      courseWithParts.parts.push(partWithLessons);
    }

    // Cache the complete course data
    await cacheService.set(cacheKey, courseWithParts, {
      ttl: envConfig.redis.courseTTL, // Configurable course cache duration
      keyPrefix: 'skillup:courses:'
    });

    console.log(`Course ${id} cached successfully`);

    res.json({
      success: true,
      data: courseWithParts,
      cached: false
    });
  });

  // Get all courses (basic info only)
  static getAllCourses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const cacheKey = 'courses:all';
    
    // Try to get from cache first
    const cachedCourses = await cacheService.get(cacheKey, {
      ttl: 1800, // 30 minutes cache for list data
    });

    if (cachedCourses) {
      console.log('Cache hit for all courses');
      res.json({
        success: true,
        data: cachedCourses,
        count: cachedCourses.length,
        cached: true
      });
      return;
    }

    console.log('Cache miss for all courses, fetching from database');

    const supabase = dbConfig.getClient();
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const courses = data || [];

    // Cache the courses list
    await cacheService.set(cacheKey, courses, {
      ttl: 1800, // 30 minutes cache
    });

    console.log('All courses cached successfully');

    res.json({
      success: true,
      data: courses,
      count: courses.length,
      cached: false
    });
  });

  // Get published courses only
  static getPublishedCourses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const supabase = dbConfig.getClient();
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  });

  // Get courses by user ID (basic course data only)
  static getCoursesByUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    ValidationUtils.validateRequiredParam(userId, 'User ID');
    ValidationUtils.validateUUID(userId, 'User ID');

    const supabase = dbConfig.getClient();
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('created_by_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
      user_id: userId
    });
  });

  // Enroll user in a course
  static enrollInCourse = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { user_id } = req.body;

    ValidationUtils.validateRequiredParam(courseId, 'Course ID');
    ValidationUtils.validateRequiredParam(user_id, 'User ID');
    ValidationUtils.validateUUID(courseId, 'Course ID');
    ValidationUtils.validateUUID(user_id, 'User ID');

    const supabase = dbConfig.getClient();

    // Check if course exists and is published
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, is_published')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      throw new NotFoundError('Course');
    }

    // In development mode, allow enrollment in unpublished courses
    if (!course.is_published && process.env.NODE_ENV === 'production') {
      throw new ValidationError('Course is not published');
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', user_id)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      throw new ValidationError('User is already enrolled in this course');
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id,
        course_id: courseId,
        current_part_number: 1,
        current_lesson_number: 1,
        progress_percentage: 0
      })
      .select()
      .single();

    if (enrollmentError) {
      throw enrollmentError;
    }

    res.status(201).json({
      success: true,
      data: enrollment
    });
  });

  // Get course enrollment for a user
  static getCourseEnrollment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId, userId } = req.params;

    ValidationUtils.validateRequiredParam(courseId, 'Course ID');
    ValidationUtils.validateRequiredParam(userId, 'User ID');
    ValidationUtils.validateUUID(courseId, 'Course ID');
    ValidationUtils.validateUUID(userId, 'User ID');

    const supabase = dbConfig.getClient();

    const { data: enrollment, error } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: enrollment
    });
  });

  // Update course progress
  static updateProgress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const { user_id, current_part_number, current_lesson_number } = req.body;

    ValidationUtils.validateRequiredParam(courseId, 'Course ID');
    ValidationUtils.validateRequiredParam(user_id, 'User ID');
    ValidationUtils.validateRequiredParam(current_part_number, 'Current part number');
    ValidationUtils.validateRequiredParam(current_lesson_number, 'Current lesson number');
    
    ValidationUtils.validateUUID(courseId, 'Course ID');
    ValidationUtils.validateUUID(user_id, 'User ID');
    ValidationUtils.validateNumber(current_part_number, 'Current part number', 1);
    ValidationUtils.validateNumber(current_lesson_number, 'Current lesson number', 1);

    const supabase = dbConfig.getClient();

    // Calculate progress percentage
    // Get total lessons in course
    const { data: courseParts } = await supabase
      .from('course_parts')
      .select(`
        id,
        part_number,
        course_lessons(id, lesson_number)
      `)
      .eq('course_id', courseId);

    let totalLessons = 0;
    let completedLessons = 0;

    for (const part of courseParts || []) {
      const lessons = part.course_lessons || [];
      totalLessons += lessons.length;
      
      if (part.part_number < current_part_number) {
        // All lessons in previous parts are considered completed
        completedLessons += lessons.length;
      } else if (part.part_number === current_part_number) {
        // Lessons up to current lesson in current part
        completedLessons += Math.max(0, current_lesson_number - 1);
      }
    }

    const progress_percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update enrollment
    const { data: enrollment, error } = await supabase
      .from('course_enrollments')
      .update({
        current_part_number,
        current_lesson_number,
        progress_percentage,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Invalidate user's enrolled courses cache when progress is updated
    try {
      await cacheService.clearByPattern(`user:${user_id}:enrolled-courses`, {
        keyPrefix: 'skillup:'
      });
    } catch (cacheError) {
      console.warn('Failed to invalidate user enrolled courses cache:', cacheError);
    }

    res.json({
      success: true,
      data: enrollment
    });
  });

  // Get enrolled courses for a user
  static getEnrolledCourses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    ValidationUtils.validateRequiredParam(userId, 'User ID');
    ValidationUtils.validateUUID(userId, 'User ID');

    const supabase = dbConfig.getClient();

    // Get enrollments with course data
    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        courses (*)
      `)
      .eq('user_id', userId)
      .order('enrollment_date', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform data to match frontend expectations
    const coursesWithEnrollment = enrollments?.map(enrollment => ({
      ...enrollment.courses,
      enrollment: {
        id: enrollment.id,
        user_id: enrollment.user_id,
        course_id: enrollment.course_id,
        enrollment_date: enrollment.enrollment_date,
        completion_date: enrollment.completion_date,
        progress_percentage: enrollment.progress_percentage,
        current_part_number: enrollment.current_part_number,
        current_lesson_number: enrollment.current_lesson_number,
        created_at: enrollment.created_at,
        updated_at: enrollment.updated_at
      }
    })) || [];

    res.json({
      success: true,
      data: coursesWithEnrollment,
      count: coursesWithEnrollment.length
    });
  });

  // Get all lesson completions for a course
  static getCourseCompletions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { courseId, userId } = req.params;

    ValidationUtils.validateRequiredParam(courseId, 'Course ID');
    ValidationUtils.validateRequiredParam(userId, 'User ID');
    ValidationUtils.validateUUID(courseId, 'Course ID');
    ValidationUtils.validateUUID(userId, 'User ID');

    const supabase = dbConfig.getClient();

    // Get all lesson completions for lessons in this course
    const { data: completions, error } = await supabase
      .from('lesson_completions')
      .select(`
        *,
        course_lessons!inner (
          id,
          course_part_id,
          course_parts!inner (
            course_id
          )
        )
      `)
      .eq('user_id', userId)
      .eq('course_lessons.course_parts.course_id', courseId);

    if (error) {
      throw error;
    }

    // Transform to simple completion objects
    const simpleCompletions = completions?.map(completion => ({
      id: completion.id,
      user_id: completion.user_id,
      lesson_id: completion.lesson_id,
      completed_at: completion.completed_at,
      quiz_score: completion.quiz_score,
      quiz_total: completion.quiz_total,
      time_spent_minutes: completion.time_spent_minutes,
      created_at: completion.created_at
    })) || [];

    res.json({
      success: true,
      data: simpleCompletions
    });
  });
} 