'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  BookOpen, Users, GraduationCap, ClipboardList, Search,
  Save, ChevronRight, UserCheck, Award, ArrowLeft, Printer, FileText,
  Upload, Trash2, Download, X, Timer, Clock, Plus, Eye, CheckCircle, XCircle
} from 'lucide-react'
import ProfileView from '@/components/college/ProfileView'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

import type { Teacher, Subject, Student, ExamResult } from '@/store/college-store'
import { useAppStore } from '@/store/college-store'
import { printContent } from '@/lib/print-utils'

interface TeacherDashboardProps {
  view: string
  teacherId: string | null
}

function calculateGrade(marks: number): { grade: string; points: number } {
  if (marks >= 80) return { grade: 'A', points: 5 }
  if (marks >= 70) return { grade: 'B+', points: 4.5 }
  if (marks >= 65) return { grade: 'B', points: 4 }
  if (marks >= 60) return { grade: 'B-', points: 3.5 }
  if (marks >= 50) return { grade: 'C', points: 3 }
  if (marks >= 45) return { grade: 'C-', points: 2.5 }
  if (marks >= 40) return { grade: 'D', points: 2 }
  return { grade: 'F', points: 0 }
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-emerald-600 text-white'
    case 'B+': return 'bg-emerald-500 text-white'
    case 'B': return 'bg-blue-500 text-white'
    case 'B-': return 'bg-blue-400 text-white'
    case 'C': return 'bg-yellow-500 text-white'
    case 'C-': return 'bg-yellow-400 text-white'
    case 'D': return 'bg-orange-500 text-white'
    case 'F': return 'bg-red-600 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } }
}

export default function TeacherDashboard({ view, teacherId }: TeacherDashboardProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([])
  const [selectedSubjectForStudents, setSelectedSubjectForStudents] = useState<Subject | null>(null)

  // Materials state
  const [materials, setMaterials] = useState<any[]>([])
  const [materialFilterSubject, setMaterialFilterSubject] = useState('')
  const [materialSearchQuery, setMaterialSearchQuery] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [materialToDelete, setMaterialToDelete] = useState<any>(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    file: null as File | null,
  })
  const [uploading, setUploading] = useState(false)

  // Quizzes state
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [quizCreateDialog, setQuizCreateDialog] = useState(false)
  const [quizSubmissionsDialog, setQuizSubmissionsDialog] = useState(false)
  const [quizDeleteDialog, setQuizDeleteDialog] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<any>(null)
  const [quizSubmissions, setQuizSubmissions] = useState<any>(null)
  const [quizForm, setQuizForm] = useState({
    title: '', description: '', subjectId: '', durationMinutes: 30,
    totalMarks: 100, dueDate: '',
  })
  const [quizQuestions, setQuizQuestions] = useState<any[]>([
    { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', marks: 10 },
  ])
  const [creatingQuiz, setCreatingQuiz] = useState(false)

  // Assignments state
  const [assignments, setAssignments] = useState<any[]>([])
  const [assignmentCreateDialog, setAssignmentCreateDialog] = useState(false)
  const [assignmentSubmissionsDialog, setAssignmentSubmissionsDialog] = useState(false)
  const [assignmentDeleteDialog, setAssignmentDeleteDialog] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null)
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<any>(null)
  const [assignmentForm, setAssignmentForm] = useState({
    title: '', description: '', subjectId: '', totalMarks: 100, dueDate: '',
  })
  const [creatingAssignment, setCreatingAssignment] = useState(false)

  // ---- Materials Functions ----
  const fetchMaterials = useCallback(async () => {
    if (!teacherId) return
    try {
      const res = await fetch(`/api/materials?teacherId=${teacherId}`)
      if (res.ok) {
        const data = await res.json()
        setMaterials(data)
      }
    } catch {
      toast.error('Failed to load materials')
    }
  }, [teacherId])

  const handleUploadMaterial = async () => {
    if (!teacherId || !uploadForm.title || !uploadForm.subjectId) {
      toast.error('Please fill in the title and select a subject')
      return
    }

    const selectedSubject = subjects.find(s => s.id === uploadForm.subjectId)
    if (!selectedSubject) return

    setUploading(true)
    try {
      let fileUrl = ''
      let fileName = ''
      let fileType = ''
      let fileSize: number | null = null

      if (uploadForm.file) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(uploadForm.file!)
        })
        fileUrl = base64
        fileName = uploadForm.file.name
        fileType = uploadForm.file.name.split('.').pop()?.toUpperCase() || ''
        fileSize = uploadForm.file.size
      }

      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadForm.title,
          description: uploadForm.description || null,
          teacherId,
          subjectId: uploadForm.subjectId,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileType: fileType || null,
          fileSize: fileSize || null,
          targetYear: selectedSubject.year || null,
          targetSemester: selectedSubject.semester || null,
        }),
      })

      if (res.ok) {
        toast.success('Material uploaded successfully!')
        setUploadDialogOpen(false)
        setUploadForm({ title: '', description: '', subjectId: '', file: null })
        fetchMaterials()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to upload material')
      }
    } catch {
      toast.error('Failed to upload material')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadMaterial = async (material: any) => {
    if (!material.fileUrl) {
      toast.info('No file attached to this material')
      return
    }
    try {
      await fetch(`/api/materials/${material.id}`, { method: 'PATCH' })
      const link = document.createElement('a')
      link.href = material.fileUrl
      link.download = material.fileName || 'material'
      link.click()
      fetchMaterials()
    } catch {
      toast.error('Download failed')
    }
  }

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return
    try {
      const res = await fetch(`/api/materials/${materialToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Material deleted successfully')
        setDeleteDialogOpen(false)
        setMaterialToDelete(null)
        fetchMaterials()
      } else {
        toast.error('Failed to delete material')
      }
    } catch {
      toast.error('Failed to delete material')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'PDF': return 'bg-red-100 text-red-700'
      case 'DOC': case 'DOCX': return 'bg-blue-100 text-blue-700'
      case 'PPT': case 'PPTX': return 'bg-orange-100 text-orange-700'
      case 'XLS': case 'XLSX': return 'bg-emerald-100 text-emerald-700'
      case 'TXT': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // ---- Quiz Functions ----
  const fetchQuizzes = useCallback(async () => {
    if (!teacherId) return
    try {
      const res = await fetch(`/api/quizzes?teacherId=${teacherId}`)
      if (res.ok) {
        const data = await res.json()
        setQuizzes(data.quizzes || [])
      }
    } catch {
      toast.error('Failed to load quizzes')
    }
  }, [teacherId])

  const handleCreateQuiz = async () => {
    if (!teacherId || !quizForm.title || !quizForm.subjectId) {
      toast.error('Please fill in the title and select a subject')
      return
    }
    const validQuestions = quizQuestions.filter(q => q.question.trim())
    if (validQuestions.length === 0) {
      toast.error('Please add at least one question')
      return
    }
    setCreatingQuiz(true)
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          subjectId: quizForm.subjectId,
          title: quizForm.title,
          description: quizForm.description || null,
          durationMinutes: parseInt(String(quizForm.durationMinutes)) || 30,
          totalMarks: validQuestions.reduce((s: number, q: any) => s + (parseInt(String(q.marks)) || 0), 0),
          dueDate: quizForm.dueDate || null,
          questions: validQuestions,
        }),
      })
      if (res.ok) {
        toast.success('Quiz created successfully!')
        setQuizCreateDialog(false)
        setQuizForm({ title: '', description: '', subjectId: '', durationMinutes: 30, totalMarks: 100, dueDate: '' })
        setQuizQuestions([{ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', marks: 10 }])
        fetchQuizzes()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create quiz')
      }
    } catch {
      toast.error('Failed to create quiz')
    } finally {
      setCreatingQuiz(false)
    }
  }

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return
    try {
      const res = await fetch(`/api/quizzes/${quizToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Quiz deleted successfully')
        setQuizDeleteDialog(false)
        setQuizToDelete(null)
        fetchQuizzes()
      } else {
        toast.error('Failed to delete quiz')
      }
    } catch {
      toast.error('Failed to delete quiz')
    }
  }

  const handleViewQuizSubmissions = async (quiz: any) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`)
      if (res.ok) {
        const data = await res.json()
        setQuizSubmissions(data.quiz)
        setQuizSubmissionsDialog(true)
      } else {
        toast.error('Failed to load quiz submissions')
      }
    } catch {
      toast.error('Failed to load quiz submissions')
    }
  }

  // ---- Assignment Functions ----
  const fetchAssignments = useCallback(async () => {
    if (!teacherId) return
    try {
      const res = await fetch(`/api/assignments?teacherId=${teacherId}`)
      if (res.ok) {
        const data = await res.json()
        setAssignments(data.assignments || [])
      }
    } catch {
      toast.error('Failed to load assignments')
    }
  }, [teacherId])

  const handleCreateAssignment = async () => {
    if (!teacherId || !assignmentForm.title || !assignmentForm.subjectId) {
      toast.error('Please fill in the title and select a subject')
      return
    }
    setCreatingAssignment(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          subjectId: assignmentForm.subjectId,
          title: assignmentForm.title,
          description: assignmentForm.description || null,
          totalMarks: parseInt(String(assignmentForm.totalMarks)) || 100,
          dueDate: assignmentForm.dueDate || null,
        }),
      })
      if (res.ok) {
        toast.success('Assignment created successfully!')
        setAssignmentCreateDialog(false)
        setAssignmentForm({ title: '', description: '', subjectId: '', totalMarks: 100, dueDate: '' })
        fetchAssignments()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create assignment')
      }
    } catch {
      toast.error('Failed to create assignment')
    } finally {
      setCreatingAssignment(false)
    }
  }

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return
    try {
      const res = await fetch(`/api/assignments/${assignmentToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Assignment deleted successfully')
        setAssignmentDeleteDialog(false)
        setAssignmentToDelete(null)
        fetchAssignments()
      } else {
        toast.error('Failed to delete assignment')
      }
    } catch {
      toast.error('Failed to delete assignment')
    }
  }

  const handleViewAssignmentSubmissions = async (assignment: any) => {
    try {
      const res = await fetch(`/api/assignments/${assignment.id}`)
      if (res.ok) {
        const data = await res.json()
        setAssignmentSubmissions(data.assignment)
        setAssignmentSubmissionsDialog(true)
      } else {
        toast.error('Failed to load assignment submissions')
      }
    } catch {
      toast.error('Failed to load assignment submissions')
    }
  }

  // Fetch teachers list when no teacher is selected
  useEffect(() => {
    if (!teacherId) {
      fetchTeachers()
    }
  }, [teacherId])

  // Fetch teacher details when teacherId is provided
  useEffect(() => {
    if (teacherId) {
      fetchTeacherDetails(teacherId)
    } else {
      setTeacher(null)
      setSubjects([])
      setStudents([])
      setResults([])
    }
  }, [teacherId])

  // Fetch materials, quizzes, and assignments when teacher is loaded
  useEffect(() => {
    if (teacher && teacherId) {
      fetchMaterials()
      fetchQuizzes()
      fetchAssignments()
    }
  }, [teacher, teacherId, fetchMaterials, fetchQuizzes, fetchAssignments])

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teachers')
      if (res.ok) {
        const data = await res.json()
        setTeachers(data)
      }
    } catch {
      toast.error('Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeacherDetails = async (id: string) => {
    setLoading(true)
    try {
      const [teacherRes, studentsRes, resultsRes] = await Promise.all([
        fetch(`/api/teachers/${id}`),
        fetch('/api/students'),
        fetch('/api/results')
      ])

      if (teacherRes.ok) {
        const tData = await teacherRes.json()
        setTeacher(tData)
        setSubjects(tData.subjects || [])
      }
      if (studentsRes.ok) {
        const sData = await studentsRes.json()
        setStudents(sData)
      }
      if (resultsRes.ok) {
        const rData = await resultsRes.json()
        setResults(rData)
      }
    } catch {
      toast.error('Failed to load teacher data')
    } finally {
      setLoading(false)
    }
  }

  const getTeacherStudents = useCallback(() => {
    const subjectCourseIds = subjects.map(s => s.courseId)
    const subjectIds = subjects.map(s => s.id)
    const filtered = students.filter(s =>
      subjectCourseIds.includes(s.courseId)
    )
    return { students: filtered, subjectIds }
  }, [students, subjects])

  const getTeacherResults = useCallback(() => {
    const subjectIds = subjects.map(s => s.id)
    return results.filter(r => subjectIds.includes(r.subjectId))
  }, [results, subjects])

  const getAveragePassRate = useCallback(() => {
    const teacherResults = getTeacherResults()
    if (teacherResults.length === 0) return 0
    const passing = teacherResults.filter(r => r.marks >= 40).length
    return Math.round((passing / teacherResults.length) * 100)
  }, [getTeacherResults])

  const handleSubjectSelectForGrades = async (subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setGradeInputs({})
    const subject = subjects.find(s => s.id === subjectId)
    if (!subject) return

    setLoading(true)
    try {
      const res = await fetch(`/api/students?courseId=${subject.courseId}`)
      if (res.ok) {
        const data = await res.json()
        setEnrolledStudents(data)

        // Pre-fill existing results
        const existingResults = results.filter(r => r.subjectId === subjectId)
        const inputs: Record<string, string> = {}
        existingResults.forEach(r => {
          inputs[r.studentId] = String(r.marks)
        })
        setGradeInputs(inputs)
      }
    } catch {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleViewEnrolledStudents = async (subject: Subject) => {
    setSelectedSubjectForStudents(subject)
    setLoading(true)
    try {
      const res = await fetch(`/api/students?courseId=${subject.courseId}`)
      if (res.ok) {
        const data = await res.json()
        setEnrolledStudents(data)
      }
    } catch {
      toast.error('Failed to load enrolled students')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAllGrades = async () => {
    if (!selectedSubjectId) return

    const subject = subjects.find(s => s.id === selectedSubjectId)
    if (!subject) return

    let savedCount = 0
    let errorCount = 0

    setLoading(true)
    try {
      for (const student of enrolledStudents) {
        const marksStr = gradeInputs[student.id]
        if (marksStr === undefined || marksStr === '') continue

        const marks = parseFloat(marksStr)
        if (isNaN(marks) || marks < 0 || marks > 100) {
          errorCount++
          continue
        }

        const { grade, points } = calculateGrade(marks)

        const res = await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            subjectId: selectedSubjectId,
            examType: 'Final',
            marks,
            semester: subject.semester,
            year: subject.year,
          })
        })

        if (res.ok) {
          savedCount++
        } else {
          errorCount++
        }
      }

      if (savedCount > 0) {
        toast.success(`Successfully saved ${savedCount} grade(s)`)
        // Refresh results
        if (teacherId) fetchTeacherDetails(teacherId)
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} grade(s) failed to save`)
      }
    } catch {
      toast.error('Failed to save grades')
    } finally {
      setLoading(false)
    }
  }

  // ---- Teacher Selection (no teacherId) ----
  if (!teacherId) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn} className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => useAppStore.getState().logout()}
              className="gap-1.5 text-gray-500 hover:text-[#0a1628] border-gray-200 hover:border-gray-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Menu
            </Button>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0a1628]">
              Lecturer Portal
            </h1>
            <p className="text-gray-500 mt-1">
              Select your profile to access the dashboard
            </p>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {teachers.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: teachers.indexOf(t) * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-[#d4a853] border-l-4 border-l-[#0a1628]"
                    onClick={() => {
                      useAppStore.getState().setCurrentUserId(t.id)
                    }}
                  >
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="w-14 h-14 rounded-full bg-[#0a1628] flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {t.firstName[0]}{t.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#0a1628] text-lg truncate">
                          {t.firstName} {t.middleName ? t.middleName + ' ' : ''}{t.lastName}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {t.department}
                          {t.specialization ? ` — ${t.specialization}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">Employee ID</p>
                        <p className="font-mono text-sm font-medium text-[#0a1628]">{t.employeeId}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {teachers.length === 0 && !loading && (
                <Card className="p-12 text-center">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No lecturers found</p>
                  <p className="text-gray-400 text-sm mt-1">Please seed the database first</p>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // ---- Teacher Dashboard ----
  if (view === 'dashboard' && teacher) {
    const teacherStudents = getTeacherStudents()
    const uniqueStudentCount = teacherStudents.students.length
    const avgPassRate = getAveragePassRate()

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          {/* Welcome Header */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#d4a853] flex items-center justify-center text-[#0a1628] font-bold text-xl">
                  {teacher.firstName[0]}{teacher.lastName[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    Welcome, {teacher.firstName} {teacher.lastName}
                  </h1>
                  <p className="text-blue-200 mt-1 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {teacher.department}
                    {teacher.qualification && (
                      <Badge className="bg-[#d4a853] text-[#0a1628] border-0 ml-2">
                        {teacher.qualification}
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => useAppStore.getState().logout()}
                className="gap-1.5 text-white/70 border-white/20 hover:text-white hover:bg-white/10 hover:border-white/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            </div>
          </div>

          {/* Stat Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {[
              {
                label: 'My Subjects',
                value: subjects.length,
                icon: BookOpen,
                color: 'from-[#0a1628] to-[#1a2a4a]',
                accent: '#d4a853'
              },
              {
                label: 'Total Students',
                value: uniqueStudentCount,
                icon: Users,
                color: 'from-emerald-700 to-emerald-900',
                accent: '#10b981'
              },
              {
                label: 'Average Pass Rate',
                value: `${avgPassRate}%`,
                icon: Award,
                color: 'from-blue-700 to-blue-900',
                accent: '#3b82f6'
              }
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeIn}>
                <Card className="overflow-hidden">
                  <div className={`bg-gradient-to-br ${stat.color} p-1`}>
                    <CardContent className="bg-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                          <p className="text-3xl font-bold text-[#0a1628] mt-1">{stat.value}</p>
                        </div>
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${stat.accent}20` }}
                        >
                          <stat.icon className="w-6 h-6" style={{ color: stat.accent }} />
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* My Subjects */}
          <div>
            <h2 className="text-xl font-bold text-[#0a1628] mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#d4a853]" />
              My Subjects
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject, idx) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-300 hover:border-[#d4a853] cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-[#0a1628] text-white">{subject.code}</Badge>
                          <span className="text-xs text-gray-400">
                            {subject.credits} Credits
                          </span>
                        </div>
                        <CardTitle className="text-lg text-[#0a1628] group-hover:text-[#d4a853] transition-colors">
                          {subject.name}
                        </CardTitle>
                        <CardDescription>
                          Year {subject.year} • Semester {subject.semester}
                          {subject.course && ` • ${subject.course.name}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {subject.courseId
                              ? students.filter(s => s.courseId === subject.courseId).length
                              : 0
                            } Students
                          </span>
                          <span className="text-[#d4a853] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            View <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {subjects.length === 0 && (
                  <Card className="col-span-full p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No subjects assigned yet</p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // ---- My Subjects View ----
  if (view === 'subjects' && teacher) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0a1628]">My Subjects</h1>
              <p className="text-gray-500 mt-1">
                {teacher.firstName} {teacher.lastName} • {teacher.department}
              </p>
            </div>
            <Badge className="bg-[#0a1628] text-white text-sm px-3 py-1">
              {subjects.length} Subject{subjects.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-44 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject, idx) => {
                const studentCount = students.filter(s => s.courseId === subject.courseId).length
                return (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <Card
                      className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-t-4 border-t-[#d4a853]"
                      onClick={() => handleViewEnrolledStudents(subject)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="font-mono text-xs border-[#d4a853] text-[#d4a853]">
                            {subject.code}
                          </Badge>
                          <Badge variant="secondary" className="bg-[#0a1628]/10 text-[#0a1628]">
                            {subject.credits} CR
                          </Badge>
                        </div>
                        <CardTitle className="text-[#0a1628] group-hover:text-[#d4a853] transition-colors">
                          {subject.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>Year {subject.year}</span>
                          <span>•</span>
                          <span>Semester {subject.semester}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-[#f8f9fc] rounded-lg p-3 flex items-center justify-between">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <UserCheck className="w-4 h-4" />
                            Enrolled Students
                          </span>
                          <span className="text-lg font-bold text-[#0a1628]">{studentCount}</span>
                        </div>
                        {subject.course && (
                          <p className="text-xs text-gray-400 mt-3">
                            Course: {subject.course.name}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Enrolled Students Dialog */}
          <Dialog
            open={!!selectedSubjectForStudents}
            onOpenChange={() => setSelectedSubjectForStudents(null)}
          >
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedSubjectForStudents?.code} — {selectedSubjectForStudents?.name}
                </DialogTitle>
                <DialogDescription>
                  Enrolled students for Year {selectedSubjectForStudents?.year}, Semester {selectedSubjectForStudents?.semester}
                </DialogDescription>
              </DialogHeader>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : enrolledStudents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reg No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Year</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrolledStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-xs">{student.regNumber}</TableCell>
                        <TableCell className="font-medium">
                          {student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}
                        </TableCell>
                        <TableCell>{student.course?.name || '-'}</TableCell>
                        <TableCell>Year {student.year}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500 py-8">No students found</p>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    )
  }

  // ---- Enter Grades View ----
  if (view === 'grades' && teacher) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0a1628]">Enter Grades</h1>
            <p className="text-gray-500 mt-1">
              Select a subject and enter marks for enrolled students
            </p>
          </div>

          {/* Subject Selector */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <Label className="text-sm font-medium text-gray-600 mb-2 block">Select Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={handleSubjectSelectForGrades}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a subject to grade..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} — {s.name} (Year {s.year}, Sem {s.semester})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Grade Entry Table */}
          {selectedSubjectId ? (
            <motion.div
              key="grade-entry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#0a1628]">
                  Student Grades — {subjects.find(s => s.id === selectedSubjectId)?.name}
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const subject = subjects.find(s => s.id === selectedSubjectId)
                      if (!subject) return
                      const teacherName = teacher ? teacher.firstName + ' ' + (teacher.middleName ? teacher.middleName + ' ' : '') + teacher.lastName : ''
                      const subjectCourse = subject.course ? subject.course.name : ''
                      const printDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                      const studentRows = enrolledStudents.map((student, idx) => {
                        const marksStr = gradeInputs[student.id] ?? ''
                        const marks = parseFloat(marksStr)
                        const { grade, points } = !isNaN(marks) && marksStr !== ''
                          ? calculateGrade(marks)
                          : { grade: '-', points: 0 }
                        const midName = student.middleName ? student.middleName + ' ' : ''
                        const fullName = student.firstName + ' ' + midName + student.lastName
                        const badgeClass = points >= 2 ? 'badge-pass' : 'badge-fail'
                        const pointsStr = grade !== '-' ? points.toFixed(1) : '-'
                        return '<tr>' +
                          '<td>' + (idx + 1) + '</td>' +
                          '<td style="font-family:monospace;font-size:11px;">' + student.regNumber + '</td>' +
                          '<td>' + fullName + '</td>' +
                          '<td style="text-align:center;font-weight:600;">' + (marksStr || '-') + '</td>' +
                          '<td style="text-align:center;"><span class="badge ' + badgeClass + '">' + grade + '</span></td>' +
                          '<td style="text-align:center;">' + pointsStr + '</td>' +
                          '</tr>'
                      }).join('')
                      const emptyRow = enrolledStudents.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#999;">No students enrolled</td></tr>' : ''
                      const gradingScale = [{l: 'A', r: '80-100', p: '5.0'}, {l: 'B+', r: '70-79', p: '4.5'}, {l: 'B', r: '65-69', p: '4.0'}, {l: 'B-', r: '60-64', p: '3.5'}, {l: 'C', r: '50-59', p: '3.0'}, {l: 'C-', r: '45-49', p: '2.5'}, {l: 'D', r: '40-44', p: '2.0'}, {l: 'F', r: '0-39', p: '0.0'}].map(g => {
                        const points = parseFloat(g.p)
                        const bg = points >= 2.5 ? '#dcfce7' : '#fef2f2'
                        const clr = points >= 2.5 ? '#166534' : '#991b1b'
                        return '<span style="display:inline-block;padding:2px 6px;border:1px solid #ddd;border-radius:4px;font-size:10px;background:' + bg + ';color:' + clr + ';">' + g.l + ': ' + g.r + ' (' + g.p + ')</span>'
                      }).join('')
                      const html = `
                        <div class="header">
                          <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
                            <img src="/images/college-logo.png" style="height:50px;width:auto;" />
                          </div>
                          <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                          <p>Zanzibar, Tanzania</p>
                          <p class="sub">OFFICIAL GRADE SHEET &mdash; ${subject.code} ${subject.name}</p>
                          <p class="sub">Year ${subject.year} &bull; Semester ${subject.semester} &bull; ${subjectCourse}</p>
                        </div>
                        <div class="info-grid">
                          <div class="info-item"><span class="info-label">Lecturer:</span><span class="info-value">${teacherName}</span></div>
                          <div class="info-item"><span class="info-label">Department:</span><span class="info-value">${teacher?.department || ''}</span></div>
                          <div class="info-item"><span class="info-label">Date Printed:</span><span class="info-value">${printDate}</span></div>
                        </div>
                        <h2 style="margin:15px 0 10px;font-size:14px;color:#0a1628;">Student Grades</h2>
                        <table>
                          <thead><tr><th>#</th><th>Reg Number</th><th>Student Name</th><th style="text-align:center;">Marks</th><th style="text-align:center;">Grade</th><th style="text-align:center;">Points</th></tr></thead>
                          <tbody>
                            ${studentRows}
                            ${emptyRow}
                          </tbody>
                        </table>
                        <div style="margin-top:15px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                          <p style="font-size:11px;font-weight:600;color:#0a1628;margin-bottom:6px;">Grading Scale</p>
                          <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            ${gradingScale}
                          </div>
                        </div>
                        <div class="footer">
                          <p>This is an official grade sheet from ICHAS</p>
                          <p>Imperial College of Health and Allied Sciences, Zanzibar, Tanzania</p>
                        </div>
                      `
                      printContent(html, `GradeSheet_${subject.code}`)
                    }}
                    variant="outline"
                    className="border-[#0a1628]/20 hover:bg-[#0a1628]/5 gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print Grade Sheet
                  </Button>
                  <Button
                    onClick={handleSaveAllGrades}
                    disabled={loading || Object.keys(gradeInputs).length === 0}
                    className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Saving...' : 'Save All Grades'}
                  </Button>
                </div>
              </div>

              {loading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="max-h-[60vh] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Reg Number</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead className="w-36">Marks (0-100)</TableHead>
                            <TableHead className="w-24">Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrolledStudents.map((student, idx) => {
                            const marksStr = gradeInputs[student.id] ?? ''
                            const marks = parseFloat(marksStr)
                            const gradeResult = !isNaN(marks) && marksStr !== ''
                              ? calculateGrade(marks)
                              : { grade: '-', points: 0 }
                            const { grade } = gradeResult

                            return (
                              <TableRow key={student.id}>
                                <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                                <TableCell className="font-mono text-xs">{student.regNumber}</TableCell>
                                <TableCell className="font-medium">
                                  {student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    placeholder="0-100"
                                    value={marksStr}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      if (val === '' || (/^\d+$/.test(val) && parseInt(val) <= 100)) {
                                        setGradeInputs(prev => ({ ...prev, [student.id]: val }))
                                      }
                                    }}
                                    className="w-28"
                                  />
                                </TableCell>
                                <TableCell>
                                  {grade !== '-' && (
                                    <Badge className={getGradeColor(grade)}>
                                      {grade}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                          {enrolledStudents.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                No students enrolled in this subject
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grade Legend */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Grade Scale</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'A', range: '80-100' },
                      { label: 'B+', range: '70-79' },
                      { label: 'B', range: '65-69' },
                      { label: 'B-', range: '60-64' },
                      { label: 'C', range: '50-59' },
                      { label: 'C-', range: '45-49' },
                      { label: 'D', range: '40-44' },
                      { label: 'F', range: '0-39' },
                    ].map(g => (
                      <Badge key={g.label} className={getGradeColor(g.label)} variant="secondary">
                        {g.label}: {g.range}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          {!selectedSubjectId && (
            <Card className="p-12 text-center">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a subject to begin grading</p>
              <p className="text-gray-400 text-sm mt-1">Choose from your assigned subjects above</p>
            </Card>
          )}
        </motion.div>
      </div>
    )
  }

  // ---- My Students View ----
  if (view === 'students' && teacher) {
    const teacherStudentsData = getTeacherStudents()
    const filteredStudents = teacherStudentsData.students.filter(s => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        s.regNumber.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        (s.course?.name || '').toLowerCase().includes(q)
      )
    })

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0a1628]">My Students</h1>
              <p className="text-gray-500 mt-1">
                {teacherStudentsData.students.length} students across your subjects
              </p>
            </div>
            <Badge className="bg-[#0a1628] text-white text-sm px-3 py-1">
              {filteredStudents.length} Shown
            </Badge>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, registration number, or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card>
              <CardContent className="p-6 space-y-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[65vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Registration No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, idx) => (
                        <TableRow key={student.id}>
                          <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs font-medium">{student.regNumber}</TableCell>
                          <TableCell className="font-medium">
                            {student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}
                          </TableCell>
                          <TableCell>{student.course?.name || '-'}</TableCell>
                          <TableCell>Year {student.year}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                student.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>No students found matching your search</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    )
  }

  // ---- Profile View ----
  if (view === 'profile') {
    return <ProfileView userId={teacherId || ''} role="teacher" />
  }

  // ---- Course Materials View ----
  if (view === 'notes' && teacher) {
    const filteredMaterials = materials.filter((m: any) => {
      if (materialFilterSubject && m.subjectId !== materialFilterSubject) return false
      if (materialSearchQuery) {
        const q = materialSearchQuery.toLowerCase()
        if (!m.title.toLowerCase().includes(q)) return false
      }
      return true
    })
    const totalDownloads = materials.reduce((sum: number, m: any) => sum + (m.downloads || 0), 0)

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          {/* Header */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold">Course Materials</h1>
                <p className="text-blue-200 mt-1">Upload and manage lecture notes and documents for your students</p>
              </div>
              <Button
                onClick={() => {
                  setUploadForm({ title: '', description: '', subjectId: '', file: null })
                  setUploadDialogOpen(true)
                }}
                className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Material
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-[#0a1628] to-[#1a2a4a] p-1">
                <CardContent className="bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Materials</p>
                      <p className="text-3xl font-bold text-[#0a1628] mt-1">{materials.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#d4a853]/20">
                      <FileText className="w-6 h-6 text-[#d4a853]" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-1">
                <CardContent className="bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Downloads</p>
                      <p className="text-3xl font-bold text-[#0a1628] mt-1">{totalDownloads}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100">
                      <Download className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search materials by title..."
                    value={materialSearchQuery}
                    onChange={(e) => setMaterialSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={materialFilterSubject} onValueChange={(v) => setMaterialFilterSubject(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge className="bg-[#0a1628] text-white text-sm px-3 py-1">
                  {filteredMaterials.length} Material{filteredMaterials.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Materials Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredMaterials.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg">No materials found</p>
                    <p className="text-gray-400 text-sm mt-2">
                      {materials.length === 0
                        ? 'Click "Upload Material" to add your first course material'
                        : 'Try adjusting your search or filter'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="w-24">Type</TableHead>
                        <TableHead className="w-28">File Size</TableHead>
                        <TableHead className="w-28">Downloads</TableHead>
                        <TableHead className="w-32">Date</TableHead>
                        <TableHead className="w-28">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaterials.map((m: any, idx: number) => (
                        <TableRow key={m.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                          <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm text-[#0a1628]">{m.title}</p>
                              {m.description && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[300px]">{m.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{m.subject?.code} — {m.subject?.name}</p>
                              <p className="text-xs text-gray-400">
                                Y{m.targetYear || '?'} Sem {m.targetSemester || '?'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {m.fileType ? (
                              <Badge variant="outline" className={`text-xs ${getFileTypeColor(m.fileType)}`}>
                                {m.fileType}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">Note</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {m.fileSize ? formatFileSize(m.fileSize) : '—'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="font-medium text-[#0a1628]">{m.downloads || 0}</span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            }) : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {m.fileUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => handleDownloadMaterial(m)}
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setMaterialToDelete(m)
                                  setDeleteDialogOpen(true)
                                }}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#d4a853]" />
                  Upload Course Material
                </DialogTitle>
                <DialogDescription>
                  Share lecture notes and documents with your students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Introduction to Anatomy - Lecture 1"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Description</Label>
                  <Textarea
                    placeholder="Optional description of the material..."
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={uploadForm.subjectId}
                    onValueChange={(v) => setUploadForm({ ...uploadForm, subjectId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} — {s.name} (Y{s.year} Sem{s.semester})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">File (optional)</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-[#d4a853]/50 transition-colors">
                    {uploadForm.file ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-[#d4a853]" />
                          <span className="text-[#0a1628] font-medium truncate max-w-[250px]">
                            {uploadForm.file.name}
                          </span>
                          <span className="text-gray-400 text-xs">
                            ({formatFileSize(uploadForm.file.size)})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => setUploadForm({ ...uploadForm, file: null })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Click to upload a file</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, PPT, PPTX, TXT, XLSX</p>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setUploadForm({ ...uploadForm, file: e.target.files[0] })
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadMaterial}
                  disabled={uploading || !uploadForm.title || !uploadForm.subjectId}
                  className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload Material'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Material</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{materialToDelete?.title}&quot;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteMaterial}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
    )
  }

  // ---- Quizzes View ----
  if (view === 'quizzes' && teacher) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          {/* Header */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Timer className="w-6 h-6 text-[#d4a853]" />
                  Online Quizzes
                </h1>
                <p className="text-blue-200 mt-1">Create timed quizzes with multiple-choice questions and auto-marking</p>
              </div>
              <Button
                onClick={() => {
                  setQuizForm({ title: '', description: '', subjectId: '', durationMinutes: 30, totalMarks: 100, dueDate: '' })
                  setQuizQuestions([{ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', marks: 10 }])
                  setQuizCreateDialog(true)
                }}
                className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Quiz
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-[#0a1628] to-[#1a2a4a] p-1">
                <CardContent className="bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Quizzes</p>
                      <p className="text-3xl font-bold text-[#0a1628] mt-1">{quizzes.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#d4a853]/20">
                      <Timer className="w-6 h-6 text-[#d4a853]" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-1">
                <CardContent className="bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Submissions</p>
                      <p className="text-3xl font-bold text-[#0a1628] mt-1">{quizzes.reduce((s: number, q: any) => s + (q._count?.submissions || 0), 0)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-1">
                <CardContent className="bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Questions</p>
                      <p className="text-3xl font-bold text-[#0a1628] mt-1">{quizzes.reduce((s: number, q: any) => s + (q._count?.questions || 0), 0)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                      <ClipboardList className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Quizzes Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto">
                {quizzes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Timer className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg">No quizzes created yet</p>
                    <p className="text-gray-400 text-sm mt-2">Click &quot;Create Quiz&quot; to create your first timed quiz</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="w-28">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Duration</span>
                        </TableHead>
                        <TableHead className="w-24">Due Date</TableHead>
                        <TableHead className="w-24">Questions</TableHead>
                        <TableHead className="w-24">Submissions</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                        <TableHead className="w-28">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quizzes.map((q: any, idx: number) => {
                        const isExpired = q.dueDate && new Date(q.dueDate) < new Date()
                        const statusColor = isExpired
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                        const statusText = isExpired ? 'Expired' : 'Active'
                        return (
                          <TableRow key={q.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                            <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm text-[#0a1628]">{q.title}</p>
                                {q.description && (
                                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]">{q.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-mono border-[#d4a853] text-[#d4a853]">
                                {q.subject?.code}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <Clock className="w-3.5 h-3.5 text-[#d4a853]" />
                                {q.durationMinutes} min
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {q.dueDate ? new Date(q.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No deadline'}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-center">{q._count?.questions || 0}</TableCell>
                            <TableCell className="text-sm font-medium text-center">{q._count?.submissions || 0}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={statusColor}>{statusText}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleViewQuizSubmissions(q)}
                                  title="View Submissions"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => { setQuizToDelete(q); setQuizDeleteDialog(true) }}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Create Quiz Dialog */}
          <Dialog open={quizCreateDialog} onOpenChange={setQuizCreateDialog}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-[#d4a853]" />
                  Create Timed Quiz
                </DialogTitle>
                <DialogDescription>
                  Create a multiple-choice quiz with a fixed time limit. Students must complete it within the duration.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Title <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g., Anatomy Mid-Term Quiz 1"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Description</Label>
                  <Textarea
                    placeholder="Brief description of the quiz..."
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Subject <span className="text-red-500">*</span></Label>
                    <Select
                      value={quizForm.subjectId}
                      onValueChange={(v) => setQuizForm({ ...quizForm, subjectId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject..." />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.code} — {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#d4a853]" />
                      Duration (minutes) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={300}
                      placeholder="30"
                      value={quizForm.durationMinutes}
                      onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: parseInt(e.target.value) || 30 })}
                    />
                    <p className="text-xs text-[#d4a853] mt-1 flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      Students must finish within this time limit
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Due Date (quiz closes after this date)
                  </Label>
                  <Input
                    type="datetime-local"
                    value={quizForm.dueDate}
                    onChange={(e) => setQuizForm({ ...quizForm, dueDate: e.target.value })}
                  />
                </div>

                {/* Questions Section */}
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold text-[#0a1628]">
                      Questions ({quizQuestions.filter(q => q.question.trim()).length} added)
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-[#d4a853] border-[#d4a853] hover:bg-[#d4a853]/10"
                      onClick={() => setQuizQuestions([...quizQuestions, { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', marks: 10 }])}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Question
                    </Button>
                  </div>
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                    {quizQuestions.map((qq: any, qIdx: number) => (
                      <Card key={qIdx} className="p-4 border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-[#0a1628] text-white text-xs">Q{qIdx + 1}</Badge>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-500">Marks:</Label>
                            <Input
                              type="number"
                              min={1}
                              className="w-16 h-7 text-xs"
                              value={qq.marks}
                              onChange={(e) => {
                                const updated = [...quizQuestions]
                                updated[qIdx] = { ...updated[qIdx], marks: parseInt(e.target.value) || 0 }
                                setQuizQuestions(updated)
                              }}
                            />
                            {quizQuestions.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                                onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIdx))}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mb-3">
                          <Input
                            placeholder="Type your question here..."
                            value={qq.question}
                            onChange={(e) => {
                              const updated = [...quizQuestions]
                              updated[qIdx] = { ...updated[qIdx], question: e.target.value }
                              setQuizQuestions(updated)
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {['A', 'B', 'C', 'D'].map((opt) => (
                            <div key={opt} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...quizQuestions]
                                  updated[qIdx] = { ...updated[qIdx], correctAnswer: opt }
                                  setQuizQuestions(updated)
                                }}
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                  qq.correctAnswer === opt
                                    ? 'border-[#d4a853] bg-[#d4a853] text-white'
                                    : 'border-gray-300 text-gray-400 hover:border-[#d4a853]/50'
                                }`}
                              >
                                {opt}
                              </button>
                              <Input
                                placeholder={`Option ${opt}`}
                                value={(qq as any)['option' + opt] || ''}
                                onChange={(e) => {
                                  const updated = [...quizQuestions]
                                  updated[qIdx] = { ...updated[qIdx], ['option' + opt]: e.target.value }
                                  setQuizQuestions(updated)
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Click a letter (A/B/C/D) to mark the correct answer</p>
                      </Card>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                    <Timer className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-700">
                      Total marks: <span className="font-bold">{quizQuestions.reduce((s: number, q: any) => s + (parseInt(String(q.marks)) || 0), 0)}</span> — Quiz time limit: <span className="font-bold">{quizForm.durationMinutes} minutes</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setQuizCreateDialog(false)} disabled={creatingQuiz}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateQuiz}
                  disabled={creatingQuiz || !quizForm.title || !quizForm.subjectId || quizQuestions.filter(q => q.question.trim()).length === 0}
                  className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
                >
                  <Timer className="w-4 h-4" />
                  {creatingQuiz ? 'Creating...' : 'Create Quiz'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quiz Submissions Dialog */}
          <Dialog open={quizSubmissionsDialog} onOpenChange={setQuizSubmissionsDialog}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#d4a853]" />
                  Quiz Submissions
                </DialogTitle>
                <DialogDescription>
                  {quizSubmissions?.title} — {quizSubmissions?.subject?.code}
                </DialogDescription>
              </DialogHeader>
              {quizSubmissions ? (
                <div>
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <Badge className="bg-[#0a1628] text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {quizSubmissions.durationMinutes} min time limit
                    </Badge>
                    <Badge variant="outline" className="border-[#d4a853] text-[#d4a853]">
                      {quizSubmissions.totalMarks} total marks
                    </Badge>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {quizSubmissions._count?.questions || 0} questions
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {quizSubmissions.submissions?.length || 0} submissions
                    </Badge>
                  </div>
                  {quizSubmissions.submissions && quizSubmissions.submissions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Reg Number</TableHead>
                          <TableHead className="text-center">Score</TableHead>
                          <TableHead className="text-center">Percentage</TableHead>
                          <TableHead className="text-center">Time Taken</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quizSubmissions.submissions.map((sub: any, idx: number) => {
                          const pct = quizSubmissions.totalMarks > 0
                            ? Math.round((sub.score / quizSubmissions.totalMarks) * 100)
                            : 0
                          return (
                            <TableRow key={sub.id}>
                              <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                              <TableCell className="font-medium">
                                {sub.student?.firstName} {sub.student?.lastName}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{sub.student?.regNumber}</TableCell>
                              <TableCell className="text-center font-bold">{sub.score}/{quizSubmissions.totalMarks}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={pct >= 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                  {pct}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm text-gray-500">
                                {sub.timeTaken ? `${sub.timeTaken} min` : '-'}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-GB', {
                                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                }) : '-'}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No submissions yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Quiz Confirmation */}
          <AlertDialog open={quizDeleteDialog} onOpenChange={setQuizDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{quizToDelete?.title}&quot;? All questions and submissions will be permanently removed. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteQuiz} className="bg-red-600 hover:bg-red-700 text-white">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
    )
  }

  // ---- Assignments View ----
  if (view === 'assignments' && teacher) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          {/* Header */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-[#d4a853]" />
                  Assignments
                </h1>
                <p className="text-blue-200 mt-1">Create and manage assignments for your students</p>
              </div>
              <Button
                onClick={() => {
                  setAssignmentForm({ title: '', description: '', subjectId: '', totalMarks: 100, dueDate: '' })
                  setAssignmentCreateDialog(true)
                }}
                className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Assignment
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-[#0a1628] to-[#1a2a4a] p-1">
                <CardContent className="bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Assignments</p>
                      <p className="text-3xl font-bold text-[#0a1628] mt-1">{assignments.length}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#d4a853]/20">
                      <FileText className="w-6 h-6 text-[#d4a853]" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-1">
                <CardContent className="bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Total Submissions</p>
                      <p className="text-3xl font-bold text-[#0a1628] mt-1">{assignments.reduce((s: number, a: any) => s + (a._count?.submissions || 0), 0)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-1">
                <CardContent className="bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Avg Submissions</p>
                      <p className="text-3xl font-bold text-[#0a1628] mt-1">
                        {assignments.length > 0
                          ? Math.round(assignments.reduce((s: number, a: any) => s + (a._count?.submissions || 0), 0) / assignments.length)
                          : 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Assignments Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto">
                {assignments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg">No assignments created yet</p>
                    <p className="text-gray-400 text-sm mt-2">Click &quot;Create Assignment&quot; to create your first assignment</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="w-24">Total Marks</TableHead>
                        <TableHead className="w-28">Due Date</TableHead>
                        <TableHead className="w-28">Submissions</TableHead>
                        <TableHead className="w-28">Status</TableHead>
                        <TableHead className="w-28">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((a: any, idx: number) => {
                        const isExpired = a.dueDate && new Date(a.dueDate) < new Date()
                        const statusColor = isExpired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        const statusText = isExpired ? 'Expired' : 'Active'
                        return (
                          <TableRow key={a.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                            <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm text-[#0a1628]">{a.title}</p>
                                {a.description && (
                                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]">{a.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs font-mono border-[#d4a853] text-[#d4a853]">
                                {a.subject?.code}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-center">{a.totalMarks}</TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No deadline'}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-center">{a._count?.submissions || 0}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={statusColor}>{statusText}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleViewAssignmentSubmissions(a)}
                                  title="View Submissions"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => { setAssignmentToDelete(a); setAssignmentDeleteDialog(true) }}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Create Assignment Dialog */}
          <Dialog open={assignmentCreateDialog} onOpenChange={setAssignmentCreateDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#d4a853]" />
                  Create Assignment
                </DialogTitle>
                <DialogDescription>
                  Create a new assignment for your students with a deadline.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Title <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g., Research Paper on Public Health"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Description</Label>
                  <Textarea
                    placeholder="Describe the assignment requirements..."
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Subject <span className="text-red-500">*</span></Label>
                  <Select
                    value={assignmentForm.subjectId}
                    onValueChange={(v) => setAssignmentForm({ ...assignmentForm, subjectId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} — {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Total Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="100"
                      value={assignmentForm.totalMarks}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, totalMarks: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Due Date</Label>
                    <Input
                      type="datetime-local"
                      value={assignmentForm.dueDate}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setAssignmentCreateDialog(false)} disabled={creatingAssignment}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAssignment}
                  disabled={creatingAssignment || !assignmentForm.title || !assignmentForm.subjectId}
                  className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
                >
                  <ClipboardList className="w-4 h-4" />
                  {creatingAssignment ? 'Creating...' : 'Create Assignment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Assignment Submissions Dialog */}
          <Dialog open={assignmentSubmissionsDialog} onOpenChange={setAssignmentSubmissionsDialog}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#d4a853]" />
                  Assignment Submissions
                </DialogTitle>
                <DialogDescription>
                  {assignmentSubmissions?.title} — {assignmentSubmissions?.subject?.code}
                </DialogDescription>
              </DialogHeader>
              {assignmentSubmissions ? (
                <div>
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <Badge variant="outline" className="border-[#d4a853] text-[#d4a853]">
                      {assignmentSubmissions.totalMarks} total marks
                    </Badge>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {assignmentSubmissions.submissions?.length || 0} submissions
                    </Badge>
                    {assignmentSubmissions.dueDate && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        Due: {new Date(assignmentSubmissions.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Badge>
                    )}
                  </div>
                  {assignmentSubmissions.submissions && assignmentSubmissions.submissions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Reg Number</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignmentSubmissions.submissions.map((sub: any, idx: number) => {
                          const isLate = assignmentSubmissions.dueDate && sub.submittedAt && new Date(sub.submittedAt) > new Date(assignmentSubmissions.dueDate)
                          return (
                            <TableRow key={sub.id}>
                              <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                              <TableCell className="font-medium">
                                {sub.student?.firstName} {sub.student?.lastName}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{sub.student?.regNumber}</TableCell>
                              <TableCell>
                                {sub.content ? (
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{sub.content}</p>
                                ) : (
                                  <span className="text-xs text-gray-400">No content</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {sub.score !== null && sub.score !== undefined
                                  ? `${sub.score}/${assignmentSubmissions.totalMarks}`
                                  : 'Not graded'}
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">
                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-GB', {
                                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                }) : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge className={isLate ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}>
                                  {isLate ? 'Late' : 'On Time'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No submissions yet</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Assignment Confirmation */}
          <AlertDialog open={assignmentDeleteDialog} onOpenChange={setAssignmentDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{assignmentToDelete?.title}&quot;? All submissions will be permanently removed. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAssignment} className="bg-red-600 hover:bg-red-700 text-white">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="min-h-screen bg-[#f8f9fc] p-6 flex items-center justify-center">
      <Card className="p-8 text-center">
        <ArrowLeft className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Please select a view to continue</p>
      </Card>
    </div>
  )
}
