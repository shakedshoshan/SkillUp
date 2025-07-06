# Course Builder Agent - Implementation Plan

## Overview
A course builder agent that creates comprehensive courses based on user input, following the modular LangGraph architecture pattern. The agent will generate structured courses with parts, lessons, and detailed content.

## Agent Flow Design

### 🔄 **3-Step Workflow Pipeline**
1. **Extract Course Structure** → Identify main course parts (max 5)
2. **Build Lessons** → Generate lessons for each part (max 5 per part)  
3. **Generate Content** → Create detailed content for each lesson

### 📁 **Project Structure**
```
src/
├── course_builder_agent.py    # Main entry point & console interface
└── agent_helpers/
    ├── __init__.py
    ├── workflow.py            # LangGraph course building workflow
    ├── models.py             # Course data models (Pydantic)
    ├── prompts.py            # Course building prompts
    ├── knowledge_service.py  # Knowledge gathering service
    └── course_formatter.py   # Output formatting utilities
```

## Detailed Implementation Plan

### 1. **Data Models (`models.py`)**

```python
from pydantic import BaseModel
from typing import List, Optional

class LessonContent(BaseModel):
    """Detailed lesson content structure"""
    title: str
    learning_objectives: List[str]
    content: str
    key_concepts: List[str]
    examples: List[str]
    exercises: List[str]
    estimated_duration: str

class CourseLesson(BaseModel):
    """Individual lesson within a course part"""
    lesson_number: int
    title: str
    description: str
    content: Optional[LessonContent] = None

class CoursePart(BaseModel):
    """Main sections of the course"""
    part_number: int
    title: str
    description: str
    learning_goals: List[str]
    lessons: List[CourseLesson] = []

class CourseStructure(BaseModel):
    """Complete course information"""
    title: str
    description: str
    target_audience: str
    prerequisites: List[str]
    total_duration: str
    parts: List[CoursePart] = []

class WorkflowState(BaseModel):
    """State flowing through the workflow"""
    user_query: str
    course_subject: str = ""
    course_structure: Optional[CourseStructure] = None
    current_part_index: int = 0
    current_lesson_index: int = 0
    status_message: str = ""
```

### 2. **Workflow Orchestrator (`workflow.py`)**

```python
from langgraph import StateGraph, END
from langchain_openai import ChatOpenAI
from typing import Dict, Any
from .models import WorkflowState, CourseStructure, CoursePart, CourseLesson, LessonContent
from .prompts import CoursePrompts
from .knowledge_service import KnowledgeService

class CourseBuilderWorkflow:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
        self.structured_llm = self.llm.with_structured_output
        self.prompts = CoursePrompts()
        self.knowledge_service = KnowledgeService()
        self.workflow = self._build_workflow()

    def _build_workflow(self):
        """Build the LangGraph workflow"""
        print("🔨 Initializing Course Builder Workflow...")
        
        graph = StateGraph(WorkflowState)
        
        # Add workflow nodes
        graph.add_node("extract_structure", self._extract_course_structure)
        graph.add_node("build_lessons", self._build_lessons)
        graph.add_node("generate_content", self._generate_lesson_content)
        
        # Define the flow
        graph.set_entry_point("extract_structure")
        graph.add_edge("extract_structure", "build_lessons")
        graph.add_edge("build_lessons", "generate_content")
        graph.add_edge("generate_content", END)
        
        return graph.compile()

    def run(self, user_query: str) -> WorkflowState:
        """Execute the complete course building workflow"""
        print(f"\n🚀 Starting Course Builder for: '{user_query}'")
        print("=" * 60)
        
        initial_state = WorkflowState(user_query=user_query)
        final_state = self.workflow.invoke(initial_state)
        
        print("\n✅ Course Building Complete!")
        return final_state

    def _extract_course_structure(self, state: WorkflowState) -> Dict[str, Any]:
        """Step 1: Extract main course parts and structure"""
        print("\n📋 STEP 1: Extracting Course Structure...")
        print(f"   Analyzing subject: {state.user_query}")
        
        # Gather knowledge about the subject
        knowledge = self.knowledge_service.gather_subject_knowledge(state.user_query)
        print(f"   ✓ Gathered knowledge from {len(knowledge)} sources")
        
        # Use structured LLM to extract course structure
        structured_llm = self.structured_llm(CourseStructure)
        
        messages = [
            {"role": "system", "content": self.prompts.STRUCTURE_SYSTEM},
            {"role": "user", "content": self.prompts.structure_user(state.user_query, knowledge)}
        ]
        
        course_structure = structured_llm.invoke(messages)
        print(f"   ✓ Generated course: '{course_structure.title}'")
        print(f"   ✓ Created {len(course_structure.parts)} main parts")
        
        for i, part in enumerate(course_structure.parts, 1):
            print(f"      {i}. {part.title}")
        
        return {
            "course_subject": state.user_query,
            "course_structure": course_structure,
            "status_message": f"Extracted {len(course_structure.parts)} course parts"
        }

    def _build_lessons(self, state: WorkflowState) -> Dict[str, Any]:
        """Step 2: Build lessons for each course part"""
        print("\n📚 STEP 2: Building Lessons for Each Part...")
        
        updated_parts = []
        
        for part_idx, part in enumerate(state.course_structure.parts):
            print(f"\n   Processing Part {part_idx + 1}: {part.title}")
            
            # Generate lessons for this part
            structured_llm = self.structured_llm(List[CourseLesson])
            
            messages = [
                {"role": "system", "content": self.prompts.LESSONS_SYSTEM},
                {"role": "user", "content": self.prompts.lessons_user(part.title, part.description, part.learning_goals)}
            ]
            
            lessons = structured_llm.invoke(messages)
            part.lessons = lessons[:5]  # Max 5 lessons per part
            
            print(f"   ✓ Generated {len(part.lessons)} lessons:")
            for lesson in part.lessons:
                print(f"      - {lesson.title}")
            
            updated_parts.append(part)
        
        # Update course structure with lessons
        state.course_structure.parts = updated_parts
        total_lessons = sum(len(part.lessons) for part in updated_parts)
        
        print(f"\n   ✅ Total lessons created: {total_lessons}")
        
        return {
            "course_structure": state.course_structure,
            "status_message": f"Built {total_lessons} lessons across {len(updated_parts)} parts"
        }

    def _generate_lesson_content(self, state: WorkflowState) -> Dict[str, Any]:
        """Step 3: Generate detailed content for each lesson"""
        print("\n📝 STEP 3: Generating Detailed Lesson Content...")
        
        total_lessons_processed = 0
        
        for part_idx, part in enumerate(state.course_structure.parts):
            print(f"\n   Generating content for Part {part_idx + 1}: {part.title}")
            
            for lesson_idx, lesson in enumerate(part.lessons):
                print(f"      Processing Lesson {lesson_idx + 1}: {lesson.title}")
                
                # Generate detailed content
                structured_llm = self.structured_llm(LessonContent)
                
                messages = [
                    {"role": "system", "content": self.prompts.CONTENT_SYSTEM},
                    {"role": "user", "content": self.prompts.content_user(
                        state.course_subject, 
                        part.title, 
                        lesson.title, 
                        lesson.description
                    )}
                ]
                
                lesson_content = structured_llm.invoke(messages)
                lesson.content = lesson_content
                total_lessons_processed += 1
                
                print(f"         ✓ Content generated ({len(lesson_content.key_concepts)} concepts, {len(lesson_content.examples)} examples)")
        
        print(f"\n   ✅ Generated detailed content for {total_lessons_processed} lessons")
        
        return {
            "course_structure": state.course_structure,
            "status_message": f"Course complete with {total_lessons_processed} fully detailed lessons"
        }
```

### 3. **Prompts (`prompts.py`)**

```python
class CoursePrompts:
    """Centralized prompts for course building"""
    
    STRUCTURE_SYSTEM = """You are an expert course designer and educator. You create well-structured, comprehensive courses on any subject.

Your task is to analyze a subject and create a logical course structure with:
- A clear course title and description
- Target audience identification
- Prerequisites (if any)
- 3-5 main course parts that flow logically
- Learning goals for each part

Focus on creating a progression from basic concepts to advanced topics."""

    LESSONS_SYSTEM = """You are an expert lesson planner. You create detailed lesson plans within course parts.

Your task is to break down a course part into 3-5 specific lessons that:
- Build upon each other logically
- Have clear, actionable titles
- Include brief but informative descriptions
- Are appropriately scoped for individual learning sessions

Each lesson should be focused and achievable within a reasonable time frame."""

    CONTENT_SYSTEM = """You are an expert content creator and educator. You create detailed, engaging lesson content.

Your task is to create comprehensive lesson content that includes:
- Clear learning objectives
- Well-structured content explanation
- Key concepts and terminology
- Practical examples
- Hands-on exercises or activities
- Realistic time estimates

Make the content engaging, practical, and immediately applicable."""

    @staticmethod
    def structure_user(subject: str, knowledge: str) -> str:
        return f"""Subject: {subject}

Available Knowledge:
{knowledge}

Create a comprehensive course structure for this subject. The course should be suitable for learners who want to gain practical, applicable knowledge.

Requirements:
- Maximum 5 main parts
- Logical progression from basics to advanced
- Clear learning outcomes
- Practical focus"""

    @staticmethod
    def lessons_user(part_title: str, part_description: str, learning_goals: list) -> str:
        goals_text = "\n".join(f"- {goal}" for goal in learning_goals)
        
        return f"""Course Part: {part_title}
Description: {part_description}

Learning Goals:
{goals_text}

Create 3-5 specific lessons for this course part. Each lesson should:
- Have a clear, descriptive title
- Include a brief description of what will be covered
- Be numbered sequentially
- Build logically toward the part's learning goals"""

    @staticmethod
    def content_user(course_subject: str, part_title: str, lesson_title: str, lesson_description: str) -> str:
        return f"""Course Subject: {course_subject}
Course Part: {part_title}
Lesson: {lesson_title}
Description: {lesson_description}

Create detailed lesson content including:
- 3-5 specific learning objectives
- Comprehensive content explanation (well-structured and detailed)
- 5-8 key concepts/terms
- 3-5 practical examples
- 3-5 exercises or activities
- Realistic duration estimate

Make the content practical, engaging, and immediately applicable."""
```

### 4. **Knowledge Service (`knowledge_service.py`)**

```python
import os
from typing import List

class KnowledgeService:
    """Service for gathering knowledge about course subjects"""
    
    def __init__(self):
        # This could be extended with real APIs like Firecrawl, Wikipedia API, etc.
        pass
    
    def gather_subject_knowledge(self, subject: str) -> str:
        """Gather knowledge about the subject for course planning"""
        print(f"   🔍 Gathering knowledge about: {subject}")
        
        # This is a simplified version - in practice, you might:
        # - Search educational databases
        # - Query Wikipedia API
        # - Search for existing courses/curricula
        # - Access academic resources
        
        knowledge_sources = [
            f"Educational standards and frameworks for {subject}",
            f"Common learning objectives for {subject}",
            f"Industry best practices in {subject}",
            f"Beginner to advanced progression in {subject}",
            f"Practical applications of {subject}"
        ]
        
        return "\n".join(f"- {source}" for source in knowledge_sources)
```

### 5. **Course Formatter (`course_formatter.py`)**

```python
from .models import CourseStructure, CoursePart, CourseLesson

class CourseFormatter:
    """Utility for formatting course output"""
    
    @staticmethod
    def format_complete_course(course: CourseStructure) -> str:
        """Format the complete course for display"""
        output = []
        
        # Course header
        output.append("=" * 80)
        output.append(f"📚 COURSE: {course.title.upper()}")
        output.append("=" * 80)
        output.append(f"\n📋 Description: {course.description}")
        output.append(f"🎯 Target Audience: {course.target_audience}")
        output.append(f"⏱️  Total Duration: {course.total_duration}")
        
        if course.prerequisites:
            output.append(f"📝 Prerequisites: {', '.join(course.prerequisites)}")
        
        # Course parts and lessons
        for part_idx, part in enumerate(course.parts, 1):
            output.append(f"\n{'='*60}")
            output.append(f"📖 PART {part_idx}: {part.title}")
            output.append(f"{'='*60}")
            output.append(f"Description: {part.description}")
            output.append(f"Learning Goals:")
            for goal in part.learning_goals:
                output.append(f"  ✓ {goal}")
            
            # Lessons
            for lesson_idx, lesson in enumerate(part.lessons, 1):
                output.append(f"\n  📑 Lesson {part_idx}.{lesson_idx}: {lesson.title}")
                output.append(f"     {lesson.description}")
                
                if lesson.content:
                    content = lesson.content
                    output.append(f"     ⏱️  Duration: {content.estimated_duration}")
                    output.append(f"     📍 Key Concepts: {', '.join(content.key_concepts[:3])}...")
        
        return "\n".join(output)
    
    @staticmethod
    def format_lesson_detail(course_title: str, part_title: str, lesson: CourseLesson) -> str:
        """Format detailed lesson content"""
        if not lesson.content:
            return "No content available for this lesson."
        
        content = lesson.content
        output = []
        
        output.append("=" * 60)
        output.append(f"📚 {course_title}")
        output.append(f"📖 {part_title}")
        output.append(f"📑 {lesson.title}")
        output.append("=" * 60)
        
        output.append(f"\n🎯 Learning Objectives:")
        for obj in content.learning_objectives:
            output.append(f"  • {obj}")
        
        output.append(f"\n📝 Content:")
        output.append(content.content)
        
        output.append(f"\n🔑 Key Concepts:")
        for concept in content.key_concepts:
            output.append(f"  • {concept}")
        
        output.append(f"\n💡 Examples:")
        for example in content.examples:
            output.append(f"  • {example}")
        
        output.append(f"\n🏋️ Exercises:")
        for exercise in content.exercises:
            output.append(f"  • {exercise}")
        
        output.append(f"\n⏱️  Estimated Duration: {content.estimated_duration}")
        
        return "\n".join(output)
```

### 6. **Main Agent (`course_builder_agent.py`)**

```python
import os
from dotenv import load_dotenv
from agent_helpers.workflow import CourseBuilderWorkflow
from agent_helpers.course_formatter import CourseFormatter

load_dotenv()

class CourseBuilderAgent:
    """Main console interface for the course builder agent"""
    
    def __init__(self):
        print("🤖 Course Builder Agent Initializing...")
        self.workflow = CourseBuilderWorkflow()
        self.formatter = CourseFormatter()
        print("✅ Agent Ready!")
    
    def run(self):
        """Main conversation loop"""
        print("\n" + "="*60)
        print("🎓 WELCOME TO THE COURSE BUILDER AGENT")
        print("="*60)
        print("I can help you create comprehensive courses on any subject!")
        print("Just describe what you'd like to learn about.")
        print("Type 'quit' to exit.\n")
        
        while True:
            try:
                user_input = input("🎯 What course would you like me to build? ")
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("👋 Thanks for using Course Builder Agent!")
                    break
                
                if not user_input.strip():
                    print("Please provide a course subject.")
                    continue
                
                # Run the workflow
                result = self.workflow.run(user_input)
                
                # Display results
                self._display_results(result)
                
                # Ask if user wants lesson details
                self._offer_lesson_details(result)
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                print("Please try again.")
    
    def _display_results(self, result):
        """Display the complete course structure"""
        print("\n" + "🎉 COURSE GENERATED SUCCESSFULLY!")
        print(self.formatter.format_complete_course(result.course_structure))
        print(f"\n📊 Status: {result.status_message}")
    
    def _offer_lesson_details(self, result):
        """Offer to show detailed lesson content"""
        print("\n" + "="*60)
        print("📖 LESSON DETAILS AVAILABLE")
        print("="*60)
        print("Would you like to see detailed content for any lesson?")
        print("Format: 'part.lesson' (e.g., '1.2' for Part 1, Lesson 2)")
        print("Type 'no' or 'next' to create another course.\n")
        
        while True:
            choice = input("🔍 Select lesson (part.lesson) or 'no': ").strip()
            
            if choice.lower() in ['no', 'next', 'n']:
                break
            
            try:
                part_num, lesson_num = map(int, choice.split('.'))
                part_idx = part_num - 1
                lesson_idx = lesson_num - 1
                
                if (0 <= part_idx < len(result.course_structure.parts) and 
                    0 <= lesson_idx < len(result.course_structure.parts[part_idx].lessons)):
                    
                    part = result.course_structure.parts[part_idx]
                    lesson = part.lessons[lesson_idx]
                    
                    print("\n" + self.formatter.format_lesson_detail(
                        result.course_structure.title,
                        part.title,
                        lesson
                    ))
                else:
                    print("❌ Invalid lesson number. Please check the course structure above.")
                    
            except ValueError:
                print("❌ Invalid format. Use 'part.lesson' (e.g., '1.2')")
            except Exception as e:
                print(f"❌ Error: {e}")

if __name__ == "__main__":
    agent = CourseBuilderAgent()
    agent.run()
```

## 🔧 **Dependencies (`requirements.txt`)**

```txt
langchain-openai>=0.1.0
langgraph>=0.1.0
pydantic>=2.0.0
python-dotenv>=1.0.0
```

## 🚀 **Setup Instructions**

### 1. **Environment Setup**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

### 2. **File Creation Order**
1. Create `src/agent_helpers/__init__.py` (empty file)
2. Create `src/agent_helpers/models.py`
3. Create `src/agent_helpers/prompts.py`
4. Create `src/agent_helpers/knowledge_service.py`
5. Create `src/agent_helpers/course_formatter.py`
6. Create `src/agent_helpers/workflow.py`
7. Create `src/course_builder_agent.py`

### 3. **Testing the Agent**
```bash
cd src
python course_builder_agent.py
```

## 📋 **Example Console Output Flow**

```
🤖 Course Builder Agent Initializing...
🔨 Initializing Course Builder Workflow...
✅ Agent Ready!

============================================================
🎓 WELCOME TO THE COURSE BUILDER AGENT
============================================================
I can help you create comprehensive courses on any subject!
Just describe what you'd like to learn about.
Type 'quit' to exit.

🎯 What course would you like me to build? Python for Data Science

🚀 Starting Course Builder for: 'Python for Data Science'
============================================================

📋 STEP 1: Extracting Course Structure...
   Analyzing subject: Python for Data Science
   🔍 Gathering knowledge about: Python for Data Science
   ✓ Gathered knowledge from 5 sources
   ✓ Generated course: 'Complete Python for Data Science'
   ✓ Created 4 main parts
      1. Python Fundamentals for Data Science
      2. Data Manipulation with Pandas
      3. Data Visualization
      4. Machine Learning Basics

📚 STEP 2: Building Lessons for Each Part...

   Processing Part 1: Python Fundamentals for Data Science
   ✓ Generated 5 lessons:
      - Python Environment Setup
      - Variables and Data Types
      - Control Flow and Functions
      - Working with Libraries
      - Error Handling

   [... continues for each part ...]

📝 STEP 3: Generating Detailed Lesson Content...

   Generating content for Part 1: Python Fundamentals for Data Science
      Processing Lesson 1: Python Environment Setup
         ✓ Content generated (6 concepts, 4 examples)
      [... continues for each lesson ...]

✅ Course Building Complete!

🎉 COURSE GENERATED SUCCESSFULLY!
[... formatted course display ...]
```

## 🎯 **Key Features**

1. **Verbose Logging**: Every step prints detailed progress
2. **Structured Data**: All course data is properly typed with Pydantic
3. **Modular Design**: Easy to extend with new knowledge sources
4. **Interactive Console**: Clean, user-friendly interface
5. **Detailed Content**: Full lesson plans with exercises and examples
6. **Flexible Architecture**: Can be adapted for other educational domains

## 🔮 **Future Enhancements**

1. **Knowledge Integration**: Add real web search and educational APIs
2. **Export Options**: Save courses to PDF, HTML, or JSON
3. **Progress Tracking**: Add user progress and completion tracking
4. **Assessment Builder**: Generate quizzes and assessments
5. **Multimedia Support**: Include images, videos, and interactive content
6. **Collaborative Features**: Share and edit courses with others

This plan provides a complete blueprint for building a course creation agent that follows the established architecture patterns while being specifically tailored for educational content generation. 