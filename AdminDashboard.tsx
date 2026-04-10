'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  GraduationCap,
  Users,
  BookOpen,
  DollarSign,
  Search,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Activity,
  ChevronRight,
  Clock,
  UserCheck,
  Building2,
  Printer,
  KeyRound,
  ArrowLeftRight,
  ShieldCheck,
  ShieldX,
  Info,
  ScrollText,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore, type Student, type Teacher, type Course, type Subject, type DashboardStats } from '@/store/college-store'
import ProfileView from '@/components/college/ProfileView'
import { printContent } from '@/lib/print-utils'
import { getAcademicLevelBadge } from '@/lib/academic-levels'

interface AdminDashboardProps {
  view: string
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

// ─── Dashboard Overview ───────────────────────────────────────────────
function DashboardView() {
  const { setLoading, addNotification, setDashboardStats, dashboardStats } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setIsLoading(true)
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Failed to fetch dashboard')
        const data: DashboardStats = await res.json()
        setDashboardStats(data)
      } catch {
        addNotification('Failed to load dashboard data', 'error')
      } finally {
        setLoading(false)
        setIsLoading(false)
      }
    }
    fetchDashboard()
  }, [setLoading, addNotification, setDashboardStats])

  if (isLoading || !dashboardStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const stats = dashboardStats
  const studentCounts = stats.studentsByCourse.map((s) => s.count)
  const maxStudentCount = Math.max(...studentCounts, 1)
  const courseColors = ['#0d9488', '#d4a853', '#3b82f6', '#8b5cf6', '#ef4444']

  const handlePrintDashboard = () => {
    const html = `
      <div class="header">
        <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
        <p>Zanzibar, Tanzania — Administration Office</p>
        <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
      </div>
      <div class="summary">
        <div class="summary-box"><div class="label">Total Students</div><div class="value">${stats.totalStudents}</div></div>
        <div class="summary-box"><div class="label">Total Teachers</div><div class="value">${stats.totalTeachers}</div></div>
        <div class="summary-box"><div class="label">Active Courses</div><div class="value">${stats.totalCourses}</div></div>
        <div class="summary-box"><div class="label">Total Revenue</div><div class="value">${formatNumber(Math.round(stats.totalRevenue))} TZS</div></div>
      </div>
      <h2>Students by Course</h2>
      <table>
        <thead><tr><th>Course</th><th class="text-center">Students</th></tr></thead>
        <tbody>
          ${stats.studentsByCourse.map((s: any, i: number) => `<tr><td>${s.courseName}</td><td class="text-center">${studentCounts[i]}</td></tr>`).join('')}
        </tbody>
      </table>
      <h2>Recent Examination Results</h2>
      <table>
        <thead><tr><th>Student</th><th>Subject</th><th class="text-center">Marks</th><th class="text-center">Grade</th><th class="text-right">Date</th></tr></thead>
        <tbody>
          ${stats.recentResults.slice(0, 5).map((r: any) => `<tr><td>${r.student?.firstName || ''} ${r.student?.lastName || ''}</td><td>${r.subject?.name || ''}</td><td class="text-center">${r.marks}</td><td class="text-center"><span class="badge ${r.marks >= 40 ? 'badge-pass' : 'badge-fail'}">${r.grade}</span></td><td class="text-right">${r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—'}</td></tr>`).join('')}
        </tbody>
      </table>
    `
    printContent(html, 'Dashboard Summary - ICHAS')
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0a1628]">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Summary of key institutional metrics</p>
        </div>
        <Button onClick={handlePrintDashboard} variant="outline" className="gap-2">
          <Printer className="size-4" />
          Print Report
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<GraduationCap className="size-6 text-teal-500" />}
          value={formatNumber(stats.totalStudents)}
          label="Total Students"
          borderColor="border-l-teal-500"
          bgColor="bg-teal-500/10"
        />
        <StatCard
          icon={<Users className="size-6 text-emerald-500" />}
          value={formatNumber(stats.totalTeachers)}
          label="Total Teachers"
          borderColor="border-l-emerald-500"
          bgColor="bg-emerald-500/10"
        />
        <StatCard
          icon={<BookOpen className="size-6 text-amber-500" />}
          value={formatNumber(stats.totalCourses)}
          label="Active Courses"
          borderColor="border-l-amber-500"
          bgColor="bg-amber-500/10"
        />
        <StatCard
          icon={<DollarSign className="size-6 text-blue-500" />}
          value={`${formatNumber(Math.round(stats.totalRevenue))} TZS`}
          label="Total Revenue"
          borderColor="border-l-blue-500"
          bgColor="bg-blue-500/10"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Course - Bar Chart */}
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-[#d4a853]" />
              Students by Course
            </CardTitle>
            <CardDescription>Distribution of enrolled students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.studentsByCourse.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No enrollment data available</p>
            ) : (
              stats.studentsByCourse.map((item, idx) => {
                const count = studentCounts[idx]
                return (
                <div key={item.courseId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate mr-2">{item.courseName}</span>
                    <span className="text-muted-foreground shrink-0">{count}</span>
                  </div>
                  <div className="w-full h-7 bg-gray-100 rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-700 ease-out flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max((count / maxStudentCount) * 100, 8)}%`,
                        backgroundColor: courseColors[idx % courseColors.length],
                      }}
                    >
                      {count > 5 && (
                        <span className="text-white text-xs font-semibold">{count}</span>
                      )}
                    </div>
                  </div>
                </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-[#d4a853]" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest examination results</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentResults.slice(0, 5).map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium text-sm">
                        {result.student?.firstName} {result.student?.lastName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.subject?.name}
                      </TableCell>
                      <TableCell className="text-center font-semibold">{result.marks}</TableCell>
                      <TableCell className="text-center">
                        <GradeBadge grade={result.grade} />
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {result.createdAt
                          ? new Date(result.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  borderColor,
  bgColor,
}: {
  icon: React.ReactNode
  value: string
  label: string
  borderColor: string
  bgColor: string
}) {
  return (
    <Card className={`py-0 border-l-4 ${borderColor}`}>
      <CardContent className="flex items-center gap-4 pt-0">
        <div className={`flex items-center justify-center size-12 rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function GradeBadge({ grade }: { grade: string }) {
  const colorMap: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'B+': 'bg-teal-100 text-teal-700 border-teal-200',
    B: 'bg-blue-100 text-blue-700 border-blue-200',
    'B-': 'bg-blue-100 text-blue-700 border-blue-200',
    C: 'bg-amber-100 text-amber-700 border-amber-200',
    'C-': 'bg-amber-100 text-amber-700 border-amber-200',
    D: 'bg-orange-100 text-orange-700 border-orange-200',
    F: 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <Badge variant="outline" className={colorMap[grade] || ''}>
      {grade}
    </Badge>
  )
}

// ─── Students Management ──────────────────────────────────────────────
function StudentsView() {
  const { setLoading, addNotification, students, setStudents, courses, setCourses } = useAppStore()
  const [localLoading, setLocalLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterSemester, setFilterSemester] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [form, setForm] = useState({
    regNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    courseId: '',
    year: 1,
    semester: 1,
    intake: 'March',
    email: '',
    phone: '',
    dateOfBirth: '',
  })

  const fetchStudents = useCallback(async () => {
    setLocalLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterCourse) params.set('courseId', filterCourse)
      if (filterYear) params.set('year', filterYear)
      if (filterSemester) params.set('semester', filterSemester)
      const res = await fetch(`/api/students?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: Student[] = await res.json()
      setStudents(data)
    } catch {
      addNotification('Failed to load students', 'error')
    } finally {
      setLocalLoading(false)
    }
  }, [search, filterCourse, filterYear, filterSemester, setStudents, addNotification])

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses')
      if (!res.ok) throw new Error('Failed')
      const data: Course[] = await res.json()
      setCourses(data)
    } catch {
      // silent
    }
  }, [setCourses])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleOpenAdd = async () => {
    setEditingStudent(null)
    const defaultCourseId = courses[0]?.id || ''
    const defaultIntake = 'March'
    setForm({
      regNumber: '',
      firstName: '',
      middleName: '',
      lastName: '',
      gender: 'Male',
      courseId: defaultCourseId,
      year: 1,
      semester: 1,
      intake: defaultIntake,
      email: '',
      phone: '',
      dateOfBirth: '',
    })
    setDialogOpen(true)
    // Auto-generate reg number if a course is already selected
    if (defaultCourseId) {
      try {
        const res = await fetch(`/api/students/generate-reg?courseId=${defaultCourseId}&intake=${defaultIntake}`)
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setForm({
          regNumber: data.regNumber,
          firstName: '',
          middleName: '',
          lastName: '',
          gender: 'Male',
          courseId: defaultCourseId,
          year: 1,
          semester: 1,
          intake: defaultIntake,
          email: '',
          phone: '',
          dateOfBirth: '',
        })
      } catch {
        toast.error('Failed to auto-generate registration number')
      }
    }
  }

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student)
    setForm({
      regNumber: student.regNumber,
      firstName: student.firstName,
      middleName: student.middleName || '',
      lastName: student.lastName,
      gender: student.gender,
      courseId: student.courseId,
      year: student.year,
      semester: student.semester,
      intake: student.intake || 'March',
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.regNumber || !form.firstName || !form.lastName || !form.courseId) {
      addNotification('Please fill in all required fields', 'error')
      return
    }
    setLoading(true)
    try {
      if (editingStudent) {
        const res = await fetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Failed to update')
        addNotification('Student updated successfully', 'success')
      } else {
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create')
        }
        addNotification('Student registered successfully! Now visible in all system interfaces.', 'success')
      }
      setDialogOpen(false)
      fetchStudents()
    } catch (err: any) {
      addNotification(err.message || 'Operation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      addNotification('Student deleted successfully', 'success')
      fetchStudents()
    } catch {
      addNotification('Failed to delete student', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, reg number..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-[160px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Course</Label>
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[100px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Year</Label>
          <Select value={filterYear} onValueChange={(v) => setFilterYear(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[1, 2, 3].map((y) => (
                <SelectItem key={y} value={String(y)}>Year {y} (NTA Level {y + 3})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[110px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Semester</Label>
          <Select value={filterSemester} onValueChange={(v) => setFilterSemester(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="1">Semester 1</SelectItem>
              <SelectItem value="2">Semester 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => {
          const html = `
            <div class="header">
              <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
              <p>Zanzibar, Tanzania — Administration Office</p>
              <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
            </div>
            <h2>Student List Report</h2>
            <table>
              <thead><tr><th>Reg No</th><th>Name</th><th>Course</th><th class="text-center">Year</th><th class="text-center">Gender</th><th class="text-center">Status</th></tr></thead>
              <tbody>
                ${students.map((s: any) => `<tr><td>${s.regNumber}</td><td>${s.firstName} ${s.lastName}</td><td>${s.course?.name || '—'}</td><td class="text-center">${s.year}</td><td class="text-center">${s.gender}</td><td class="text-center"><span class="badge ${s.status === 'Active' ? 'badge-pass' : 'badge-fail'}">${s.status}</span></td></tr>`).join('')}
              </tbody>
            </table>
            <div class="footer">Total: ${students.length} students</div>
          `
          printContent(html, 'Student List - ICHAS')
        }} variant="outline" className="gap-2">
          <Printer className="size-4" />
          Print
        </Button>
        <Button onClick={handleOpenAdd} className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white">
          <Plus className="size-4" />
          Register Student
        </Button>
      </div>

      {/* Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {localLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="size-12 mx-auto mb-3 opacity-30" />
                <p>No students found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                    <TableHead>Reg No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Year</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-teal-50 text-teal-700 border-teal-200">NTA Level</Badge>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Gender</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, idx) => (
                    <TableRow key={student.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                      <TableCell className="font-mono text-sm font-medium">{student.regNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-xs font-bold">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{student.course?.name || '—'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span>Year {student.year}</span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getAcademicLevelBadge(student.year).color}`}>{getAcademicLevelBadge(student.year).label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {student.gender}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-xs ${
                            student.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                          variant="outline"
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenEdit(student)}>
                            <Pencil className="size-3.5 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDelete(student.id)}>
                            <Trash2 className="size-3.5 text-red-500" />
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

      {/* Add/Edit Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Register New Student'}</DialogTitle>
            <DialogDescription>
              {editingStudent ? 'Update student information below.' : 'Register a new student. They will appear in all system interfaces.'}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-sm">Registration Number *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="e.g., NS0001/0009/2025"
                  value={form.regNumber}
                  onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
                  readOnly={!editingStudent}
                  className={!editingStudent ? 'bg-gray-50 text-gray-600' : ''}
                />
                {!editingStudent && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 whitespace-nowrap border-[#d4a853]/50 text-[#d4a853] hover:bg-[#d4a853]/10"
                    onClick={async () => {
                      if (!form.courseId) {
                        toast.warning('Select a course first to generate a registration number')
                        return
                      }
                      try {
                        const res = await fetch(`/api/students/generate-reg?courseId=${form.courseId}&intake=${form.intake}`)
                        if (!res.ok) throw new Error('Failed')
                        const data = await res.json()
                        setForm((prev) => ({ ...prev, regNumber: data.regNumber }))
                        toast.success('Registration number generated successfully')
                      } catch {
                        toast.error('Failed to generate registration number')
                      }
                    }}
                  >
                    <Sparkles className="size-3.5" />
                    Auto Generate
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm">First Name *</Label>
              <Input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Middle Name</Label>
              <Input
                placeholder="Middle name (optional)"
                value={form.middleName}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Last Name *</Label>
              <Input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Date of Birth</Label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Course *</Label>
              <Select value={form.courseId} onValueChange={async (v) => {
                setForm({ ...form, courseId: v, regNumber: '' })
                // Auto-generate registration number when course is selected
                try {
                  const res = await fetch(`/api/students/generate-reg?courseId=${v}&intake=${form.intake}`)
                  if (!res.ok) throw new Error('Failed')
                  const data = await res.json()
                  setForm((prev) => ({ ...prev, courseId: v, regNumber: data.regNumber }))
                } catch {
                  toast.error('Failed to auto-generate registration number')
                }
              }}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Year</Label>
              <Select value={String(form.year)} onValueChange={(v) => setForm({ ...form, year: parseInt(v) })}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3].map((y) => (
                    <SelectItem key={y} value={String(y)}>Year {y} (NTA Level {y + 3})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Semester</Label>
              <Select value={String(form.semester)} onValueChange={(v) => setForm({ ...form, semester: parseInt(v) })}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Intake</Label>
              <Select value={form.intake} onValueChange={(v) => setForm({ ...form, intake: v })}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="March">March Intake</SelectItem>
                  <SelectItem value="September">September Intake</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input
                type="email"
                placeholder="student@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Phone</Label>
              <Input
                placeholder="+255 700 000 000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white">
              {editingStudent ? 'Update Student' : 'Register Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Teachers Management ──────────────────────────────────────────────
function TeachersView() {
  const { setLoading, addNotification, teachers, setTeachers } = useAppStore()
  const [localLoading, setLocalLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [form, setForm] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    gender: 'Male',
    department: '',
    qualification: '',
    specialization: '',
    email: '',
    phone: '',
  })

  const fetchTeachers = useCallback(async () => {
    setLocalLoading(true)
    try {
      const res = await fetch('/api/teachers')
      if (!res.ok) throw new Error('Failed to fetch')
      const data: Teacher[] = await res.json()
      setTeachers(data)
    } catch {
      addNotification('Failed to load teachers', 'error')
    } finally {
      setLocalLoading(false)
    }
  }, [setTeachers, addNotification])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const handleOpenAdd = () => {
    setEditingTeacher(null)
    setForm({
      employeeId: '',
      firstName: '',
      lastName: '',
      gender: 'Male',
      department: '',
      qualification: '',
      specialization: '',
      email: '',
      phone: '',
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (teacher: any) => {
    setEditingTeacher(teacher)
    setForm({
      employeeId: teacher.employeeId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      gender: teacher.gender,
      department: teacher.department,
      qualification: teacher.qualification || '',
      specialization: teacher.specialization || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.employeeId || !form.firstName || !form.lastName || !form.department) {
      addNotification('Please fill in all required fields', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create')
      }
      addNotification('Teacher added successfully', 'success')
      setDialogOpen(false)
      fetchTeachers()
    } catch (err: any) {
      addNotification(err.message || 'Operation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const departments = ['NMT', 'PST', 'CDT', 'Basic Sciences', 'General Education']

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Faculty Members</h3>
          <p className="text-sm text-muted-foreground">{teachers.length} teachers registered</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            const html = `
              <div class="header">
                <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                <p>Zanzibar, Tanzania — Administration Office</p>
                <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
              </div>
              <h2>Faculty Members Report</h2>
              <table>
                <thead><tr><th>Emp ID</th><th>Name</th><th>Department</th><th>Qualification</th><th class="text-center">Status</th></tr></thead>
                <tbody>
                  ${teachers.map((t: any) => `<tr><td>${t.employeeId}</td><td>${t.firstName} ${t.lastName}</td><td>${t.department}</td><td>${t.qualification || '—'}</td><td class="text-center"><span class="badge ${t.status === 'Active' ? 'badge-pass' : 'badge-fail'}">${t.status}</span></td></tr>`).join('')}
                </tbody>
              </table>
              <div class="footer">Total: ${teachers.length} teachers</div>
            `
            printContent(html, 'Teacher List - ICHAS')
          }} variant="outline" className="gap-2">
            <Printer className="size-4" />
            Print
          </Button>
          <Button onClick={handleOpenAdd} className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white">
            <Plus className="size-4" />
            Add Teacher
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {localLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserCheck className="size-12 mx-auto mb-3 opacity-30" />
                <p>No teachers found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                    <TableHead>Emp ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher, idx) => (
                    <TableRow key={teacher.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                      <TableCell className="font-mono text-sm font-medium">{teacher.employeeId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-[#d4a853]/20 text-[#d4a853] flex items-center justify-center text-xs font-bold">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{teacher.firstName} {teacher.lastName}</p>
                            <p className="text-xs text-muted-foreground">{teacher.specialization || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{teacher.department}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{teacher.qualification || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={`text-xs ${
                            teacher.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                          variant="outline"
                        >
                          {teacher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenEdit(teacher)}>
                          <Pencil className="size-3.5 text-blue-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Teacher Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
            <DialogDescription>
              {editingTeacher ? 'Update teacher information below.' : 'Fill in the details to add a new teacher.'}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-sm">Employee ID *</Label>
              <Input
                placeholder="e.g., EMP001"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">First Name *</Label>
              <Input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Last Name *</Label>
              <Input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Department *</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Qualification</Label>
              <Input
                placeholder="e.g., MSc, PhD"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Specialization</Label>
              <Input
                placeholder="Area of specialization"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input
                type="email"
                placeholder="teacher@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Phone</Label>
              <Input
                placeholder="+255 700 000 000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white">
              {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Courses View ─────────────────────────────────────────────────────
function CoursesView() {
  const { addNotification, courses, setCourses } = useAppStore()
  const [loading, setLoadingLocal] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingLocal(true)
      try {
        const res = await fetch('/api/courses')
        if (!res.ok) throw new Error('Failed')
        const data: Course[] = await res.json()
        setCourses(data)
      } catch {
        addNotification('Failed to load courses', 'error')
      } finally {
        setLoadingLocal(false)
      }
    }
    fetchCourses()
  }, [setCourses, addNotification])

  const courseColors: Record<string, string> = {
    'BSc-NUR': 'border-l-teal-500',
    'BSc-PHA': 'border-l-amber-500',
    'BSc-PH': 'border-l-blue-500',
  }

  const courseIcons: Record<string, React.ReactNode> = {
    'BSc-NUR': <GraduationCap className="size-6 text-teal-500" />,
    'BSc-PHA': <Building2 className="size-6 text-amber-500" />,
    'BSc-PH': <Activity className="size-6 text-blue-500" />,
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Academic Programs</h3>
          <p className="text-sm text-muted-foreground">{courses.length} courses available</p>
        </div>
        <Button onClick={() => {
          const html = `
            <div class="header">
              <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
              <p>Zanzibar, Tanzania — Administration Office</p>
              <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB')}</p>
            </div>
            <h2>Academic Programs</h2>
            <table>
              <thead><tr><th>Code</th><th>Course Name</th><th>Duration</th><th class="text-center">Students Enrolled</th><th class="text-center">Status</th></tr></thead>
              <tbody>
                ${courses.map((c: any) => `<tr><td>${c.code}</td><td>${c.name}</td><td>${c.duration}</td><td class="text-center">${c.studentCount || c._count?.students || 0}</td><td class="text-center">Active</td></tr>`).join('')}
              </tbody>
            </table>
            <div class="footer">Total: ${courses.length} programs</div>
          `
          printContent(html, 'Courses - ICHAS')
        }} variant="outline" className="gap-2">
          <Printer className="size-4" />
          Print
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className={`py-0 border-l-4 ${courseColors[course.code] || 'border-l-[#d4a853]'}`}>
            <CardHeader>
              <CardAction className="flex items-center gap-3">
                {courseIcons[course.code] || <BookOpen className="size-6 text-[#d4a853]" />}
              </CardAction>
              <div>
                <CardTitle className="text-base">{course.name}</CardTitle>
                <CardDescription className="mt-1">{course.code} &bull; {course.duration}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {course.description || 'A comprehensive program designed to prepare students for professional excellence.'}
              </p>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span><span className="font-semibold text-foreground">{course.studentCount || course._count?.students || 0}</span> Students Enrolled</span>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Subjects View ────────────────────────────────────────────────────
function SubjectsView() {
  const { addNotification, subjects, setSubjects, courses, setCourses } = useAppStore()
  const [loading, setLoadingLocal] = useState(true)
  const [filterCourse, setFilterCourse] = useState('')

  const fetchSubjects = useCallback(async () => {
    setLoadingLocal(true)
    try {
      const params = new URLSearchParams()
      if (filterCourse) params.set('courseId', filterCourse)
      const res = await fetch(`/api/subjects?${params.toString()}`)
      if (!res.ok) throw new Error('Failed')
      const data: Subject[] = await res.json()
      setSubjects(data)
    } catch {
      addNotification('Failed to load subjects', 'error')
    } finally {
      setLoadingLocal(false)
    }
  }, [filterCourse, setSubjects, addNotification])

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/courses')
      if (!res.ok) throw new Error('Failed')
      const data: Course[] = await res.json()
      setCourses(data)
    } catch {
      // silent
    }
  }, [setCourses])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Subjects</h3>
          <p className="text-sm text-muted-foreground">{subjects.length} subjects listed</p>
        </div>
        <div className="w-[200px]">
          <Select value={filterCourse} onValueChange={(v) => setFilterCourse(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="size-12 mx-auto mb-3 opacity-30" />
                <p>No subjects found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead className="text-center">Year</TableHead>
                    <TableHead className="text-center">Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject, idx) => (
                    <TableRow key={subject.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                      <TableCell className="font-mono text-sm font-medium">{subject.code}</TableCell>
                      <TableCell className="text-sm">{subject.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{subject.course?.name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {subject.teacher
                          ? `${subject.teacher.firstName} ${subject.teacher.lastName}`
                          : <span className="text-xs italic">Not assigned</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-[#d4a853]/10 text-[#d4a853] border-[#d4a853]/20">
                          {subject.credits}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{subject.year}</TableCell>
                      <TableCell className="text-center">Sem {subject.semester}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Staff Management ─────────────────────────────────────────────────
interface StaffUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  role: string
  department: string | null
  status: string
  employeeId?: string | null
  qualification?: string | null
  mustChangePassword?: boolean
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
}

const roleBadgeColors: Record<string, string> = {
  Lecturer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Exam Officer': 'bg-blue-100 text-blue-700 border-blue-200',
  'Finance Officer': 'bg-rose-100 text-rose-700 border-rose-200',
  Admin: 'bg-amber-100 text-amber-700 border-amber-200',
}

const staffDepartments = ['NMT', 'PST', 'CDT', 'Basic Sciences', 'General Education']

function StaffManagementView() {
  const { setLoading, addNotification } = useAppStore()
  const [localLoading, setLocalLoading] = useState(true)
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingStaff, setDeletingStaff] = useState<StaffUser | null>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Lecturer',
    department: '',
    employeeId: '',
    qualification: '',
    password: 'ichas2025',
  })

  const fetchStaff = useCallback(async () => {
    setLocalLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterRole) params.set('role', filterRole)
      const res = await fetch(`/api/users?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: StaffUser[] = await res.json()
      setStaffList(data)
    } catch {
      addNotification('Failed to load staff', 'error')
    } finally {
      setLocalLoading(false)
    }
  }, [filterRole, addNotification])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const filteredStaff = staffList.filter((s) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    )
  })

  const handleOpenAdd = () => {
    setEditingStaff(null)
    // Auto-generate employee ID for lecturers
    const lecturerCount = staffList.filter((s) => s.role === 'Lecturer').length
    const autoEmpId = 'TCH' + String(lecturerCount + 1).padStart(3, '0')
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Lecturer',
      department: '',
      employeeId: autoEmpId,
      qualification: '',
      password: 'ichas2025',
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (staff: StaffUser) => {
    setEditingStaff(staff)
    setForm({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      department: staff.department || '',
      employeeId: staff.employeeId || '',
      qualification: staff.qualification || '',
      password: 'ichas2025',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      addNotification('Please fill in all required fields', 'error')
      return
    }
    setLoading(true)
    try {
      const body: Record<string, string> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        department: form.department,
        password: form.password,
      }
      if (form.role === 'Lecturer') {
        body.employeeId = form.employeeId
        body.qualification = form.qualification
      }
      if (editingStaff) {
        const res = await fetch(`/api/users/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to update')
        toast.success('Staff member updated successfully')
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create')
        }
        toast.success('Staff member added successfully')
      }
      setDialogOpen(false)
      fetchStaff()
    } catch (err: any) {
      toast.error(err.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingStaff) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${deletingStaff.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success(`${deletingStaff.firstName} ${deletingStaff.lastName} has been removed`)
      setDeleteDialogOpen(false)
      setDeletingStaff(null)
      fetchStaff()
    } catch {
      toast.error('Failed to delete staff member')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (staff: StaffUser) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'ichas2025', mustChangePassword: true }),
      })
      if (!res.ok) throw new Error('Failed to reset')
      toast.success(`Password reset to ichas2025 for ${staff.firstName} ${staff.lastName}`)
    } catch {
      toast.error('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div {...fadeIn} className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0a1628]">Staff Management</h2>
          <p className="text-sm text-muted-foreground">Manage system users and staff accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1 bg-[#d4a853]/10 text-[#d4a853] border-[#d4a853]/30">
            {filteredStaff.length} Staff
          </Badge>
          <Button onClick={handleOpenAdd} className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-white gap-2">
            <Plus className="size-4" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="py-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-[170px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Role</Label>
              <Select value={filterRole} onValueChange={(v) => setFilterRole(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Lecturer">Lecturer</SelectItem>
                  <SelectItem value="Exam Officer">Exam Officer</SelectItem>
                  <SelectItem value="Finance Officer">Finance Officer</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {localLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="size-12 mx-auto mb-3 opacity-30" />
                <p>No staff members found</p>
                <p className="text-xs mt-1">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Username / Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff, idx) => (
                    <TableRow key={staff.id} className="hover:bg-blue-50/30 transition-colors">
                      <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-xs font-bold">
                            {staff.firstName[0]}{staff.lastName[0]}
                          </div>
                          <span className="font-medium text-sm">{staff.firstName} {staff.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{staff.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${roleBadgeColors[staff.role] || ''}`}>
                          {staff.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{staff.department || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            staff.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {staff.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenEdit(staff)} title="Edit">
                            <Pencil className="size-3.5 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => handleResetPassword(staff)} title="Reset Password">
                            <KeyRound className="size-3.5 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => { setDeletingStaff(staff); setDeleteDialogOpen(true) }}
                            title="Delete"
                          >
                            <Trash2 className="size-3.5 text-red-500" />
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

      {/* Add/Edit Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update staff information below.' : 'Create a new staff account with default credentials.'}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">First Name *</Label>
              <Input
                placeholder="First name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Last Name *</Label>
              <Input
                placeholder="Last name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-sm">Email (Username) *</Label>
              <Input
                type="email"
                placeholder="email@ichas.ac.tz"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-sm">Phone</Label>
              <Input
                placeholder="+255 700 000 000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Role *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lecturer">Lecturer</SelectItem>
                  <SelectItem value="Exam Officer">Exam Officer</SelectItem>
                  <SelectItem value="Finance Officer">Finance Officer</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'Lecturer' && (
              <div>
                <Label className="text-sm">Department *</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffDepartments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.role === 'Lecturer' && (
              <div>
                <Label className="text-sm">Employee ID</Label>
                <Input
                  placeholder="e.g., TCH001"
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="mt-1"
                />
              </div>
            )}
            {form.role === 'Lecturer' && (
              <div>
                <Label className="text-sm">Qualification</Label>
                <Input
                  placeholder="e.g., MSc, PhD"
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  className="mt-1"
                />
              </div>
            )}
            <div className="col-span-2">
              <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2.5 text-sm text-blue-700">
                <Info className="size-4 shrink-0" />
                <span>Default password: <strong>ichas2025</strong>. User will be prompted to change on first login.</span>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-white">
              {editingStaff ? 'Update Staff' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingStaff?.firstName} {deletingStaff?.lastName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-600/90 text-white">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

// ─── Semester Transfer ────────────────────────────────────────────────
function SemesterTransferView() {
  const { setLoading, addNotification } = useAppStore()
  const [localLoading, setLocalLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [toYear, setToYear] = useState('1')
  const [toSemester, setToSemester] = useState('1')
  const [reason, setReason] = useState('')
  const [transfers, setTransfers] = useState<any[]>([])

  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  const fetchData = useCallback(async () => {
    setLocalLoading(true)
    try {
      const [studentRes, transferRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/semester-transfer'),
      ])
      if (studentRes.ok) {
        const studentData = await studentRes.json()
        setStudents(studentData)
      }
      if (transferRes.ok) {
        const transferData = await transferRes.json()
        setTransfers(Array.isArray(transferData) ? transferData : [])
      }
    } catch {
      // silent
    } finally {
      setLocalLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTransfer = async () => {
    if (!selectedStudentId || !reason) {
      addNotification('Please select a student and provide a reason', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/semester-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          toYear: parseInt(toYear),
          toSemester: parseInt(toSemester),
          reason,
          approvedBy: 'admin',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Transfer failed')
      }
      toast.success('Student transferred successfully')
      setReason('')
      setSelectedStudentId('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0a1628]">Semester Transfer</h2>
        <p className="text-sm text-muted-foreground">Transfer students between academic years and semesters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transfer Form */}
        <Card className="py-0">
          <CardHeader className="bg-gradient-to-r from-[#0a1628] to-[#0a1628]/80 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowLeftRight className="size-4 text-[#d4a853]" />
              Transfer Student
            </CardTitle>
            <CardDescription className="text-gray-300">Select a student and specify the new placement</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {localLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium">Select Student</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue placeholder="Choose a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.regNumber} — {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStudent && (
                  <div className="rounded-lg bg-[#0a1628]/5 border border-[#0a1628]/10 p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-[#0a1628]">Current Placement</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Course:</span> <span className="font-medium">{selectedStudent.course?.name || '—'}</span></div>
                      <div><span className="text-muted-foreground">Year:</span> <span className="font-medium">Year {selectedStudent.year}</span></div>
                      <div><span className="text-muted-foreground">Semester:</span> <span className="font-medium">Semester {selectedStudent.semester}</span></div>
                      <div><span className="text-muted-foreground">NTA Level:</span> <span className="font-medium">{getAcademicLevelBadge(selectedStudent.year).label}</span></div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-semibold text-[#0a1628] flex items-center gap-2">
                    <ChevronRight className="size-4 text-[#d4a853]" />
                    Transfer To
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">New Year</Label>
                      <Select value={toYear} onValueChange={setToYear}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3].map((y) => (
                            <SelectItem key={y} value={String(y)}>Year {y} (NTA Level {y + 3})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">New Semester</Label>
                      <Select value={toSemester} onValueChange={setToSemester}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Semester 1</SelectItem>
                          <SelectItem value="2">Semester 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Reason</Label>
                  <Textarea
                    placeholder="Enter the reason for this transfer..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1.5 min-h-[80px]"
                  />
                </div>

                <Button
                  onClick={handleTransfer}
                  disabled={!selectedStudentId || !reason}
                  className="w-full bg-[#d4a853] hover:bg-[#d4a853]/90 text-white gap-2"
                >
                  <ArrowLeftRight className="size-4" />
                  Transfer Student
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transfer History */}
        <Card className="py-0">
          <CardHeader className="bg-gradient-to-r from-[#0a1628] to-[#0a1628]/80 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-[#d4a853]" />
              Transfer History
            </CardTitle>
            <CardDescription className="text-gray-300">Recent semester transfer records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {transfers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowLeftRight className="size-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No transfer records yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                      <TableHead>#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((t: any, idx: number) => (
                      <TableRow key={t.id || idx} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                        <TableCell className="text-sm font-medium">{t.studentName || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">Y{t.fromYear} S{t.fromSemester}</TableCell>
                        <TableCell className="text-sm font-medium">Y{t.toYear} S{t.toSemester}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">{t.reason || '—'}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

// ─── Transcript Templates ───────────────────────────────────────────────
function TranscriptTemplatesView() {
  const { addNotification } = useAppStore()
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewStudentsDialog, setViewStudentsDialog] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [batchStudents, setBatchStudents] = useState<any[]>([])
  const [form, setForm] = useState({
    title: '',
    courseId: '',
    year: '',
    semester: '',
    academicYear: '',
  })
  const [creating, setCreating] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [batchesRes, coursesRes] = await Promise.all([
          fetch('/api/transcripts'),
          fetch('/api/courses'),
        ])
        if (batchesRes.ok) setBatches(await batchesRes.json())
        if (coursesRes.ok) setCourses(await coursesRes.json())
      } catch {
        addNotification('Failed to load transcript templates', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          courseId: form.courseId || undefined,
          year: form.year ? parseInt(form.year) : undefined,
          semester: form.semester ? parseInt(form.semester) : undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      const data = await res.json()
      addNotification(`Transcript batch created with ${data.studentCount} students`, 'success')
      setDialogOpen(false)
      setForm({ title: '', courseId: '', year: '', semester: '', academicYear: '' })
      setBatches(prev => [data, ...prev])
    } catch (err: any) {
      addNotification(err.message || 'Failed to create template', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleViewStudents = async (batch: any) => {
    setSelectedBatch(batch)
    setViewStudentsDialog(true)
    try {
      const where: any = { status: 'Active' }
      if (batch.courseId) where.courseId = batch.courseId
      if (batch.year) where.year = batch.year
      if (batch.semester) where.semester = batch.semester
      const params = new URLSearchParams()
      Object.entries(where).forEach(([k, v]) => params.set(k, String(v)))
      const res = await fetch(`/api/students?${params.toString()}`)
      if (res.ok) setBatchStudents(await res.json())
    } catch {
      addNotification('Failed to load students', 'error')
    }
  }

  const statusBadge: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    generated: 'bg-blue-100 text-blue-700 border-blue-200',
    published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#d4a853] flex items-center justify-center">
              <ScrollText className="w-6 h-6 text-[#0a1628]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Transcript Templates</h1>
              <p className="text-blue-200 text-sm">Create and manage transcript batches for students</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setForm({ title: '', courseId: '', year: '', semester: '', academicYear: '' })
              setDialogOpen(true)
            }}
            className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold"
          >
            <Plus className="size-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Batches Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {batches.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ScrollText className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No transcript templates created yet</p>
                <p className="text-sm text-muted-foreground mt-1">Click &quot;Create Template&quot; to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Year</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch: any, idx: number) => (
                    <TableRow key={batch.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{batch.title}</TableCell>
                      <TableCell className="text-sm">{batch.course?.name || 'All Courses'}</TableCell>
                      <TableCell className="text-center">{batch.year || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-semibold">{batch.studentCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={statusBadge[batch.status] || statusBadge.draft}>{batch.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleViewStudents(batch)}
                        >
                          <Users className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#d4a853]" />
              Create Transcript Template
            </DialogTitle>
            <DialogDescription>Generate a transcript batch for students matching selected criteria.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">Title *</Label>
              <Input
                placeholder="e.g., March 2024 PST Transcripts"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Course</Label>
                <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Year</Label>
                <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1">Year 1</SelectItem>
                    <SelectItem value="2">Year 2</SelectItem>
                    <SelectItem value="3">Year 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Semester</Label>
                <Select value={form.semester} onValueChange={(v) => setForm({ ...form, semester: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Academic Year</Label>
                <Input
                  placeholder="e.g., 2024/2025"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.title} className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white">
              {creating ? 'Creating...' : 'Create Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog open={viewStudentsDialog} onOpenChange={setViewStudentsDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBatch?.title || 'Students'}</DialogTitle>
            <DialogDescription>
              {selectedBatch?.course?.name ? `${selectedBatch.course.name} • Year ${selectedBatch.year || 'All'} • ${selectedBatch.studentCount} students` : `${selectedBatch?.studentCount || 0} students matched`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Reg No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-center">Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No students matched the criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  batchStudents.map((s: any, idx: number) => (
                    <TableRow key={s.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{s.regNumber}</TableCell>
                      <TableCell className="font-medium text-sm">{s.firstName} {s.lastName}</TableCell>
                      <TableCell className="text-sm">{s.course?.name || '—'}</TableCell>
                      <TableCell className="text-center">{s.year || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStudentsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Password Recovery ─────────────────────────────────────────────
function PasswordRecoveryView() {
  const { setLoading, addNotification } = useAppStore()
  const [localLoading, setLocalLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [showAllPasswords, setShowAllPasswords] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [changePasswordDialog, setChangePasswordDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const passwordRoleColors: Record<string, string> = {
    Student: 'bg-teal-100 text-teal-700 border-teal-200',
    Teacher: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Admin: 'bg-amber-100 text-amber-700 border-amber-200',
    Admission: 'bg-blue-100 text-blue-700 border-blue-200',
    Exam: 'bg-purple-100 text-purple-700 border-purple-200',
    Finance: 'bg-rose-100 text-rose-700 border-rose-200',
    Alumni: 'bg-violet-100 text-violet-700 border-violet-200',
    Lecturer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Exam Officer': 'bg-purple-100 text-purple-700 border-purple-200',
    'Finance Officer': 'bg-rose-100 text-rose-700 border-rose-200',
  }

  const roleOptions = ['All', 'Student', 'Teacher', 'Admin', 'Admission', 'Exam', 'Finance', 'Alumni']

  const fetchUsers = useCallback(async () => {
    setLocalLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterRole) params.set('role', filterRole)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/all-passwords?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : data.users || [])
    } catch {
      addNotification('Failed to load users', 'error')
    } finally {
      setLocalLoading(false)
    }
  }, [filterRole, search, addNotification])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const toggleShowAll = () => {
    if (showAllPasswords) {
      setVisiblePasswords(new Set())
    } else {
      setVisiblePasswords(new Set(users.map((u) => u.id)))
    }
    setShowAllPasswords(!showAllPasswords)
  }

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, newPassword }),
      })
      if (!res.ok) throw new Error('Failed to change password')
      toast.success(`Password changed for ${selectedUser.firstName} ${selectedUser.lastName}`)
      setChangePasswordDialog(false)
      setSelectedUser(null)
      setNewPassword('')
      fetchUsers()
    } catch {
      toast.error('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const openChangePassword = (user: any) => {
    setSelectedUser(user)
    setNewPassword('')
    setChangePasswordDialog(true)
  }

  const isPasswordVisible = (userId: string) => visiblePasswords.has(userId)

  return (
    <motion.div {...fadeIn} className="space-y-4">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
        <ShieldCheck className="size-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Password Security Notice</p>
          <p className="text-xs text-amber-700 mt-0.5">
            This section displays user passwords for recovery assistance. Access is restricted to administrators only.
            Always verify the user identity before sharing password information. All password changes are logged.
          </p>
        </div>
      </div>

      {/* Header with search, filter, and show all toggle */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, username, or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-[160px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Role</Label>
          <Select value={filterRole} onValueChange={(v) => setFilterRole(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((r) => (
                <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={showAllPasswords ? 'default' : 'outline'}
          className={showAllPasswords ? 'bg-[#d4a853] hover:bg-[#d4a853]/90 text-white gap-2' : 'gap-2'}
          onClick={toggleShowAll}
        >
          {showAllPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {showAllPasswords ? 'Hide All Passwords' : 'Show All Passwords'}
        </Button>
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0a1628]/5">
          <Users className="size-4 text-[#d4a853]" />
          <span className="text-sm font-semibold text-[#0a1628]">{users.length}</span>
          <span className="text-xs text-muted-foreground">users</span>
        </div>
      </div>

      {/* Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {localLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <KeyRound className="size-12 mx-auto mb-3 opacity-30" />
                <p>No users found</p>
                <p className="text-xs mt-1">Try adjusting your search or role filter</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, idx) => {
                    const visible = isPasswordVisible(user.id)
                    const roleColor = passwordRoleColors[user.role] || 'bg-gray-100 text-gray-700 border-gray-200'
                    return (
                      <TableRow key={user.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                        <TableCell className="text-sm text-muted-foreground font-mono">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-xs font-bold">
                              {(user.firstName || 'U')[0]}{(user.lastName || '')[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                              {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{user.username || user.email || '—'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-xs ${roleColor}`}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-sm ${visible ? 'text-[#0a1628]' : 'text-muted-foreground'}`}>
                              {visible ? (user.plainPassword || '••••••') : '••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => togglePasswordVisibility(user.id)}
                            >
                              {visible ? <EyeOff className="size-3.5 text-muted-foreground" /> : <Eye className="size-3.5 text-[#d4a853]" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              user.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            {user.status || 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => openChangePassword(user)}
                          >
                            <KeyRound className="size-3" />
                            Change Password
                          </Button>
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

      {/* Change Password Dialog */}
      <Dialog open={changePasswordDialog} onOpenChange={setChangePasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Password</DialogTitle>
            <DialogDescription>
              Set a new password for <span className="font-semibold">{selectedUser?.firstName} {selectedUser?.lastName}</span>
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4">
            <div className="p-3 rounded-md bg-gray-50 space-y-1">
              <p className="text-xs text-muted-foreground">User Information</p>
              <p className="text-sm font-medium">{selectedUser?.firstName} {selectedUser?.lastName}</p>
              <p className="text-xs text-muted-foreground">{selectedUser?.username || selectedUser?.email}</p>
              <Badge variant="outline" className={`text-xs ${passwordRoleColors[selectedUser?.role || ''] || ''}`}>
                {selectedUser?.role}
              </Badge>
            </div>
            <div>
              <Label className="text-sm">New Password</Label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type={visiblePasswords.has('new-password-field') ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="pl-9 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 size-9"
                  onClick={() => togglePasswordVisibility('new-password-field')}
                >
                  {visiblePasswords.has('new-password-field') ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Minimum 4 characters. User will be prompted to change on next login.</p>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setChangePasswordDialog(false)}>Cancel</Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || newPassword.length < 4}
              className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white"
            >
              {changingPassword ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────
export default function AdminDashboard({ view }: AdminDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1628]">
              Administration Dashboard
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Building2 className="size-3.5" />
              Imperial College of Health and Allied Sciences
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* View Content */}
        {view === 'dashboard' && <DashboardView />}
        {view === 'students' && <StudentsView />}
        {view === 'teachers' && <TeachersView />}
        {view === 'courses' && <CoursesView />}
        {view === 'subjects' && <SubjectsView />}
        {view === 'staff' && <StaffManagementView />}
        {view?.includes('password-recovery') && <PasswordRecoveryView />}
        {view === 'semester-transfer' && <SemesterTransferView />}
        {view === 'transcripts' && <TranscriptTemplatesView />}
        {view === 'profile' && <ProfileView userId={useAppStore.getState().currentUserId || ''} role="admin" />}
      </div>
    </div>
  )
}
