import { CourseStructure } from './models';
import { dbConfig } from '../config/db.config';
import { v4 as uuidv4 } from 'uuid';

export class CourseSaver {
  /**
   * Save course content to the database
   */
  static async saveCourse(course: CourseStructure, createdByUserId?: string): Promise<string> {
    const supabase = dbConfig.getClient();
    
    try {
      console.log(`\n💾 Saving course "${course.title}" to database...`);
      
      // Start transaction by saving the main course
      const courseId = uuidv4();
      const now = new Date().toISOString();
      
      // 1. Save main course record
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          id: courseId,
          title: course.title,
          description: course.description,
          target_audience: course.target_audience,
          prerequisites: course.prerequisites,
          total_duration: course.total_duration,
          tags: [], // Can be extended later
          is_published: false,
          created_by_user_id: createdByUserId,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (courseError) {
        throw new Error(`Failed to save course: ${courseError.message}`);
      }

      console.log(`✅ Course saved with ID: ${courseId}`);

      // 2. Save course parts
      const partPromises = course.parts.map(async (part) => {
        const partId = uuidv4();
        
        const { data: partData, error: partError } = await supabase
          .from('course_parts')
          .insert({
            id: partId,
            course_id: courseId,
            part_number: part.part_number,
            title: part.title,
            description: part.description,
            learning_goals: part.learning_goals,
            created_at: now,
            updated_at: now
          })
          .select()
          .single();

        if (partError) {
          throw new Error(`Failed to save part ${part.part_number}: ${partError.message}`);
        }

        console.log(`✅ Part ${part.part_number} saved with ID: ${partId}`);

        // 3. Save lessons for this part
        const lessonPromises = part.lessons.map(async (lesson) => {
          const lessonId = uuidv4();
          
          const { data: lessonData, error: lessonError } = await supabase
            .from('course_lessons')
            .insert({
              id: lessonId,
              course_part_id: partId,
              lesson_number: lesson.lesson_number,
              title: lesson.title,
              description: lesson.description,
              created_at: now,
              updated_at: now
            })
            .select()
            .single();

          if (lessonError) {
            throw new Error(`Failed to save lesson ${lesson.lesson_number}: ${lessonError.message}`);
          }

          console.log(`✅ Lesson ${lesson.lesson_number} saved with ID: ${lessonId}`);

          // 4. Save lesson content if it exists
          if (lesson.content) {
            const { error: contentError } = await supabase
              .from('lesson_content')
              .insert({
                id: uuidv4(),
                lesson_id: lessonId,
                title: lesson.content.title,
                learning_objectives: lesson.content.learning_objectives,
                content: lesson.content.content,
                key_concepts: lesson.content.key_concepts,
                examples: lesson.content.examples,
                exercises: lesson.content.exercises,
                estimated_duration: lesson.content.estimated_duration,
                created_at: now,
                updated_at: now
              });

            if (contentError) {
              throw new Error(`Failed to save lesson content: ${contentError.message}`);
            }

            console.log(`✅ Lesson content saved for lesson ${lesson.lesson_number}`);

            // 5. Save quiz if it exists
            if (lesson.content.quiz) {
              const quizId = uuidv4();
              
              const { error: quizError } = await supabase
                .from('lesson_quizzes')
                .insert({
                  id: quizId,
                  lesson_id: lessonId,
                  created_at: now,
                  updated_at: now
                });

              if (quizError) {
                throw new Error(`Failed to save quiz: ${quizError.message}`);
              }

              console.log(`✅ Quiz saved for lesson ${lesson.lesson_number}`);

              // 6. Save quiz questions and options
              const questionPromises = lesson.content.quiz.questions.map(async (question, questionIndex) => {
                const questionId = uuidv4();
                
                const { error: questionError } = await supabase
                  .from('quiz_questions')
                  .insert({
                    id: questionId,
                    quiz_id: quizId,
                    question_number: questionIndex + 1,
                    question: question.question,
                    explanation: question.explanation,
                    created_at: now,
                    updated_at: now
                  });

                if (questionError) {
                  throw new Error(`Failed to save question ${questionIndex + 1}: ${questionError.message}`);
                }

                // Save quiz options
                const optionPromises = question.options.map(async (option) => {
                  const { error: optionError } = await supabase
                    .from('quiz_options')
                    .insert({
                      id: uuidv4(),
                      question_id: questionId,
                      option_letter: option.option,
                      option_text: option.text,
                      is_correct: option.is_correct,
                      created_at: now,
                      updated_at: now
                    });

                  if (optionError) {
                    throw new Error(`Failed to save option ${option.option}: ${optionError.message}`);
                  }
                });

                await Promise.all(optionPromises);
              });

              await Promise.all(questionPromises);
              console.log(`✅ Quiz questions and options saved for lesson ${lesson.lesson_number}`);
            }
          }

          return lessonId;
        });

        await Promise.all(lessonPromises);
        return partId;
      });

      await Promise.all(partPromises);

      console.log(`\n🎉 Course "${course.title}" saved successfully to database!`);
      console.log(`📊 Course summary: ${this.getCourseSummary(course)}`);
      console.log(`🆔 Course ID: ${courseId}`);

      return courseId;

    } catch (error) {
      console.error('\n❌ Error saving course to database:', error);
      throw new Error(`Failed to save course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a summary of the course for logging
   */
  private static getCourseSummary(course: CourseStructure): string {
    const totalLessons = course.parts.reduce((total, part) => total + part.lessons.length, 0);
    return `${course.parts.length} parts, ${totalLessons} lessons`;
  }

  /**
   * List all saved courses from database
   */
  static async listSavedCourses(): Promise<any[]> {
    const supabase = dbConfig.getClient();
    
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list courses: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error listing saved courses:', error);
      return [];
    }
  }

  /**
   * Load a saved course by ID from database
   */
  static async loadCourse(courseId: string): Promise<CourseStructure | null> {
    const supabase = dbConfig.getClient();
    
    try {
      // Get course with all related data
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          course_parts!inner (
            *,
            course_lessons!inner (
              *,
              lesson_content (*),
              lesson_quizzes (
                *,
                quiz_questions (
                  *,
                  quiz_options (*)
                )
              )
            )
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) {
        throw new Error(`Failed to load course: ${courseError.message}`);
      }

      if (!courseData) {
        return null;
      }

      // Transform database data back to CourseStructure format
      const course: CourseStructure = {
        title: courseData.title,
        description: courseData.description,
        target_audience: courseData.target_audience,
        prerequisites: courseData.prerequisites,
        total_duration: courseData.total_duration,
        parts: courseData.course_parts.map((part: any) => ({
          part_number: part.part_number,
          title: part.title,
          description: part.description,
          learning_goals: part.learning_goals,
          lessons: part.course_lessons.map((lesson: any) => ({
            lesson_number: lesson.lesson_number,
            title: lesson.title,
            description: lesson.description,
            content: lesson.lesson_content?.[0] ? {
              title: lesson.lesson_content[0].title,
              learning_objectives: lesson.lesson_content[0].learning_objectives,
              content: lesson.lesson_content[0].content,
              key_concepts: lesson.lesson_content[0].key_concepts,
              examples: lesson.lesson_content[0].examples,
              exercises: lesson.lesson_content[0].exercises,
              estimated_duration: lesson.lesson_content[0].estimated_duration,
              quiz: lesson.lesson_quizzes?.[0] ? {
                questions: lesson.lesson_quizzes[0].quiz_questions.map((q: any) => ({
                  question: q.question,
                  explanation: q.explanation,
                  options: q.quiz_options.map((opt: any) => ({
                    option: opt.option_letter,
                    text: opt.option_text,
                    is_correct: opt.is_correct
                  }))
                }))
              } : undefined
            } : undefined
          }))
        }))
      };

      return course;
    } catch (error) {
      console.error(`Error loading course ${courseId}:`, error);
      return null;
    }
  }

  /**
   * Export course to different formats (for backwards compatibility)
   */
  static async exportCourse(course: CourseStructure, format: 'json' | 'database' = 'database'): Promise<string> {
    if (format === 'database') {
      return await this.saveCourse(course);
    } else if (format === 'json') {
      // For backwards compatibility, save as JSON file
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const coursesDir = path.join(process.cwd(), 'created_courses');
      await fs.mkdir(coursesDir, { recursive: true });
      
      const filename = this.generateFilename(course.title);
      const filepath = path.join(coursesDir, filename);
      
      const courseData = {
        metadata: {
          created_at: new Date().toISOString(),
          version: '1.0.0',
          generator: 'Course Builder Agent'
        },
        course: course
      };
      
      await fs.writeFile(filepath, JSON.stringify(courseData, null, 2), 'utf8');
      return filepath;
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate a filename for the course (legacy method)
   */
  private static generateFilename(courseTitle: string): string {
    const sanitizedTitle = courseTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .substring(0, 19);

    return `${sanitizedTitle}_${timestamp}.json`;
  }
} 