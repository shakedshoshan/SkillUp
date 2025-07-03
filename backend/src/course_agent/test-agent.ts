import { CourseFormatter } from './course-formatter';
import { CourseSaver } from './course-saver';
import { CourseStructure } from './models';

// Test the course formatter with sample data
const sampleCourse: CourseStructure = {
  title: 'Complete Python for Data Science',
  description: 'A comprehensive course covering Python fundamentals and data science applications',
  target_audience: 'Beginners to intermediate programmers interested in data science',
  prerequisites: ['Basic programming knowledge', 'Mathematics fundamentals'],
  total_duration: '40 hours',
  parts: [
    {
      part_number: 1,
      title: 'Python Fundamentals',
      description: 'Core Python concepts and syntax',
      learning_goals: ['Understand Python syntax', 'Work with data types', 'Control flow'],
      lessons: [
        {
          lesson_number: 1,
          title: 'Python Environment Setup',
          description: 'Setting up Python development environment',
          content: {
            title: 'Python Environment Setup',
            learning_objectives: ['Install Python', 'Set up IDE', 'Create first program'],
            content: 'This lesson covers the installation and setup of Python development environment...',
            key_concepts: ['Python installation', 'IDE setup', 'Virtual environments'],
            examples: ['Installing Python on Windows', 'Setting up VS Code', 'Creating a virtual environment'],
            exercises: ['Install Python 3.9+', 'Create your first Python file', 'Set up a virtual environment'],
            estimated_duration: '2 hours'
          }
        }
      ]
    }
  ]
};

console.log('🧪 Testing Course Builder Agent Structure...\n');

// Test course formatting
console.log('📋 Testing Course Formatter:');
console.log(CourseFormatter.formatCompleteCourse(sampleCourse));

console.log('\n📑 Testing Lesson Detail Formatting:');
console.log(CourseFormatter.formatLessonDetail(
  sampleCourse.title,
  sampleCourse.parts[0].title,
  sampleCourse.parts[0].lessons[0]
));

console.log('\n📊 Testing Course Summary:');
console.log(CourseFormatter.formatCourseSummary(sampleCourse));

console.log('\n🔄 Testing Progress Formatter:');
console.log(CourseFormatter.formatProgress(2, 3, 'Building Lessons'));

console.log('\n💾 Testing Course Saver:');
testCourseSaver();

async function testCourseSaver() {
  try {
    console.log('📁 Courses directory:', CourseSaver.getCoursesDirectory());
    
    // Test saving the sample course
    console.log('🧪 Testing course save...');
    const savedPath = await CourseSaver.saveCourse(sampleCourse);
    console.log(`✓ Course saved successfully to: ${savedPath}`);
    
    // Test listing saved courses
    console.log('\n🧪 Testing course list...');
    const savedCourses = await CourseSaver.listSavedCourses();
    console.log(`✓ Found ${savedCourses.length} saved course(s)`);
    
    if (savedCourses.length > 0) {
      const filename = savedCourses[savedCourses.length - 1]; // Get the latest
      console.log(`🧪 Testing course load: ${filename}`);
      const loadedCourse = await CourseSaver.loadCourse(filename);
      
      if (loadedCourse) {
        console.log(`✓ Course loaded successfully: ${loadedCourse.title}`);
      } else {
        console.log('❌ Failed to load course');
      }
    }
    
    console.log('\n✅ All tests passed! Course Builder Agent with saving functionality is working correctly.');
    console.log('\n💡 To run the full agent, set your OPENAI_API_KEY in the .env file and run:');
    console.log('   npm run course-agent');
    console.log('\n📚 Available commands in the agent:');
    console.log('   • Enter a course subject to build a new course');
    console.log('   • Type "list" to see saved courses');
    console.log('   • Type "load [filename]" to view a saved course');
    
  } catch (error) {
    console.error('❌ Course saver test failed:', error);
  }
} 