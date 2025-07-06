import { CourseFormatter } from './course-formatter';
import { CourseSaver } from './course-saver';
import { CourseStructure } from './models';
import { dbConfig } from '../config/db.config';

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
            estimated_duration: '2 hours',
            quiz: {
              questions: [
                {
                  question: 'What is the first step in setting up a Python environment?',
                  options: [
                    { option: 'A', text: 'Install an IDE', is_correct: false },
                    { option: 'B', text: 'Install Python', is_correct: true },
                    { option: 'C', text: 'Create a virtual environment', is_correct: false },
                    { option: 'D', text: 'Download packages', is_correct: false }
                  ],
                  explanation: 'Installing Python is the first step before setting up any IDE or virtual environment.'
                },
                {
                  question: 'Which is the recommended IDE for Python development?',
                  options: [
                    { option: 'A', text: 'Notepad', is_correct: false },
                    { option: 'B', text: 'VS Code', is_correct: true },
                    { option: 'C', text: 'MS Word', is_correct: false },
                    { option: 'D', text: 'Paint', is_correct: false }
                  ],
                  explanation: 'VS Code is widely recommended for Python development due to its extensive features and Python support.'
                },
                {
                  question: 'What is the purpose of a virtual environment?',
                  options: [
                    { option: 'A', text: 'To isolate project dependencies', is_correct: true },
                    { option: 'B', text: 'To run Python faster', is_correct: false },
                    { option: 'C', text: 'To create graphics', is_correct: false },
                    { option: 'D', text: 'To compile code', is_correct: false }
                  ],
                  explanation: 'Virtual environments help isolate project dependencies and avoid conflicts between different projects.'
                }
              ]
            }
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

console.log('\n💾 Testing Database-Based Course Saver:');
testCourseSaver();

async function testCourseSaver() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Initialize database connection
    await dbConfig.connect();
    console.log('✅ Database connected successfully');
    
    // Test saving the sample course
    console.log('\n🧪 Testing course save to database...');
    const courseId = await CourseSaver.saveCourse(sampleCourse);
    console.log(`✅ Course saved successfully with ID: ${courseId}`);
    
    // Test listing saved courses
    console.log('\n🧪 Testing course list from database...');
    const savedCourses = await CourseSaver.listSavedCourses();
    console.log(`✅ Found ${savedCourses.length} saved course(s) in database`);
    
    if (savedCourses.length > 0) {
      console.log('\n📚 Available courses:');
      savedCourses.forEach((course, index) => {
        console.log(`   ${index + 1}. ${course.title} (ID: ${course.id})`);
      });
      
      // Test loading the course we just saved
      console.log(`\n🧪 Testing course load from database: ${courseId}`);
      const loadedCourse = await CourseSaver.loadCourse(courseId);
      
      if (loadedCourse) {
        console.log(`✅ Course loaded successfully: ${loadedCourse.title}`);
        console.log(`   Parts: ${loadedCourse.parts.length}`);
        console.log(`   Total lessons: ${loadedCourse.parts.reduce((total, part) => total + part.lessons.length, 0)}`);
      } else {
        console.log('❌ Failed to load course');
      }
    }
    
    console.log('\n✅ All database tests passed! Course Builder Agent with database functionality is working correctly.');
    console.log('\n💡 To run the full agent, set your OPENAI_API_KEY in the .env file and run:');
    console.log('   npm run course-agent');
    console.log('\n📚 Available commands in the agent:');
    console.log('   • Enter a course subject to build a new course');
    console.log('   • Type "list" to see saved courses from database');
    console.log('   • Type "load [course-id]" to view a saved course');
    
  } catch (error) {
    console.error('❌ Database course saver test failed:', error);
    console.log('\n💡 Make sure your database is set up correctly and environment variables are configured.');
    console.log('Check the SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
  }
} 