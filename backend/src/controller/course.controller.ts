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
} 