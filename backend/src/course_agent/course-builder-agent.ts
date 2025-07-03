import dotenv from 'dotenv';
import * as readline from 'readline-sync';
import { CourseBuilderWorkflow } from './workflow';
import { CourseFormatter } from './course-formatter';
import { CourseSaver } from './course-saver';
import { WorkflowState } from './models';

// Load environment variables
dotenv.config();

export class CourseBuilderAgent {
  private workflow: CourseBuilderWorkflow;

  constructor() {
    console.log('🤖 Course Builder Agent Initializing...');
    this.workflow = new CourseBuilderWorkflow();
    console.log('✅ Agent Ready!');
  }

  /**
   * Main conversation loop
   */
  async run(): Promise<void> {
    console.log('🎓 Welcome to SkillUp Course Builder Agent!');
    console.log('===============================================');
    console.log('🔧 Create comprehensive courses on any topic');
    console.log('🌐 Optional web search for current information');
    console.log('💾 Automatic saving with course management');
    console.log('===============================================\n');
    console.log('Available commands:');
    console.log('  • Enter any subject to build a course (e.g., "Machine Learning")');
    console.log('  • "list" - Show all saved courses');
    console.log('  • "load [filename]" - View a saved course');
    console.log('  • "help" - Show this help message');
    console.log('  • "exit" - Quit the application\n');

    while (true) {
      try {
        const userInput = readline.question('🎯 Enter course topic or command: ');

        // Handle exit command
        if (userInput.toLowerCase().trim() === 'exit' || userInput.toLowerCase().trim() === 'quit') {
          console.log('👋 Thanks for using SkillUp Course Builder! Goodbye!');
          break;
        }

        // Handle help command
        if (userInput.toLowerCase().trim() === 'help') {
          console.log('\n📖 HELP - Course Builder Commands');
          console.log('==================================');
          console.log('Course Creation:');
          console.log('  • Enter any topic (e.g., "Python Programming", "Digital Marketing")');
          console.log('  • Choose web search option for current information');
          console.log('  • Get detailed lessons with examples and exercises');
          console.log('\nCourse Management:');
          console.log('  • "list" - View all saved courses');
          console.log('  • "load [filename]" - Display a specific course');
          console.log('\nNavigation:');
          console.log('  • "help" - Show this help');
          console.log('  • "exit" - Quit application\n');
          continue;
        }

        if (!userInput.trim()) {
          console.log('Please provide a command or course subject.');
          continue;
        }

        // Handle special commands
        if (userInput.toLowerCase().trim() === 'list') {
          await this.listSavedCourses();
          continue;
        }

        if (userInput.toLowerCase().startsWith('load ')) {
          const filename = userInput.slice(5).trim();
          await this.loadSavedCourse(filename);
          continue;
        }

        // Ask user about web search preference
        console.log('\n🔍 SEARCH PREFERENCE');
        console.log('='.repeat(40));
        console.log('Do you want to use web search for current information?');
        console.log('📍 Yes: Get latest trends, examples, and current best practices');
        console.log('📚 No:  Use standard knowledge base (faster, no web access)');
        
        const webSearchChoice = readline.question('\nUse web search? (y/n) [default: n]: ').trim().toLowerCase();
        const useWebSearch = webSearchChoice === 'y' || webSearchChoice === 'yes';
        
        if (useWebSearch) {
          console.log('🌐 Web search enabled - gathering current information...');
        } else {
          console.log('📚 Using standard knowledge base...');
        }

        // Run the workflow for course creation
        const result = await this.workflow.run(userInput, useWebSearch);

        // Display results
        this.displayResults(result);

        // Ask if user wants lesson details
        await this.offerLessonDetails(result);

      } catch (error) {
        console.error('\n❌ Error:', error);
        console.log('Please try again.');
      }
    }
  }

  /**
   * Display the complete course structure
   */
  private displayResults(result: WorkflowState): void {
    if (!result.course_structure) {
      console.log('❌ No course structure available');
      return;
    }

    console.log('\n' + '🎉 COURSE GENERATED SUCCESSFULLY!');
    console.log(CourseFormatter.formatCompleteCourse(result.course_structure));
    console.log(`\n📊 Status: ${result.status_message}`);
  }

  /**
   * Offer to show detailed lesson content
   */
  private async offerLessonDetails(result: WorkflowState): Promise<void> {
    if (!result.course_structure) {
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📖 LESSON DETAILS AVAILABLE');
    console.log('='.repeat(60));
    console.log('Would you like to see detailed content for any lesson?');
    console.log('Format: \'part.lesson\' (e.g., \'1.2\' for Part 1, Lesson 2)');
    console.log('Type \'no\' or \'next\' to create another course.\n');

    while (true) {
      const choice = readline.question('🔍 Select lesson (part.lesson) or \'no\': ').trim();

      if (choice.toLowerCase() === 'no' || choice.toLowerCase() === 'next' || choice.toLowerCase() === 'n') {
        break;
      }

      try {
        const [partNumStr, lessonNumStr] = choice.split('.');
        const partNum = parseInt(partNumStr);
        const lessonNum = parseInt(lessonNumStr);
        
        if (isNaN(partNum) || isNaN(lessonNum)) {
          console.log('❌ Invalid format. Use \'part.lesson\' (e.g., \'1.2\')');
          continue;
        }

        const partIdx = partNum - 1;
        const lessonIdx = lessonNum - 1;

        if (partIdx >= 0 && partIdx < result.course_structure.parts.length &&
            lessonIdx >= 0 && lessonIdx < result.course_structure.parts[partIdx].lessons.length) {
          
          const part = result.course_structure.parts[partIdx];
          const lesson = part.lessons[lessonIdx];

          console.log('\n' + CourseFormatter.formatLessonDetail(
            result.course_structure.title,
            part.title,
            lesson
          ));
        } else {
          console.log('❌ Invalid lesson number. Please check the course structure above.');
        }

      } catch (error) {
        console.log('❌ Invalid format. Use \'part.lesson\' (e.g., \'1.2\')');
      }
    }
  }

  /**
   * List all saved courses
   */
  private async listSavedCourses(): Promise<void> {
    console.log('\n📚 SAVED COURSES');
    console.log('='.repeat(60));

    try {
      const savedCourses = await CourseSaver.listSavedCourses();
      
      if (savedCourses.length === 0) {
        console.log('No saved courses found.');
        console.log(`📁 Courses are saved in: ${CourseSaver.getCoursesDirectory()}`);
        return;
      }

      console.log(`Found ${savedCourses.length} saved course(s):\n`);
      
      savedCourses.forEach((filename, index) => {
        // Extract course title from filename (remove timestamp and extension)
        const titlePart = filename.replace(/_.+\.json$/, '').replace(/-/g, ' ');
        const displayTitle = titlePart.charAt(0).toUpperCase() + titlePart.slice(1);
        
        console.log(`${index + 1}. ${displayTitle}`);
        console.log(`   📄 File: ${filename}\n`);
      });

      console.log(`📁 Directory: ${CourseSaver.getCoursesDirectory()}`);
      console.log('\n💡 Use \'load [filename]\' to view a saved course');

    } catch (error) {
      console.error('❌ Error listing saved courses:', error);
    }
  }

  /**
   * Load and display a saved course
   */
  private async loadSavedCourse(filename: string): Promise<void> {
    if (!filename) {
      console.log('❌ Please provide a filename. Example: load my-course_2024-01-15T10-30-00.json');
      return;
    }

    console.log(`\n📖 Loading course: ${filename}`);
    console.log('='.repeat(60));

    try {
      const course = await CourseSaver.loadCourse(filename);
      
      if (!course) {
        console.log('❌ Course not found. Use \'list\' to see available courses.');
        return;
      }

      // Display the loaded course
      console.log(CourseFormatter.formatCompleteCourse(course));

      // Create a workflow state for lesson details
      const mockState: WorkflowState = {
        user_query: 'loaded course',
        course_subject: course.title,
        course_structure: course,
        current_part_index: 0,
        current_lesson_index: 0,
        status_message: `Loaded from ${filename}`
      };

      // Offer lesson details
      await this.offerLessonDetails(mockState);

    } catch (error) {
      console.error('❌ Error loading course:', error);
    }
  }
}

// Main execution
async function main() {
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.log('Please set your OpenAI API key in the .env file:');
    console.log('OPENAI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  const agent = new CourseBuilderAgent();
  await agent.run();
}

// Run the agent if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 