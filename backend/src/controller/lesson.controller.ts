import { Request, Response } from 'express';
import { dbConfig } from '../config/db.config';

export class LessonController {
  // Complete a lesson
  static async completeLesson(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { user_id, time_spent_minutes } = req.body;

      if (!lessonId || !user_id) {
        res.status(400).json({
          success: false,
          error: 'Lesson ID and user ID are required'
        });
        return;
      }

      const supabase = dbConfig.getClient();

      // Check if lesson exists
      const { data: lesson, error: lessonError } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('id', lessonId)
        .single();

      if (lessonError || !lesson) {
        res.status(404).json({
          success: false,
          error: 'Lesson not found'
        });
        return;
      }

      // Check if already completed
      const { data: existingCompletion } = await supabase
        .from('lesson_completions')
        .select('id')
        .eq('user_id', user_id)
        .eq('lesson_id', lessonId)
        .single();

      if (existingCompletion) {
        // Update existing completion
        const { data: completion, error: updateError } = await supabase
          .from('lesson_completions')
          .update({
            time_spent_minutes: time_spent_minutes || null,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingCompletion.id)
          .select()
          .single();

        if (updateError) {
          res.status(500).json({
            success: false,
            error: 'Failed to update lesson completion',
            message: updateError.message
          });
          return;
        }

        res.json({
          success: true,
          data: completion
        });
        return;
      }

      // Create new completion
      const { data: completion, error: completionError } = await supabase
        .from('lesson_completions')
        .insert({
          user_id,
          lesson_id: lessonId,
          time_spent_minutes: time_spent_minutes || null
        })
        .select()
        .single();

      if (completionError) {
        res.status(500).json({
          success: false,
          error: 'Failed to complete lesson',
          message: completionError.message
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: completion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get lesson completion for a user
  static async getLessonCompletion(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId, userId } = req.params;

      if (!lessonId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Lesson ID and user ID are required'
        });
        return;
      }

      const supabase = dbConfig.getClient();

      const { data: completion, error } = await supabase
        .from('lesson_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          res.status(404).json({
            success: false,
            error: 'Lesson completion not found'
          });
          return;
        }
        
        res.status(500).json({
          success: false,
          error: 'Failed to fetch lesson completion',
          message: error.message
        });
        return;
      }

      res.json({
        success: true,
        data: completion
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Submit quiz for a lesson
  static async submitQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId } = req.params;
      const { user_id, quiz_id, answers } = req.body;

      if (!lessonId || !user_id || !quiz_id || !answers) {
        res.status(400).json({
          success: false,
          error: 'Lesson ID, user ID, quiz ID, and answers are required'
        });
        return;
      }

      const supabase = dbConfig.getClient();

      // Verify quiz belongs to the lesson
      const { data: quiz, error: quizError } = await supabase
        .from('lesson_quizzes')
        .select('id')
        .eq('id', quiz_id)
        .eq('lesson_id', lessonId)
        .single();

      if (quizError || !quiz) {
        res.status(404).json({
          success: false,
          error: 'Quiz not found for this lesson'
        });
        return;
      }

      // Get all questions with correct answers
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select(`
          id,
          quiz_options (
            id,
            is_correct
          )
        `)
        .eq('quiz_id', quiz_id);

      if (questionsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch quiz questions',
          message: questionsError.message
        });
        return;
      }

      // Calculate score
      let score = 0;
      const results = [];

      for (const answer of answers) {
        const question = questions?.find(q => q.id === answer.question_id);
        if (!question) continue;

        const selectedOption = question.quiz_options?.find(o => o.id === answer.selected_option_id);
        const correctOption = question.quiz_options?.find(o => o.is_correct);
        
        const isCorrect = selectedOption?.is_correct || false;
        if (isCorrect) score++;

        results.push({
          question_id: answer.question_id,
          correct: isCorrect,
          selected_option_id: answer.selected_option_id,
          correct_option_id: correctOption?.id || null
        });
      }

      const total = questions?.length || 0;
      const passed = score >= Math.ceil(total * 0.7); // 70% passing grade

      // Update or create lesson completion with quiz score
      const { data: existingCompletion } = await supabase
        .from('lesson_completions')
        .select('id')
        .eq('user_id', user_id)
        .eq('lesson_id', lessonId)
        .single();

      if (existingCompletion) {
        // Update existing completion
        await supabase
          .from('lesson_completions')
          .update({
            quiz_score: score,
            quiz_total: total,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingCompletion.id);
      } else {
        // Create new completion
        await supabase
          .from('lesson_completions')
          .insert({
            user_id,
            lesson_id: lessonId,
            quiz_score: score,
            quiz_total: total
          });
      }

      res.json({
        success: true,
        data: {
          score,
          total,
          passed,
          results
        }
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