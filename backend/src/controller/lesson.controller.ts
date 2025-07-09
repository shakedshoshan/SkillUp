import { Request, Response, NextFunction } from 'express';
import { dbConfig } from '../config/db.config';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware';
import { ValidationUtils } from '../utils/validation.utils';

export class LessonController {
  // Complete a lesson
  static completeLesson = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { lessonId } = req.params;
    const { user_id, time_spent_minutes } = req.body;

    ValidationUtils.validateRequiredParam(lessonId, 'Lesson ID');
    ValidationUtils.validateRequiredParam(user_id, 'User ID');
    ValidationUtils.validateUUID(lessonId, 'Lesson ID');
    ValidationUtils.validateUUID(user_id, 'User ID');

    if (time_spent_minutes !== undefined) {
      ValidationUtils.validateNumber(time_spent_minutes, 'Time spent minutes', 0);
    }

    const supabase = dbConfig.getClient();

    // Check if lesson exists
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      throw new NotFoundError('Lesson');
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
        throw updateError;
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
      throw completionError;
    }

    res.status(201).json({
      success: true,
      data: completion
    });
  });

  // Get lesson completion for a user
  static getLessonCompletion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { lessonId, userId } = req.params;

    ValidationUtils.validateRequiredParam(lessonId, 'Lesson ID');
    ValidationUtils.validateRequiredParam(userId, 'User ID');
    ValidationUtils.validateUUID(lessonId, 'Lesson ID');
    ValidationUtils.validateUUID(userId, 'User ID');

    const supabase = dbConfig.getClient();

    const { data: completion, error } = await supabase
      .from('lesson_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: completion
    });
  });

  // Submit quiz for a lesson
  static submitQuiz = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { lessonId } = req.params;
    const { user_id, quiz_id, answers } = req.body;

    ValidationUtils.validateRequiredParam(lessonId, 'Lesson ID');
    ValidationUtils.validateRequiredParam(user_id, 'User ID');
    ValidationUtils.validateRequiredParam(quiz_id, 'Quiz ID');
    ValidationUtils.validateRequiredParam(answers, 'Answers');
    
    ValidationUtils.validateUUID(lessonId, 'Lesson ID');
    ValidationUtils.validateUUID(user_id, 'User ID');
    ValidationUtils.validateUUID(quiz_id, 'Quiz ID');
    ValidationUtils.validateArray(answers, 'Answers', 1);

    const supabase = dbConfig.getClient();

    // Verify quiz belongs to the lesson
    const { data: quiz, error: quizError } = await supabase
      .from('lesson_quizzes')
      .select('id')
      .eq('id', quiz_id)
      .eq('lesson_id', lessonId)
      .single();

    if (quizError || !quiz) {
      throw new NotFoundError('Quiz for this lesson');
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
      throw questionsError;
    }

    // Validate answers format
    for (const answer of answers) {
      if (!answer.question_id || !answer.selected_option_id) {
        throw new ValidationError('Each answer must contain question_id and selected_option_id');
      }
      ValidationUtils.validateUUID(answer.question_id, 'Question ID');
      ValidationUtils.validateUUID(answer.selected_option_id, 'Selected option ID');
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
      const { error: updateError } = await supabase
        .from('lesson_completions')
        .update({
          quiz_score: score,
          quiz_total: total,
          completed_at: new Date().toISOString()
        })
        .eq('id', existingCompletion.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new completion
      const { error: insertError } = await supabase
        .from('lesson_completions')
        .insert({
          user_id,
          lesson_id: lessonId,
          quiz_score: score,
          quiz_total: total
        });

      if (insertError) {
        throw insertError;
      }
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
  });
} 