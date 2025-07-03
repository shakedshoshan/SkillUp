import { StateGraph, END } from "langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { WorkflowState, CourseStructure, CoursePart, CourseLesson, LessonContent } from './models';
import { CoursePrompts } from './prompts';
import { KnowledgeService } from './knowledge-service';
import { CourseFormatter } from './course-formatter';
import { CourseSaver } from './course-saver';
import { 
  WorkflowStateSchema, 
  CourseStructureSchema, 
  CourseLessonSchema, 
  LessonContentSchema 
} from './models';

export class CourseBuilderWorkflow {
  private openai: OpenAI;
  private knowledgeService: KnowledgeService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.knowledgeService = new KnowledgeService();
  }

  /**
   * Execute the complete course building workflow
   */
  async run(userQuery: string): Promise<WorkflowState> {
    console.log(`\n🚀 Starting Course Builder for: '${userQuery}'`);
    console.log('='.repeat(60));

    try {
      // Initialize state
      let state: WorkflowState = {
        user_query: userQuery,
        course_subject: '',
        course_structure: undefined,
        current_part_index: 0,
        current_lesson_index: 0,
        status_message: ''
      };

      // Step 1: Extract Course Structure
      console.log(CourseFormatter.formatProgress(1, 3, 'Extracting Course Structure'));
      state = await this.extractCourseStructure(state);

      // Step 2: Build Lessons
      console.log(CourseFormatter.formatProgress(2, 3, 'Building Lessons'));
      state = await this.buildLessons(state);

      // Step 3: Generate Content
      console.log(CourseFormatter.formatProgress(3, 3, 'Generating Content'));
      state = await this.generateLessonContent(state);

      // Step 4: Save Course to JSON
      if (state.course_structure) {
        console.log('\n💾 Saving course to JSON file...');
        try {
          const savedPath = await CourseSaver.saveCourse(state.course_structure);
          state.status_message += ` | Saved to: ${savedPath}`;
        } catch (error) {
          console.error('⚠️  Warning: Failed to save course to file:', error);
          state.status_message += ' | Warning: Save failed';
        }
      }

      console.log('\n✅ Course Building Complete!');
      return state;

    } catch (error) {
      console.error('\n❌ Error in workflow:', error);
      throw error;
    }
  }

  /**
   * Step 1: Extract main course parts and structure
   */
  private async extractCourseStructure(state: WorkflowState): Promise<WorkflowState> {
    console.log('\n📋 STEP 1: Extracting Course Structure...');
    console.log(`   Analyzing subject: ${state.user_query}`);

    try {
      // Gather knowledge about the subject
      const knowledge = await this.knowledgeService.gatherSubjectKnowledge(state.user_query);
      console.log(`   ✓ Gathered knowledge from ${knowledge.split('\n').length} sources`);

      // Create messages for OpenAI
      const messages: OpenAI.Chat.Completions.CreateChatCompletionRequestMessage[] = [
        {
          role: 'system',
          content: CoursePrompts.STRUCTURE_SYSTEM
        },
        {
          role: 'user',
          content: CoursePrompts.structureUser(state.user_query, knowledge)
        }
      ];

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI API');
      }

      // Parse and validate response
      const parsedResponse = JSON.parse(responseContent);
      const courseStructure = CourseStructureSchema.parse(parsedResponse);

      console.log(`   ✓ Generated course: '${courseStructure.title}'`);
      console.log(`   ✓ Created ${courseStructure.parts.length} main parts`);

      courseStructure.parts.forEach((part, i) => {
        console.log(`      ${i + 1}. ${part.title}`);
      });

      return {
        ...state,
        course_subject: state.user_query,
        course_structure: courseStructure,
        status_message: `Extracted ${courseStructure.parts.length} course parts`
      };

    } catch (error) {
      console.error('   ❌ Error extracting course structure:', error);
      throw error;
    }
  }

  /**
   * Step 2: Build lessons for each course part
   */
  private async buildLessons(state: WorkflowState): Promise<WorkflowState> {
    console.log('\n📚 STEP 2: Building Lessons for Each Part...');

    if (!state.course_structure) {
      throw new Error('Course structure not available');
    }

    try {
      const updatedParts: CoursePart[] = [];

      for (let partIdx = 0; partIdx < state.course_structure.parts.length; partIdx++) {
        const part = state.course_structure.parts[partIdx];
        console.log(`\n   Processing Part ${partIdx + 1}: ${part.title}`);

        // Create messages for OpenAI
        const messages: OpenAI.Chat.Completions.CreateChatCompletionRequestMessage[] = [
          {
            role: 'system',
            content: CoursePrompts.LESSONS_SYSTEM
          },
          {
            role: 'user',
            content: CoursePrompts.lessonsUser(part.title, part.description, part.learning_goals)
          }
        ];

        // Call OpenAI API
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        const responseContent = response.choices[0]?.message?.content;
        if (!responseContent) {
          throw new Error('No response from OpenAI API');
        }

        // Parse and validate response
        const parsedResponse = JSON.parse(responseContent);
        
                 // Handle both array and object responses
         let lessons: CourseLesson[];
         if (Array.isArray(parsedResponse)) {
           lessons = parsedResponse.map((lesson: any) => CourseLessonSchema.parse(lesson));
         } else if (parsedResponse.lessons && Array.isArray(parsedResponse.lessons)) {
           lessons = parsedResponse.lessons.map((lesson: any) => CourseLessonSchema.parse(lesson));
         } else {
           throw new Error('Invalid lessons response format');
         }

        // Limit to max 5 lessons per part
        part.lessons = lessons.slice(0, 3);

        console.log(`   ✓ Generated ${part.lessons.length} lessons:`);
        part.lessons.forEach(lesson => {
          console.log(`      - ${lesson.title}`);
        });

        updatedParts.push(part);
      }

      // Update course structure with lessons
      const updatedCourseStructure = {
        ...state.course_structure,
        parts: updatedParts
      };

      const totalLessons = updatedParts.reduce((total, part) => total + part.lessons.length, 0);
      console.log(`\n   ✅ Total lessons created: ${totalLessons}`);

      return {
        ...state,
        course_structure: updatedCourseStructure,
        status_message: `Built ${totalLessons} lessons across ${updatedParts.length} parts`
      };

    } catch (error) {
      console.error('   ❌ Error building lessons:', error);
      throw error;
    }
  }

  /**
   * Step 3: Generate detailed content for each lesson
   */
  private async generateLessonContent(state: WorkflowState): Promise<WorkflowState> {
    console.log('\n📝 STEP 3: Generating Detailed Lesson Content...');

    if (!state.course_structure) {
      throw new Error('Course structure not available');
    }

    try {
      let totalLessonsProcessed = 0;
      const updatedParts: CoursePart[] = [];

      for (let partIdx = 0; partIdx < state.course_structure.parts.length; partIdx++) {
        const part = state.course_structure.parts[partIdx];
        console.log(`\n   Generating content for Part ${partIdx + 1}: ${part.title}`);

        const updatedLessons: CourseLesson[] = [];

        for (let lessonIdx = 0; lessonIdx < part.lessons.length; lessonIdx++) {
          const lesson = part.lessons[lessonIdx];
          console.log(`      Processing Lesson ${lessonIdx + 1}: ${lesson.title}`);

          // Create messages for OpenAI
          const messages: OpenAI.Chat.Completions.CreateChatCompletionRequestMessage[] = [
            {
              role: 'system',
              content: CoursePrompts.CONTENT_SYSTEM
            },
            {
              role: 'user',
              content: CoursePrompts.contentUser(
                state.course_subject,
                part.title,
                lesson.title,
                lesson.description
              )
            }
          ];

          // Call OpenAI API
          const response = await this.openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.7,
            response_format: { type: 'json_object' }
          });

          const responseContent = response.choices[0]?.message?.content;
          if (!responseContent) {
            throw new Error('No response from OpenAI API');
          }

          // Parse and validate response
          const parsedResponse = JSON.parse(responseContent);
          const lessonContent = LessonContentSchema.parse(parsedResponse);

          // Update lesson with content
          const updatedLesson = {
            ...lesson,
            content: lessonContent
          };

          updatedLessons.push(updatedLesson);
          totalLessonsProcessed++;

          console.log(`         ✓ Content generated (${lessonContent.key_concepts.length} concepts, ${lessonContent.examples.length} examples)`);
        }

        // Update part with lessons
        const updatedPart = {
          ...part,
          lessons: updatedLessons
        };

        updatedParts.push(updatedPart);
      }

      // Update course structure with content
      const updatedCourseStructure = {
        ...state.course_structure,
        parts: updatedParts
      };

      console.log(`\n   ✅ Generated detailed content for ${totalLessonsProcessed} lessons`);

      return {
        ...state,
        course_structure: updatedCourseStructure,
        status_message: `Course complete with ${totalLessonsProcessed} fully detailed lessons`
      };

    } catch (error) {
      console.error('   ❌ Error generating lesson content:', error);
      throw error;
    }
  }
} 