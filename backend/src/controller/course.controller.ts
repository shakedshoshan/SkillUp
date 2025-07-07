import { Request, Response } from 'express';
import { dbConfig } from '../config/db.config';

export class CourseController {
  // Get course by ID with all nested data
  static async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Course ID is required'
        });
        return;
      }

      const supabase = dbConfig.getClient();
      
      // First, get the course basic information
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) {
        if (courseError.code === 'PGRST116') {
          res.status(404).json({
            success: false,
            error: 'Course not found'
          });
          return;
        }
        
        res.status(500).json({
          success: false,
          error: 'Failed to fetch course',
          message: courseError.message
        });
        return;
      }

      // Get course parts
      const { data: courseParts, error: partsError } = await supabase
        .from('course_parts')
        .select('*')
        .eq('course_id', id)
        .order('part_number', { ascending: true });

      if (partsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch course parts',
          message: partsError.message
        });
        return;
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
          res.status(500).json({
            success: false,
            error: 'Failed to fetch lessons',
            message: lessonsError.message
          });
          return;
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
              res.status(500).json({
                success: false,
                error: 'Failed to fetch quiz questions',
                message: questionsError.message
              });
              return;
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
                res.status(500).json({
                  success: false,
                  error: 'Failed to fetch quiz options',
                  message: optionsError.message
                });
                return;
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

      res.json({
        success: true,
        data: courseWithParts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all courses (basic info only)
  static async getAllCourses(req: Request, res: Response): Promise<void> {
    try {
      const supabase = dbConfig.getClient();
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch courses',
          message: error.message
        });
        return;
      }

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get published courses only
  static async getPublishedCourses(req: Request, res: Response): Promise<void> {
    try {
      const supabase = dbConfig.getClient();
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch published courses',
          message: error.message
        });
        return;
      }

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get courses by user ID (basic course data only)
  static async getCoursesByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const supabase = dbConfig.getClient();
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('created_by_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch user courses',
          message: error.message
        });
        return;
      }

      res.json({
        success: true,
        data: data || [],
        count: data?.length || 0,
        user_id: userId
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Enroll user in a course
  static async enrollInCourse(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { user_id } = req.body;

      if (!courseId || !user_id) {
        res.status(400).json({
          success: false,
          error: 'Course ID and user ID are required'
        });
        return;
      }

      const supabase = dbConfig.getClient();

      // Check if course exists and is published
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, is_published')
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        res.status(404).json({
          success: false,
          error: 'Course not found'
        });
        return;
      }

      // In development mode, allow enrollment in unpublished courses
      if (!course.is_published && process.env.NODE_ENV === 'production') {
        res.status(400).json({
          success: false,
          error: 'Course is not published'
        });
        return;
      }

      // Check if already enrolled
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user_id)
        .eq('course_id', courseId)
        .single();

      if (existingEnrollment) {
        res.status(400).json({
          success: false,
          error: 'User is already enrolled in this course'
        });
        return;
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
        res.status(500).json({
          success: false,
          error: 'Failed to enroll in course',
          message: enrollmentError.message
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get course enrollment for a user
  static async getCourseEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, userId } = req.params;

      if (!courseId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Course ID and user ID are required'
        });
        return;
      }

      const supabase = dbConfig.getClient();

      const { data: enrollment, error } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({
            success: false,
            error: 'Enrollment not found'
          });
          return;
        }
        
        res.status(500).json({
          success: false,
          error: 'Failed to fetch enrollment',
          message: error.message
        });
        return;
      }

      res.json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update course progress
  static async updateProgress(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const { user_id, current_part_number, current_lesson_number } = req.body;

      if (!courseId || !user_id || !current_part_number || !current_lesson_number) {
        res.status(400).json({
          success: false,
          error: 'Course ID, user ID, part number, and lesson number are required'
        });
        return;
      }

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
        res.status(500).json({
          success: false,
          error: 'Failed to update progress',
          message: error.message
        });
        return;
      }

      res.json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get enrolled courses for a user
  static async getEnrolledCourses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

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
        res.status(500).json({
          success: false,
          error: 'Failed to fetch enrolled courses',
          message: error.message
        });
        return;
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
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get all lesson completions for a course
  static async getCourseCompletions(req: Request, res: Response): Promise<void> {
    try {
      const { courseId, userId } = req.params;

      if (!courseId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Course ID and user ID are required'
        });
        return;
      }

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
        res.status(500).json({
          success: false,
          error: 'Failed to fetch course completions',
          message: error.message
        });
        return;
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
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 