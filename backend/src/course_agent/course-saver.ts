import fs from 'fs/promises';
import path from 'path';
import { CourseStructure } from './models';

export class CourseSaver {
  private static readonly COURSES_DIR = path.join(process.cwd(), 'created_courses');

  /**
   * Save course content to a JSON file
   */
  static async saveCourse(course: CourseStructure): Promise<string> {
    try {
      // Ensure the created_courses directory exists
      await this.ensureDirectoryExists();

      // Generate filename with timestamp and sanitized course title
      const filename = this.generateFilename(course.title);
      const filepath = path.join(this.COURSES_DIR, filename);

      // Prepare course data with metadata
      const courseData = {
        metadata: {
          created_at: new Date().toISOString(),
          version: '1.0.0',
          generator: 'Course Builder Agent'
        },
        course: course
      };

      // Write course data to JSON file
      await fs.writeFile(filepath, JSON.stringify(courseData, null, 2), 'utf8');

      console.log(`\n💾 Course saved successfully!`);
      console.log(`📁 File location: ${filepath}`);
      console.log(`📊 Course data: ${this.getCourseSummary(course)}`);

      return filepath;

    } catch (error) {
      console.error('\n❌ Error saving course:', error);
      throw new Error(`Failed to save course: ${error}`);
    }
  }

  /**
   * Ensure the created_courses directory exists
   */
  private static async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.COURSES_DIR);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(this.COURSES_DIR, { recursive: true });
      console.log(`📁 Created directory: ${this.COURSES_DIR}`);
    }
  }

  /**
   * Generate a filename for the course
   */
  private static generateFilename(courseTitle: string): string {
    // Sanitize title for filename
    const sanitizedTitle = courseTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    // Add timestamp
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-') // Replace colons and dots
      .substring(0, 19); // Remove milliseconds

    return `${sanitizedTitle}_${timestamp}.json`;
  }

  /**
   * Get a summary of the course for logging
   */
  private static getCourseSummary(course: CourseStructure): string {
    const totalLessons = course.parts.reduce((total, part) => total + part.lessons.length, 0);
    return `${course.parts.length} parts, ${totalLessons} lessons`;
  }

  /**
   * List all saved courses
   */
  static async listSavedCourses(): Promise<string[]> {
    try {
      await this.ensureDirectoryExists();
      const files = await fs.readdir(this.COURSES_DIR);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error('Error listing saved courses:', error);
      return [];
    }
  }

  /**
   * Load a saved course by filename
   */
  static async loadCourse(filename: string): Promise<CourseStructure | null> {
    try {
      const filepath = path.join(this.COURSES_DIR, filename);
      const fileContent = await fs.readFile(filepath, 'utf8');
      const courseData = JSON.parse(fileContent);
      return courseData.course;
    } catch (error) {
      console.error(`Error loading course ${filename}:`, error);
      return null;
    }
  }

  /**
   * Get the courses directory path
   */
  static getCoursesDirectory(): string {
    return this.COURSES_DIR;
  }

  /**
   * Export course to different formats (future enhancement)
   */
  static async exportCourse(course: CourseStructure, format: 'json' | 'txt' = 'json'): Promise<string> {
    if (format === 'json') {
      return await this.saveCourse(course);
    } else if (format === 'txt') {
      // Future: implement text export
      throw new Error('Text export not yet implemented');
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }
} 