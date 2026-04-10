'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  BarChart3, FileCheck, FileText, TrendingUp, AlertTriangle,
  Search, Edit, Trash2, Eye, Filter, CheckCircle, Download,
  BookOpen, Users, GraduationCap, ArrowLeft, Printer,
  ScrollText, ClipboardList, UserCheck, Lock, ShieldCheck, ShieldX,
  Key, FileDown
} from 'lucide-react'
import ProfileView from '@/components/college/ProfileView'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

import type { ExamResult, Course, Student, Subject } from '@/store/college-store'
import { useAppStore } from '@/store/college-store'
import { printContent } from '@/lib/print-utils'
import { getAcademicLevel, getGpaScaleLabel } from '@/lib/academic-levels'

interface ExamOfficeProps {
  view: string
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

function getGradeBarColor(grade: string): string {
  switch (grade) {
    case 'A': return '#059669'
    case 'B+': return '#10b981'
    case 'B': return '#3b82f6'
    case 'B-': return '#60a5fa'
    case 'C': return '#eab308'
    case 'C-': return '#f59e0b'
    case 'D': return '#f97316'
    case 'F': return '#ef4444'
    default: return '#6b7280'
  }
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

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } }
}

function getStudentFullName(student: Student | undefined | null): string {
  if (!student) return '-'
  return `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`
}

export default function ExamOffice({ view }: ExamOfficeProps) {
  const [results, setResults] = useState<ExamResult[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filters
  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [filterSemester, setFilterSemester] = useState<string>('all')
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>('all')

  // Publish filters
  const [publishCourse, setPublishCourse] = useState<string>('')
  const [publishYear, setPublishYear] = useState<string>('')
  const [publishSemester, setPublishSemester] = useState<string>('')
  const [publishing, setPublishing] = useState(false)

  // Edit dialog
  const [editResult, setEditResult] = useState<ExamResult | null>(null)
  const [editMarks, setEditMarks] = useState<string>('')
  const [editRemarks, setEditRemarks] = useState<string>('')

  // Delete dialog
  const [deleteResult, setDeleteResult] = useState<ExamResult | null>(null)

  // Publish confirmation
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [publishedBatches, setPublishedBatches] = useState<string[]>([])

  // Permissions state
  const [permissions, setPermissions] = useState<any[]>([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)

  // Student Results view state
  const [srStudentId, setSrStudentId] = useState<string>('')
  const [srYear, setSrYear] = useState<string>('')
  const [srSemester, setSrSemester] = useState<string>('')

  // Class Results view state
  const [crCourseId, setCrCourseId] = useState<string>('')
  const [crYear, setCrYear] = useState<string>('')
  const [crSemester, setCrSemester] = useState<string>('')

  // Transcript view state
  const [trStudentId, setTrStudentId] = useState<string>('')

  // Result Statement view state
  const [rsStudentId, setRsStudentId] = useState<string>('')
  const [rsSemester, setRsSemester] = useState<string>('')

  // Permissions view filter
  const [permCourseFilter, setPermCourseFilter] = useState<string>('all')

  // Student Info view state
  const [siSearchQuery, setSiSearchQuery] = useState<string>('')
  const [siFilterCourse, setSiFilterCourse] = useState<string>('all')
  const [siFilterYear, setSiFilterYear] = useState<string>('all')
  const [siFilterStatus, setSiFilterStatus] = useState<string>('all')
  const [siEditStudent, setSiEditStudent] = useState<Student | null>(null)
  const [siEditForm, setSiEditForm] = useState<Record<string, string>>({})
  const [siEditSaving, setSiEditSaving] = useState(false)
  const [siResetStudent, setSiResetStudent] = useState<Student | null>(null)
  const [siResetPassword, setSiResetPassword] = useState<string>('')
  const [siResetConfirm, setSiResetConfirm] = useState<string>('')
  const [siResetSaving, setSiResetSaving] = useState(false)
  const [siNewPassword, setSiNewPassword] = useState<string>('')
  const [siConfirmPassword, setSiConfirmPassword] = useState<string>('')
  const [siPasswordSaving, setSiPasswordSaving] = useState(false)
  const [siLoginInfo, setSiLoginInfo] = useState<{ username?: string | null; lastLogin?: Date | null; mustChangePassword?: boolean | null; isActive?: boolean | null } | null>(null)

  // Lock Results view state
  const [lockViewTab, setLockViewTab] = useState<'class' | 'individual'>('class')
  const [lockCourseId, setLockCourseId] = useState<string>('')
  const [lockYear, setLockYear] = useState<string>('')
  const [lockSemester, setLockSemester] = useState<string>('')
  const [lockReason, setLockReason] = useState<string>('')
  const [lockStudentId, setLockStudentId] = useState<string>('')
  const [lockStudentSearch, setLockStudentSearch] = useState<string>('')
  const [existingLocks, setExistingLocks] = useState<any[]>([])
  const [lockSaving, setLockSaving] = useState(false)

  // Coursework Templates view state
  const [cwMaterials, setCwMaterials] = useState<any[]>([])
  const [cwLoading, setCwLoading] = useState(false)
  const [cwSearchQuery, setCwSearchQuery] = useState<string>('')
  const [cwFilterCourse, setCwFilterCourse] = useState<string>('all')

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [resultsRes, coursesRes, studentsRes, subjectsRes, permissionsRes, locksRes, cwRes] = await Promise.all([
        fetch('/api/results'),
        fetch('/api/courses'),
        fetch('/api/students'),
        fetch('/api/subjects'),
        fetch('/api/permissions'),
        fetch('/api/result-locks'),
        fetch('/api/coursework-templates')
      ])

      if (resultsRes.ok) setResults(await resultsRes.json())
      if (coursesRes.ok) setCourses(await coursesRes.json())
      if (studentsRes.ok) setStudents(await studentsRes.json())
      if (subjectsRes.ok) setSubjects(await subjectsRes.json())
      if (permissionsRes.ok) setPermissions(await permissionsRes.json())
      if (locksRes.ok) setExistingLocks(await locksRes.json())
      if (cwRes.ok) setCwMaterials(await cwRes.json())
    } catch {
      toast.error('Failed to load examination data')
    } finally {
      setLoading(false)
    }
  }

  // ---- Computed Stats ----
  const totalResults = results.length
  const averageScore = totalResults > 0
    ? (results.reduce((sum, r) => sum + r.marks, 0) / totalResults).toFixed(1)
    : '0.0'
  const passRate = totalResults > 0
    ? Math.round((results.filter(r => r.marks >= 40).length / totalResults) * 100)
    : 0
  const pendingPublishing = Math.max(0, totalResults - publishedBatches.length)

  const gradeDistribution = useCallback(() => {
    const grades = ['A', 'B+', 'B', 'B-', 'C', 'C-', 'D', 'F']
    const dist: Record<string, number> = {}
    grades.forEach(g => dist[g] = 0)
    results.forEach(r => {
      if (dist[r.grade] !== undefined) dist[r.grade]++
    })
    return grades.map(g => ({ grade: g, count: dist[g] }))
  }, [results])

  // ---- Dashboard ----
  if (view === 'dashboard') {
    const dist = gradeDistribution()
    const maxCount = Math.max(...dist.map(d => d.count), 1)

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-[#0a1628]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Examination Office</h1>
                <p className="text-blue-200">IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</p>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            {[
              {
                label: 'Total Results',
                value: totalResults,
                icon: FileCheck,
                color: 'from-[#0a1628] to-[#1a2a4a]',
                accent: '#d4a853'
              },
              {
                label: 'Average Score',
                value: averageScore,
                icon: TrendingUp,
                color: 'from-blue-700 to-blue-900',
                accent: '#3b82f6'
              },
              {
                label: 'Pass Rate',
                value: `${passRate}%`,
                icon: GraduationCap,
                color: 'from-emerald-700 to-emerald-900',
                accent: '#10b981'
              },
              {
                label: 'Pending Publishing',
                value: pendingPublishing,
                icon: AlertTriangle,
                color: 'from-amber-600 to-amber-800',
                accent: '#f59e0b'
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

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0a1628] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#d4a853]" />
                Results Distribution by Grade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {dist.map((item) => (
                    <div key={item.grade} className="flex items-center gap-3">
                      <Badge className={`${getGradeColor(item.grade)} w-10 justify-center shrink-0`}>
                        {item.grade}
                      </Badge>
                      <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: getGradeBarColor(item.grade) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
                          transition={{ duration: 0.8, delay: dist.indexOf(item) * 0.06 }}
                        />
                      </div>
                      <span className="text-sm font-medium text-[#0a1628] w-12 text-right shrink-0">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ---- Results Management ----
  if (view === 'results') {
    const filteredResults = results.filter(r => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const studentName = r.student
          ? `${r.student.firstName} ${r.student.middleName || ''} ${r.student.lastName}`.toLowerCase()
          : ''
        const regNo = r.student?.regNumber?.toLowerCase() || ''
        if (!studentName.includes(q) && !regNo.includes(q)) return false
      }
      if (filterCourse !== 'all' && r.subject?.courseId !== filterCourse) return false
      if (filterYear !== 'all' && r.subject?.year !== parseInt(filterYear)) return false
      if (filterSemester !== 'all' && r.subject?.semester !== parseInt(filterSemester)) return false
      return true
    })

    const uniqueAcademicYears = [...new Set(
      results.map(r => r.academicYear).filter(Boolean) as string[]
    )]

    const handleEditOpen = (result: ExamResult) => {
      setEditResult(result)
      setEditMarks(String(result.marks))
      setEditRemarks(result.remarks || '')
    }

    const handleEditSave = async () => {
      if (!editResult) return
      const marks = parseFloat(editMarks)
      if (isNaN(marks) || marks < 0 || marks > 100) {
        toast.error('Please enter valid marks (0-100)')
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/results/${editResult.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marks,
            remarks: editRemarks || null
          })
        })

        if (res.ok) {
          const updated = await res.json()
          setResults(prev => prev.map(r => r.id === editResult.id ? updated : r))
          toast.success('Result updated successfully')
          setEditResult(null)
        } else {
          toast.error('Failed to update result')
        }
      } catch {
        toast.error('Failed to update result')
      } finally {
        setLoading(false)
      }
    }

    const handleDelete = async () => {
      if (!deleteResult) return

      setLoading(true)
      try {
        const res = await fetch(`/api/results/${deleteResult.id}`, {
          method: 'DELETE'
        })

        if (res.ok) {
          setResults(prev => prev.filter(r => r.id !== deleteResult.id))
          toast.success('Result deleted successfully')
          setDeleteResult(null)
        } else {
          toast.error('Failed to delete result')
        }
      } catch {
        toast.error('Failed to delete result')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0a1628]">Results Management</h1>
              <p className="text-gray-500 mt-1">{results.length} total results on record</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-[#0a1628] text-white text-sm px-3 py-1">
                {filteredResults.length} Showing
              </Badge>
              <Button
                onClick={() => {
                  const html = `
                    <div class="header">
                      <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                      <p>Zanzibar, Tanzania — Examination Office</p>
                      <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                    <h2>Examination Results Report</h2>
                    <p>Showing ${filteredResults.length} of ${results.length} results</p>
                    <table>
                      <thead><tr><th>#</th><th>Student Name</th><th>Reg No</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Points</th><th>Remarks</th></tr></thead>
                      <tbody>
                        ${filteredResults.map((r: any, idx: number) => `<tr><td>${idx + 1}</td><td>${r.student ? `${r.student.firstName} ${r.student.lastName}` : '-'}</td><td>${r.student?.regNumber || '-'}</td><td>${r.subject?.name || '-'}</td><td><strong>${r.marks}</strong></td><td><span class="badge ${r.marks >= 40 ? 'badge-pass' : 'badge-fail'}">${r.grade}</span></td><td>${r.points}</td><td>${r.remarks || '-'}</td></tr>`).join('')}
                      </tbody>
                    </table>
                  `
                  printContent(html, 'Exam Results - ICHAS')
                }}
                variant="outline"
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Results
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search name or reg no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1">Year 1 (NTA Level 4)</SelectItem>
                    <SelectItem value="2">Year 2 (NTA Level 5)</SelectItem>
                    <SelectItem value="3">Year 3 (NTA Level 6)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSemester} onValueChange={setFilterSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[65vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Reg No</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead className="w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 9 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredResults.map((result, idx) => (
                      <TableRow key={result.id}>
                        <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {result.student
                            ? `${result.student.firstName} ${result.student.middleName || ''} ${result.student.lastName}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {result.student?.regNumber || '-'}
                        </TableCell>
                        <TableCell>
                          {result.subject
                            ? <span className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">{result.subject.code}</Badge>
                                {result.subject.name}
                              </span>
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-bold text-[#0a1628]">{result.marks}</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                        </TableCell>
                        <TableCell>{result.points}</TableCell>
                        <TableCell className="text-gray-500 text-sm max-w-[120px] truncate">
                          {result.remarks || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEditOpen(result)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteResult(result)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && filteredResults.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p>No results found matching your filters</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={!!editResult} onOpenChange={() => setEditResult(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Result</DialogTitle>
                <DialogDescription>
                  {editResult?.student
                    ? `${editResult.student.firstName} ${editResult.student.lastName} — ${editResult.subject?.name}`
                    : 'Modify marks and remarks'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Marks (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editMarks}
                    onChange={(e) => setEditMarks(e.target.value)}
                    className="mt-1"
                  />
                  {editMarks && !isNaN(parseFloat(editMarks)) && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-500">Resulting Grade:</span>
                      <Badge className={getGradeColor(calculateGrade(parseFloat(editMarks)).grade)}>
                        {calculateGrade(parseFloat(editMarks)).grade}
                      </Badge>
                      <span className="text-sm text-gray-500">({calculateGrade(parseFloat(editMarks)).points} pts)</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Input
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="Optional remarks..."
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditResult(null)}>Cancel</Button>
                <Button
                  onClick={handleEditSave}
                  disabled={loading}
                  className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <AlertDialog open={!!deleteResult} onOpenChange={() => setDeleteResult(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Result</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this result? This action cannot be undone.
                  {deleteResult?.student && (
                    <span className="block mt-2 font-medium text-[#0a1628]">
                      {deleteResult.student.firstName} {deleteResult.student.lastName} — {deleteResult.subject?.name} ({deleteResult.marks} marks)
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
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

  // ---- Publish Results ----
  if (view === 'publish') {
    const publishKey = `${publishCourse}-${publishYear}-${publishSemester}`
    const isPublished = publishedBatches.includes(publishKey)

    const publishResults = results.filter(r => {
      if (!publishCourse || !publishYear || !publishSemester) return false
      return (
        r.subject?.courseId === publishCourse &&
        r.subject?.year === parseInt(publishYear) &&
        r.subject?.semester === parseInt(publishSemester)
      )
    })

    const handlePublish = async () => {
      setPublishing(true)
      // Simulate publishing
      await new Promise(resolve => setTimeout(resolve, 1500))
      setPublishedBatches(prev => [...prev, publishKey])
      setPublishing(false)
      setShowPublishConfirm(false)
      toast.success(`Results published successfully for ${publishResults.length} entries`)
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-[#0a1628]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Publish Results</h1>
                <p className="text-blue-200">Select criteria and publish examination results</p>
              </div>
            </div>
          </div>

          {/* Selection Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-[#0a1628] flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#d4a853]" />
                Select Batch to Publish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Course</Label>
                  <Select value={publishCourse} onValueChange={setPublishCourse}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Year</Label>
                  <Select value={publishYear} onValueChange={setPublishYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1 (NTA Level 4)</SelectItem>
                      <SelectItem value="2">Year 2 (NTA Level 5)</SelectItem>
                      <SelectItem value="3">Year 3 (NTA Level 6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Semester</Label>
                  <Select value={publishSemester} onValueChange={setPublishSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Preview */}
          {publishCourse && publishYear && publishSemester && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#0a1628] flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Results Preview ({publishResults.length} entries)
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      const courseName = courses.find(c => c.id === publishCourse)?.name || publishCourse
                      const html = `
                        <div class="header">
                          <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                          <p>Zanzibar, Tanzania — Examination Office</p>
                          <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
                        </div>
                        <h2>Publish Results — ${courseName}</h2>
                        <p>Year ${publishYear}, Semester ${publishSemester} — ${publishResults.length} entries</p>
                        <table>
                          <thead><tr><th>Student</th><th>Reg No</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Points</th></tr></thead>
                          <tbody>
                            ${publishResults.map((r: any) => `<tr><td>${r.student ? `${r.student.firstName} ${r.student.lastName}` : '-'}</td><td>${r.student?.regNumber || '-'}</td><td>${r.subject?.name || '-'}</td><td><strong>${r.marks}</strong></td><td><span class="badge ${r.marks >= 40 ? 'badge-pass' : 'badge-fail'}">${r.grade}</span></td><td>${r.points}</td></tr>`).join('')}
                          </tbody>
                        </table>
                      `
                      printContent(html, `Publish Results - ${courseName}`)
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                  {isPublished ? (
                    <Badge className="bg-emerald-100 text-emerald-700 px-4 py-2">
                      <CheckCircle className="w-4 h-4 mr-1" /> Published
                    </Badge>
                  ) : (
                  <Button
                    onClick={() => setShowPublishConfirm(true)}
                    disabled={publishResults.length === 0 || publishing}
                    className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {publishing ? 'Publishing...' : 'Publish All'}
                  </Button>
                )}
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="max-h-[50vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Reg No</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead>Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {publishResults.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              {r.student
                                ? `${r.student.firstName} ${r.student.lastName}`
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {r.student?.regNumber || '-'}
                            </TableCell>
                            <TableCell>{r.subject?.name || '-'}</TableCell>
                            <TableCell className="font-bold">{r.marks}</TableCell>
                            <TableCell>
                              <Badge className={getGradeColor(r.grade)}>{r.grade}</Badge>
                            </TableCell>
                            <TableCell>{r.points}</TableCell>
                          </TableRow>
                        ))}
                        {publishResults.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                              No results found for the selected criteria
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!publishCourse && (
            <Card className="p-12 text-center">
              <FileCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select course, year, and semester to preview results</p>
            </Card>
          )}

          {/* Publish Confirmation */}
          <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Publishing Results</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to publish <span className="font-bold text-[#0a1628]">{publishResults.length}</span> results.
                  Once published, these results will be visible to students and stakeholders.
                  This action should be performed after thorough verification.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={publishing}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handlePublish}
                  disabled={publishing}
                  className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold"
                >
                  {publishing ? 'Publishing...' : 'Yes, Publish All'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </div>
    )
  }

  // ---- Reports ----
  if (view === 'reports') {
    // Course performance summary
    const coursePerformance = courses.map(course => {
      const courseSubjects = subjects.filter(s => s.courseId === course.id)
      const courseSubjectIds = courseSubjects.map(s => s.id)
      const courseResults = results.filter(r => courseSubjectIds.includes(r.subjectId))

      const totalStudents = new Set(courseResults.map(r => r.studentId)).size
      const avgScore = courseResults.length > 0
        ? (courseResults.reduce((sum, r) => sum + r.marks, 0) / courseResults.length).toFixed(1)
        : '0.0'
      const passCount = courseResults.filter(r => r.marks >= 40).length
      const passRate = courseResults.length > 0
        ? Math.round((passCount / courseResults.length) * 100)
        : 0

      return {
        course,
        totalStudents,
        avgScore,
        passRate,
        totalResults: courseResults.length
      }
    })

    // Subject-wise analysis
    const subjectAnalysis = subjects.map(subject => {
      const subjectResults = results.filter(r => r.subjectId === subject.id)
      const avgScore = subjectResults.length > 0
        ? (subjectResults.reduce((sum, r) => sum + r.marks, 0) / subjectResults.length).toFixed(1)
        : '0.0'
      const passRate = subjectResults.length > 0
        ? Math.round((subjectResults.filter(r => r.marks >= 40).length / subjectResults.length) * 100)
        : 0

      return {
        subject,
        avgScore,
        passRate,
        totalResults: subjectResults.length
      }
    })

    const totalAllStudents = [...new Set(results.map(r => r.studentId))].length
    const overallAvg = results.length > 0
      ? (results.reduce((sum, r) => sum + r.marks, 0) / results.length).toFixed(1)
      : '0.0'
    const overallPassRate = results.length > 0
      ? Math.round((results.filter(r => r.marks >= 40).length / results.length) * 100)
      : 0
    const highestScore = results.length > 0
      ? Math.max(...results.map(r => r.marks))
      : 0
    const lowestScore = results.length > 0
      ? Math.min(...results.map(r => r.marks))
      : 0

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#0a1628]">Examination Reports</h1>
                <p className="text-gray-500 mt-1">Performance analysis and summary statistics</p>
              </div>
              <Button
                onClick={() => {
                  const html = `
                    <div class="header">
                      <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                      <p>Zanzibar, Tanzania — Examination Office</p>
                      <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                    <div class="summary">
                      <div class="summary-box"><div class="label">Students Assessed</div><div class="value">${totalAllStudents}</div></div>
                      <div class="summary-box"><div class="label">Overall Average</div><div class="value">${overallAvg}</div></div>
                      <div class="summary-box"><div class="label">Overall Pass Rate</div><div class="value">${overallPassRate}%</div></div>
                      <div class="summary-box"><div class="label">Score Range</div><div class="value">${lowestScore} — ${highestScore}</div></div>
                    </div>
                    <h2>Course Performance Summary</h2>
                    <table>
                      <thead><tr><th>Course</th><th class="text-center">Students</th><th class="text-center">Results</th><th class="text-center">Avg Score</th><th class="text-center">Pass Rate</th></tr></thead>
                      <tbody>
                        ${coursePerformance.map(({ course: c, totalStudents: ts, avgScore, passRate, totalResults: tr }: any) => `<tr><td><strong>${c.code}</strong> ${c.name}</td><td class="text-center">${ts}</td><td class="text-center">${tr}</td><td class="text-center"><strong>${avgScore}</strong></td><td class="text-center"><span class="badge ${passRate >= 70 ? 'badge-pass' : passRate >= 50 ? 'badge-upper' : 'badge-fail'}">${passRate}%</span></td></tr>`).join('')}
                      </tbody>
                    </table>
                  `
                  printContent(html, 'Exam Reports - ICHAS')
                }}
                variant="outline"
                className="gap-2"
              >
                <Printer className="w-5 h-5" />
                Print Report
              </Button>
            </div>

          {/* Overall Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Students Assessed', value: totalAllStudents },
              { label: 'Overall Average', value: overallAvg },
              { label: 'Overall Pass Rate', value: `${overallPassRate}%` },
              { label: 'Score Range', value: `${lowestScore} — ${highestScore}` },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="text-center">
                  <CardContent className="p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#0a1628] mt-1">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Course Performance */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-[#0a1628] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#d4a853]" />
                Course Performance Summary
              </CardTitle>
              <CardDescription>Aggregated results by course</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-center">Students</TableHead>
                      <TableHead className="text-center">Results</TableHead>
                      <TableHead className="text-center">Avg Score</TableHead>
                      <TableHead className="text-center">Pass Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coursePerformance.map(({ course, totalStudents: ts, avgScore, passRate, totalResults: tr }) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{course.code}</Badge>
                            {course.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{ts}</TableCell>
                        <TableCell className="text-center">{tr}</TableCell>
                        <TableCell className="text-center font-bold">{avgScore}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              passRate >= 70
                                ? 'bg-emerald-100 text-emerald-700'
                                : passRate >= 50
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }
                          >
                            {passRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Subject-wise Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0a1628] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#d4a853]" />
                Subject-wise Analysis
              </CardTitle>
              <CardDescription>Detailed performance breakdown by subject</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-center">Results</TableHead>
                        <TableHead className="text-center">Avg Score</TableHead>
                        <TableHead className="text-center">Pass Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectAnalysis.map(({ subject, avgScore, passRate, totalResults: tr }) => (
                        <TableRow key={subject.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{subject.code}</Badge>
                              {subject.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {subject.course?.name || '-'}
                          </TableCell>
                          <TableCell className="text-center">{tr}</TableCell>
                          <TableCell className="text-center font-bold">{avgScore}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                passRate >= 70
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : passRate >= 50
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }
                            >
                              {passRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {subjectAnalysis.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No subject data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ---- Student Results ----
  if (view === 'student-results') {
    const srStudent = students.find(s => s.id === srStudentId)
    const srStudentResults = results.filter(r => {
      if (!srStudentId) return false
      if (r.studentId !== srStudentId) return false
      if (srYear && r.subject?.year !== parseInt(srYear)) return false
      if (srSemester && r.subject?.semester !== parseInt(srSemester)) return false
      return true
    })

    const handlePrintStudentResults = () => {
      if (!srStudent || srStudentResults.length === 0) return
      const html = `
        <div class="header">
          <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
          <p>Zanzibar, Tanzania — Examination Office</p>
          <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
        <h2>Student Results</h2>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Student Name:</span><span class="info-value">${getStudentFullName(srStudent)}</span></div>
          <div class="info-item"><span class="info-label">Reg Number:</span><span class="info-value">${srStudent.regNumber}</span></div>
          <div class="info-item"><span class="info-label">Course:</span><span class="info-value">${srStudent.course?.name || '-'}</span></div>
          <div class="info-item"><span class="info-label">Intake:</span><span class="info-value">${srStudent.intake}</span></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Subject Code</th><th>Subject Name</th><th>Marks</th><th>Grade</th><th>Points</th></tr></thead>
          <tbody>
            ${srStudentResults.map((r: any, idx: number) => `<tr><td>${idx + 1}</td><td>${r.subject?.code || '-'}</td><td>${r.subject?.name || '-'}</td><td><strong>${r.marks}</strong></td><td><span class="badge ${r.marks >= 40 ? 'badge-pass' : 'badge-fail'}">${r.grade}</span></td><td>${r.points}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="summary">
          <div class="summary-box"><div class="label">Total Subjects</div><div class="value">${srStudentResults.length}</div></div>
          <div class="summary-box"><div class="label">Average Marks</div><div class="value">${srStudentResults.length > 0 ? (srStudentResults.reduce((s, r) => s + r.marks, 0) / srStudentResults.length).toFixed(1) : '0.0'}</div></div>
          <div class="summary-box"><div class="label">Passed</div><div class="value">${srStudentResults.filter(r => r.marks >= 40).length}</div></div>
          <div class="summary-box"><div class="label">Failed</div><div class="value">${srStudentResults.filter(r => r.marks < 40).length}</div></div>
        </div>
      `
      printContent(html, `Student Results - ${srStudent.regNumber}`)
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                <UserCheck className="w-7 h-7 text-[#0a1628]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Student Results</h1>
                <p className="text-blue-200">View and print individual student examination results</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Select Student</Label>
                  <Select value={srStudentId} onValueChange={setSrStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.regNumber} — {getStudentFullName(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Year</Label>
                  <Select value={srYear} onValueChange={setSrYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      <SelectItem value="1">Year 1 (NTA Level 4)</SelectItem>
                      <SelectItem value="2">Year 2 (NTA Level 5)</SelectItem>
                      <SelectItem value="3">Year 3 (NTA Level 6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Semester</Label>
                  <Select value={srSemester} onValueChange={setSrSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Semesters</SelectItem>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {srStudentId && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#0a1628]">
                  Results for {getStudentFullName(srStudent)}
                  {srStudent && <span className="text-gray-400 font-normal ml-2">({srStudent.regNumber})</span>}
                </h2>
                <Button
                  onClick={handlePrintStudentResults}
                  variant="outline"
                  className="gap-2"
                  disabled={srStudentResults.length === 0}
                >
                  <Printer className="w-4 h-4" />
                  Print Results
                </Button>
              </div>

              {srStudentResults.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="max-h-[65vh] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Subject Code</TableHead>
                            <TableHead>Subject Name</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Semester</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Points</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {srStudentResults.map((r, idx) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{r.subject?.code || '-'}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{r.subject?.name || '-'}</TableCell>
                              <TableCell className="text-gray-500">Year {r.subject?.year}</TableCell>
                              <TableCell className="text-gray-500">Sem {r.subject?.semester}</TableCell>
                              <TableCell className="font-bold text-[#0a1628]">{r.marks}</TableCell>
                              <TableCell>
                                <Badge className={getGradeColor(r.grade)}>{r.grade}</Badge>
                              </TableCell>
                              <TableCell>{r.points}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No results found for the selected student and filters</p>
                </Card>
              )}
            </motion.div>
          )}

          {!srStudentId && (
            <Card className="p-12 text-center">
              <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a student to view their examination results</p>
            </Card>
          )}
        </motion.div>
      </div>
    )
  }

  // ---- Class Results ----
  if (view === 'class-results') {
    const crCourse = courses.find(c => c.id === crCourseId)
    const crSubjectIds = crCourseId
      ? subjects.filter(s => {
          if (s.courseId !== crCourseId) return false
          if (crYear && s.year !== parseInt(crYear)) return false
          if (crSemester && s.semester !== parseInt(crSemester)) return false
          return true
        }).map(s => s.id)
      : []
    const crResults = results.filter(r => crSubjectIds.includes(r.subjectId))

    const classAvg = crResults.length > 0
      ? (crResults.reduce((sum, r) => sum + r.marks, 0) / crResults.length).toFixed(1)
      : '0.0'
    const classPassRate = crResults.length > 0
      ? Math.round((crResults.filter(r => r.marks >= 40).length / crResults.length) * 100)
      : 0
    const classHighest = crResults.length > 0 ? Math.max(...crResults.map(r => r.marks)) : 0
    const classLowest = crResults.length > 0 ? Math.min(...crResults.map(r => r.marks)) : 0

    const handlePrintClassResults = () => {
      if (!crCourse || crResults.length === 0) return
      const html = `
        <div class="header">
          <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
          <p>Zanzibar, Tanzania — Examination Office</p>
          <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
        <h2>Class Results — ${crCourse.name} (${crCourse.code})</h2>
        <p>Year ${crYear || 'All'}, Semester ${crSemester || 'All'} — ${crResults.length} entries</p>
        <table>
          <thead><tr><th>#</th><th>Student Name</th><th>Reg No</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Points</th></tr></thead>
          <tbody>
            ${crResults.map((r: any, idx: number) => `<tr><td>${idx + 1}</td><td>${r.student ? getStudentFullName(r.student) : '-'}</td><td>${r.student?.regNumber || '-'}</td><td>${r.subject?.name || '-'}</td><td><strong>${r.marks}</strong></td><td><span class="badge ${r.marks >= 40 ? 'badge-pass' : 'badge-fail'}">${r.grade}</span></td><td>${r.points}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="summary">
          <div class="summary-box"><div class="label">Class Average</div><div class="value">${classAvg}</div></div>
          <div class="summary-box"><div class="label">Pass Rate</div><div class="value">${classPassRate}%</div></div>
          <div class="summary-box"><div class="label">Highest Score</div><div class="value">${classHighest}</div></div>
          <div class="summary-box"><div class="label">Lowest Score</div><div class="value">${classLowest}</div></div>
        </div>
      `
      printContent(html, `Class Results - ${crCourse.name}`)
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-[#0a1628]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Class Results</h1>
                <p className="text-blue-200">View and print batch examination results for all students</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Select Course</Label>
                  <Select value={crCourseId} onValueChange={setCrCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Year</Label>
                  <Select value={crYear} onValueChange={setCrYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      <SelectItem value="1">Year 1 (NTA Level 4)</SelectItem>
                      <SelectItem value="2">Year 2 (NTA Level 5)</SelectItem>
                      <SelectItem value="3">Year 3 (NTA Level 6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Semester</Label>
                  <Select value={crSemester} onValueChange={setCrSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Semesters</SelectItem>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {crCourseId && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#0a1628]">
                  {crCourse?.name || 'Class'} Results
                  <Badge className="ml-2 bg-[#d4a853] text-[#0a1628]">{crResults.length} entries</Badge>
                </h2>
                <Button
                  onClick={handlePrintClassResults}
                  variant="outline"
                  className="gap-2"
                  disabled={crResults.length === 0}
                >
                  <Printer className="w-4 h-4" />
                  Print Class Results
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Class Average', value: classAvg },
                  { label: 'Pass Rate', value: `${classPassRate}%` },
                  { label: 'Highest', value: classHighest },
                  { label: 'Lowest', value: classLowest },
                ].map((stat) => (
                  <Card key={stat.label} className="text-center">
                    <CardContent className="p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
                      <p className="text-2xl font-bold text-[#0a1628] mt-1">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {crResults.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <div className="max-h-[60vh] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white z-10">
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Reg No</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Points</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {crResults.map((r, idx) => (
                            <TableRow key={r.id}>
                              <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                              <TableCell className="font-medium">
                                {r.student ? getStudentFullName(r.student) : '-'}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{r.student?.regNumber || '-'}</TableCell>
                              <TableCell>{r.subject?.name || '-'}</TableCell>
                              <TableCell className="font-bold text-[#0a1628]">{r.marks}</TableCell>
                              <TableCell>
                                <Badge className={getGradeColor(r.grade)}>{r.grade}</Badge>
                              </TableCell>
                              <TableCell>{r.points}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No results found for the selected batch</p>
                </Card>
              )}
            </motion.div>
          )}

          {!crCourseId && (
            <Card className="p-12 text-center">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a course to view class results</p>
            </Card>
          )}
        </motion.div>
      </div>
    )
  }

  // ---- Academic Transcript ----
  if (view === 'transcript') {
    const trStudent = students.find(s => s.id === trStudentId)
    const trResults = results.filter(r => r.studentId === trStudentId)

    // Organize results by year/semester
    const semesters = new Map<string, ExamResult[]>()
    trResults.forEach(r => {
      const year = r.subject?.year || r.year || 0
      const sem = r.subject?.semester || r.semester || 0
      const key = `${year}-${sem}`
      if (!semesters.has(key)) semesters.set(key, [])
      semesters.get(key)!.push(r)
    })

    const sortedSemesterKeys = [...semesters.keys()].sort((a, b) => {
      const [aY, aS] = a.split('-').map(Number)
      const [bY, bS] = b.split('-').map(Number)
      return aY !== bY ? aY - bY : aS - bS
    })

    const calculateSemesterGPA = (semResults: ExamResult[], yearNum: number): string => {
      if (semResults.length === 0) return '0.00'
      const gpaScale = yearNum <= 2 ? 4.0 : 5.0
      let totalPoints = 0
      let totalCredits = 0
      semResults.forEach(r => {
        const sub = subjects.find(s => s.id === r.subjectId)
        const credits = sub?.credits || 1
        totalPoints += (r.points / gpaScale * credits)
        totalCredits += credits
      })
      return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
    }

    const calculateCumulativeGPA = (): string => {
      if (trResults.length === 0) return '0.00'
      let totalPoints = 0
      let totalCredits = 0
      trResults.forEach(r => {
        const sub = subjects.find(s => s.id === r.subjectId)
        const credits = sub?.credits || 1
        const yearNum = r.subject?.year || r.year || 1
        const gpaScale = yearNum <= 2 ? 4.0 : 5.0
        totalPoints += (r.points / gpaScale * credits)
        totalCredits += credits
      })
      return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
    }

    const handlePrintTranscript = () => {
      if (!trStudent || trResults.length === 0) return
      const studentYear = trStudent.year || 1
      const gpaScaleLabel = getGpaScaleLabel(studentYear)

      let semestersHtml = ''
      let cumulativeCredits = 0
      let cumulativePoints = 0

      sortedSemesterKeys.forEach(key => {
        const semRes = semesters.get(key)!
        const [yr, sm] = key.split('-').map(Number)
        const ntaLevel = getAcademicLevel(yr)
        const yearGpaScale = yr <= 2 ? 4.0 : 5.0
        let semTotalCredits = 0
        let semTotalPoints = 0

        semRes.forEach(r => {
          const sub = subjects.find(s => s.id === r.subjectId)
          const credits = sub?.credits || 1
          semTotalCredits += credits
          semTotalPoints += (r.points / yearGpaScale * credits)
        })
        cumulativeCredits += semTotalCredits
        cumulativePoints += semTotalPoints

        const semGpa = semTotalCredits > 0 ? (semTotalPoints / semTotalCredits).toFixed(2) : '0.00'
        const cumGpa = cumulativeCredits > 0 ? (cumulativePoints / cumulativeCredits).toFixed(2) : '0.00'

        semestersHtml += `
          <h3 style="margin-top:20px;margin-bottom:8px;border-bottom:2px solid #0a1628;padding-bottom:4px;">Year ${yr} — Semester ${sm} (${ntaLevel}) — GPA Scale: ${yearGpaScale === 4.0 ? '0.0-4.0' : '0.0-5.0'}</h3>
          <table>
            <thead><tr><th>Code</th><th>Subject</th><th>Credits</th><th>Marks</th><th>Grade</th><th>Points</th></tr></thead>
            <tbody>
              ${semRes.map((r: any) => {
                const sub = subjects.find(s => s.id === r.subjectId)
                return `<tr><td>${r.subject?.code || '-'}</td><td>${r.subject?.name || '-'}</td><td class="text-center">${sub?.credits || 1}</td><td class="text-center"><strong>${r.marks}</strong></td><td class="text-center"><span class="badge ${r.marks >= 40 ? 'badge-pass' : 'badge-fail'}">${r.grade}</span></td><td class="text-center">${r.points}</td></tr>`
              }).join('')}
              <tr style="background:#f0f4f8;font-weight:bold;"><td colspan="2">Semester GPA</td><td class="text-center">${semTotalCredits}</td><td colspan="2" class="text-center">GPA</td><td class="text-center">${semGpa}</td></tr>
            </tbody>
          </table>
        `
      })

      const cumGpa = calculateCumulativeGPA()
      const standing = parseFloat(cumGpa) >= 3.5 ? 'First Class - Excellent' : parseFloat(cumGpa) >= 3.0 ? 'Upper Second - Very Good' : parseFloat(cumGpa) >= 2.5 ? 'Lower Second - Good' : parseFloat(cumGpa) >= 2.0 ? 'Pass' : 'Probation'

      const html = `
        <div class="header">
          <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
          <p>Zanzibar, Tanzania</p>
          <p style="font-size:16px;font-weight:bold;margin-top:8px;color:#0a1628;">OFFICIAL ACADEMIC TRANSCRIPT</p>
          <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Student Name:</span><span class="info-value" style="font-weight:bold;">${getStudentFullName(trStudent)}</span></div>
          <div class="info-item"><span class="info-label">Reg Number:</span><span class="info-value">${trStudent.regNumber}</span></div>
          <div class="info-item"><span class="info-label">Programme:</span><span class="info-value">${trStudent.course?.name || '-'}</span></div>
          <div class="info-item"><span class="info-label">Intake:</span><span class="info-value">${trStudent.intake}</span></div>
          <div class="info-item"><span class="info-label">Current Year:</span><span class="info-value">Year ${trStudent.year} (${getAcademicLevel(trStudent.year)})</span></div>
          <div class="info-item"><span class="info-label">GPA Scale:</span><span class="info-value">${gpaScaleLabel}</span></div>
        </div>
        ${semestersHtml}
        <div class="summary" style="margin-top:20px;">
          <div class="summary-box"><div class="label">Total Credits Earned</div><div class="value">${cumulativeCredits}</div></div>
          <div class="summary-box"><div class="label">Cumulative GPA</div><div class="value">${cumGpa}</div></div>
          <div class="summary-box"><div class="label">Academic Standing</div><div class="value" style="font-size:14px;">${standing}</div></div>
        </div>
        <p style="margin-top:20px;font-size:11px;color:#888;">
          <strong>Grading Scale:</strong> A (Excellent), B+ (Very Good), B (Good), B- (Fairly Good), C (Average), C- (Below Average), D (Pass), F (Fail)<br/>
          <strong>Note:</strong> Years 1-2 use GPA Scale 0.0-4.0. Year 3 uses GPA Scale 0.0-5.0. NTA Levels 4-6 correspond to Years 1-3 respectively.
        </p>
      `
      printContent(html, `Transcript - ${trStudent.regNumber}`)
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                <ScrollText className="w-7 h-7 text-[#0a1628]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Academic Transcript</h1>
                <p className="text-blue-200">View and print official student academic transcript</p>
              </div>
            </div>
          </div>

          {/* Student Selection */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Select Student</Label>
                  <Select value={trStudentId} onValueChange={setTrStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.regNumber} — {getStudentFullName(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {trStudentId && trStudent && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Student Info Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#0a1628]">{getStudentFullName(trStudent)}</h2>
                  <p className="text-gray-500 text-sm">{trStudent.regNumber} — {trStudent.course?.name || '-'} — {trStudent.intake}</p>
                </div>
                <Button
                  onClick={handlePrintTranscript}
                  variant="outline"
                  className="gap-2"
                  disabled={trResults.length === 0}
                >
                  <Printer className="w-4 h-4" />
                  Print Transcript
                </Button>
              </div>

              {/* Student Info Card */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Programme</p>
                      <p className="font-medium text-[#0a1628]">{trStudent.course?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Current Year</p>
                      <p className="font-medium text-[#0a1628]">Year {trStudent.year} ({getAcademicLevel(trStudent.year)})</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">GPA Scale</p>
                      <p className="font-medium text-[#0a1628]">{getGpaScaleLabel(trStudent.year)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Intake</p>
                      <p className="font-medium text-[#0a1628]">{trStudent.intake}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Cumulative GPA</p>
                      <p className="font-bold text-[#d4a853] text-lg">{calculateCumulativeGPA()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Total Results</p>
                      <p className="font-medium text-[#0a1628]">{trResults.length} records</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Semester Tables */}
              {sortedSemesterKeys.length > 0 ? sortedSemesterKeys.map(key => {
                const semRes = semesters.get(key)!
                const [yr, sm] = key.split('-').map(Number)
                const ntaLevel = getAcademicLevel(yr)
                const semGpa = calculateSemesterGPA(semRes, yr)
                const yearGpaScale = yr <= 2 ? 4.0 : 5.0
                let semTotalCredits = 0
                semRes.forEach(r => {
                  const sub = subjects.find(s => s.id === r.subjectId)
                  semTotalCredits += sub?.credits || 1
                })

                return (
                  <Card key={key} className="mb-6">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-[#0a1628]">
                          Year {yr} — Semester {sm}
                          <Badge variant="outline" className="ml-2">{ntaLevel}</Badge>
                        </CardTitle>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">GPA Scale: {yearGpaScale === 4.0 ? '0.0-4.0' : '0.0-5.0'}</span>
                          <Badge className="bg-[#0a1628] text-white">Sem GPA: {semGpa}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">Credits</TableHead>
                            <TableHead className="text-center">Marks</TableHead>
                            <TableHead className="text-center">Grade</TableHead>
                            <TableHead className="text-center">Points</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {semRes.map(r => {
                            const sub = subjects.find(s => s.id === r.subjectId)
                            return (
                              <TableRow key={r.id}>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">{r.subject?.code || '-'}</Badge>
                                </TableCell>
                                <TableCell className="font-medium">{r.subject?.name || '-'}</TableCell>
                                <TableCell className="text-center">{sub?.credits || 1}</TableCell>
                                <TableCell className="text-center font-bold text-[#0a1628]">{r.marks}</TableCell>
                                <TableCell className="text-center">
                                  <Badge className={getGradeColor(r.grade)}>{r.grade}</Badge>
                                </TableCell>
                                <TableCell className="text-center">{r.points}</TableCell>
                              </TableRow>
                            )
                          })}
                          <TableRow className="bg-gray-50 font-bold">
                            <TableCell colSpan={2}>Semester GPA — Total Credits: {semTotalCredits}</TableCell>
                            <TableCell colSpan={4} className="text-center text-[#d4a853] text-lg">{semGpa}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )
              }) : (
                <Card className="p-12 text-center">
                  <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No academic records found for this student</p>
                </Card>
              )}
            </motion.div>
          )}

          {!trStudentId && (
            <Card className="p-12 text-center">
              <ScrollText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a student to view their academic transcript</p>
            </Card>
          )}
        </motion.div>
      </div>
    )
  }

  // ---- Result Statement ----
  if (view === 'result-statement') {
    const rsStudent = students.find(s => s.id === rsStudentId)
    const rsResults = results.filter(r => {
      if (!rsStudentId || !rsSemester) return false
      if (r.studentId !== rsStudentId) return false
      return true
    }).filter(r => {
      const sub = subjects.find(s => s.id === r.subjectId)
      if (!sub) return false
      if (sub.semester !== parseInt(rsSemester)) return false
      return true
    })

    const rsStudentYear = rsStudent?.year || 1
    const rsGpaScale = rsStudentYear <= 2 ? 4.0 : 5.0
    let rsTotalCredits = 0
    let rsTotalPoints = 0
    rsResults.forEach(r => {
      const sub = subjects.find(s => s.id === r.subjectId)
      const credits = sub?.credits || 1
      rsTotalCredits += credits
      rsTotalPoints += (r.points / rsGpaScale * credits)
    })
    const rsSemesterGPA = rsTotalCredits > 0 ? (rsTotalPoints / rsTotalCredits).toFixed(2) : '0.00'

    const handlePrintResultStatement = () => {
      if (!rsStudent || rsResults.length === 0) return
      const html = `
        <div class="header">
          <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
          <p>Zanzibar, Tanzania</p>
          <p style="font-size:16px;font-weight:bold;margin-top:8px;color:#0a1628;">SEMESTER RESULT STATEMENT</p>
          <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
        <div class="info-grid">
          <div class="info-item"><span class="info-label">Student Name:</span><span class="info-value" style="font-weight:bold;">${getStudentFullName(rsStudent)}</span></div>
          <div class="info-item"><span class="info-label">Reg Number:</span><span class="info-value">${rsStudent.regNumber}</span></div>
          <div class="info-item"><span class="info-label">Programme:</span><span class="info-value">${rsStudent.course?.name || '-'}</span></div>
          <div class="info-item"><span class="info-label">Year:</span><span class="info-value">Year ${rsStudent.year} (${getAcademicLevel(rsStudent.year)})</span></div>
          <div class="info-item"><span class="info-label">Semester:</span><span class="info-value">Semester ${rsSemester}</span></div>
          <div class="info-item"><span class="info-label">GPA Scale:</span><span class="info-value">${getGpaScaleLabel(rsStudent.year)}</span></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Code</th><th>Subject</th><th>Credits</th><th>Marks</th><th>Grade</th><th>Points</th></tr></thead>
          <tbody>
            ${rsResults.map((r: any, idx: number) => {
              const sub = subjects.find(s => s.id === r.subjectId)
              return `<tr><td>${idx + 1}</td><td>${r.subject?.code || '-'}</td><td>${r.subject?.name || '-'}</td><td class="text-center">${sub?.credits || 1}</td><td class="text-center"><strong>${r.marks}</strong></td><td class="text-center"><span class="badge ${r.marks >= 40 ? 'badge-pass' : 'badge-fail'}">${r.grade}</span></td><td class="text-center">${r.points}</td></tr>`
            }).join('')}
            <tr style="background:#f0f4f8;font-weight:bold;"><td colspan="3">Semester GPA</td><td class="text-center">${rsTotalCredits}</td><td colspan="2" class="text-center">GPA</td><td class="text-center">${rsSemesterGPA}</td></tr>
          </tbody>
        </table>
        <div class="summary" style="margin-top:15px;">
          <div class="summary-box"><div class="label">Subjects Taken</div><div class="value">${rsResults.length}</div></div>
          <div class="summary-box"><div class="label">Total Credits</div><div class="value">${rsTotalCredits}</div></div>
          <div class="summary-box"><div class="label">Semester GPA</div><div class="value">${rsSemesterGPA}</div></div>
          <div class="summary-box"><div class="label">Passed</div><div class="value">${rsResults.filter(r => r.marks >= 40).length}</div></div>
        </div>
      `
      printContent(html, `Result Statement - ${rsStudent.regNumber} - Sem ${rsSemester}`)
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                <FileText className="w-7 h-7 text-[#0a1628]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Result Statement</h1>
                <p className="text-blue-200">View and print semester result statements for students</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Select Student</Label>
                  <Select value={rsStudentId} onValueChange={setRsStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.regNumber} — {getStudentFullName(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Semester</Label>
                  <Select value={rsSemester} onValueChange={setRsSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result Statement Content */}
          {rsStudentId && rsSemester && rsStudent && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#0a1628]">
                    Result Statement — Semester {rsSemester}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {getStudentFullName(rsStudent)} ({rsStudent.regNumber}) — {rsStudent.course?.name || '-'}
                  </p>
                </div>
                <Button
                  onClick={handlePrintResultStatement}
                  variant="outline"
                  className="gap-2"
                  disabled={rsResults.length === 0}
                >
                  <Printer className="w-4 h-4" />
                  Print Statement
                </Button>
              </div>

              {/* Student Info */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Year</p>
                      <p className="font-medium text-[#0a1628]">Year {rsStudent.year} ({getAcademicLevel(rsStudent.year)})</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Semester</p>
                      <p className="font-medium text-[#0a1628]">Semester {rsSemester}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">GPA Scale</p>
                      <p className="font-medium text-[#0a1628]">{getGpaScaleLabel(rsStudent.year)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Semester GPA</p>
                      <p className="font-bold text-[#d4a853] text-lg">{rsSemesterGPA}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {rsResults.length > 0 ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-center">Credits</TableHead>
                          <TableHead className="text-center">Marks</TableHead>
                          <TableHead className="text-center">Grade</TableHead>
                          <TableHead className="text-center">Points</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rsResults.map((r, idx) => {
                          const sub = subjects.find(s => s.id === r.subjectId)
                          return (
                            <TableRow key={r.id}>
                              <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{r.subject?.code || '-'}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{r.subject?.name || '-'}</TableCell>
                              <TableCell className="text-center">{sub?.credits || 1}</TableCell>
                              <TableCell className="text-center font-bold text-[#0a1628]">{r.marks}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={getGradeColor(r.grade)}>{r.grade}</Badge>
                              </TableCell>
                              <TableCell className="text-center">{r.points}</TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow className="bg-gray-50 font-bold">
                          <TableCell colSpan={3}>Semester GPA — Credits: {rsTotalCredits}</TableCell>
                          <TableCell colSpan={4} className="text-center text-[#d4a853] text-lg">{rsSemesterGPA}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No results found for this student in the selected semester</p>
                </Card>
              )}
            </motion.div>
          )}

          {(rsStudentId && !rsSemester) && (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Please select a semester to view the result statement</p>
            </Card>
          )}

          {!rsStudentId && (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Select a student and semester to view the result statement</p>
            </Card>
          )}
        </motion.div>
      </div>
    )
  }

  // ---- Student Access Control (Permissions) ----
  if (view === 'permissions') {
    const filteredPermissions = permissions.filter(p => {
      if (permCourseFilter !== 'all' && p.student?.courseId !== permCourseFilter) return false
      return true
    })

    const handleTogglePermission = async (studentId: string, field: 'transcript' | 'resultStatement', value: boolean) => {
      try {
        const res = await fetch('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            [field]: value,
            grantedBy: 'exam-office'
          })
        })
        if (res.ok) {
          const updated = await res.json()
          setPermissions(prev => {
            const idx = prev.findIndex(p => p.studentId === studentId)
            if (idx >= 0) {
              const newPerms = [...prev]
              newPerms[idx] = updated
              return newPerms
            }
            return [...prev, updated]
          })
          toast.success(`Permission ${value ? 'granted' : 'revoked'} successfully`)
        } else {
          toast.error('Failed to update permission')
        }
      } catch {
        toast.error('Failed to update permission')
      }
    }

    const handleBatchAction = async (action: 'grant' | 'revoke') => {
      const studentIds = filteredPermissions.map(p => p.studentId)
      if (studentIds.length === 0) {
        toast.error('No students to update')
        return
      }
      try {
        setPermissionsLoading(true)
        const res = await fetch('/api/permissions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentIds,
            transcript: true,
            resultStatement: true,
            action,
            grantedBy: 'exam-office'
          })
        })
        if (res.ok) {
          setPermissions(prev => prev.map(p => ({
            ...p,
            transcript: action === 'grant',
            resultStatement: action === 'grant'
          })))
          toast.success(`All permissions ${action === 'grant' ? 'granted' : 'revoked'} successfully`)
        } else {
          toast.error(`Failed to ${action} permissions`)
        }
      } catch {
        toast.error(`Failed to ${action} permissions`)
      } finally {
        setPermissionsLoading(false)
      }
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                <Lock className="w-7 h-7 text-[#0a1628]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Student Access Control</h1>
                <p className="text-blue-200">Control which students can view and print their Transcripts and Result Statements</p>
              </div>
            </div>
          </div>

          {/* Filters & Batch Actions */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 mb-1 block">Filter by Course</Label>
                    <Select value={permCourseFilter} onValueChange={setPermCourseFilter}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="All Courses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge className="bg-[#0a1628] text-white mt-5">
                    {filteredPermissions.length} Students
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleBatchAction('grant')}
                    disabled={permissionsLoading || filteredPermissions.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Grant All
                  </Button>
                  <Button
                    onClick={() => handleBatchAction('revoke')}
                    disabled={permissionsLoading || filteredPermissions.length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white gap-2"
                  >
                    <ShieldX className="w-4 h-4" />
                    Revoke All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[70vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Reg No</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-center">Transcript</TableHead>
                      <TableHead className="text-center">Result Statement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissionsLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredPermissions.map((perm, idx) => {
                      const student = perm.student
                      if (!student) return null
                      return (
                        <TableRow key={perm.id || perm.studentId}>
                          <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{getStudentFullName(student)}</TableCell>
                          <TableCell className="font-mono text-xs">{student.regNumber}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{student.course?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Year {student.year}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={perm.transcript || false}
                                onCheckedChange={(checked) => handleTogglePermission(student.id, 'transcript', checked)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={perm.resultStatement || false}
                                onCheckedChange={(checked) => handleTogglePermission(student.id, 'resultStatement', checked)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {!permissionsLoading && filteredPermissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p>No student permissions found</p>
                          <p className="text-sm text-gray-400 mt-1">Permissions will appear here once students are enrolled</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ---- Lock / Unlock Results View ----
  if (view === 'lock-results') {
    const classLocks = existingLocks.filter((l: any) => l.lockType === 'class')
    const individualLocks = existingLocks.filter((l: any) => l.lockType === 'individual')

    const handleCreateLock = async () => {
      if (lockViewTab === 'class') {
        if (!lockCourseId || !lockYear || !lockSemester) {
          toast.error('Please select Course, Year, and Semester')
          return
        }
      } else {
        if (!lockStudentId) {
          toast.error('Please select a student')
          return
        }
      }
      setLockSaving(true)
      try {
        const res = await fetch('/api/result-locks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lockType: lockViewTab,
            courseId: lockViewTab === 'class' ? lockCourseId : undefined,
            year: lockViewTab === 'class' ? lockYear : undefined,
            semester: lockViewTab === 'class' ? lockSemester : undefined,
            studentId: lockViewTab === 'individual' ? lockStudentId : undefined,
            reason: lockReason,
            lockedBy: useAppStore.getState().currentUser?.firstName || 'Exam Officer',
          }),
        })
        if (res.ok) {
          toast.success('Results locked successfully')
          setLockCourseId('')
          setLockYear('')
          setLockSemester('')
          setLockStudentId('')
          setLockStudentSearch('')
          setLockReason('')
          const updatedLocks = await fetch('/api/result-locks')
          if (updatedLocks.ok) setExistingLocks(await updatedLocks.json())
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to lock results')
        }
      } catch {
        toast.error('Failed to lock results')
      } finally {
        setLockSaving(false)
      }
    }

    const handleUnlock = async (lockId: string) => {
      try {
        const res = await fetch(`/api/result-locks?id=${lockId}`, { method: 'DELETE' })
        if (res.ok) {
          toast.success('Results unlocked successfully')
          setExistingLocks(prev => prev.filter((l: any) => l.id !== lockId))
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to unlock')
        }
      } catch {
        toast.error('Failed to unlock results')
      }
    }

    const filteredStudentsForLock = students.filter(s => {
      if (!lockStudentSearch) return true
      const q = lockStudentSearch.toLowerCase()
      const name = `${s.firstName} ${s.middleName || ''} ${s.lastName}`.toLowerCase()
      const regNo = s.regNumber.toLowerCase()
      return name.includes(q) || regNo.includes(q)
    })

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          {/* Header */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                <ShieldX className="w-7 h-7 text-[#0a1628]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Lock / Unlock Results</h1>
                <p className="text-blue-200">Prevent students from viewing or downloading their results</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <Button
              variant={lockViewTab === 'class' ? 'default' : 'outline'}
              onClick={() => setLockViewTab('class')}
              className={lockViewTab === 'class' ? 'bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2' : 'gap-2'}
            >
              <ShieldCheck className="w-4 h-4" />
              Lock by Class (Level/Semester)
            </Button>
            <Button
              variant={lockViewTab === 'individual' ? 'default' : 'outline'}
              onClick={() => setLockViewTab('individual')}
              className={lockViewTab === 'individual' ? 'bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2' : 'gap-2'}
            >
              <Lock className="w-4 h-4" />
              Lock Individual Student
            </Button>
          </div>

          {lockViewTab === 'class' ? (
            <div className="space-y-6">
              {/* Lock by Class Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#0a1628] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#d4a853]" />
                    Lock Results by Class
                  </CardTitle>
                  <CardDescription>Select a course, year, and semester to lock all results for that batch.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">Course</Label>
                      <Select value={lockCourseId} onValueChange={setLockCourseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">Year</Label>
                      <Select value={lockYear} onValueChange={setLockYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Year 1 (NTA Level 4)</SelectItem>
                          <SelectItem value="2">Year 2 (NTA Level 5)</SelectItem>
                          <SelectItem value="3">Year 3 (NTA Level 6)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">Semester</Label>
                      <Select value={lockSemester} onValueChange={setLockSemester}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Semester 1</SelectItem>
                          <SelectItem value="2">Semester 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1 block">Reason (optional)</Label>
                    <Textarea
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                      placeholder="e.g., Results under review by academic committee"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={handleCreateLock}
                    disabled={lockSaving || !lockCourseId || !lockYear || !lockSemester}
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {lockSaving ? 'Locking...' : 'Lock Results'}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Class Locks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#0a1628] flex items-center gap-2">
                    <ShieldX className="w-5 h-5 text-red-500" />
                    Existing Class Locks
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Semester</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Locked By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classLocks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p>No class locks active</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          classLocks.map((lock: any, idx: number) => {
                            const course = courses.find(c => c.id === lock.courseId)
                            return (
                              <TableRow key={lock.id}>
                                <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                                <TableCell className="font-medium">{course?.name || lock.courseId || '-'}</TableCell>
                                <TableCell>{lock.year ? `Year ${lock.year}` : '-'}</TableCell>
                                <TableCell>{lock.semester ? `Semester ${lock.semester}` : '-'}</TableCell>
                                <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">{lock.reason || '-'}</TableCell>
                                <TableCell className="text-sm">{lock.lockedBy || '-'}</TableCell>
                                <TableCell className="text-xs text-gray-500">
                                  {lock.lockedAt ? new Date(lock.lockedAt).toLocaleDateString('en-GB') : '-'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                                    onClick={() => handleUnlock(lock.id)}
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                    Unlock
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lock Individual Student Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#0a1628] flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#d4a853]" />
                    Lock Individual Student Results
                  </CardTitle>
                  <CardDescription>Select a student to lock their results from being viewed.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">Search Student</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={lockStudentSearch}
                          onChange={(e) => setLockStudentSearch(e.target.value)}
                          className="pl-10"
                          placeholder="Search by name or registration number..."
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">Select Student</Label>
                      <Select value={lockStudentId} onValueChange={setLockStudentId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student..." />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredStudentsForLock.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.regNumber} — {getStudentFullName(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label className="text-sm font-medium text-gray-600 mb-1 block">Reason (optional)</Label>
                    <Textarea
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                      placeholder="e.g., Fee balance outstanding, disciplinary issue"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={handleCreateLock}
                    disabled={lockSaving || !lockStudentId}
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {lockSaving ? 'Locking...' : 'Lock Results'}
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Individual Locks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#0a1628] flex items-center gap-2">
                    <ShieldX className="w-5 h-5 text-red-500" />
                    Existing Individual Locks
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Reg No</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Locked By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {individualLocks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p>No individual locks active</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          individualLocks.map((lock: any, idx: number) => {
                            const student = students.find(s => s.id === lock.studentId)
                            return (
                              <TableRow key={lock.id}>
                                <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                                <TableCell className="font-medium">
                                  {student ? getStudentFullName(student) : lock.studentId || '-'}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {student?.regNumber || '-'}
                                </TableCell>
                                <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">{lock.reason || '-'}</TableCell>
                                <TableCell className="text-sm">{lock.lockedBy || '-'}</TableCell>
                                <TableCell className="text-xs text-gray-500">
                                  {lock.lockedAt ? new Date(lock.lockedAt).toLocaleDateString('en-GB') : '-'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                                    onClick={() => handleUnlock(lock.id)}
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                    Unlock
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // ---- Coursework Templates View ----
  if (view === 'coursework-templates') {
    const filteredCwMaterials = cwMaterials.filter((m: any) => {
      if (cwSearchQuery) {
        const q = cwSearchQuery.toLowerCase()
        const title = (m.title || '').toLowerCase()
        const desc = (m.description || '').toLowerCase()
        if (!title.includes(q) && !desc.includes(q)) return false
      }
      if (cwFilterCourse !== 'all') {
        const course = m.subject?.course
        if (!course || course.id !== cwFilterCourse) return false
      }
      return true
    })

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          {/* Header */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                  <ClipboardList className="w-7 h-7 text-[#0a1628]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Coursework Templates from Lecturers</h1>
                  <p className="text-blue-200">IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</p>
                </div>
              </div>
              <Badge className="bg-[#d4a853] text-[#0a1628] font-semibold px-4 py-1.5 text-sm">
                {filteredCwMaterials.length} Materials
              </Badge>
            </div>
          </div>

          {/* Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by title or description..."
                    value={cwSearchQuery}
                    onChange={(e) => setCwSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={cwFilterCourse} onValueChange={setCwFilterCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Materials Table */}
          <Card>
            <CardContent className="p-0">
              {cwLoading ? (
                <div className="p-8 space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredCwMaterials.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium">No Coursework Templates Found</p>
                  <p className="text-sm mt-1">Course materials uploaded by lecturers will appear here.</p>
                </div>
              ) : (
                <div className="max-h-[65vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Lecturer</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCwMaterials.map((material: any, idx: number) => (
                        <TableRow key={material.id}>
                          <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{material.title || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {material.subject?.code || '-'}
                            </Badge>
                            {' '}
                            <span className="text-sm">{material.subject?.name || '-'}</span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {material.subject?.course?.name || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {material.teacher
                              ? `${material.teacher.firstName} ${material.teacher.lastName}`
                              : '-'
                            }
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                            {material.description || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {material.createdAt ? new Date(material.createdAt).toLocaleDateString('en-GB') : '-'}
                          </TableCell>
                          <TableCell>
                            {material.fileData && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                                onClick={() => {
                                  const link = document.createElement('a')
                                  link.href = `data:application/octet-stream;base64,${material.fileData}`
                                  link.download = material.title || 'coursework'
                                  link.click()
                                }}
                              >
                                <FileDown className="w-4 h-4" />
                                Download
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ---- Student Info View ----
  if (view === 'student-info') {
    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'Active': return 'bg-emerald-100 text-emerald-700'
        case 'Inactive': return 'bg-gray-100 text-gray-600'
        case 'Suspended': return 'bg-red-100 text-red-700'
        case 'Graduated': return 'bg-blue-100 text-blue-700'
        default: return 'bg-gray-100 text-gray-600'
      }
    }

    const filteredStudents = students.filter(s => {
      if (siSearchQuery) {
        const q = siSearchQuery.toLowerCase()
        const fullName = `${s.firstName} ${s.middleName || ''} ${s.lastName}`.toLowerCase()
        const regNo = s.regNumber.toLowerCase()
        if (!fullName.includes(q) && !regNo.includes(q)) return false
      }
      if (siFilterCourse !== 'all' && s.courseId !== siFilterCourse) return false
      if (siFilterYear !== 'all' && s.year !== parseInt(siFilterYear)) return false
      if (siFilterStatus !== 'all' && s.status !== siFilterStatus) return false
      return true
    })

    const handleSiEditOpen = async (student: Student) => {
      setSiEditStudent(student)
      setSiNewPassword('')
      setSiConfirmPassword('')
      setSiLoginInfo(null)
      setSiEditForm({
        firstName: student.firstName || '',
        middleName: student.middleName || '',
        lastName: student.lastName || '',
        regNumber: student.regNumber || '',
        email: student.email || '',
        phone: student.phone || '',
        gender: student.gender || '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
        address: student.address || '',
        year: String(student.year || ''),
        semester: String(student.semester || ''),
        status: student.status || 'Active',
      })
      // Fetch student detail including loginInfo
      try {
        const res = await fetch(`/api/students/${student.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.loginInfo) {
            setSiLoginInfo(data.loginInfo)
          }
        }
      } catch {
        // silently fail, login info is optional
      }
    }

    const handleSiEditSave = async () => {
      if (!siEditStudent) return
      // Validate password if entered
      if (siNewPassword && siNewPassword.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      if (siNewPassword && siNewPassword !== siConfirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      setSiEditSaving(true)
      try {
        const res = await fetch(`/api/students/${siEditStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: siEditForm.firstName,
            middleName: siEditForm.middleName,
            lastName: siEditForm.lastName,
            regNumber: siEditForm.regNumber,
            email: siEditForm.email,
            phone: siEditForm.phone,
            gender: siEditForm.gender,
            dateOfBirth: siEditForm.dateOfBirth,
            address: siEditForm.address,
            year: parseInt(siEditForm.year),
            semester: parseInt(siEditForm.semester),
            status: siEditForm.status,
            newPassword: siNewPassword || undefined,
          }),
        })
        if (res.ok) {
          toast.success('Student information updated successfully' + (siNewPassword ? '. Password has been reset.' : ''))
          setSiEditStudent(null)
          setSiEditForm({})
          setSiNewPassword('')
          setSiConfirmPassword('')
          setSiLoginInfo(null)
          fetchInitialData()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to update student')
        }
      } catch {
        toast.error('Failed to update student information')
      } finally {
        setSiEditSaving(false)
      }
    }

    const handleSiResetPassword = async () => {
      if (!siResetStudent) return
      if (siResetPassword.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      if (siResetPassword !== siResetConfirm) {
        toast.error('Passwords do not match')
        return
      }
      setSiResetSaving(true)
      try {
        const res = await fetch('/api/students/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: siResetStudent.id,
            newPassword: siResetPassword,
          }),
        })
        if (res.ok) {
          toast.success('Password reset successfully. Student must change it on next login.')
          setSiResetStudent(null)
          setSiResetPassword('')
          setSiResetConfirm('')
        } else {
          const data = await res.json()
          toast.error(data.error || 'Failed to reset password')
        }
      } catch {
        toast.error('Failed to reset password')
      } finally {
        setSiResetSaving(false)
      }
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          {/* Header */}
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                  <Users className="w-7 h-7 text-[#0a1628]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Student Information</h1>
                  <p className="text-blue-200">IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</p>
                </div>
              </div>
              <Badge className="bg-[#d4a853] text-[#0a1628] font-semibold px-4 py-1.5 text-sm">
                {filteredStudents.length} Students
              </Badge>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or reg number..."
                    value={siSearchQuery}
                    onChange={(e) => setSiSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={siFilterCourse} onValueChange={setSiFilterCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={siFilterYear} onValueChange={setSiFilterYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={siFilterStatus} onValueChange={setSiFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Student List Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[65vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Registration Number</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Year &amp; Semester</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredStudents.map((student, idx) => (
                      <TableRow key={student.id}>
                        <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{student.regNumber}</TableCell>
                        <TableCell className="font-medium">
                          {student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}
                        </TableCell>
                        <TableCell>{student.course?.name || '-'}</TableCell>
                        <TableCell>Year {student.year}, Sem {student.semester}</TableCell>
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(student.status)}>{student.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleSiEditOpen(student)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => {
                                setSiResetStudent(student)
                                setSiResetPassword('')
                                setSiResetConfirm('')
                              }}
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p>No students found matching your filters</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Student Detail/Edit Dialog */}
          <Dialog open={!!siEditStudent} onOpenChange={() => setSiEditStudent(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#0a1628] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#d4a853]" />
                  Student Information — View / Edit
                </DialogTitle>
                <DialogDescription>
                  {siEditStudent ? `${siEditStudent.regNumber} — ${getStudentFullName(siEditStudent)}` : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">First Name</Label>
                  <Input
                    value={siEditForm.firstName || ''}
                    onChange={(e) => setSiEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Middle Name</Label>
                  <Input
                    value={siEditForm.middleName || ''}
                    onChange={(e) => setSiEditForm(prev => ({ ...prev, middleName: e.target.value }))}
                    className="mt-1"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Name</Label>
                  <Input
                    value={siEditForm.lastName || ''}
                    onChange={(e) => setSiEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Registration Number</Label>
                  <Input
                    value={siEditForm.regNumber || ''}
                    onChange={(e) => setSiEditForm(prev => ({ ...prev, regNumber: e.target.value }))}
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <Input
                    type="email"
                    value={siEditForm.email || ''}
                    onChange={(e) => setSiEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <Input
                    value={siEditForm.phone || ''}
                    onChange={(e) => setSiEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Gender</Label>
                  <Select
                    value={siEditForm.gender || ''}
                    onValueChange={(val) => setSiEditForm(prev => ({ ...prev, gender: val }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                  <Input
                    type="date"
                    value={siEditForm.dateOfBirth || ''}
                    onChange={(e) => setSiEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                  <Input
                    value={siEditForm.address || ''}
                    onChange={(e) => setSiEditForm(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                    placeholder="Residential address"
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <Label className="text-sm font-medium text-gray-500">Course</Label>
                  <p className="mt-1 font-medium text-[#0a1628]">{siEditStudent?.course?.name || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <Label className="text-sm font-medium text-gray-500">Enrollment Date</Label>
                  <p className="mt-1 font-medium text-[#0a1628]">{siEditStudent?.enrollmentDate ? new Date(siEditStudent.enrollmentDate).toLocaleDateString('en-GB') : '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Year</Label>
                  <Select
                    value={siEditForm.year || ''}
                    onValueChange={(val) => setSiEditForm(prev => ({ ...prev, year: val }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1 (NTA Level 4)</SelectItem>
                      <SelectItem value="2">Year 2 (NTA Level 5)</SelectItem>
                      <SelectItem value="3">Year 3 (NTA Level 6)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Semester</Label>
                  <Select
                    value={siEditForm.semester || ''}
                    onValueChange={(val) => setSiEditForm(prev => ({ ...prev, semester: val }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Select
                    value={siEditForm.status || 'Active'}
                    onValueChange={(val) => setSiEditForm(prev => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                      <SelectItem value="Graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Login Info Display */}
              {siLoginInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">Login Account</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-600">Username:</span>{' '}
                      <span className="font-mono font-medium text-[#0a1628]">{siLoginInfo.username || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Status:</span>{' '}
                      <Badge className={siLoginInfo.isActive ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-gray-100 text-gray-600 text-xs'}>
                        {siLoginInfo.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-blue-600">Last Login:</span>{' '}
                      <span className="text-[#0a1628]">{siLoginInfo.lastLogin ? new Date(siLoginInfo.lastLogin).toLocaleString('en-GB') : 'Never'}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">Must Change Password:</span>{' '}
                      <Badge className={siLoginInfo.mustChangePassword ? 'bg-amber-100 text-amber-700 text-xs' : 'bg-emerald-100 text-emerald-700 text-xs'}>
                        {siLoginInfo.mustChangePassword ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Change Section */}
              <Separator className="my-4" />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-[#0a1628]">Change Login Password</h3>
                  <span className="text-xs text-gray-400">(optional)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">New Password</Label>
                    <Input
                      type="password"
                      value={siNewPassword}
                      onChange={(e) => setSiNewPassword(e.target.value)}
                      className="mt-1"
                      placeholder="Leave blank to keep current"
                    />
                    {siNewPassword && siNewPassword.length < 6 && (
                      <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Confirm Password</Label>
                    <Input
                      type="password"
                      value={siConfirmPassword}
                      onChange={(e) => setSiConfirmPassword(e.target.value)}
                      className="mt-1"
                      placeholder="Re-enter the new password"
                    />
                    {siConfirmPassword && siNewPassword !== siConfirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                    {siConfirmPassword && siNewPassword === siConfirmPassword && siNewPassword.length >= 6 && (
                      <p className="text-xs text-emerald-500 mt-1">Passwords match</p>
                    )}
                  </div>
                </div>
                {siNewPassword && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-amber-700">
                      <strong>Warning:</strong> The student will be required to change this password on their next login.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setSiEditStudent(null)}>Cancel</Button>
                <Button
                  onClick={handleSiEditSave}
                  disabled={siEditSaving}
                  className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white"
                >
                  {siEditSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={!!siResetStudent} onOpenChange={() => { setSiResetStudent(null); setSiResetPassword(''); setSiResetConfirm('') }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#0a1628] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-500" />
                  Reset Student Password
                </DialogTitle>
                <DialogDescription>
                  {siResetStudent ? (
                    <span>
                      <strong>{getStudentFullName(siResetStudent)}</strong> ({siResetStudent.regNumber})
                    </span>
                  ) : ''}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">New Password</Label>
                  <Input
                    type="password"
                    value={siResetPassword}
                    onChange={(e) => setSiResetPassword(e.target.value)}
                    className="mt-1"
                    placeholder="Minimum 6 characters"
                  />
                  {siResetPassword && siResetPassword.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Confirm Password</Label>
                  <Input
                    type="password"
                    value={siResetConfirm}
                    onChange={(e) => setSiResetConfirm(e.target.value)}
                    className="mt-1"
                    placeholder="Re-enter the new password"
                  />
                  {siResetConfirm && siResetPassword !== siResetConfirm && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {siResetConfirm && siResetPassword === siResetConfirm && siResetPassword.length >= 6 && (
                    <p className="text-xs text-emerald-500 mt-1">Passwords match</p>
                  )}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">
                    <strong>Warning:</strong> The student will be required to change this password on their next login.
                  </p>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => { setSiResetStudent(null); setSiResetPassword(''); setSiResetConfirm('') }}>Cancel</Button>
                <Button
                  onClick={handleSiResetPassword}
                  disabled={siResetSaving || !siResetPassword || !siResetConfirm || siResetPassword.length < 6 || siResetPassword !== siResetConfirm}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {siResetSaving ? 'Resetting...' : 'Reset Password'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    )
  }

  // ---- Profile View ----
  if (view === 'profile') {
    return <ProfileView userId={useAppStore.getState().currentUserId || ''} role="exam" />
  }

  // Fallback
  return (
    <div className="min-h-screen bg-[#f8f9fc] p-6 flex items-center justify-center">
      <Card className="p-8 text-center">
        <ArrowLeft className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Select a view to continue</p>
      </Card>
    </div>
  )
}
