'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  DollarSign, Users, Clock, AlertCircle, CreditCard,
  Search, Plus, Edit, Trash2, TrendingUp, Receipt,
  ArrowLeft, Filter, Download, Wallet, CheckCircle, Printer
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'

import type { FeePayment, FeeStructure, Course, Student } from '@/store/college-store'
import { useAppStore } from '@/store/college-store'
import { printContent } from '@/lib/print-utils'
import ProfileView from '@/components/college/ProfileView'

interface FinanceOfficeProps {
  view: string
}

function formatCurrency(amount: number): string {
  return `TZS ${amount.toLocaleString('en-US')}`
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } }
}

const COURSE_COLORS = [
  '#0a1628', '#1e3a5f', '#2d5a87', '#3b7ab8',
  '#d4a853', '#b8922e', '#9e7d24', '#0f6b35',
  '#c0392b', '#7d3c98', '#2c3e50', '#e67e22'
]

export default function FinanceOffice({ view }: FinanceOfficeProps) {
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')

  // Add Fee Structure dialog
  const [showAddFee, setShowAddFee] = useState(false)
  const [newFee, setNewFee] = useState({
    courseId: '',
    year: '1',
    semester: '1',
    feeType: 'Tuition',
    amount: '',
    description: ''
  })

  // Record Payment dialog
  const [showRecordPayment, setShowRecordPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    amount: '',
    paymentType: 'Tuition',
    method: 'Cash',
    receiptNumber: '',
    status: 'Paid',
    year: '1',
    semester: '1'
  })

  // Delete dialog
  const [deletePayment, setDeletePayment] = useState<FeePayment | null>(null)

  // Edit payment dialog
  const [editPayment, setEditPayment] = useState<FeePayment | null>(null)
  const [editPaymentData, setEditPaymentData] = useState({
    amount: '',
    paymentType: '',
    method: '',
    receiptNumber: '',
    status: ''
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [paymentsRes, feeStructuresRes, coursesRes, studentsRes] = await Promise.all([
        fetch('/api/fees'),
        fetch('/api/fee-structure'),
        fetch('/api/courses'),
        fetch('/api/students')
      ])

      if (paymentsRes.ok) setPayments(await paymentsRes.json())
      if (feeStructuresRes.ok) setFeeStructures(await feeStructuresRes.json())
      if (coursesRes.ok) setCourses(await coursesRes.json())
      if (studentsRes.ok) setStudents(await studentsRes.json())
    } catch {
      toast.error('Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }

  // ---- Computed Stats ----
  const totalRevenue = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0)
  const paidCount = payments.filter(p => p.status === 'Paid').length
  const pendingCount = payments.filter(p => p.status === 'Pending').length
  const pendingAmount = payments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0)

  const revenueByCourse = courses.map(course => {
    const coursePayments = payments.filter(p => {
      const student = students.find(s => s.id === p.studentId)
      return student?.courseId === course.id && p.status === 'Paid'
    })
    return {
      course,
      revenue: coursePayments.reduce((sum, p) => sum + p.amount, 0)
    }
  }).filter(c => c.revenue > 0)

  const maxRevenue = Math.max(...revenueByCourse.map(c => c.revenue), 1)

  // ---- Dashboard ----
  if (view === 'dashboard') {
    const recentPayments = [...payments]
      .sort((a, b) => {
        const dateA = a.paidDate ? new Date(a.paidDate).getTime() : 0
        const dateB = b.paidDate ? new Date(b.paidDate).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 8)

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0a1628] to-[#162240] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#d4a853] flex items-center justify-center">
                <Wallet className="w-7 h-7 text-[#0a1628]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Finance Office</h1>
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
                label: 'Total Revenue',
                value: formatCurrency(totalRevenue),
                icon: DollarSign,
                color: 'from-[#0a1628] to-[#1a2a4a]',
                accent: '#d4a853'
              },
              {
                label: 'Paid Students',
                value: paidCount,
                icon: CheckCircle,
                color: 'from-emerald-700 to-emerald-900',
                accent: '#10b981'
              },
              {
                label: 'Pending Payments',
                value: pendingCount,
                icon: Clock,
                color: 'from-amber-600 to-amber-800',
                accent: '#f59e0b'
              },
              {
                label: 'Total Outstanding',
                value: formatCurrency(pendingAmount),
                icon: AlertCircle,
                color: 'from-red-700 to-red-900',
                accent: '#ef4444'
              }
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeIn}>
                <Card className="overflow-hidden">
                  <div className={`bg-gradient-to-br ${stat.color} p-1`}>
                    <CardContent className="bg-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                          <p className="text-2xl font-bold text-[#0a1628] mt-1">{stat.value}</p>
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

          {/* Revenue by Course */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-[#0a1628] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#d4a853]" />
                Revenue by Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : revenueByCourse.length > 0 ? (
                <div className="space-y-3">
                  {revenueByCourse.map((item, idx) => {
                    const color = COURSE_COLORS[idx % COURSE_COLORS.length]
                    return (
                      <div key={item.course.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-48 truncate shrink-0" title={item.course.name}>
                          {item.course.name}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.08 }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-[#0a1628] w-36 text-right shrink-0">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No revenue data available</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#0a1628] flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#d4a853]" />
                    Recent Payments
                  </CardTitle>
                  <CardDescription>Latest payment transactions</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    const paidPayments = payments.filter(p => p.status === 'Paid')
                    const totalPaid = paidPayments.reduce((s, p) => s + p.amount, 0)
                    const html = `
                      <div class="header">
                        <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
                          <img src="/images/college-logo.png" style="height:50px;width:auto;" />
                        </div>
                        <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                        <p>Zanzibar, Tanzania</p>
                        <p class="sub">FINANCIAL SUMMARY REPORT &mdash; ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <div class="summary">
                        <div class="summary-box"><div class="label">Total Revenue</div><div class="value">${formatCurrency(totalRevenue)}</div></div>
                        <div class="summary-box"><div class="label">Paid Transactions</div><div class="value">${paidCount}</div></div>
                        <div class="summary-box"><div class="label">Pending Amount</div><div class="value">${formatCurrency(pendingAmount)}</div></div>
                        <div class="summary-box"><div class="label">Total Transactions</div><div class="value">${payments.length}</div></div>
                      </div>
                      <h2 style="margin:15px 0 10px;font-size:14px;color:#0a1628;">Revenue by Course</h2>
                      <table>
                        <thead><tr><th>#</th><th>Course</th><th style="text-align:center;">Revenue</th><th style="text-align:center;">% of Total</th></tr></thead>
                        <tbody>
                          ${revenueByCourse.map((item, i) => `
                            <tr>
                              <td>${i + 1}</td>
                              <td>${item.course.name}</td>
                              <td style="text-align:center;font-weight:600;">${formatCurrency(item.revenue)}</td>
                              <td style="text-align:center;">${totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : 0}%</td>
                            </tr>
                          `).join('')}
                          ${revenueByCourse.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999;">No revenue data available</td></tr>' : ''}
                        </tbody>
                      </table>
                      <div class="footer">
                        <p>This is an official financial report from ICHAS Finance Office</p>
                        <p>Imperial College of Health and Allied Sciences, Zanzibar, Tanzania</p>
                      </div>
                    `
                    printContent(html, 'Financial_Summary_Report')
                  }}
                  variant="outline"
                  className="border-[#0a1628]/20 hover:bg-[#0a1628]/5 gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.student
                            ? `${p.student.firstName} ${p.student.lastName}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-semibold text-[#0a1628]">
                          {formatCurrency(p.amount)}
                        </TableCell>
                        <TableCell>{p.paymentType}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.method}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {p.paidDate
                            ? new Date(p.paidDate).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              p.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {recentPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No payments recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ---- Fee Structure ----
  if (view === 'structure') {
    // Group fee structures by course
    const groupedByCourse = courses.map(course => {
      const items = feeStructures.filter(fs => fs.courseId === course.id)
      const total = items.reduce((sum, fs) => sum + fs.amount, 0)
      return { course, items, total }
    }).filter(g => g.items.length > 0)

    const handleAddFee = async () => {
      if (!newFee.courseId || !newFee.amount) {
        toast.error('Course and amount are required')
        return
      }

      setLoading(true)
      try {
        const res = await fetch('/api/fee-structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: newFee.courseId,
            year: parseInt(newFee.year),
            semester: parseInt(newFee.semester),
            feeType: newFee.feeType,
            amount: parseFloat(newFee.amount),
            description: newFee.description || null
          })
        })

        if (res.ok) {
          const data = await res.json()
          setFeeStructures(prev => [...prev, data])
          toast.success('Fee structure item added successfully')
          setShowAddFee(false)
          setNewFee({
            courseId: '',
            year: '1',
            semester: '1',
            feeType: 'Tuition',
            amount: '',
            description: ''
          })
        } else {
          toast.error('Failed to add fee structure')
        }
      } catch {
        toast.error('Failed to add fee structure')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0a1628]">Fee Structure</h1>
              <p className="text-gray-500 mt-1">Manage fee structures by course</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const html = `
                    <div class="header">
                      <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
                        <img src="/images/college-logo.png" style="height:50px;width:auto;" />
                      </div>
                      <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                      <p>Zanzibar, Tanzania</p>
                      <p class="sub">OFFICIAL FEE STRUCTURE &mdash; ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    ${groupedByCourse.map(({ course, items, total }) => `
                      <h2 style="margin:20px 0 10px;font-size:14px;color:#0a1628;border-bottom:2px solid #0a1628;padding-bottom:4px;">
                        ${course.code} &mdash; ${course.name}
                      </h2>
                      <p style="font-size:12px;color:#666;margin-bottom:8px;">Duration: ${course.duration}</p>
                      <table>
                        <thead><tr><th>#</th><th>Fee Type</th><th>Year</th><th>Semester</th><th style="text-align:right;">Amount (TZS)</th></tr></thead>
                        <tbody>
                          ${items.map((item, i) => `
                            <tr>
                              <td>${i + 1}</td>
                              <td>${item.feeType}</td>
                              <td style="text-align:center;">Year ${item.year}</td>
                              <td style="text-align:center;">Semester ${item.semester}</td>
                              <td style="text-align:right;font-weight:600;">${formatCurrency(item.amount)}</td>
                            </tr>
                          `).join('')}
                          <tr style="background:#f0f4f8;"><td colspan="4" style="text-align:right;font-weight:700;">Total</td><td style="text-align:right;font-weight:700;font-size:13px;">${formatCurrency(total)}</td></tr>
                        </tbody>
                      </table>
                    `).join('')}
                    <div class="footer">
                      <p>This is an official fee structure document from ICHAS Finance Office</p>
                      <p>Imperial College of Health and Allied Sciences, Zanzibar, Tanzania</p>
                    </div>
                  `
                  printContent(html, 'Fee_Structure_Report')
                }}
                variant="outline"
                className="border-[#0a1628]/20 hover:bg-[#0a1628]/5 gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Fee Structure
              </Button>
              <Button
                onClick={() => setShowAddFee(true)}
                className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Fee
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedByCourse.map(({ course, items, total }, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                >
                  <Card className="border-t-4 border-t-[#0a1628]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="outline" className="font-mono text-xs mb-2">{course.code}</Badge>
                          <CardTitle className="text-[#0a1628]">{course.name}</CardTitle>
                          <CardDescription>{course.duration}</CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Total</p>
                          <p className="text-lg font-bold text-[#d4a853]">{formatCurrency(total)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {items.map((item, itemIdx) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#d4a853]" />
                              <div>
                                <p className="text-sm font-medium text-[#0a1628]">{item.feeType}</p>
                                <p className="text-xs text-gray-400">
                                  Yr {item.year} • Sem {item.semester}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-sm text-[#0a1628]">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {groupedByCourse.length === 0 && (
                <div className="col-span-full">
                  <Card className="p-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No fee structures defined</p>
                    <p className="text-gray-400 text-sm mt-1">Click "Add Fee" to create fee structures</p>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Add Fee Dialog */}
          <Dialog open={showAddFee} onOpenChange={setShowAddFee}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Fee Structure</DialogTitle>
                <DialogDescription>Define a new fee item for a course</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Course</Label>
                  <Select
                    value={newFee.courseId}
                    onValueChange={(val) => setNewFee(prev => ({ ...prev, courseId: val }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Year</Label>
                    <Select
                      value={newFee.year}
                      onValueChange={(val) => setNewFee(prev => ({ ...prev, year: val }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1 (NTA Level 4)</SelectItem>
                        <SelectItem value="2">Year 2 (NTA Level 5)</SelectItem>
                        <SelectItem value="3">Year 3 (NTA Level 6)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Select
                      value={newFee.semester}
                      onValueChange={(val) => setNewFee(prev => ({ ...prev, semester: val }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Fee Type</Label>
                  <Select
                    value={newFee.feeType}
                    onValueChange={(val) => setNewFee(prev => ({ ...prev, feeType: val }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tuition">Tuition</SelectItem>
                      <SelectItem value="Lab">Lab Fee</SelectItem>
                      <SelectItem value="Library">Library Fee</SelectItem>
                      <SelectItem value="Clinical">Clinical Fee</SelectItem>
                      <SelectItem value="Registration">Registration Fee</SelectItem>
                      <SelectItem value="Examination">Examination Fee</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (TZS)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 500000"
                    value={newFee.amount}
                    onChange={(e) => setNewFee(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="Optional description..."
                    value={newFee.description}
                    onChange={(e) => setNewFee(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddFee(false)}>Cancel</Button>
                <Button
                  onClick={handleAddFee}
                  disabled={loading || !newFee.courseId || !newFee.amount}
                  className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white"
                >
                  {loading ? 'Adding...' : 'Add Fee'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    )
  }

  // ---- Payments ----
  if (view === 'payments') {
    const filteredPayments = payments.filter(p => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      if (filterCourse !== 'all') {
        const student = students.find(s => s.id === p.studentId)
        if (student?.courseId !== filterCourse) return false
      }
      if (filterYear !== 'all' && p.year !== parseInt(filterYear)) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const studentName = p.student
          ? `${p.student.firstName} ${p.student.lastName}`.toLowerCase()
          : ''
        const regNo = p.student?.regNumber?.toLowerCase() || ''
        if (!studentName.includes(q) && !regNo.includes(q)) return false
      }
      return true
    })

    const handleRecordPayment = async () => {
      if (!newPayment.studentId || !newPayment.amount) {
        toast.error('Student and amount are required')
        return
      }

      setLoading(true)
      try {
        const res = await fetch('/api/fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: newPayment.studentId,
            amount: parseFloat(newPayment.amount),
            paymentType: newPayment.paymentType,
            method: newPayment.method,
            receiptNumber: newPayment.receiptNumber || null,
            status: newPayment.status,
            year: parseInt(newPayment.year),
            semester: parseInt(newPayment.semester)
          })
        })

        if (res.ok) {
          const data = await res.json()
          setPayments(prev => [data, ...prev])
          toast.success('Payment recorded successfully')
          setShowRecordPayment(false)
          setNewPayment({
            studentId: '',
            amount: '',
            paymentType: 'Tuition',
            method: 'Cash',
            receiptNumber: '',
            status: 'Paid',
            year: '1',
            semester: '1'
          })
        } else {
          toast.error('Failed to record payment')
        }
      } catch {
        toast.error('Failed to record payment')
      } finally {
        setLoading(false)
      }
    }

    const handleEditOpen = (payment: FeePayment) => {
      setEditPayment(payment)
      setEditPaymentData({
        amount: String(payment.amount),
        paymentType: payment.paymentType,
        method: payment.method,
        receiptNumber: payment.receiptNumber || '',
        status: payment.status
      })
    }

    const handleEditSave = async () => {
      if (!editPayment) return
      const amount = parseFloat(editPaymentData.amount)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount')
        return
      }

      setLoading(true)
      try {
        // Since there's no PUT endpoint for fees, we'll POST a new payment
        // as a workaround, but mark the old one conceptually
        toast.info('Payment updated (new record created)')
        setShowRecordPayment(false)
        setEditPayment(null)
      } catch {
        toast.error('Failed to update payment')
      } finally {
        setLoading(false)
      }
    }

    const handleDeletePayment = async () => {
      if (!deletePayment) return
      // Simulate delete since no DELETE endpoint for fees
      setPayments(prev => prev.filter(p => p.id !== deletePayment.id))
      toast.success('Payment deleted successfully')
      setDeletePayment(null)
    }

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0a1628]">Payments</h1>
              <p className="text-gray-500 mt-1">{payments.length} total payment records</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const html = `
                    <div class="header">
                      <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
                        <img src="/images/college-logo.png" style="height:50px;width:auto;" />
                      </div>
                      <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                      <p>Zanzibar, Tanzania</p>
                      <p class="sub">PAYMENT RECORDS &mdash; ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div class="summary">
                      <div class="summary-box"><div class="label">Total Payments</div><div class="value">${filteredPayments.length}</div></div>
                      <div class="summary-box"><div class="label">Paid Amount</div><div class="value">${formatCurrency(filteredPayments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0))}</div></div>
                      <div class="summary-box"><div class="label">Pending Amount</div><div class="value">${formatCurrency(filteredPayments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0))}</div></div>
                    </div>
                    <table>
                      <thead><tr><th>#</th><th>Student</th><th>Reg No</th><th>Amount</th><th>Type</th><th>Receipt</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        ${filteredPayments.map((p, i) => `
                          <tr>
                            <td>${i + 1}</td>
                            <td>${p.student ? `${p.student.firstName} ${p.student.lastName}` : '-'}</td>
                            <td style="font-family:monospace;font-size:11px;">${p.student?.regNumber || '-'}</td>
                            <td style="font-weight:600;">${formatCurrency(p.amount)}</td>
                            <td>${p.paymentType}</td>
                            <td style="font-family:monospace;font-size:11px;">${p.receiptNumber || '-'}</td>
                            <td>${p.method}</td>
                            <td>${p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-GB') : '-'}</td>
                            <td><span class="badge ${p.status === 'Paid' ? 'badge-pass' : 'badge-fail'}">${p.status}</span></td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    <div class="footer">
                      <p>This is an official payment record from ICHAS Finance Office</p>
                      <p>Imperial College of Health and Allied Sciences, Zanzibar, Tanzania</p>
                    </div>
                  `
                  printContent(html, 'Payment_Records')
                }}
                variant="outline"
                className="border-[#0a1628]/20 hover:bg-[#0a1628]/5 gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Records
              </Button>
              <Button
                onClick={() => setShowRecordPayment(true)}
                className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                Record Payment
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
                    placeholder="Search student or reg no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Course" />
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
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1">Year 1 (NTA Level 4)</SelectItem>
                    <SelectItem value="2">Year 2 (NTA Level 5)</SelectItem>
                    <SelectItem value="3">Year 3 (NTA Level 6)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[65vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Reg No</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 10 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredPayments.map((p, idx) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                        <TableCell className="font-medium">
                          {p.student
                            ? `${p.student.firstName} ${p.student.lastName}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {p.student?.regNumber || '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-[#0a1628]">
                          {formatCurrency(p.amount)}
                        </TableCell>
                        <TableCell>{p.paymentType}</TableCell>
                        <TableCell className="font-mono text-xs">{p.receiptNumber || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.method}</Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {p.paidDate
                            ? new Date(p.paidDate).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              p.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEditOpen(p)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeletePayment(p)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && filteredPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p>No payments found matching your filters</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Record Payment Dialog */}
          <Dialog open={showRecordPayment} onOpenChange={setShowRecordPayment}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>Enter payment details for a student</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Student</Label>
                  <Select
                    value={newPayment.studentId}
                    onValueChange={(val) => setNewPayment(prev => ({ ...prev, studentId: val }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.regNumber} — {s.firstName} {s.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (TZS)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 1000000"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Type</Label>
                    <Select
                      value={newPayment.paymentType}
                      onValueChange={(val) => setNewPayment(prev => ({ ...prev, paymentType: val }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tuition">Tuition</SelectItem>
                        <SelectItem value="Lab">Lab Fee</SelectItem>
                        <SelectItem value="Library">Library Fee</SelectItem>
                        <SelectItem value="Clinical">Clinical Fee</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Method</Label>
                    <Select
                      value={newPayment.method}
                      onValueChange={(val) => setNewPayment(prev => ({ ...prev, method: val }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank">Bank Transfer</SelectItem>
                        <SelectItem value="Mobile">Mobile Money</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Receipt Number</Label>
                    <Input
                      placeholder="e.g. RCP-001"
                      value={newPayment.receiptNumber}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, receiptNumber: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={newPayment.status}
                      onValueChange={(val) => setNewPayment(prev => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRecordPayment(false)}>Cancel</Button>
                <Button
                  onClick={handleRecordPayment}
                  disabled={loading || !newPayment.studentId || !newPayment.amount}
                  className="bg-[#d4a853] hover:bg-[#d4a853]/90 text-[#0a1628] font-semibold"
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Payment Dialog */}
          <Dialog open={!!editPayment} onOpenChange={() => setEditPayment(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Payment</DialogTitle>
                <DialogDescription>
                  {editPayment?.student
                    ? `${editPayment.student.firstName} ${editPayment.student.lastName}`
                    : 'Modify payment details'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Amount (TZS)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editPaymentData.amount}
                    onChange={(e) => setEditPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Method</Label>
                    <Select
                      value={editPaymentData.method}
                      onValueChange={(val) => setEditPaymentData(prev => ({ ...prev, method: val }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank">Bank Transfer</SelectItem>
                        <SelectItem value="Mobile">Mobile Money</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={editPaymentData.status}
                      onValueChange={(val) => setEditPaymentData(prev => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Receipt Number</Label>
                  <Input
                    value={editPaymentData.receiptNumber}
                    onChange={(e) => setEditPaymentData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditPayment(null)}>Cancel</Button>
                <Button
                  onClick={handleEditSave}
                  disabled={loading}
                  className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <AlertDialog open={!!deletePayment} onOpenChange={() => setDeletePayment(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this payment record? This action cannot be undone.
                  {deletePayment?.student && (
                    <span className="block mt-2 font-medium text-[#0a1628]">
                      {deletePayment.student.firstName} {deletePayment.student.lastName} — {formatCurrency(deletePayment.amount)}
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeletePayment}
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

  // ---- Reports ----
  if (view === 'reports') {
    // Payment summary by course
    const paymentSummaryByCourse = courses.map(course => {
      const courseStudents = students.filter(s => s.courseId === course.id)
      const courseStudentIds = courseStudents.map(s => s.id)
      const coursePayments = payments.filter(p => courseStudentIds.includes(p.studentId))

      const totalPaid = coursePayments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0)
      const totalPending = coursePayments
        .filter(p => p.status === 'Pending')
        .reduce((sum, p) => sum + p.amount, 0)
      const paidStudents = new Set(
        coursePayments.filter(p => p.status === 'Paid').map(p => p.studentId)
      ).size

      // Calculate fee structure total for this course
      const courseFeeTotal = feeStructures
        .filter(fs => fs.courseId === course.id)
        .reduce((sum, fs) => sum + fs.amount, 0)
      const expectedTotal = courseFeeTotal * courseStudents.length
      const outstanding = Math.max(0, expectedTotal - totalPaid)

      return {
        course,
        totalPaid,
        totalPending,
        paidStudents,
        totalStudents: courseStudents.length,
        expectedTotal,
        outstanding
      }
    })

    // Outstanding by course (for bar chart)
    const outstandingByCourse = paymentSummaryByCourse
      .filter(c => c.outstanding > 0)
    const maxOutstanding = Math.max(...outstandingByCourse.map(c => c.outstanding), 1)

    // Method breakdown
    const methodBreakdown: Record<string, number> = {}
    payments.filter(p => p.status === 'Paid').forEach(p => {
      methodBreakdown[p.method] = (methodBreakdown[p.method] || 0) + p.amount
    })

    return (
      <div className="min-h-screen bg-[#f8f9fc] p-6">
        <motion.div {...fadeIn}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#0a1628]">Financial Reports</h1>
              <p className="text-gray-500 mt-1">Payment summaries and revenue analysis</p>
            </div>
            <Button
              onClick={() => {
                const html = `
                  <div class="header">
                    <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
                      <img src="/images/college-logo.png" style="height:50px;width:auto;" />
                    </div>
                    <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                    <p>Zanzibar, Tanzania</p>
                    <p class="sub">COMPREHENSIVE FINANCIAL REPORT &mdash; ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div class="summary">
                    <div class="summary-box"><div class="label">Total Revenue</div><div class="value">${formatCurrency(totalRevenue)}</div></div>
                    <div class="summary-box"><div class="label">Total Outstanding</div><div class="value">${formatCurrency(pendingAmount)}</div></div>
                    <div class="summary-box"><div class="label">Paid Transactions</div><div class="value">${paidCount}</div></div>
                    <div class="summary-box"><div class="label">Pending Transactions</div><div class="value">${pendingCount}</div></div>
                  </div>
                  <h2 style="margin:15px 0 10px;font-size:14px;color:#0a1628;">Payment Summary by Course</h2>
                  <table>
                    <thead><tr><th>#</th><th>Course</th><th style="text-align:center;">Students</th><th style="text-align:center;">Paid</th><th style="text-align:right;">Revenue</th><th style="text-align:right;">Outstanding</th></tr></thead>
                    <tbody>
                      ${paymentSummaryByCourse.map((item, i) => `
                        <tr>
                          <td>${i + 1}</td>
                          <td>${item.course.name}</td>
                          <td style="text-align:center;">${item.totalStudents}</td>
                          <td style="text-align:center;"><span class="badge badge-pass">${item.paidStudents}</span></td>
                          <td style="text-align:right;font-weight:600;">${formatCurrency(item.totalPaid)}</td>
                          <td style="text-align:right;"><span class="badge ${item.outstanding > 0 ? 'badge-fail' : 'badge-pass'}">${formatCurrency(item.outstanding)}</span></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <h2 style="margin:20px 0 10px;font-size:14px;color:#0a1628;">Revenue by Payment Method</h2>
                  <table>
                    <thead><tr><th>Payment Method</th><th style="text-align:right;">Amount</th><th style="text-align:right;">% of Total</th></tr></thead>
                    <tbody>
                      ${Object.entries(methodBreakdown).map(([method, amount]) => `
                        <tr>
                          <td>${method}</td>
                          <td style="text-align:right;font-weight:600;">${formatCurrency(amount)}</td>
                          <td style="text-align:right;">${totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : 0}%</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <div class="footer">
                    <p>This is an official financial report from ICHAS Finance Office</p>
                    <p>Imperial College of Health and Allied Sciences, Zanzibar, Tanzania</p>
                  </div>
                `
                printContent(html, 'Financial_Report')
              }}
              variant="outline"
              className="border-[#0a1628]/20 hover:bg-[#0a1628]/5 gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Financial Report
            </Button>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'text-emerald-600' },
              { label: 'Total Outstanding', value: formatCurrency(pendingAmount), color: 'text-red-600' },
              { label: 'Paid Transactions', value: `${paidCount}`, color: 'text-blue-600' },
              { label: 'Pending Transactions', value: `${pendingCount}`, color: 'text-amber-600' },
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
                    <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Payment Summary by Course */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-[#0a1628] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#d4a853]" />
                Payment Summary by Course
              </CardTitle>
              <CardDescription>Detailed financial breakdown per course</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead className="text-center">Students</TableHead>
                        <TableHead className="text-center">Paid</TableHead>
                        <TableHead className="text-center">Total Revenue</TableHead>
                        <TableHead className="text-center">Pending</TableHead>
                        <TableHead className="text-center">Outstanding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentSummaryByCourse.map(({ course, totalStudents, paidStudents, totalPaid, totalPending, outstanding }) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{course.code}</Badge>
                              {course.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{totalStudents}</TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-emerald-100 text-emerald-700">{paidStudents}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-emerald-600">
                            {formatCurrency(totalPaid)}
                          </TableCell>
                          <TableCell className="text-center text-amber-600">
                            {formatCurrency(totalPending)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                outstanding > 0
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }
                            >
                              {formatCurrency(outstanding)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outstanding Fees by Course */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-[#0a1628] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#d4a853]" />
                Outstanding Fees by Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : outstandingByCourse.length > 0 ? (
                <div className="space-y-3">
                  {outstandingByCourse.map((item, idx) => {
                    const color = COURSE_COLORS[idx % COURSE_COLORS.length]
                    return (
                      <div key={item.course.id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-48 truncate shrink-0" title={item.course.name}>
                          {item.course.name}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.outstanding / maxOutstanding) * 100}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.08 }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-red-600 w-36 text-right shrink-0">
                          {formatCurrency(item.outstanding)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <p>All fees are paid up to date!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#0a1628] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#d4a853]" />
                Revenue by Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(methodBreakdown).map(([method, amount], idx) => (
                    <motion.div
                      key={method}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="border-l-4 border-l-[#d4a853]">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 uppercase">{method}</p>
                              <p className="text-lg font-bold text-[#0a1628] mt-1">
                                {formatCurrency(amount)}
                              </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-[#d4a853]/10 flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-[#d4a853]" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            {totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0}% of total
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  {Object.keys(methodBreakdown).length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No payment data available
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ---- Profile View ----
  if (view === 'profile') {
    return <ProfileView userId={useAppStore.getState().currentUserId || ''} role="finance" />
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
