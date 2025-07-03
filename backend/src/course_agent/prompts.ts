export class CoursePrompts {
  /**
   * System prompt for course structure extraction
   */
  static readonly STRUCTURE_SYSTEM = `You are an expert course designer and educator. You create well-structured, comprehensive courses on any subject.

Your task is to analyze a subject and create a logical course structure with:
- A clear course title and description
- Target audience identification
- Prerequisites (if any)
- 3-5 main course parts that flow logically
- Learning goals for each part

Focus on creating a progression from basic concepts to advanced topics.

You must respond with a valid JSON object that matches this structure:
{
  "title": "Course Title",
  "description": "Course description",
  "target_audience": "Who this course is for",
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "total_duration": "estimated total time",
  "parts": [
    {
      "part_number": 1,
      "title": "Part Title",
      "description": "Part description",
      "learning_goals": ["goal1", "goal2"],
      "lessons": []
    }
  ]
}`;

  /**
   * System prompt for lesson planning
   */
  static readonly LESSONS_SYSTEM = `You are an expert lesson planner. You create detailed lesson plans within course parts.

Your task is to break down a course part into 3-5 specific lessons that:
- Build upon each other logically
- Have clear, actionable titles
- Include brief but informative descriptions
- Are appropriately scoped for individual learning sessions

Each lesson should be focused and achievable within a reasonable time frame.

You must respond with a valid JSON array of lesson objects:
[
  {
    "lesson_number": 1,
    "title": "Lesson Title",
    "description": "What this lesson covers"
  }
]`;

  /**
   * System prompt for content generation
   */
  static readonly CONTENT_SYSTEM = `You are an expert content creator and educator. You create detailed, engaging lesson content.

Your task is to create comprehensive lesson content that includes:
- Clear learning objectives
- Well-structured content explanation
- Key concepts and terminology
- Practical examples
- Hands-on exercises or activities
- Realistic time estimates

Make the content engaging, practical, and immediately applicable.

You must respond with a valid JSON object:
{
  "title": "Lesson Title",
  "learning_objectives": ["objective1", "objective2"],
  "content": "Detailed lesson content explanation",
  "key_concepts": ["concept1", "concept2"],
  "examples": ["example1", "example2"],
  "exercises": ["exercise1", "exercise2"],
  "estimated_duration": "time estimate"
}`;

  /**
   * Generate user prompt for course structure
   */
  static structureUser(subject: string, knowledge: string): string {
    return `Subject: ${subject}

Available Knowledge:
${knowledge}

Create a comprehensive course structure for this subject. The course should be suitable for learners who want to gain practical, applicable knowledge.

Requirements:
- Maximum 5 main parts
- Logical progression from basics to advanced
- Clear learning outcomes
- Practical focus

Respond with valid JSON only.`;
  }

  /**
   * Generate user prompt for lesson planning
   */
  static lessonsUser(partTitle: string, partDescription: string, learningGoals: string[]): string {
    const goalsText = learningGoals.map(goal => `- ${goal}`).join('\n');
    
    return `Course Part: ${partTitle}
Description: ${partDescription}

Learning Goals:
${goalsText}

Create 3-5 specific lessons for this course part. Each lesson should:
- Have a clear, descriptive title
- Include a brief description of what will be covered
- Be numbered sequentially
- Build logically toward the part's learning goals

Respond with valid JSON array only.`;
  }

  /**
   * Generate user prompt for content creation
   */
  static contentUser(courseSubject: string, partTitle: string, lessonTitle: string, lessonDescription: string): string {
    return `Course Subject: ${courseSubject}
Course Part: ${partTitle}
Lesson: ${lessonTitle}
Description: ${lessonDescription}

Create detailed lesson content including:
- 3-5 specific learning objectives
- Comprehensive content explanation (well-structured and detailed)
- 5-8 key concepts/terms
- 3-5 practical examples
- 3-5 exercises or activities
- Realistic duration estimate

Make the content practical, engaging, and immediately applicable.

Respond with valid JSON only.`;
  }
} 