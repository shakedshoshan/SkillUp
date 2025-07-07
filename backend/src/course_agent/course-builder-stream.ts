import { CourseBuilderWorkflow } from './workflow';
import { CourseFormatter } from './course-formatter';
import { CourseSaver } from './course-saver';
import { CourseActivationSchema, CourseActivation, WorkflowState } from './models';
import { dbConfig } from '../config/db.config';

export interface StreamMessage {
  type: 'log' | 'progress' | 'success' | 'error' | 'course_generated';
  message: string;
  data?: any;
  timestamp: string;
}

export class StreamingCourseBuilderAgent {
  private workflow: CourseBuilderWorkflow;
  private emitCallback?: (message: StreamMessage) => void;

  constructor(emitCallback?: (message: StreamMessage) => void) {
    this.workflow = new CourseBuilderWorkflow();
    this.emitCallback = emitCallback;
  }

  /**
   * Set the emit callback for streaming messages
   */
  setEmitCallback(callback: (message: StreamMessage) => void): void {
    this.emitCallback = callback;
  }

  /**
   * Emit a message to the stream
   */
  private emit(type: StreamMessage['type'], message: string, data?: any): void {
    if (this.emitCallback) {
      this.emitCallback({
        type,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Override console methods to capture output
   */
  private setupConsoleCapture(): () => void {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      this.emit('log', message);
      originalLog.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const message = args.join(' ');
      this.emit('error', message);
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      this.emit('log', `⚠️ ${message}`);
      originalWarn.apply(console, args);
    };

    // Return cleanup function
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      this.emit('log', '🔌 Connecting to database...');
      await dbConfig.connect();
      this.emit('log', '✅ Database connected successfully!');
    } catch (error) {
      this.emit('error', `❌ Database connection failed: ${error}`);
      throw error;
    }
  }

  /**
   * Process course creation with real-time streaming
   */
  async generateCourse(activation: CourseActivation): Promise<string | null> {
    const cleanup = this.setupConsoleCapture();
    
    try {
      this.emit('log', '🤖 Course Builder Agent (Streaming Mode) Starting...');
      this.emit('log', '===============================================');
      this.emit('log', `📖 Course Topic: ${activation.course_topic}`);
      this.emit('log', `🌐 Web Search: ${activation.search_web ? 'Enabled' : 'Disabled'}`);
      this.emit('log', `👤 User ID: ${activation.user_id}`);
      this.emit('log', '===============================================\n');

      this.emit('progress', 'Initializing database connection...');
      await this.initializeDatabase();

      this.emit('progress', 'Starting course generation workflow...');
      const result = await this.workflow.run(activation.course_topic, activation.search_web);

      if (result.course_structure) {
        this.emit('progress', 'Saving course to database...');
        const courseId = await CourseSaver.saveCourse(result.course_structure, activation.user_id);
        
        this.emit('log', '\n🎉 COURSE GENERATED SUCCESSFULLY!');
        this.emit('log', '='.repeat(60));
        this.emit('log', CourseFormatter.formatCompleteCourse(result.course_structure));
        this.emit('log', `\n📊 Status: ${result.status_message}`);
        this.emit('log', `🆔 Course ID: ${courseId}`);
        this.emit('log', `📈 Course Summary: ${this.getCourseSummary(result.course_structure)}`);

        this.emit('course_generated', 'Course generated successfully!', {
          courseId,
          course: result.course_structure,
          summary: this.getCourseSummary(result.course_structure)
        });

        this.emit('success', `✅ Course generation completed! Course ID: ${courseId}`);
        return courseId;
      } else {
        this.emit('error', '❌ Course generation failed - no course structure created');
        return null;
      }

    } catch (error) {
      this.emit('error', `❌ Error during course generation: ${error}`);
      return null;
    } finally {
      cleanup();
    }
  }

  /**
   * Validate activation data
   */
  static validateActivationData(data: any): CourseActivation {
    try {
      return CourseActivationSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid request data: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
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
} 