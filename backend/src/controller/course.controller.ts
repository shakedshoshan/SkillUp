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

  // Update course details
  static updateCourse = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, description, target_audience, prerequisites, total_duration, difficulty_level, tags, is_published } = req.body;

    ValidationUtils.validateRequiredParam(id, 'Course ID');
    ValidationUtils.validateUUID(id, 'Course ID');

    const supabase = dbConfig.getClient();

    // Check if course exists
    const { data: existingCourse, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', id)
      .single();

    if (courseError || !existingCourse) {
      throw new NotFoundError('Course');
    }

    // Update course
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (target_audience !== undefined) updateData.target_audience = target_audience;
    if (prerequisites !== undefined) updateData.prerequisites = prerequisites;
    if (total_duration !== undefined) updateData.total_duration = total_duration;
    if (difficulty_level !== undefined) updateData.difficulty_level = difficulty_level;
    if (tags !== undefined) updateData.tags = tags;
    if (is_published !== undefined) updateData.is_published = is_published;
    updateData.updated_at = new Date().toISOString();

    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Invalidate course cache
    try {
      await cacheService.clearByPattern(`course:${id}:*`, {
        keyPrefix: 'skillup:courses:'
      });
      await cacheService.clearByPattern('courses:all', {
        keyPrefix: 'skillup:'
      });
    } catch (cacheError) {
      console.warn('Failed to invalidate course cache:', cacheError);
    }

    res.json({
      success: true,
      data: course
    });
  });

  // Add a new part to course
  static addCoursePart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, description, learning_goals } = req.body;

    ValidationUtils.validateRequiredParam(id, 'Course ID');
    ValidationUtils.validateRequiredParam(title, 'Part title');
    ValidationUtils.validateRequiredParam(description, 'Part description');
    ValidationUtils.validateUUID(id, 'Course ID');

    const supabase = dbConfig.getClient();

    // Check if course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', id)
      .single();

    if (courseError || !course) {
      throw new NotFoundError('Course');
    }

    // Get the next part number
    const { data: existingParts } = await supabase
      .from('course_parts')
      .select('part_number')
      .eq('course_id', id)
      .order('part_number', { ascending: false })
      .limit(1);

    const nextPartNumber = existingParts && existingParts.length > 0 ? existingParts[0].part_number + 1 : 1;

    // Create new part
    const { data: part, error: partError } = await supabase
      .from('course_parts')
      .insert({
        course_id: id,
        part_number: nextPartNumber,
        title,
        description,
        learning_goals: learning_goals || []
      })
      .select()
      .single();

    if (partError) {
      throw partError;
    }

    // Invalidate course cache
    try {
      await cacheService.clearByPattern(`course:${id}:*`, {
        keyPrefix: 'skillup:courses:'
      });
    } catch (cacheError) {
      console.warn('Failed to invalidate course cache:', cacheError);
    }

    res.status(201).json({
      success: true,
      data: part
    });
  });

  // Update course part
  static updateCoursePart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, partId } = req.params;
    const { title, description, learning_goals } = req.body;

    ValidationUtils.validateRequiredParam(id, 'Course ID');
    ValidationUtils.validateRequiredParam(partId, 'Part ID');
    ValidationUtils.validateUUID(id, 'Course ID');
    ValidationUtils.validateUUID(partId, 'Part ID');

    const supabase = dbConfig.getClient();

    // Check if part exists and belongs to the course
    const { data: existingPart, error: partError } = await supabase
      .from('course_parts')
      .select('id')
      .eq('id', partId)
      .eq('course_id', id)
      .single();

    if (partError || !existingPart) {
      throw new NotFoundError('Course part');
    }

    // Update part
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (learning_goals !== undefined) updateData.learning_goals = learning_goals;
    updateData.updated_at = new Date().toISOString();

    const { data: part, error: updateError } = await supabase
      .from('course_parts')
      .update(updateData)
      .eq('id', partId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Invalidate course cache
    try {
      await cacheService.clearByPattern(`course:${id}:*`, {
        keyPrefix: 'skillup:courses:'
      });
    } catch (cacheError) {
      console.warn('Failed to invalidate course cache:', cacheError);
    }

    res.json({
      success: true,
      data: part
    });
  });

  // Delete course part
  static deleteCoursePart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, partId } = req.params;

    ValidationUtils.validateRequiredParam(id, 'Course ID');
    ValidationUtils.validateRequiredParam(partId, 'Part ID');
    ValidationUtils.validateUUID(id, 'Course ID');
    ValidationUtils.validateUUID(partId, 'Part ID');

    const supabase = dbConfig.getClient();

    // Check if part exists and belongs to the course
    const { data: existingPart, error: partError } = await supabase
      .from('course_parts')
      .select('id')
      .eq('id', partId)
      .eq('course_id', id)
      .single();

    if (partError || !existingPart) {
      throw new NotFoundError('Course part');
    }

    // Delete part (cascade will handle lessons, content, and quizzes)
    const { error: deleteError } = await supabase
      .from('course_parts')
      .delete()
      .eq('id', partId);

    if (deleteError) {
      throw deleteError;
    }

    // Invalidate course cache
    try {
      await cacheService.clearByPattern(`course:${id}:*`, {
        keyPrefix: 'skillup:courses:'
      });
    } catch (cacheError) {
      console.warn('Failed to invalidate course cache:', cacheError);
    }

    res.json({
      success: true,
      message: 'Course part deleted successfully'
    });
  });

  // Add a new lesson to part
  static addLesson = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, partId } = req.params;
    const { title, description, content, quiz } = req.body;

    ValidationUtils.validateRequiredParam(id, 'Course ID');
    ValidationUtils.validateRequiredParam(partId, 'Part ID');
    ValidationUtils.validateRequiredParam(title, 'Lesson title');
    ValidationUtils.validateRequiredParam(description, 'Lesson description');
    ValidationUtils.validateUUID(id, 'Course ID');
    ValidationUtils.validateUUID(partId, 'Part ID');

    const supabase = dbConfig.getClient();

    // Check if part exists and belongs to the course
    const { data: part, error: partError } = await supabase
      .from('course_parts')
      .select('id')
      .eq('id', partId)
      .eq('course_id', id)
      .single();

    if (partError || !part) {
      throw new NotFoundError('Course part');
    }

    // Get the next lesson number
    const { data: existingLessons } = await supabase
      .from('course_lessons')
      .select('lesson_number')
      .eq('course_part_id', partId)
      .order('lesson_number', { ascending: false })
      .limit(1);

    const nextLessonNumber = existingLessons && existingLessons.length > 0 ? existingLessons[0].lesson_number + 1 : 1;

    // Create new lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .insert({
        course_part_id: partId,
        lesson_number: nextLessonNumber,
        title,
        description
      })
      .select()
      .single();

    if (lessonError) {
      throw lessonError;
    }

    // Create lesson content if provided
    if (content) {
      const { error: contentError } = await supabase
        .from('lesson_content')
        .insert({
          lesson_id: lesson.id,
          title: content.title || title,
          learning_objectives: content.learning_objectives || [],
          content: content.content || '',
          key_concepts: content.key_concepts || [],
          examples: content.examples || [],
          exercises: content.exercises || [],
          estimated_duration: content.estimated_duration || '30 minutes'
        });

      if (contentError) {
        throw contentError;
      }
    }

    // Create quiz if provided
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      const { data: quizData, error: quizError } = await supabase
        .from('lesson_quizzes')
        .insert({
          lesson_id: lesson.id
        })
        .select()
        .single();

      if (quizError) {
        throw quizError;
      }

      // Create quiz questions and options
      for (const question of quiz.questions) {
        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quizData.id,
            question_number: question.question_number,
            question: question.question,
            explanation: question.explanation
          })
          .select()
          .single();

        if (questionError) {
          throw questionError;
        }

        // Create quiz options
        for (const option of question.options) {
          const { error: optionError } = await supabase
            .from('quiz_options')
            .insert({
              question_id: questionData.id,
              option_letter: option.option_letter,
              option_text: option.option_text,
              is_correct: option.is_correct
            });

          if (optionError) {
            throw optionError;
          }
        }
      }
    }

    // Invalidate course cache
    try {
      await cacheService.clearByPattern(`course:${id}:*`, {
        keyPrefix: 'skillup:courses:'
      });
    } catch (cacheError) {
      console.warn('Failed to invalidate course cache:', cacheError);
    }

    res.status(201).json({
      success: true,
      data: lesson
    });
  });

  // Update lesson
  static updateLesson = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, partId, lessonId } = req.params;
    const { title, description, content, quiz } = req.body;

    ValidationUtils.validateRequiredParam(id, 'Course ID');
    ValidationUtils.validateRequiredParam(partId, 'Part ID');
    ValidationUtils.validateRequiredParam(lessonId, 'Lesson ID');
    ValidationUtils.validateUUID(id, 'Course ID');
    ValidationUtils.validateUUID(partId, 'Part ID');
    ValidationUtils.validateUUID(lessonId, 'Lesson ID');

    const supabase = dbConfig.getClient();

    // Check if lesson exists and belongs to the part and course
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('id', lessonId)
      .eq('course_part_id', partId)
      .single();

    if (lessonError || !lesson) {
      throw new NotFoundError('Lesson');
    }

    // Update lesson basic info
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedLesson, error: updateError } = await supabase
      .from('course_lessons')
      .update(updateData)
      .eq('id', lessonId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Update lesson content if provided
    if (content) {
      const { data: existingContent } = await supabase
        .from('lesson_content')
        .select('id')
        .eq('lesson_id', lessonId)
        .single();

      const contentData = {
        title: content.title || title,
        learning_objectives: content.learning_objectives || [],
        content: content.content || '',
        key_concepts: content.key_concepts || [],
        examples: content.examples || [],
        exercises: content.exercises || [],
        estimated_duration: content.estimated_duration || '30 minutes',
        updated_at: new Date().toISOString()
      };

      if (existingContent) {
        // Update existing content
        const { error: contentError } = await supabase
          .from('lesson_content')
          .update(contentData)
          .eq('id', existingContent.id);

        if (contentError) {
          throw contentError;
        }
      } else {
        // Create new content
        const { error: contentError } = await supabase
          .from('lesson_content')
          .insert({
            lesson_id: lessonId,
            ...contentData
          });

        if (contentError) {
          throw contentError;
        }
      }
    }

    // Update quiz if provided
    if (quiz) {
      const { data: existingQuiz } = await supabase
        .from('lesson_quizzes')
        .select('id')
        .eq('lesson_id', lessonId)
        .single();

      if (existingQuiz) {
        // Delete existing quiz questions and options (cascade will handle options)
        const { error: deleteQuestionsError } = await supabase
          .from('quiz_questions')
          .delete()
          .eq('quiz_id', existingQuiz.id);

        if (deleteQuestionsError) {
          throw deleteQuestionsError;
        }
      } else {
        // Create new quiz
        const { data: quizData, error: quizError } = await supabase
          .from('lesson_quizzes')
          .insert({
            lesson_id: lessonId
          })
          .select()
          .single();

        if (quizError) {
          throw quizError;
        }

        // Create quiz questions and options
        if (quiz.questions && quiz.questions.length > 0) {
          for (const question of quiz.questions) {
            const { data: questionData, error: questionError } = await supabase
              .from('quiz_questions')
              .insert({
                quiz_id: quizData.id,
                question_number: question.question_number,
                question: question.question,
                explanation: question.explanation
              })
              .select()
              .single();

            if (questionError) {
              throw questionError;
            }

            // Create quiz options
            for (const option of question.options) {
              const { error: optionError } = await supabase
                .from('quiz_options')
                .insert({
                  question_id: questionData.id,
                  option_letter: option.option_letter,
                  option_text: option.option_text,
                  is_correct: option.is_correct
                });

              if (optionError) {
                throw optionError;
              }
            }
          }
        }
      }
    }

    // Invalidate course cache
    try {
      await cacheService.clearByPattern(`course:${id}:*`, {
        keyPrefix: 'skillup:courses:'
      });
    } catch (cacheError) {
      console.warn('Failed to invalidate course cache:', cacheError);
    }

    res.json({
      success: true,
      data: updatedLesson
    });
  });

  // Delete lesson
  static deleteLesson = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id, partId, lessonId } = req.params;

    ValidationUtils.validateRequiredParam(id, 'Course ID');
    ValidationUtils.validateRequiredParam(partId, 'Part ID');
    ValidationUtils.validateRequiredParam(lessonId, 'Lesson ID');
    ValidationUtils.validateUUID(id, 'Course ID');
    ValidationUtils.validateUUID(partId, 'Part ID');
    ValidationUtils.validateUUID(lessonId, 'Lesson ID');

    const supabase = dbConfig.getClient();

    // Check if lesson exists and belongs to the part and course
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('id', lessonId)
      .eq('course_part_id', partId)
      .single();

    if (lessonError || !lesson) {
      throw new NotFoundError('Lesson');
    }

    // Delete lesson (cascade will handle content, quiz, questions, and options)
    const { error: deleteError } = await supabase
      .from('course_lessons')
      .delete()
      .eq('id', lessonId);

    if (deleteError) {
      throw deleteError;
    }

    // Invalidate course cache
    try {
      await cacheService.clearByPattern(`course:${id}:*`, {
        keyPrefix: 'skillup:courses:'
      });
    } catch (cacheError) {
      console.warn('Failed to invalidate course cache:', cacheError);
    }

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  });
} 