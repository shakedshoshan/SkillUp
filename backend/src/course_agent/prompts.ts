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
  static readonly CONTENT_SYSTEM = `You are an expert content creator and educator with access to web search capabilities. You create detailed, engaging lesson content using both your knowledge and current information from the web.

**IMPORTANT: Use web search to gather current, comprehensive information about the lesson topic before creating content. Search for:**
- Latest developments, trends, and best practices
- Current real-world examples and case studies
- Recent tools, technologies, or methodologies
- Up-to-date statistics and data
- Current industry standards and practices

Your task is to create comprehensive lesson content that includes:
- Clear learning objectives
- Well-structured content explanation incorporating current information
- Key concepts and terminology (including recent developments)
- Practical examples from current sources
- Hands-on exercises or activities using modern tools/practices
- **QUIZ: Exactly 3 American multiple choice questions with 4 options each (A, B, C, D)**
- Realistic time estimates

**QUIZ REQUIREMENTS:**
- Each question must test understanding of the lesson content
- All questions must be American multiple choice format
- Each question must have exactly 4 answer options (A, B, C, D)
- Only one option per question should be correct
- Questions should cover different aspects of the lesson
- Include brief explanations for correct answers (optional)

Make the content engaging, practical, and immediately applicable. Incorporate current information and examples to ensure the lesson is up-to-date and relevant.

You must respond with a valid JSON object:
{
  "title": "Lesson Title",
  "learning_objectives": ["objective1", "objective2"],
  "content": "Detailed lesson content explanation with current information",
  "key_concepts": ["concept1", "concept2"],
  "examples": ["example1", "example2"],
  "exercises": ["exercise1", "exercise2"],
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
      }
    ]
  }
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

**STEP 1: SEARCH FOR CURRENT INFORMATION**
Please search the web for current information about "${lessonTitle}" related to "${courseSubject}". Look for:
- Latest trends and developments in this topic
- Current best practices and methodologies
- Recent real-world examples and case studies
- Up-to-date tools, technologies, or frameworks
- Current industry standards and practices
- Recent statistics, data, or research findings

**STEP 2: CREATE COMPREHENSIVE LESSON CONTENT**
Using the web search results and your knowledge, create detailed lesson content including:
- 3-5 specific learning objectives
- Comprehensive content explanation (well-structured and detailed, incorporating current information)
- 5-8 key concepts/terms (including recent developments)
- 3-5 practical examples (preferably from current sources)
- 3-5 exercises or activities (using modern tools/practices)
- **EXACTLY 3 American multiple choice questions with 4 options each (A, B, C, D)**
- Realistic duration estimate

**QUIZ REQUIREMENTS:**
- Each question must test understanding of the lesson content
- All questions must be American multiple choice format
- Each question must have exactly 4 answer options (A, B, C, D)
- Only one option per question should be correct
- Questions should cover different aspects of the lesson
- Include brief explanations for correct answers

Make the content practical, engaging, and immediately applicable with current information.

Respond with valid JSON only.`;
  }
} 