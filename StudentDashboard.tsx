'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Award,
  CreditCard,
  User,
  BookOpen,
  FileText,
  Receipt,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogOut,
  Building2,
  Mail,
  Phone,
  Calendar,
  Hash,
  TrendingUp,
  Shield,
  Download,
  Printer,
  Lock,
  ShieldCheck,
  HelpCircle,
  ClipboardList,
  Bell,
  Timer,
  Send,
  Info,
  ArrowLeft,
  Check,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore, type Student, type ExamResult, type FeePayment, type FeeStructure } from '@/store/college-store'
import { toast } from 'sonner'
import { printContent } from '@/lib/print-utils'
import { getAcademicLevel, getAcademicLevelBadge, getGpaScaleLabel, getIntakeLabel } from '@/lib/academic-levels'
import ProfileView from './ProfileView'
import { AvatarImage } from '@/components/ui/avatar'

interface StudentDashboardProps {
  view: string
  studentId: string | null
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

function getGradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'B+': 'bg-teal-100 text-teal-700 border-teal-200',
    B: 'bg-blue-100 text-blue-700 border-blue-200',
    'B-': 'bg-blue-100 text-blue-700 border-blue-200',
    C: 'bg-amber-100 text-amber-700 border-amber-200',
    'C-': 'bg-amber-100 text-amber-700 border-amber-200',
    D: 'bg-orange-100 text-orange-700 border-orange-200',
    F: 'bg-red-100 text-red-700 border-red-200',
  }
  return map[grade] || ''
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
}

// ─── Student Dashboard Overview ───────────────────────────────────────
function StudentDashboardView({
  student,
  results,
  payments,
}: {
  student: Student
  results: ExamResult[]
  payments: FeePayment[]
}) {
  const currentUser = useAppStore((s) => s.currentUser)
  const profilePhoto = currentUser?.user?.profilePhoto

  // Calculate GPA
  const gpa =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.points * (r.subject?.credits || 3), 0) /
        results.reduce((sum, r) => sum + (r.subject?.credits || 3), 0)
      : 0

  const passed = results.filter((r) => r.grade !== 'F').length
  const failed = results.filter((r) => r.grade === 'F').length

  const totalPaid = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0)
  const pendingPayments = payments.filter((p) => p.status === 'Pending').length
  const feeStatus = pendingPayments === 0 ? 'Paid' : 'Pending'

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Welcome */}
      <motion.div {...fadeUp}>
        <div className="flex items-center gap-4">
          <Avatar className="size-14 border-2 border-[#d4a853]/30 shadow-sm">
            {profilePhoto ? (
              <AvatarImage src={profilePhoto} alt={student.firstName} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-[#0a1628] to-[#162040] text-white text-lg font-bold">
              {student.firstName[0]}{student.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-[#0a1628]">
              Welcome back, {student.firstName}! 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {student.course?.name || 'Your Course'} &bull; {getAcademicLevel(student.year)} &bull; Semester {student.semester}{student.intake ? ' \u2022 ' + student.intake + ' Intake' : ''}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div {...fadeUp}>
          <Card className="py-0 border-l-4 border-l-teal-500">
            <CardContent className="flex items-center gap-4 pt-0">
              <div className="flex items-center justify-center size-12 rounded-lg bg-teal-500/10">
                <TrendingUp className="size-6 text-teal-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{gpa.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Current GPA</p>
                <p className="text-xs text-muted-foreground">{getGpaScaleLabel(student.year)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fadeUp}>
          <Card className="py-0 border-l-4 border-l-blue-500">
            <CardContent className="flex items-center gap-4 pt-0">
              <div className="flex items-center justify-center size-12 rounded-lg bg-blue-500/10">
                <BookOpen className="size-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{results.length}</p>
                <p className="text-sm text-muted-foreground">Subjects Taken</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fadeUp}>
          <Card className="py-0 border-l-4 border-l-amber-500">
            <CardContent className="flex items-center gap-4 pt-0">
              <div className="flex items-center justify-center size-12 rounded-lg bg-amber-500/10">
                <CreditCard className="size-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(Math.round(totalPaid))} TZS</p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div {...fadeUp}>
        <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="py-0 cursor-pointer hover:shadow-md transition-shadow group" onClick={() => useAppStore.getState().setCurrentView('results')}>
            <CardContent className="flex items-center gap-4 pt-0">
              <div className="flex items-center justify-center size-10 rounded-lg bg-[#0a1628] text-white">
                <FileText className="size-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-[#0a1628]">My Results</p>
                <p className="text-xs text-muted-foreground">{passed} passed, {failed} failed</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#0a1628]" />
            </CardContent>
          </Card>
          <Card className="py-0 cursor-pointer hover:shadow-md transition-shadow group" onClick={() => useAppStore.getState().setCurrentView('fees')}>
            <CardContent className="flex items-center gap-4 pt-0">
              <div className="flex items-center justify-center size-10 rounded-lg bg-[#d4a853]/20">
                <Receipt className="size-5 text-[#d4a853]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm group-hover:text-[#0a1628]">Fee Status</p>
                <p className="text-xs text-muted-foreground">{feeStatus === 'Paid' ? 'All fees paid' : `${pendingPayments} pending`}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground group-hover:text-[#0a1628]" />
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Performance Summary */}
      {results.length > 0 && (
        <motion.div {...fadeUp}>
          <Card className="py-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="size-4 text-[#d4a853]" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{passed}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{gpa.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">GPA</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#0a1628]">{results.length}</p>
                  <p className="text-xs text-muted-foreground">Total Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Results View ─────────────────────────────────────────────────────
function ResultsView({
  student,
  results,
  permissions,
}: {
  student: Student
  results: ExamResult[]
  permissions: { transcript: boolean; resultStatement: boolean } | null
}) {
  const [filterYear, setFilterYear] = useState('')
  const [filterSemester, setFilterSemester] = useState('')

  const filtered = results.filter((r) => {
    if (filterYear && r.year !== parseInt(filterYear)) return false
    if (filterSemester && r.semester !== parseInt(filterSemester)) return false
    return true
  })

  const totalCredits = filtered.reduce((s, r) => s + (r.subject?.credits || 3), 0)
  const weightedSum = filtered.reduce((s, r) => s + r.points * (r.subject?.credits || 3), 0)
  const gpa = totalCredits > 0 ? weightedSum / totalCredits : 0
  const passed = filtered.filter((r) => r.grade !== 'F').length
  const failed = filtered.filter((r) => r.grade === 'F').length

  const years = [...new Set(results.map((r) => r.year))].sort()
  const semesters = [1, 2]

  const handleDownloadExamTicket = () => {
    if (!student || results.length === 0) return
    const currentSemester = results[0]?.semester || 1
    const currentYear = results[0]?.year || 1

    const html = `
      <div class="header">
        <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
          <img src="/images/college-logo.png" style="height:50px;width:auto;" />
        </div>
        <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
        <p>Zanzibar, Tanzania</p>
        <p class="sub">EXAMINATION TICKET &mdash; ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Student Name:</span><span class="info-value">${student.firstName} ${student.lastName}</span></div>
        <div class="info-item"><span class="info-label">Reg Number:</span><span class="info-value">${student.regNumber}</span></div>
        <div class="info-item"><span class="info-label">Course:</span><span class="info-value">${student.course?.name || ''}</span></div>
        <div class="info-item"><span class="info-label">Year / Semester:</span><span class="info-value">Year ${student.year} / Semester ${student.semester}</span></div>
        <div class="info-item"><span class="info-label">Academic Year:</span><span class="info-value">${currentYear}/${currentYear + 1}</span></div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:15px 0;">
        <div style="font-size:11px;color:#888;margin-bottom:8px;">INSTRUCTIONS TO CANDIDATE</div>
        <ul style="font-size:12px;color:#444;padding-left:20px;line-height:1.8;">
          <li>Report to the examination hall at least 30 minutes before the exam starts</li>
          <li>Bring your student ID card and this examination ticket</li>
          <li>No electronic devices, calculators, or unauthorized materials allowed</li>
          <li>Write clearly and legibly in all answer booklets</li>
        </ul>
      </div>
      <h2 style="margin:15px 0 10px;font-size:15px;color:#0a1628;">Examination Schedule</h2>
      <table>
        <thead><tr><th>Subject Code</th><th>Subject Name</th><th>Exam Type</th><th>Venue</th><th>Date</th></tr></thead>
        <tbody>
          ${filtered.map((r) => `
            <tr>
              <td>${r.subject?.code || ''}</td>
              <td>${r.subject?.name || ''}</td>
              <td>${r.examType || 'Final'}</td>
              <td>Main Hall</td>
              <td>See Schedule</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top:20px;padding-top:10px;border-top:2px dashed #0a1628;text-align:center;">
        <p style="font-size:11px;color:#666;">Student Signature: ___________________</p>
        <p style="font-size:11px;color:#666;margin-top:10px;">Examiner Signature: ___________________</p>
      </div>
      <div class="footer">
        <p>This is a computer-generated document from ICHAS Management System</p>
        <p>Imperial College of Health and Allied Sciences, Zanzibar, Tanzania</p>
      </div>
    `
    printContent(html, `Exam_Ticket_${student.regNumber}`)
  }

  const handlePrintResults = () => {
    if (!student || filtered.length === 0) return
    const totalCredits = filtered.reduce((s, r) => s + (r.subject?.credits || 3), 0)
    const weightedSum = filtered.reduce((s, r) => s + r.points * (r.subject?.credits || 3), 0)
    const gpa = totalCredits > 0 ? weightedSum / totalCredits : 0
    const passed = filtered.filter((r) => r.grade !== 'F').length
    const failed = filtered.filter((r) => r.grade === 'F').length

    const html = `
      <div class="header">
        <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
          <img src="/images/college-logo.png" style="height:50px;width:auto;" />
        </div>
        <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
        <p>Zanzibar, Tanzania</p>
        <p class="sub">ACADEMIC RESULTS &mdash; ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Student Name:</span><span class="info-value">${student.firstName} ${student.lastName}</span></div>
        <div class="info-item"><span class="info-label">Reg Number:</span><span class="info-value">${student.regNumber}</span></div>
        <div class="info-item"><span class="info-label">Course:</span><span class="info-value">${student.course?.name || ''}</span></div>
        <div class="info-item"><span class="info-label">Year / Semester:</span><span class="info-value">Year ${student.year} / Semester ${student.semester}</span></div>
      </div>
      <h2 style="margin:15px 0 10px;font-size:15px;color:#0a1628;">Examination Results</h2>
      <table>
        <thead><tr><th>Code</th><th>Subject Name</th><th style="text-align:center">Marks</th><th style="text-align:center">Grade</th><th style="text-align:center">Points</th><th style="text-align:center">Credits</th><th style="text-align:center">Remarks</th></tr></thead>
        <tbody>
          ${filtered.map((r) => `
            <tr>
              <td>${r.subject?.code || ''}</td>
              <td>${r.subject?.name || ''}</td>
              <td style="text-align:center;font-weight:700">${r.marks}</td>
              <td style="text-align:center"><span class="badge ${r.grade === 'F' ? 'badge-fail' : 'badge-pass'}">${r.grade}</span></td>
              <td style="text-align:center">${r.points}</td>
              <td style="text-align:center">${r.subject?.credits || 3}</td>
              <td style="text-align:center">${r.grade === 'F' ? 'Fail' : 'Pass'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="summary">
        <div class="summary-box">
          <div class="label">GPA</div>
          <div class="value">${gpa.toFixed(2)}</div>
        </div>
        <div class="summary-box">
          <div class="label">Total Credits</div>
          <div class="value">${totalCredits}</div>
        </div>
        <div class="summary-box">
          <div class="label">Passed</div>
          <div class="value" style="color:#059669">${passed}</div>
        </div>
        <div class="summary-box">
          <div class="label">Failed</div>
          <div class="value" style="color:#dc2626">${failed}</div>
        </div>
        <div class="summary-box">
          <div class="label">Subjects</div>
          <div class="value">${filtered.length}</div>
        </div>
      </div>
      <div class="footer">
        <p>This is a computer-generated document from ICHAS Management System</p>
        <p>Imperial College of Health and Allied Sciences, Zanzibar, Tanzania</p>
      </div>
    `
    printContent(html, `Results_${student.regNumber}`)
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div {...fadeUp} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0a1628] flex items-center gap-2">
            <FileText className="size-5 text-[#d4a853]" />
            My Examination Results
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {student.firstName} {student.lastName} &bull; {student.regNumber}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#0a1628]/20 hover:bg-[#0a1628]/5"
            onClick={handleDownloadExamTicket}
            disabled={results.length === 0}
          >
            <Download className="size-4" />
            Download Exam Ticket
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-[#0a1628]/20 hover:bg-[#0a1628]/5"
                    onClick={handlePrintResults}
                    disabled={filtered.length === 0}
                  >
                    <Printer className="size-4" />
                    Print Results
                    {permissions && !permissions.resultStatement && (
                      <Lock className="size-3 text-red-500" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {permissions && !permissions.resultStatement && (
                <TooltipContent>
                  <p className="text-red-600 font-medium">Access Restricted</p>
                  <p className="text-xs text-muted-foreground">The Examination Officer has not yet granted permission to print results.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-[#d4a853]/30 hover:bg-[#d4a853]/10 text-[#d4a853]"
                    disabled={!permissions?.transcript}
                    onClick={() => {
                      const allResults = results
                      if (!student || allResults.length === 0) return
                      const yearsSet = [...new Set(allResults.map(r => r.year))].sort()
                      let transcriptHtml = `
                        <div class="header">
                          <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
                            <img src="/images/college-logo.png" style="height:50px;width:auto;" />
                          </div>
                          <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                          <p>Zanzibar, Tanzania</p>
                          <p class="sub">OFFICIAL ACADEMIC TRANSCRIPT &mdash; ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div class="info-grid">
                          <div class="info-item"><span class="info-label">Student Name:</span><span class="info-value">${student.firstName} ${student.middleName || ''} ${student.lastName}</span></div>
                          <div class="info-item"><span class="info-label">Reg Number:</span><span class="info-value">${student.regNumber}</span></div>
                          <div class="info-item"><span class="info-label">Programme:</span><span class="info-value">${student.course?.name || ''}</span></div>
                          <div class="info-item"><span class="info-label">Intake:</span><span class="info-value">${student.intake || ''} Intake</span></div>
                          <div class="info-item"><span class="info-label">Current Level:</span><span class="info-value">${getAcademicLevel(student.year)}</span></div>
                          <div class="info-item"><span class="info-label">GPA Scale:</span><span class="info-value">${getGpaScaleLabel(student.year)}</span></div>
                        </div>
                      `
                      let totalCreditsAll = 0
                      let totalWeightedAll = 0
                      for (const yr of yearsSet) {
                        const yearResults = allResults.filter(r => r.year === yr)
                        const sems = [...new Set(yearResults.map(r => r.semester))].sort()
                        transcriptHtml += `<h2 style="margin:20px 0 10px;font-size:15px;color:#0a1628;border-bottom:2px solid #d4a853;padding-bottom:5px;">YEAR ${yr} &mdash; ${getAcademicLevel(yr)}</h2>`
                        for (const sem of sems) {
                          const semResults = yearResults.filter(r => r.semester === sem)
                          const semCredits = semResults.reduce((s, r) => s + (r.subject?.credits || 3), 0)
                          const semWeighted = semResults.reduce((s, r) => s + r.points * (r.subject?.credits || 3), 0)
                          const semGpa = semCredits > 0 ? semWeighted / semCredits : 0
                          transcriptHtml += `<h3 style="margin:12px 0 6px;font-size:13px;color:#333;">Semester ${sem}</h3>`
                          transcriptHtml += `<table><thead><tr><th>Code</th><th>Subject</th><th style="text-align:center">Credits</th><th style="text-align:center">Marks</th><th style="text-align:center">Grade</th><th style="text-align:center">Points</th><th style="text-align:center">Remarks</th></tr></thead><tbody>`
                          for (const r of semResults) {
                            transcriptHtml += `<tr><td>${r.subject?.code || ''}</td><td>${r.subject?.name || ''}</td><td style="text-align:center">${r.subject?.credits || 3}</td><td style="text-align:center;font-weight:700">${r.marks}</td><td style="text-align:center"><span class="badge ${r.grade === 'F' ? 'badge-fail' : 'badge-pass'}">${r.grade}</span></td><td style="text-align:center">${r.points}</td><td style="text-align:center">${r.grade === 'F' ? 'Fail' : 'Pass'}</td></tr>`
                          }
                          transcriptHtml += `</tbody></table>`
                          transcriptHtml += `<p style="text-align:right;font-size:12px;color:#555;margin-top:4px;"><strong>Semester GPA: ${semGpa.toFixed(2)}</strong> | Credits: ${semCredits}</p>`
                          totalCreditsAll += semCredits
                          totalWeightedAll += semWeighted
                        }
                      }
                      const cumGpa = totalCreditsAll > 0 ? totalWeightedAll / totalCreditsAll : 0
                      transcriptHtml += `
                        <div class="summary" style="margin-top:20px;">
                          <div class="summary-box"><div class="label">Cumulative GPA</div><div class="value">${cumGpa.toFixed(2)}</div></div>
                          <div class="summary-box"><div class="label">Total Credits</div><div class="value">${totalCreditsAll}</div></div>
                          <div class="summary-box"><div class="label">Levels Completed</div><div class="value">${yearsSet.length}</div></div>
                          <div class="summary-box"><div class="label">GPA Scale</div><div class="value" style="font-size:14px">${getGpaScaleLabel(student.year)}</div></div>
                        </div>
                        <div class="footer">
                          <p>This is an official transcript from ICHAS Management System</p>
                          <p>Imperial College of Health and Allied Sciences, Zanzibar, Tanzania</p>
                        </div>
                      `
                      printContent(transcriptHtml, `Transcript_${student.regNumber}`)
                    }}
                  >
                    <ShieldCheck className="size-4" />
                    Transcript
                    {!permissions?.transcript && (
                      <Lock className="size-3 text-red-500" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {permissions && !permissions.transcript && (
                <TooltipContent>
                  <p className="text-red-600 font-medium">Transcript Access Restricted</p>
                  <p className="text-xs text-muted-foreground">The Examination Officer has not yet granted permission to view/print transcript.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp} className="flex items-center gap-3 flex-wrap">
        <Select value={filterYear} onValueChange={(v) => setFilterYear(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Academic Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSemester} onValueChange={(v) => setFilterSemester(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map((s) => (
              <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* Results Table */}
      <motion.div {...fadeUp}>
        <Card className="py-0" id="results-table-card">
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="size-12 mx-auto mb-3 opacity-30" />
                  <p>No results found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0a1628] text-white hover:bg-[#0a1628]">
                      <TableHead className="text-white/90">Code</TableHead>
                      <TableHead className="text-white/90">Subject Name</TableHead>
                      <TableHead className="text-white/90 text-center">Marks</TableHead>
                      <TableHead className="text-white/90 text-center">Grade</TableHead>
                      <TableHead className="text-white/90 text-center">Points</TableHead>
                      <TableHead className="text-white/90 text-center">Credits</TableHead>
                      <TableHead className="text-white/90 text-center">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((result, idx) => (
                      <TableRow key={result.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                        <TableCell className="font-mono text-sm font-medium">{result.subject?.code}</TableCell>
                        <TableCell className="text-sm">{result.subject?.name}</TableCell>
                        <TableCell className="text-center font-bold">{result.marks}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={getGradeColor(result.grade)}>
                            {result.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{result.points}</TableCell>
                        <TableCell className="text-center">{result.subject?.credits || 3}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-medium ${result.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {result.remarks || (result.grade === 'F' ? 'Fail' : 'Pass')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary */}
      {filtered.length > 0 && (
        <motion.div {...fadeUp}>
          <Card className="py-0 border-2 border-[#0a1628]/10">
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">GPA</p>
                <p className="text-2xl font-bold text-[#0a1628] mt-1">{gpa.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Credits</p>
                <p className="text-2xl font-bold text-[#0a1628] mt-1">{totalCredits}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Passed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{passed}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Failed</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{failed}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Subjects</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{filtered.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Fee Status View ──────────────────────────────────────────────────
function FeeStatusView({
  student,
  payments,
  feeStructures,
}: {
  student: Student
  payments: FeePayment[]
  feeStructures: FeeStructure[]
}) {
  const studentFees = feeStructures.filter((fs) => fs.courseId === student.courseId)
  const totalRequired = studentFees.reduce((s, fs) => s + fs.amount, 0)
  const totalPaid = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0)
  const outstanding = Math.max(totalRequired - totalPaid, 0)
  const paymentPercent = totalRequired > 0 ? Math.min((totalPaid / totalRequired) * 100, 100) : 0

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div {...fadeUp}>
        <h2 className="text-xl font-bold text-[#0a1628] flex items-center gap-2">
          <Receipt className="size-5 text-[#d4a853]" />
          Fee Status
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Payment history and outstanding balance
        </p>
      </motion.div>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div {...fadeUp}>
          <Card className="py-0 border-l-4 border-l-blue-500">
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Total Required</p>
              <p className="text-2xl font-bold text-[#0a1628] mt-1">
                {formatNumber(Math.round(totalRequired))} <span className="text-sm font-normal text-muted-foreground">TZS</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fadeUp}>
          <Card className="py-0 border-l-4 border-l-emerald-500">
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatNumber(Math.round(totalPaid))} <span className="text-sm font-normal text-muted-foreground">TZS</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div {...fadeUp}>
          <Card className={`py-0 border-l-4 ${outstanding > 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className={`text-2xl font-bold mt-1 ${outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {formatNumber(Math.round(outstanding))} <span className="text-sm font-normal text-muted-foreground">TZS</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <motion.div {...fadeUp}>
        <Card className="py-0">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Progress</span>
              <span className="text-sm font-bold text-[#0a1628]">{paymentPercent.toFixed(1)}%</span>
            </div>
            <div className="relative">
              <Progress
                value={paymentPercent}
                className="h-4"
              />
              <div
                className="absolute top-0 left-0 h-4 rounded-full transition-all duration-500"
                style={{
                  width: `${paymentPercent}%`,
                  background: paymentPercent >= 100
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : paymentPercent >= 50
                    ? 'linear-gradient(90deg, #f59e0b, #d4a853)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-emerald-500" />
                Paid: {formatNumber(Math.round(totalPaid))} TZS
              </span>
              {outstanding > 0 && (
                <span className="flex items-center gap-1">
                  <div className="size-2 rounded-full bg-red-500" />
                  Outstanding: {formatNumber(Math.round(outstanding))} TZS
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payments Table */}
      <motion.div {...fadeUp}>
        <Card className="py-0">
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
            <CardDescription>All recorded payments</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {payments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="size-12 mx-auto mb-3 opacity-30" />
                  <p>No payment records found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment, idx) => (
                      <TableRow key={payment.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                        <TableCell className="font-mono text-sm">
                          {payment.receiptNumber || '—'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatNumber(Math.round(payment.amount))} TZS
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.paidDate
                            ? new Date(payment.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-sm">{payment.method}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{payment.paymentType}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              payment.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : payment.status === 'Partial'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                            }`}
                          >
                            {payment.status === 'Paid' && <CheckCircle2 className="size-3 mr-1" />}
                            {payment.status === 'Pending' && <AlertCircle className="size-3 mr-1" />}
                            {payment.status === 'Partial' && <AlertCircle className="size-3 mr-1" />}
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ─── Course Materials View ─────────────────────────────────────────────
function CourseMaterialsView({ student }: { student: Student }) {
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoadingLocal] = useState(true)
  const [filterSubject, setFilterSubject] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoadingLocal(true)
      try {
        const res = await fetch('/api/materials')
        if (res.ok) {
          const data = await res.json()
          // Filter: show materials matching student's year/semester, OR matching student's course, OR general (no target)
          const filtered = data.filter((m: any) => {
            const matchYearSem = m.targetYear === student.year && m.targetSemester === student.semester
            const matchCourse = m.subject?.course?.id === student.courseId
            const isGeneral = !m.targetYear && !m.targetSemester
            return matchYearSem || matchCourse || isGeneral
          })
          setMaterials(filtered)
        }
      } catch {
        // silent
      } finally {
        setLoadingLocal(false)
      }
    }
    fetchMaterials()
  }, [student.year, student.semester, student.courseId])

  // Get unique subjects from materials for filter
  const subjectOptions = [...new Map(materials.map((m: any) => [m.subjectId, { id: m.subjectId, code: m.subject?.code, name: m.subject?.name }])).values()]

  const filteredMaterials = materials.filter((m: any) => {
    if (filterSubject && m.subjectId !== filterSubject) return false
    return true
  })

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

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF': return '📄'
      case 'DOC': case 'DOCX': return '📝'
      case 'PPT': case 'PPTX': return '📊'
      case 'XLS': case 'XLSX': return '📈'
      case 'TXT': return '📃'
      default: return '📎'
    }
  }

  const handleDownload = async (material: any) => {
    if (!material.fileUrl) return
    setDownloadingId(material.id)
    try {
      // Increment downloads
      fetch(`/api/materials/${material.id}`, { method: 'PATCH' })
      // Open in new tab
      window.open(material.fileUrl, '_blank')
    } catch {
      // silent
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp}>
        <div className="rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-6 text-white mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="size-5 text-[#d4a853]" />
            Course Materials
          </h2>
          <p className="text-blue-200 mt-1 text-sm">
            Your lecturers&apos; notes and documents
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      {subjectOptions.length > 1 && (
        <motion.div {...fadeUp} className="flex items-center gap-3 flex-wrap">
          <Select value={filterSubject} onValueChange={(v) => setFilterSubject(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjectOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredMaterials.length} material{filteredMaterials.length !== 1 ? 's' : ''}
          </span>
        </motion.div>
      )}

      {/* Materials Content */}
      <motion.div {...fadeUp}>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="size-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No course materials available yet</p>
            <p className="text-gray-400 text-sm mt-2">Your lecturers will share notes and documents here</p>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Card className="py-0">
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#0a1628] text-white hover:bg-[#0a1628]">
                          <TableHead className="text-white/90 w-12">#</TableHead>
                          <TableHead className="text-white/90">Title</TableHead>
                          <TableHead className="text-white/90">Subject</TableHead>
                          <TableHead className="text-white/90 w-24">Type</TableHead>
                          <TableHead className="text-white/90 w-36">Uploaded</TableHead>
                          <TableHead className="text-white/90 w-28">Actions</TableHead>
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
                                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[250px]">{m.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{m.subject?.code} — {m.subject?.name}</p>
                              <p className="text-xs text-gray-400">By {m.teacher?.firstName} {m.teacher?.lastName}</p>
                            </TableCell>
                            <TableCell>
                              {m.fileType ? (
                                <Badge variant="outline" className={`text-xs ${getFileTypeColor(m.fileType)}`}>
                                  {getFileTypeIcon(m.fileType)} {m.fileType}
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">Note</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              }) : '—'}
                            </TableCell>
                            <TableCell>
                              {m.fileUrl ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => handleDownload(m)}
                                  disabled={downloadingId === m.id}
                                >
                                  <Download className="size-4" />
                                  {downloadingId === m.id ? 'Opening...' : 'Open'}
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400">No file</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {filteredMaterials.map((m: any, idx: number) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {m.fileType ? (
                              <Badge variant="outline" className={`text-xs ${getFileTypeColor(m.fileType)}`}>
                                {getFileTypeIcon(m.fileType)} {m.fileType}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Note</Badge>
                            )}
                          </div>
                          <p className="font-medium text-sm text-[#0a1628] truncate">{m.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {m.subject?.code} — {m.subject?.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {m.teacher?.firstName} {m.teacher?.lastName} &bull;{' '}
                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short'
                            }) : ''}
                          </p>
                        </div>
                        {m.fileUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleDownload(m)}
                            disabled={downloadingId === m.id}
                          >
                            <Download className="size-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Quizzes View ────────────────────────────────────────────────────
function QuizzesView({ studentId }: { studentId: string }) {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoadingLocal] = useState(true)
  const [activeQuiz, setActiveQuiz] = useState<any>(null)
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeStarted, setTimeStarted] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [timesUp, setTimesUp] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answersRef = useRef(answers)
  answersRef.current = answers

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoadingLocal(true)
      try {
        const res = await fetch(`/api/quizzes?studentId=${studentId}`)
        if (res.ok) {
          const data = await res.json()
          setQuizzes(data.quizzes || [])
        }
      } catch {
        // silent
      } finally {
        setLoadingLocal(false)
      }
    }
    fetchQuizzes()
  }, [studentId])

  // Timer logic with auto-submit
  const timeStartedRef = useRef(timeStarted)
  timeStartedRef.current = timeStarted
  const activeQuizRef = useRef(activeQuiz)
  activeQuizRef.current = activeQuiz

  useEffect(() => {
    if (timeRemaining > 0 && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setTimesUp(true)
            // Auto-submit using refs to avoid stale closures
            const quiz = activeQuizRef.current
            if (quiz) {
              fetch(`/api/quizzes/${quiz.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentId,
                  answers: answersRef.current,
                  timeStarted: timeStartedRef.current,
                }),
              })
                .then((res) => {
                  if (res.ok) return res.json()
                  return null
                })
                .then((data) => {
                  if (data) {
                    setSubmitted(true)
                    setResult(data)
                  }
                })
                .catch(() => {
                  // silent
                })
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timeRemaining, submitted, studentId])

  const handleStartQuiz = async (quiz: any) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`)
      if (res.ok) {
        const data = await res.json()
        const quizData = data.quiz
        // Filter out correctAnswer before displaying
        const filteredQuestions = (quizData.questions || []).map((q: any) => {
          const { correctAnswer, ...rest } = q
          return rest
        })
        setQuizQuestions(filteredQuestions)
        setActiveQuiz(quizData)
        setAnswers({})
        setSubmitted(false)
        setResult(null)
        setTimesUp(false)
        const now = new Date().toISOString()
        setTimeStarted(now)
        setTimeRemaining(quizData.durationMinutes * 60)
      }
    } catch {
      toast.error('Failed to load quiz questions')
    }
  }

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || submitted) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/quizzes/${activeQuiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          answers,
          timeStarted,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSubmitted(true)
        setResult(data)
        if (timerRef.current) clearInterval(timerRef.current)
        toast.success('Quiz submitted successfully!')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to submit quiz')
      }
    } catch {
      toast.error('Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExitQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setActiveQuiz(null)
    setQuizQuestions([])
    setAnswers({})
    setTimeStarted(null)
    setTimeRemaining(0)
    setSubmitted(false)
    setResult(null)
    setTimesUp(false)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const getQuizStatus = (quiz: any) => {
    if (quiz.dueDate && new Date() > new Date(quiz.dueDate)) return 'expired'
    const hasSubmission = quiz.submissions?.some((s: any) => s.studentId === studentId)
    if (hasSubmission) return 'submitted'
    return 'available'
  }

  // Active quiz view
  if (activeQuiz) {
    return (
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
        {/* Timer Bar */}
        <motion.div {...fadeUp}>
          <div className={`rounded-xl p-4 ${timeRemaining < 60 && !submitted ? 'bg-red-50 border-2 border-red-300' : 'bg-gradient-to-r from-[#0a1628] to-[#162240]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleExitQuiz} className={timeRemaining < 60 && !submitted ? 'text-red-700 hover:bg-red-100' : 'text-white/70 hover:bg-white/10'}>
                  <ArrowLeft className="size-4 mr-1" />
                  Exit
                </Button>
                <div>
                  <p className={`font-semibold ${timeRemaining < 60 && !submitted ? 'text-red-700' : 'text-white'}`}>{activeQuiz.title}</p>
                  <p className={`text-sm ${timeRemaining < 60 && !submitted ? 'text-red-500' : 'text-blue-200'}`}>{activeQuiz.subject?.code} — {activeQuiz.subject?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!submitted && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 60 ? 'bg-red-100' : 'bg-white/10'}`}>
                    <Timer className={`size-5 ${timeRemaining < 60 ? 'text-red-600' : 'text-[#d4a853]'}`} />
                    <span className={`text-2xl font-mono font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-white'}`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
                {!submitted && (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={submitting || timesUp}
                    className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold"
                  >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quiz Questions */}
        {!submitted ? (
          <motion.div {...fadeUp} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {quizQuestions.length} question{quizQuestions.length !== 1 ? 's' : ''} &bull; Total marks: {activeQuiz.totalMarks}
            </p>
            {quizQuestions.map((q: any, idx: number) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="py-0">
                  <CardContent className="p-6">
                    <p className="font-medium text-sm mb-4">
                      <span className="text-[#d4a853] font-bold mr-2">Q{idx + 1}.</span>
                      {q.question}
                      <span className="text-xs text-muted-foreground ml-2">({q.marks} marks)</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['A', 'B', 'C', 'D'].map((opt) => {
                        if (!q[`option${opt}`]) return null
                        const isSelected = answers[q.id] === opt
                        return (
                          <button
                            key={opt}
                            onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                              isSelected
                                ? 'border-[#d4a853] bg-[#d4a853]/10 text-[#0a1628]'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            } ${submitted ? 'pointer-events-none' : 'cursor-pointer'}`}
                          >
                            <span className={`flex items-center justify-center size-8 rounded-full text-sm font-bold ${
                              isSelected
                                ? 'bg-[#d4a853] text-white'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isSelected ? <Check className="size-4" /> : opt}
                            </span>
                            <span className="text-sm">{q[`option${opt}`]}</span>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : result ? (
          /* Results View */
          <motion.div {...fadeUp} className="space-y-6">
            <Card className="overflow-hidden">
              <div className={`p-6 text-white text-center ${result.percentage >= 50 ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-red-600 to-rose-600'}`}>
                <p className="text-lg font-medium opacity-90">Quiz Completed!</p>
                <p className="text-5xl font-bold mt-2">{result.percentage}%</p>
                <p className="text-sm mt-2 opacity-80">
                  {timesUp ? "Time's up!" : 'Submitted'} &bull; Score: {result.score}/{result.totalMarks}
                </p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#0a1628]">{result.score}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0a1628]">{result.totalMarks}</p>
                    <p className="text-xs text-muted-foreground">Total Marks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0a1628]">{result.percentage}%</p>
                    <p className="text-xs text-muted-foreground">Percentage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-center">
              <Button onClick={handleExitQuiz} className="gap-2">
                <ArrowLeft className="size-4" />
                Back to Quizzes
              </Button>
            </div>
          </motion.div>
        ) : null}
      </motion.div>
    )
  }

  // Quiz list view
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div {...fadeUp}>
        <div className="rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-6 text-white mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="size-5 text-[#d4a853]" />
            Quizzes
          </h2>
          <p className="text-blue-200 mt-1 text-sm">
            Take quizzes for your course subjects
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="p-12 text-center">
          <HelpCircle className="size-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No quizzes available</p>
          <p className="text-gray-400 text-sm mt-2">Your lecturers will create quizzes here</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz: any, idx: number) => {
            const status = getQuizStatus(quiz)
            const submission = quiz.submissions?.find((s: any) => s.studentId === studentId)
            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="py-0 hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[#0a1628]">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {quiz.subject?.code} — {quiz.subject?.name}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${
                          status === 'expired'
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : status === 'submitted'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}
                      >
                        {status === 'expired' ? 'Expired' : status === 'submitted' ? 'Submitted' : 'Available'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Timer className="size-3" />
                        {quiz.durationMinutes} min
                      </span>
                      {quiz.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(quiz.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span>{quiz._count?.questions || 0} questions</span>
                    </div>

                    {status === 'submitted' && submission && (
                      <div className="mt-auto p-2 rounded-lg bg-emerald-50 mb-3">
                        <p className="text-sm font-medium text-emerald-700">
                          Score: {submission.score}/{submission.totalMarks} ({submission.totalMarks > 0 ? Math.round((submission.score / submission.totalMarks) * 100) : 0}%)
                        </p>
                      </div>
                    )}

                    <div className="mt-auto">
                      {status === 'available' ? (
                        <Button
                          onClick={() => handleStartQuiz(quiz)}
                          className="w-full bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold"
                          size="sm"
                        >
                          <HelpCircle className="size-4 mr-1" />
                          Start Quiz
                        </Button>
                      ) : status === 'expired' ? (
                        <Button variant="outline" className="w-full" size="sm" disabled>
                          Expired
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full border-emerald-200 text-emerald-700" size="sm" disabled>
                          <CheckCircle2 className="size-4 mr-1" />
                          Already Submitted
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

// ─── Assignments View ─────────────────────────────────────────────────
function AssignmentsView({ studentId }: { studentId: string }) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoadingLocal] = useState(true)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [answerContent, setAnswerContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoadingLocal(true)
      try {
        const res = await fetch(`/api/assignments?studentId=${studentId}`)
        if (res.ok) {
          const data = await res.json()
          setAssignments(data.assignments || [])
        }
      } catch {
        // silent
      } finally {
        setLoadingLocal(false)
      }
    }
    fetchAssignments()
  }, [studentId])

  const handleOpenSubmit = (assignment: any) => {
    setSelectedAssignment(assignment)
    setAnswerContent('')
    setSubmitDialogOpen(true)
  }

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !answerContent.trim()) {
      toast.error('Please write your answer before submitting')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          content: answerContent.trim(),
        }),
      })
      if (res.ok) {
        toast.success('Assignment submitted successfully!')
        setSubmitDialogOpen(false)
        setAnswerContent('')
        setSelectedAssignment(null)
        // Refresh
        const listRes = await fetch(`/api/assignments?studentId=${studentId}`)
        if (listRes.ok) {
          const data = await listRes.json()
          setAssignments(data.assignments || [])
        }
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to submit assignment')
      }
    } catch {
      toast.error('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const getAssignmentStatus = (assignment: any) => {
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      const hasSubmission = assignment.submissions?.some((s: any) => s.studentId === studentId)
      if (hasSubmission) {
        const sub = assignment.submissions.find((s: any) => s.studentId === studentId)
        return sub.marks !== null && sub.marks !== undefined ? 'graded' : 'submitted'
      }
      return 'overdue'
    }
    const hasSubmission = assignment.submissions?.some((s: any) => s.studentId === studentId)
    if (hasSubmission) {
      const sub = assignment.submissions.find((s: any) => s.studentId === studentId)
      return sub.marks !== null && sub.marks !== undefined ? 'graded' : 'submitted'
    }
    return 'pending'
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    graded: { label: 'Graded', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700 border-red-200' },
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div {...fadeUp}>
        <div className="rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-6 text-white mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="size-5 text-[#d4a853]" />
            Assignments
          </h2>
          <p className="text-blue-200 mt-1 text-sm">
            Submit assignments for your course subjects
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="size-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No assignments available</p>
          <p className="text-gray-400 text-sm mt-2">Your lecturers will assign work here</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment: any, idx: number) => {
            const status = getAssignmentStatus(assignment)
            const config = statusConfig[status] || statusConfig.pending
            const submission = assignment.submissions?.find((s: any) => s.studentId === studentId)
            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="py-0 hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[#0a1628]">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {assignment.subject?.code} — {assignment.subject?.name}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 ${config.className}`}>
                        {config.label}
                      </Badge>
                    </div>

                    {assignment.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{assignment.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      {assignment.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      <span>Total: {assignment.totalMarks} marks</span>
                    </div>

                    {status === 'graded' && submission && (
                      <div className="p-2 rounded-lg bg-emerald-50 mb-3 space-y-1">
                        <p className="text-sm font-medium text-emerald-700">
                          Grade: {submission.marks}/{assignment.totalMarks}
                        </p>
                        {submission.feedback && (
                          <p className="text-xs text-emerald-600">{submission.feedback}</p>
                        )}
                      </div>
                    )}

                    {status === 'submitted' && submission && (
                      <div className="p-2 rounded-lg bg-blue-50 mb-3">
                        <p className="text-xs text-blue-600">
                          Submitted on {new Date(submission.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-blue-500 mt-0.5">Awaiting grading...</p>
                      </div>
                    )}

                    <div className="mt-auto">
                      {status === 'pending' ? (
                        <Button
                          onClick={() => handleOpenSubmit(assignment)}
                          className="w-full bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold"
                          size="sm"
                        >
                          <Send className="size-4 mr-1" />
                          Submit Assignment
                        </Button>
                      ) : status === 'overdue' ? (
                        <Button variant="outline" className="w-full text-red-600 border-red-200" size="sm" disabled>
                          Overdue
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" size="sm" disabled>
                          {status === 'graded' ? 'Graded' : 'Submitted'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-5 text-[#d4a853]" />
              Submit Assignment
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignment-answer">Your Answer</Label>
              <Textarea
                id="assignment-answer"
                placeholder="Write your answer here..."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {answerContent.length} characters
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSubmitDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAssignment}
                disabled={submitting || !answerContent.trim()}
                className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Notifications View ───────────────────────────────────────────────
function NotificationsView({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoadingLocal] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoadingLocal(true)
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`)
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
        }
      } catch {
        // silent
      } finally {
        setLoadingLocal(false)
      }
    }
    fetchNotifications()
  }, [userId])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
    } catch {
      // silent
    }
  }

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead)
    if (unread.length === 0) return
    try {
      await Promise.all(unread.map((n) => fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })))
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'login':
        return { icon: <Shield className="size-4" />, color: 'bg-blue-100 text-blue-600', label: 'Login' }
      case 'academic':
        return { icon: <GraduationCap className="size-4" />, color: 'bg-emerald-100 text-emerald-600', label: 'Academic' }
      case 'alert':
        return { icon: <AlertCircle className="size-4" />, color: 'bg-red-100 text-red-600', label: 'Alert' }
      default:
        return { icon: <Info className="size-4" />, color: 'bg-gray-100 text-gray-600', label: 'Info' }
    }
  }

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
      <motion.div {...fadeUp}>
        <div className="rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bell className="size-5 text-[#d4a853]" />
                Notifications
              </h2>
              <p className="text-blue-200 mt-1 text-sm">
                Stay updated with the latest alerts
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-[#d4a853] hover:bg-white/10 hover:text-[#d4a853]"
              >
                <CheckCircle2 className="size-4 mr-1" />
                Mark All Read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <Badge className="mt-3 bg-[#d4a853]/20 text-[#d4a853] border-[#d4a853]/30" variant="outline">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="size-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No notifications</p>
          <p className="text-gray-400 text-sm mt-2">You're all caught up!</p>
        </Card>
      ) : (
        <motion.div {...fadeUp} className="space-y-3">
          {notifications.map((notification: any, idx: number) => {
            const typeConfig = getTypeConfig(notification.type)
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card
                  className={`py-0 cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? 'border-l-4 border-l-[#d4a853] bg-[#d4a853]/5' : ''
                  }`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${typeConfig.color}`}>
                        {typeConfig.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-[#0a1628]' : 'font-medium text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!notification.isRead && (
                              <div className="size-2 rounded-full bg-[#d4a853]" />
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(notification.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5">
                          <Badge variant="secondary" className="text-xs">
                            {typeConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Main Student Dashboard ───────────────────────────────────────────
export default function StudentDashboard({ view, studentId }: StudentDashboardProps) {
  const { currentUser, logout } = useAppStore()
  const [student, setStudent] = useState<Student | null>(null)
  const [results, setResults] = useState<ExamResult[]>([])
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [loading, setLoadingLocal] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [resultAccess, setResultAccess] = useState<{ canViewResults: boolean; hasDebt: boolean; debtAmount: number; totalRequired: number; totalPaid: number; isLocked: boolean; locks: any[] } | null>(null)
  const [permissions, setPermissions] = useState<{ transcript: boolean; resultStatement: boolean } | null>(null)

  // Get the student name from currentUser for the header
  const studentDisplayName = currentUser?.relatedInfo
    ? `${currentUser.relatedInfo.firstName} ${currentUser.relatedInfo.lastName}`
    : currentUser?.user
    ? `${currentUser.user.firstName} ${currentUser.user.lastName}`
    : 'Student'

  const fetchStudentData = useCallback(async () => {
    if (!studentId) return
    setLoadingLocal(true)
    try {
      // Fetch student data first (no dependency on state)
      const [studentRes, resultsRes, feesRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/results?studentId=${studentId}`),
        fetch(`/api/fees?studentId=${studentId}`),
      ])

      if (studentRes.ok) {
        const data = await studentRes.json()
        setStudent(data)
        // Fetch fee structure with the actual courseId (depends on student data)
        if (data.courseId) {
          const fsRes = await fetch(`/api/fee-structure?courseId=${data.courseId}`)
          if (fsRes.ok) setFeeStructures(await fsRes.json())
        }
      }
      if (resultsRes.ok) setResults(await resultsRes.json())
      if (feesRes.ok) setPayments(await feesRes.json())
      // Check result access (finance debt + locks)
      const [accessRes, permRes] = await Promise.all([
        fetch(`/api/results/access-check?studentId=${studentId}`),
        fetch(`/api/permissions?studentId=${studentId}`),
      ])
      if (accessRes.ok) setResultAccess(await accessRes.json())
      // Fetch document permissions (transcript, result statement)
      if (permRes.ok) {
        const permData = await permRes.json()
        if (Array.isArray(permData) && permData.length > 0) {
          setPermissions({ transcript: permData[0].transcript, resultStatement: permData[0].resultStatement })
        } else {
          // No permissions record yet - default to no access
          setPermissions({ transcript: false, resultStatement: false })
        }
      }
      setFetchError(false)
    } catch {
      setFetchError(true)
    } finally {
      setLoadingLocal(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchStudentData()
  }, [fetchStudentData])

  // Error state - show retry
  if (fetchError && !student) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="border-2 border-red-200 max-w-md w-full">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="size-7 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-[#0a1628]">Failed to Load Student Data</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  There was an error loading your dashboard data. Please check your connection and try again.
                </p>
                <Button
                  className="mt-4 gap-2 bg-[#0a1628] hover:bg-[#0a1628]/90"
                  onClick={() => fetchStudentData()}
                >
                  <RefreshCw className="size-4" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Loading student data
  if (loading && !student) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1628]">Student Portal</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Building2 className="size-3.5" />
              Imperial College of Health and Allied Sciences
            </p>
          </div>
          <div className="flex items-center gap-3">
            {student && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-white border rounded-lg px-3 py-1.5">
                <Avatar className="size-6">
                  {currentUser?.user?.profilePhoto ? (
                    <AvatarImage src={currentUser.user.profilePhoto} alt={studentDisplayName} />
                  ) : null}
                  <AvatarFallback className="bg-[#0a1628] text-white text-[10px] font-bold">
                    {student.firstName[0]}{student.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-[#0a1628]">{studentDisplayName}</span>
                <span className="text-xs">({student.regNumber})</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="gap-1.5">
              <LogOut className="size-3.5" />
              Logout
            </Button>
          </div>
        </div>

        {/* View Content */}
        {student && (
          <>
            {view === 'dashboard' && (
              <StudentDashboardView student={student} results={results} payments={payments} />
            )}
            {view === 'results' && resultAccess && !resultAccess.canViewResults && (
              <motion.div {...fadeUp}>
                <Card className="border-2 border-red-200 bg-red-50/50">
                  <CardContent className="p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                      <Lock className="size-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-red-800">Results Access Blocked</h3>
                    <p className="text-sm text-red-600 mt-2">
                      {resultAccess.hasDebt && resultAccess.isLocked
                        ? 'You have outstanding fee payments AND your results have been locked by the Examination Office.'
                        : resultAccess.hasDebt
                        ? `You have outstanding fee payments of TZS ${resultAccess.debtAmount.toLocaleString()}. Please clear your balance with the Finance Office to view your results.`
                        : 'Your results have been locked by the Examination Office. Please contact the Examination Officer for more information.'}
                    </p>
                    {resultAccess.hasDebt && (
                      <div className="mt-4 bg-white rounded-lg p-4 border border-red-200 max-w-sm mx-auto">
                        <div className="text-left space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total Required:</span>
                            <span className="font-semibold">TZS {resultAccess.totalRequired.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total Paid:</span>
                            <span className="font-semibold text-emerald-600">TZS {resultAccess.totalPaid.toLocaleString()}</span>
                          </div>
                          <Separator className="my-1" />
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-red-600">Outstanding Balance:</span>
                            <span className="font-bold text-red-600">TZS {resultAccess.debtAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {resultAccess.isLocked && resultAccess.locks.length > 0 && (
                      <div className="mt-4 bg-white rounded-lg p-4 border border-amber-200 max-w-md mx-auto">
                        <p className="text-sm font-medium text-amber-800 mb-2">Active Locks:</p>
                        {resultAccess.locks.map((lock, i) => (
                          <div key={i} className="text-xs text-amber-700 bg-amber-50 rounded p-2 mb-1">
                            {lock.lockType === 'class' ? `Class Lock — ${lock.reason || 'No reason provided'}` : `Individual Lock — ${lock.reason || 'No reason provided'}`}
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => useAppStore.getState().setCurrentView('fees')}
                    >
                      <CreditCard className="size-4 mr-1" />
                      View Fee Status
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {view === 'results' && resultAccess && resultAccess.canViewResults && (
              <ResultsView student={student} results={results} permissions={permissions} />
            )}
            {view === 'results' && !resultAccess && loading && (
              <div className="flex items-center justify-center py-16">
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            )}
            {view === 'profile' && (
              <ProfileView userId={currentUser?.user?.id || ''} role='student' />
            )}
            {view === 'fees' && (
              <FeeStatusView student={student} payments={payments} feeStructures={feeStructures} />
            )}
            {view === 'notes' && (
              <CourseMaterialsView student={student} />
            )}
            {view === 'quizzes' && (
              <QuizzesView studentId={studentId!} />
            )}
            {view === 'assignments' && (
              <AssignmentsView studentId={studentId!} />
            )}
            {view === 'notifications' && (
              <NotificationsView userId={studentId!} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
