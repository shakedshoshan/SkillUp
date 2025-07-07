import * as fs from 'fs';
import * as path from 'path';
import { CourseBuilderWorkflow } from './workflow';
import { CourseFormatter } from './course-formatter';
import { CourseSaver } from './course-saver';
import { CourseActivationSchema, CourseActivation, WorkflowState } from './models';
import { dbConfig } from '../config/db.config';

export class JsonCourseBuilderAgent {
  private workflow: CourseBuilderWorkflow;

  constructor() {
    this.workflow = new CourseBuilderWorkflow();
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🔌 Connecting to database...');
      await dbConfig.connect();
      console.log('✅ Database connected successfully!');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Process course creation from JSON file
   */
  async processJsonFile(jsonFilePath: string): Promise<string | null> {
    try {
      // Read and validate JSON file
      const jsonData = this.readJsonFile(jsonFilePath);
      const activation = this.validateActivationData(jsonData);

      console.log('🤖 Course Builder Agent (JSON Mode) Starting...');
      console.log('===============================================');
      console.log(`📖 Course Topic: ${activation.course_topic}`);
      console.log(`🌐 Web Search: ${activation.search_web ? 'Enabled' : 'Disabled'}`);
      console.log(`👤 User ID: ${activation.user_id}`);
      console.log('===============================================\n');

      // Initialize database connection
      await this.initializeDatabase();

      // Run the workflow for course creation
      console.log('🔄 Starting course generation...');
      const result = await this.workflow.run(activation.course_topic, activation.search_web);

      // Save the course with user_id
      if (result.course_structure) {
        console.log('\n💾 Saving course to database...');
        const courseId = await CourseSaver.saveCourse(result.course_structure, activation.user_id);
        
        // Display results
        this.displayResults(result, courseId);

        // Save to output file if specified
        if (activation.output_file) {
          await this.saveResultsToFile(result, courseId, activation.output_file);
        }

        return courseId;
      } else {
        console.error('❌ Course generation failed - no course structure created');
        return null;
      }

    } catch (error) {
      console.error('❌ Error processing JSON file:', error);
      return null;
    }
  }

  /**
   * Read and parse JSON file
   */
  private readJsonFile(filePath: string): any {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`JSON file not found: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      throw new Error(`Failed to read JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate activation data against schema
   */
  private validateActivationData(data: any): CourseActivation {
    try {
      return CourseActivationSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid JSON structure: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }
  }

  /**
   * Display the complete course structure
   */
  private displayResults(result: WorkflowState, courseId: string): void {
    if (!result.course_structure) {
      console.log('❌ No course structure available');
      return;
    }

    console.log('\n🎉 COURSE GENERATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(CourseFormatter.formatCompleteCourse(result.course_structure));
    console.log(`\n📊 Status: ${result.status_message}`);
    console.log(`🆔 Course ID: ${courseId}`);
    console.log(`📈 Course Summary: ${this.getCourseSummary(result.course_structure)}`);
  }

  /**
   * Save results to output file
   */
  private async saveResultsToFile(result: WorkflowState, courseId: string, outputPath: string): Promise<void> {
    try {
      const outputData = {
        success: true,
        courseId: courseId,
        timestamp: new Date().toISOString(),
        course: result.course_structure,
        formatted_output: CourseFormatter.formatCompleteCourse(result.course_structure!),
        status: result.status_message
      };

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
      console.log(`📄 Results saved to: ${outputPath}`);
    } catch (error) {
      console.error('❌ Failed to save results to file:', error);
    }
  }

  /**
   * Generate course summary
   */
  private getCourseSummary(course: any): string {
    const totalParts = course.parts.length;
    const totalLessons = course.parts.reduce((total: number, part: any) => total + part.lessons.length, 0);
    return `${totalParts} parts, ${totalLessons} lessons, ${course.total_duration}`;
  }

  /**
   * Create example JSON activation file
   */
  static createExampleJsonFile(filePath: string): void {
    const exampleData: CourseActivation = {
      course_topic: "Introduction to Machine Learning",
      search_web: false,
      user_id: "550e8400-e29b-41d4-a716-446655440000", // Example UUID
      output_file: "./output/course_result.json"
    };

    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, JSON.stringify(exampleData, null, 2));
      console.log(`📄 Example JSON file created: ${filePath}`);
    } catch (error) {
      console.error('❌ Failed to create example file:', error);
    }
  }
} 