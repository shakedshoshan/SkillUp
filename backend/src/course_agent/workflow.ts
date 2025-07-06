import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
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
import { z } from 'zod';
import { OpenAI } from 'openai';

// Define a lessons response schema for structured output
const LessonsResponseSchema = z.object({
  lessons: z.array(CourseLessonSchema)
});

export class CourseBuilderWorkflow {
  private llm: ChatOpenAI;
  private client: OpenAI;
  private knowledgeService: KnowledgeService;
  private workflow: any;

  constructor() {
    console.log("🔨 Initializing Course Builder Workflow...");
    
    // Standard LLM for structure and lesson planning
    this.llm = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
    });

    // OpenAI client for Responses API with web search
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.knowledgeService = new KnowledgeService();
    this.workflow = this._buildWorkflow();
    console.log("✅ LangGraph Workflow with Web Search Ready!");
  }

  /**
   * Build the workflow (simplified sequential execution)
   */
  private _buildWorkflow() {
    // For now, use sequential execution following LangGraph pattern
    // TODO: Implement full StateGraph when TypeScript types are compatible
    return {
      invoke: async (state: WorkflowState) => {
        // Step 1: Extract Course Structure
        console.log(CourseFormatter.formatProgress(1, 3, 'Extracting Course Structure'));
        const structureUpdate = await this._extractCourseStructure(state);
        const state1 = { ...state, ...structureUpdate };

        // Step 2: Build Lessons  
        console.log(CourseFormatter.formatProgress(2, 3, 'Building Lessons'));
        const lessonsUpdate = await this._buildLessons(state1);
        const state2 = { ...state1, ...lessonsUpdate };

        // Step 3: Generate Content
        console.log(CourseFormatter.formatProgress(3, 3, 'Generating Content'));
        const contentUpdate = await this._generateLessonContent(state2);
        const finalState = { ...state2, ...contentUpdate };

        return finalState;
      }
    };
  }

  /**
   * Execute the complete course building workflow
   */
  async run(userQuery: string, webSearchEnabled: boolean = false): Promise<WorkflowState> {
    console.log(`\n🚀 Starting Course Builder for: '${userQuery}'`);
    if (webSearchEnabled) {
      console.log('🌐 Web search enabled - using real-time information');
    } else {
      console.log('📚 Using standard knowledge base only');
    }
    console.log('='.repeat(60));

    const initialState: WorkflowState = {
      user_query: userQuery,
      course_subject: '',
      course_structure: undefined,
      current_part_index: 0,
      current_lesson_index: 0,
      status_message: '',
      web_search_enabled: webSearchEnabled
    };

    try {
      const finalState = await this.workflow.invoke(initialState);
      console.log('\n✅ Course Building Complete!');
      return finalState;
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

      // Use structured LLM to extract course structure
      const structuredLLM = this.llm.withStructuredOutput(CourseStructureSchema);
      
      const messages = [
        { role: "system" as const, content: CoursePrompts.STRUCTURE_SYSTEM },
        { role: "user" as const, content: CoursePrompts.structureUser(state.user_query, knowledge) }
      ];

      const courseStructure = await structuredLLM.invoke(messages);

      // Ensure parts array is initialized
      if (!courseStructure.parts) {
        courseStructure.parts = [];
      }

      console.log(`   ✓ Generated course: '${courseStructure.title}'`);
      console.log(`   ✓ Created ${courseStructure.parts.length} main parts`);

      courseStructure.parts.forEach((part, i) => {
        console.log(`      ${i + 1}. ${part.title}`);
      });

      return {
        course_subject: state.user_query,
        course_structure: courseStructure as CourseStructure,
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

        // Create structured LLM for lessons response
        const structuredLLM = this.llm.withStructuredOutput(LessonsResponseSchema);

        const messages = [
          { role: "system" as const, content: CoursePrompts.LESSONS_SYSTEM },
          { role: "user" as const, content: CoursePrompts.lessonsUser(part.title, part.description, part.learning_goals) }
        ];

        const response = await structuredLLM.invoke(messages);
        const lessons = response.lessons;

        // Initialize lessons array and limit to 5 lessons per part
        part.lessons = lessons.slice(0, 5).map((lesson, idx) => ({
          ...lesson,
          lesson_number: idx + 1,
          content: undefined
        }));

        console.log(`   ✓ Generated ${part.lessons.length} lessons:`);
        part.lessons.forEach(lesson => {
          console.log(`      - ${lesson.title}`);
        });

        updatedParts.push(part);
      }

      // Update course structure with lessons
      const updatedCourseStructure: CourseStructure = {
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
    const searchMethod = state.web_search_enabled ? 'with Web Search' : 'with Standard Knowledge';
    console.log(`\n📝 STEP 3: Generating Detailed Lesson Content ${searchMethod}...`);

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

          // Choose method based on user preference
          let lessonContent;
          if (state.web_search_enabled) {
            lessonContent = await this._generateContentWithWebSearch(state, part, lesson);
          } else {
            lessonContent = await this._generateContentStandard(state, part, lesson);
          }

          // Update lesson with content
          const updatedLesson: CourseLesson = {
            ...lesson,
            content: lessonContent
          };

          updatedLessons.push(updatedLesson);
          totalLessonsProcessed++;
        }

        // Update part with lessons
        const updatedPart: CoursePart = {
          ...part,
          lessons: updatedLessons
        };

        updatedParts.push(updatedPart);
      }

      // Update course structure with content
      const updatedCourseStructure: CourseStructure = {
        ...state.course_structure,
        parts: updatedParts
      };

      const methodUsed = state.web_search_enabled ? 'web search enhanced' : 'standard knowledge';
      console.log(`\n   ✅ Generated detailed content for ${totalLessonsProcessed} lessons using ${methodUsed}`);

      // Save Course to database automatically
      console.log('\n💾 Saving course to database...');
      try {
        const courseId = await CourseSaver.saveCourse(updatedCourseStructure);
        const statusMessage = `Course complete with ${totalLessonsProcessed} fully detailed lessons (${methodUsed}) | Saved to database with ID: ${courseId}`;
        
        return {
          course_structure: updatedCourseStructure,
          status_message: statusMessage
        };
      } catch (saveError) {
        console.error('⚠️  Warning: Failed to save course to database:', saveError);
        return {
          course_structure: updatedCourseStructure,
          status_message: `Course complete with ${totalLessonsProcessed} fully detailed lessons (${methodUsed}) | Warning: Database save failed`
        };
      }

    } catch (error) {
      console.error('   ❌ Error generating lesson content:', error);
      throw error;
    }
  }

  private async _generateContentWithWebSearch(state: WorkflowState, part: CoursePart, lesson: CourseLesson): Promise<LessonContent> {
    console.log(`      🌐 Using OpenAI Responses API with web search...`);
    
    try {
      const searchPrompt = `${CoursePrompts.contentUser(
        state.course_subject,
        part.title,
        lesson.title,
        lesson.description
      )}

Please respond with a JSON object following this exact structure:
{
  "title": "${lesson.title}",
  "learning_objectives": ["objective1", "objective2", "objective3"],
  "content": "detailed lesson content explanation with current information",
  "key_concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
  "examples": ["example1", "example2", "example3"],
  "exercises": ["exercise1", "exercise2", "exercise3"],
  "estimated_duration": "time estimate",
  "quiz": {
    "questions": [
      {
        "question": "Question text here?",
        "options": [
          {"option": "A", "text": "Option A text", "is_correct": false},
          {"option": "B", "text": "Option B text", "is_correct": true},
          {"option": "C", "text": "Option C text", "is_correct": false},
          {"option": "D", "text": "Option D text", "is_correct": false}
        ],
        "explanation": "Brief explanation of why B is correct"
      },
      {
        "question": "Second question text here?",
        "options": [
          {"option": "A", "text": "Option A text", "is_correct": true},
          {"option": "B", "text": "Option B text", "is_correct": false},
          {"option": "C", "text": "Option C text", "is_correct": false},
          {"option": "D", "text": "Option D text", "is_correct": false}
        ],
        "explanation": "Brief explanation of why A is correct"
      },
      {
        "question": "Third question text here?",
        "options": [
          {"option": "A", "text": "Option A text", "is_correct": false},
          {"option": "B", "text": "Option B text", "is_correct": false},
          {"option": "C", "text": "Option C text", "is_correct": true},
          {"option": "D", "text": "Option D text", "is_correct": false}
        ],
        "explanation": "Brief explanation of why C is correct"
      }
    ]
  }
}`;

      const response = await this.client.responses.create({
        model: "gpt-4o",
        input: searchPrompt,
        tools: [{
          type: "web_search_preview",
          search_context_size: "medium"
        }]
      });

      // Extract the response content
      let responseText = '';
      if (response.output && response.output.length > 0) {
        // Find the assistant message in the output
        for (const output of response.output) {
          if (output.type === 'message' && output.role === 'assistant') {
            const content = output.content[0];
            if (content.type === 'output_text') {
              responseText = content.text;
              break;
            }
          }
        }
      }

      if (!responseText) {
        throw new Error('No content generated from web search');
      }

      // Parse the JSON response
      let lessonContent;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          lessonContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text with default quiz
        lessonContent = {
          title: lesson.title,
          learning_objectives: [
            `Understand the fundamentals of ${lesson.title}`,
            `Apply key concepts in practice`,
            `Demonstrate proficiency in the topic`
          ],
          content: responseText,
          key_concepts: ["Key concept 1", "Key concept 2", "Key concept 3"],
          examples: ["Example 1", "Example 2", "Example 3"],
          exercises: ["Exercise 1", "Exercise 2", "Exercise 3"],
          estimated_duration: "30-45 minutes",
          quiz: {
            questions: [
              {
                question: `What is the main focus of ${lesson.title}?`,
                options: [
                  { option: "A", text: "Basic concepts only", is_correct: false },
                  { option: "B", text: "Advanced theory only", is_correct: false },
                  { option: "C", text: "Practical application and understanding", is_correct: true },
                  { option: "D", text: "None of the above", is_correct: false }
                ],
                explanation: "The lesson focuses on both understanding and practical application."
              },
              {
                question: `Which approach is most effective for learning ${lesson.title}?`,
                options: [
                  { option: "A", text: "Theoretical study only", is_correct: false },
                  { option: "B", text: "Hands-on practice with examples", is_correct: true },
                  { option: "C", text: "Memorization of facts", is_correct: false },
                  { option: "D", text: "Passive observation", is_correct: false }
                ],
                explanation: "Hands-on practice with real examples provides the most effective learning experience."
              },
              {
                question: `What is the recommended duration for this lesson?`,
                options: [
                  { option: "A", text: "15-20 minutes", is_correct: false },
                  { option: "B", text: "30-45 minutes", is_correct: true },
                  { option: "C", text: "60-90 minutes", is_correct: false },
                  { option: "D", text: "2+ hours", is_correct: false }
                ],
                explanation: "The lesson is designed to be completed in 30-45 minutes for optimal learning."
              }
            ]
          }
        };
      }

      // Validate and ensure the content matches our schema
      const validatedContent = LessonContentSchema.parse(lessonContent);
      console.log(`         ✓ Content generated with web search (${validatedContent.key_concepts.length} concepts, ${validatedContent.examples.length} examples, ${validatedContent.quiz.questions.length} quiz questions)`);
      
      return validatedContent;
    } catch (webSearchError) {
      console.log(`         ⚠️  Web search failed, falling back to standard method...`);
      console.error(`         Error: ${webSearchError}`);
      
      // Fallback to standard method if web search fails
      return await this._generateContentStandard(state, part, lesson);
    }
  }

  private async _generateContentStandard(state: WorkflowState, part: CoursePart, lesson: CourseLesson): Promise<LessonContent> {
    console.log(`      📚 Using standard knowledge base...`);
    
    // Use standard LLM with structured output for content generation
    const structuredLLM = this.llm.withStructuredOutput(LessonContentSchema);
    
    const messages = [
      { role: "system" as const, content: CoursePrompts.CONTENT_SYSTEM.replace(
        /\*\*IMPORTANT:[\s\S]*?practices\n\n/, 
        "**Note: Using available knowledge base without web search.**\n\n"
      )},
      { role: "user" as const, content: CoursePrompts.contentUser(
        state.course_subject,
        part.title,
        lesson.title,
        lesson.description
      ).replace(/\*\*STEP 1:[\s\S]*?\n\n/, "")}
    ];

    const lessonContent = await structuredLLM.invoke(messages);
    console.log(`         ✓ Standard content generated (${lessonContent.key_concepts.length} concepts, ${lessonContent.examples.length} examples, ${lessonContent.quiz.questions.length} quiz questions)`);
    
    return lessonContent;
  }
} 