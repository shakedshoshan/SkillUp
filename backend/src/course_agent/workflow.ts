import { ChatOpenAI } from "@langchain/openai";
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
  private llm: ChatOpenAI;
  private knowledgeService: KnowledgeService;

  constructor() {
    console.log("🔨 Initializing Course Builder Workflow...");
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });
    this.knowledgeService = new KnowledgeService();
    console.log("✅ LangChain Workflow Ready!");
  }

  /**
   * Execute the complete course building workflow
   */
  async run(userQuery: string): Promise<WorkflowState> {
    console.log(`\n🚀 Starting Course Builder for: '${userQuery}'`);
    console.log('='.repeat(60));

    const initialState: WorkflowState = {
      user_query: userQuery,
      course_subject: '',
      course_structure: undefined,
      current_part_index: 0,
      current_lesson_index: 0,
      status_message: ''
    };

    try {
      // Step 1: Extract Course Structure
      console.log(CourseFormatter.formatProgress(1, 3, 'Extracting Course Structure'));
      let state = await this._extractCourseStructure(initialState);

      // Step 2: Build Lessons
      console.log(CourseFormatter.formatProgress(2, 3, 'Building Lessons'));
      const updatedState1 = await this._buildLessons({ ...initialState, ...state });

      // Step 3: Generate Content
      console.log(CourseFormatter.formatProgress(3, 3, 'Generating Content'));
      const finalState = await this._generateLessonContent({ ...initialState, ...state, ...updatedState1 });

      console.log('\n✅ Course Building Complete!');
      return { ...initialState, ...state, ...updatedState1, ...finalState };
    } catch (error) {
      console.error('\n❌ Error in workflow:', error);
      throw error;
    }
  }

  /**
   * Step 1: Extract main course parts and structure
   */
  private async _extractCourseStructure(state: WorkflowState): Promise<Partial<WorkflowState>> {
    console.log('\n📋 STEP 1: Extracting Course Structure...');
    console.log(`   Analyzing subject: ${state.user_query}`);

    try {
      // Gather knowledge about the subject
      const knowledge = await this.knowledgeService.gatherSubjectKnowledge(state.user_query);
      console.log(`   ✓ Gathered knowledge from ${knowledge.split('\n').length} sources`);

      // Create structured LLM with CourseStructure schema
      const structuredLLM = this.llm.withStructuredOutput(CourseStructureSchema);

      // Create prompt template
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", CoursePrompts.STRUCTURE_SYSTEM],
        ["human", CoursePrompts.structureUser(state.user_query, knowledge)]
      ]);

      // Invoke the structured LLM
      const courseStructure = await structuredLLM.invoke(
        await prompt.formatMessages({})
      );

      console.log(`   ✓ Generated course: '${courseStructure.title}'`);
      console.log(`   ✓ Created ${courseStructure.parts.length} main parts`);

      courseStructure.parts.forEach((part, i) => {
        console.log(`      ${i + 1}. ${part.title}`);
      });

      return {
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
  private async _buildLessons(state: WorkflowState): Promise<Partial<WorkflowState>> {
    console.log('\n📚 STEP 2: Building Lessons for Each Part...');

    if (!state.course_structure) {
      throw new Error('Course structure not available');
    }

    try {
      const updatedParts: CoursePart[] = [];

      for (let partIdx = 0; partIdx < state.course_structure.parts.length; partIdx++) {
        const part = state.course_structure.parts[partIdx];
        console.log(`\n   Processing Part ${partIdx + 1}: ${part.title}`);

        // Create structured LLM for lessons array
        const structuredLLM = this.llm.withStructuredOutput(
          LessonContentSchema.array()
        );

        // Create prompt template
        const prompt = ChatPromptTemplate.fromMessages([
          ["system", CoursePrompts.LESSONS_SYSTEM],
          ["human", CoursePrompts.lessonsUser(part.title, part.description, part.learning_goals)]
        ]);

        // Invoke the structured LLM
        const lessonsData = await structuredLLM.invoke(
          await prompt.formatMessages({})
        );

        // Convert to CourseLesson format and limit to 5
        const lessons: CourseLesson[] = lessonsData.slice(0, 5).map((lessonData, idx) => ({
          lesson_number: idx + 1,
          title: lessonData.title,
          description: `Lesson covering ${lessonData.title}`,
          content: undefined
        }));

        part.lessons = lessons;

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
  private async _generateLessonContent(state: WorkflowState): Promise<Partial<WorkflowState>> {
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

          // Create structured LLM for lesson content
          const structuredLLM = this.llm.withStructuredOutput(LessonContentSchema);

          // Create prompt template
          const prompt = ChatPromptTemplate.fromMessages([
            ["system", CoursePrompts.CONTENT_SYSTEM],
            ["human", CoursePrompts.contentUser(
              state.course_subject,
              part.title,
              lesson.title,
              lesson.description
            )]
          ]);

          // Invoke the structured LLM
          const lessonContent = await structuredLLM.invoke(
            await prompt.formatMessages({})
          );

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

      // Save Course to JSON automatically
      console.log('\n💾 Saving course to JSON file...');
      try {
        const savedPath = await CourseSaver.saveCourse(updatedCourseStructure);
        const statusMessage = `Course complete with ${totalLessonsProcessed} fully detailed lessons | Saved to: ${savedPath}`;
        
        return {
          course_structure: updatedCourseStructure,
          status_message: statusMessage
        };
      } catch (saveError) {
        console.error('⚠️  Warning: Failed to save course to file:', saveError);
        return {
          course_structure: updatedCourseStructure,
          status_message: `Course complete with ${totalLessonsProcessed} fully detailed lessons | Warning: Save failed`
        };
      }

    } catch (error) {
      console.error('   ❌ Error generating lesson content:', error);
      throw error;
    }
  }
} 