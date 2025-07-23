'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  type Course, 
  type CoursePart, 
  type Lesson,
  CourseService 
} from '@/lib/services/course.service'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  BookOpen, 
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

export default function CourseEditPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCourse, setEditingCourse] = useState(false)
  const [editingPart, setEditingPart] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    target_audience: '',
    prerequisites: [] as string[],
    total_duration: '',
    difficulty_level: '',
    tags: [] as string[],
    is_published: false
  })

  const [partForm, setPartForm] = useState({
    title: '',
    description: '',
    learning_goals: [] as string[]
  })

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: {
      title: '',
      learning_objectives: [] as string[],
      content: '',
      key_concepts: [] as string[],
      examples: [] as string[],
      exercises: [] as string[],
      estimated_duration: '30 minutes'
    },
    quiz: {
      questions: [] as any[]
    }
  })

  useEffect(() => {
    loadCourse()
  }, [courseId])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const response = await CourseService.getCourseById(courseId)
      if (response.success && response.data) {
        setCourse(response.data)
        setCourseForm({
          title: response.data.title || '',
          description: response.data.description || '',
          target_audience: response.data.target_audience || '',
          prerequisites: response.data.prerequisites || [],
          total_duration: response.data.total_duration || '',
          difficulty_level: response.data.difficulty_level || '',
          tags: response.data.tags || [],
          is_published: response.data.is_published || false
        })
      }
    } catch (error) {
      console.error('Failed to load course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCourse = async () => {
    try {
      setSaving(true)
      const response = await CourseService.updateCourse(courseId, courseForm)
      if (response.success && response.data) {
        setCourse(response.data)
        setEditingCourse(false)
        await loadCourse() // Reload to get fresh data
      }
    } catch (error) {
      console.error('Failed to save course:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddPart = async () => {
    try {
      setSaving(true)
      const response = await CourseService.addCoursePart(courseId, partForm)
      if (response.success) {
        setPartForm({ title: '', description: '', learning_goals: [] })
        await loadCourse()
      }
    } catch (error) {
      console.error('Failed to add part:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePart = async (partId: string) => {
    try {
      setSaving(true)
      const part = course?.parts?.find(p => p.id === partId)
      if (!part) return

      const response = await CourseService.updateCoursePart(courseId, partId, {
        title: partForm.title || part.title,
        description: partForm.description || part.description,
        learning_goals: partForm.learning_goals.length > 0 ? partForm.learning_goals : part.learning_goals
      })

      if (response.success) {
        setEditingPart(null)
        setPartForm({ title: '', description: '', learning_goals: [] })
        await loadCourse()
      }
    } catch (error) {
      console.error('Failed to update part:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePart = async (partId: string) => {
    if (!confirm('Are you sure you want to delete this part? This will also delete all lessons in this part.')) {
      return
    }

    try {
      setSaving(true)
      const response = await CourseService.deleteCoursePart(courseId, partId)
      if (response.success) {
        await loadCourse()
      }
    } catch (error) {
      console.error('Failed to delete part:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddLesson = async (partId: string) => {
    try {
      setSaving(true)
      const response = await CourseService.addLesson(courseId, partId, lessonForm)
      if (response.success) {
        setLessonForm({
          title: '',
          description: '',
          content: {
            title: '',
            learning_objectives: [],
            content: '',
            key_concepts: [],
            examples: [],
            exercises: [],
            estimated_duration: '30 minutes'
          },
          quiz: { questions: [] }
        })
        await loadCourse()
      }
    } catch (error) {
      console.error('Failed to add lesson:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateLesson = async (partId: string, lessonId: string) => {
    try {
      setSaving(true)
      const part = course?.parts?.find(p => p.id === partId)
      const lesson = part?.lessons?.find(l => l.id === lessonId)
      if (!lesson) return

      const response = await CourseService.updateLesson(courseId, partId, lessonId, {
        title: lessonForm.title || lesson.title,
        description: lessonForm.description || lesson.description,
        content: lessonForm.content,
        quiz: lessonForm.quiz
      })

      if (response.success) {
        setEditingLesson(null)
        setLessonForm({
          title: '',
          description: '',
          content: {
            title: '',
            learning_objectives: [],
            content: '',
            key_concepts: [],
            examples: [],
            exercises: [],
            estimated_duration: '30 minutes'
          },
          quiz: { questions: [] }
        })
        await loadCourse()
      }
    } catch (error) {
      console.error('Failed to update lesson:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLesson = async (partId: string, lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return
    }

    try {
      setSaving(true)
      const response = await CourseService.deleteLesson(courseId, partId, lessonId)
      if (response.success) {
        await loadCourse()
      }
    } catch (error) {
      console.error('Failed to delete lesson:', error)
    } finally {
      setSaving(false)
    }
  }

  const togglePartExpansion = (partId: string) => {
    const newExpanded = new Set(expandedParts)
    if (newExpanded.has(partId)) {
      newExpanded.delete(partId)
    } else {
      newExpanded.add(partId)
    }
    setExpandedParts(newExpanded)
  }

  const startEditingPart = (part: CoursePart) => {
    setPartForm({
      title: part.title,
      description: part.description,
      learning_goals: part.learning_goals || []
    })
    setEditingPart(part.id)
  }

  const startEditingLesson = (lesson: Lesson) => {
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content || {
        title: '',
        learning_objectives: [],
        content: '',
        key_concepts: [],
        examples: [],
        exercises: [],
        estimated_duration: '30 minutes'
      },
      quiz: lesson.quiz || { questions: [] }
    })
    setEditingLesson(lesson.id)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading course...</div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Course not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <Button onClick={() => router.back()}>
          Back to Course
        </Button>
      </div>

      {/* Course Details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Details
            </CardTitle>
            {!editingCourse ? (
              <Button onClick={() => setEditingCourse(true)} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSaveCourse} disabled={saving} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={() => setEditingCourse(false)} variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingCourse ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={courseForm.title}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Course title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Course description"
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target Audience</label>
                <Input
                  value={courseForm.target_audience}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, target_audience: e.target.value }))}
                  placeholder="Target audience"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Duration</label>
                <Input
                  value={courseForm.total_duration}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, total_duration: e.target.value }))}
                  placeholder="e.g., 10 hours"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty Level</label>
                <select
                  value={courseForm.difficulty_level}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, difficulty_level: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select difficulty</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={courseForm.is_published}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, is_published: e.target.checked }))}
                />
                <label htmlFor="is_published" className="text-sm font-medium">
                  Published
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{course.title}</h3>
              <p className="text-gray-600">{course.description}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Target: {course.target_audience}</span>
                <span>Duration: {course.total_duration}</span>
                <span>Level: {course.difficulty_level}</span>
                <span>Status: {course.is_published ? 'Published' : 'Draft'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Parts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Course Parts ({course.parts?.length || 0})
            </CardTitle>
            <Button onClick={handleAddPart} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {course.parts?.map((part) => (
              <div key={part.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePartExpansion(part.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedParts.has(part.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <h4 className="font-semibold">Part {part.part_number}: {part.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startEditingPart(part)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeletePart(part.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingPart === part.id ? (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        value={partForm.title}
                        onChange={(e) => setPartForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Part title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={partForm.description}
                        onChange={(e) => setPartForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Part description"
                        className="w-full p-2 border rounded-md"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleUpdatePart(part.id)} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={() => setEditingPart(null)} variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600 ml-6">{part.description}</p>
                )}

                {expandedParts.has(part.id) && (
                  <div className="mt-4 ml-6">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">Lessons ({part.lessons?.length || 0})</h5>
                      <Button onClick={() => handleAddLesson(part.id)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {part.lessons?.map((lesson) => (
                        <div key={lesson.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="font-medium">Lesson {lesson.lesson_number}: {lesson.title}</h6>
                              <p className="text-sm text-gray-600">{lesson.description}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => startEditingLesson(lesson)}
                                size="sm"
                                variant="outline"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteLesson(part.id, lesson.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {editingLesson === lesson.id && (
                            <div className="mt-4 space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <Input
                                  value={lessonForm.title}
                                  onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                                  placeholder="Lesson title"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                  value={lessonForm.description}
                                  onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Lesson description"
                                  className="w-full p-2 border rounded-md"
                                  rows={2}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <textarea
                                  value={lessonForm.content.content}
                                  onChange={(e) => setLessonForm(prev => ({ 
                                    ...prev, 
                                    content: { ...prev.content, content: e.target.value }
                                  }))}
                                  placeholder="Lesson content"
                                  className="w-full p-2 border rounded-md"
                                  rows={4}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button onClick={() => handleUpdateLesson(part.id, lesson.id)} disabled={saving}>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button onClick={() => setEditingLesson(null)} variant="outline">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 