import { CourseStructure, CoursePart, CourseLesson } from './models';

export class CourseFormatter {
  /**
   * Format the complete course for display
   */
  static formatCompleteCourse(course: CourseStructure): string {
    const output: string[] = [];
    
    // Course header
    output.push('='.repeat(80));
    output.push(`📚 COURSE: ${course.title.toUpperCase()}`);
    output.push('='.repeat(80));
    output.push(`\n📋 Description: ${course.description}`);
    output.push(`🎯 Target Audience: ${course.target_audience}`);
    output.push(`⏱️  Total Duration: ${course.total_duration}`);
    
    if (course.prerequisites.length > 0) {
      output.push(`📝 Prerequisites: ${course.prerequisites.join(', ')}`);
    }
    
    // Course parts and lessons
    course.parts.forEach((part, partIdx) => {
      output.push(`\n${'='.repeat(60)}`);
      output.push(`📖 PART ${partIdx + 1}: ${part.title}`);
      output.push('='.repeat(60));
      output.push(`Description: ${part.description}`);
      output.push(`Learning Goals:`);
      part.learning_goals.forEach(goal => {
        output.push(`  ✓ ${goal}`);
      });
      
      // Lessons
      part.lessons.forEach((lesson, lessonIdx) => {
        output.push(`\n  📑 Lesson ${partIdx + 1}.${lessonIdx + 1}: ${lesson.title}`);
        output.push(`     ${lesson.description}`);
        
        if (lesson.content) {
          const content = lesson.content;
          output.push(`     ⏱️  Duration: ${content.estimated_duration}`);
          const keyConcepts = content.key_concepts.slice(0, 3).join(', ');
          output.push(`     📍 Key Concepts: ${keyConcepts}${content.key_concepts.length > 3 ? '...' : ''}`);
        }
      });
    });
    
    return output.join('\n');
  }
  
  /**
   * Format detailed lesson content
   */
  static formatLessonDetail(courseTitle: string, partTitle: string, lesson: CourseLesson): string {
    if (!lesson.content) {
      return 'No content available for this lesson.';
    }
    
    const content = lesson.content;
    const output: string[] = [];
    
    output.push('='.repeat(60));
    output.push(`📚 ${courseTitle}`);
    output.push(`📖 ${partTitle}`);
    output.push(`📑 ${lesson.title}`);
    output.push('='.repeat(60));
    
    output.push(`\n🎯 Learning Objectives:`);
    content.learning_objectives.forEach(obj => {
      output.push(`  • ${obj}`);
    });
    
    output.push(`\n📝 Content:`);
    output.push(content.content);
    
    output.push(`\n🔑 Key Concepts:`);
    content.key_concepts.forEach(concept => {
      output.push(`  • ${concept}`);
    });
    
    output.push(`\n💡 Examples:`);
    content.examples.forEach(example => {
      output.push(`  • ${example}`);
    });
    
    output.push(`\n🏋️ Exercises:`);
    content.exercises.forEach(exercise => {
      output.push(`  • ${exercise}`);
    });
    
    output.push(`\n⏱️  Estimated Duration: ${content.estimated_duration}`);
    
    return output.join('\n');
  }
  
  /**
   * Format course summary for quick overview
   */
  static formatCourseSummary(course: CourseStructure): string {
    const output: string[] = [];
    
    output.push(`📚 ${course.title}`);
    output.push(`🎯 ${course.target_audience}`);
    output.push(`⏱️  ${course.total_duration}`);
    output.push(`📖 ${course.parts.length} parts, ${this.getTotalLessons(course)} lessons`);
    
    return output.join('\n');
  }
  
  /**
   * Get total number of lessons in course
   */
  private static getTotalLessons(course: CourseStructure): number {
    return course.parts.reduce((total, part) => total + part.lessons.length, 0);
  }
  
  /**
   * Format progress indicator
   */
  static formatProgress(step: number, totalSteps: number, stepName: string): string {
    const progress = Math.round((step / totalSteps) * 100);
    const progressBar = '█'.repeat(Math.round(progress / 5)) + '░'.repeat(20 - Math.round(progress / 5));
    return `\n🔄 Progress: [${progressBar}] ${progress}% - ${stepName}`;
  }
} 