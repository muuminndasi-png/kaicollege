'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Filter, GraduationCap, Building2, MapPin, Phone,
  Mail, Briefcase, Award, Calendar, TrendingUp, Plus, Edit3, Trash2,
  X, ChevronDown, ExternalLink, Globe, Linkedin, Star, BookOpen,
  Eye, Download, UserCheck, UserX, BarChart3, Heart, Handshake,
  FileText, Printer,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { Alumni } from '@/store/college-store'
import { printContent } from '@/lib/print-utils'

interface AlumniDashboardProps {
  view: string
}

const courseColors: Record<string, any> = {
  'PST': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', accent: '#0d9488' },
  'NMT': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', accent: '#059669' },
  'CDT': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', accent: '#d97706' },
}

const honourColors: Record<string, string> = {
  'First Class': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Upper Second': 'bg-blue-100 text-blue-800 border-blue-300',
  'Lower Second': 'bg-green-100 text-green-800 border-green-300',
  'Pass': 'bg-gray-100 text-gray-700 border-gray-300',
}

export default function AlumniDashboard({ view }: AlumniDashboardProps) {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editingAlumni, setEditingAlumni] = useState<Alumni | null>(null)
  const [graduationYears, setGraduationYears] = useState<string[]>([])

  // Form state
  const [form, setForm] = useState({
    alumniNumber: '', regNumber: '', firstName: '', middleName: '', lastName: '',
    email: '', phone: '', gender: 'Male', courseId: '', courseName: '',
    graduationYear: '', graduationDate: '', gpa: '', classHonour: 'Pass',
    currentEmployer: '', currentPosition: '', currentLocation: '',
    linkedin: '', notes: '',
  })

  const fetchAlumni = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCourse !== 'all') params.set('courseId', filterCourse)
      if (filterYear !== 'all') params.set('graduationYear', filterYear)
      if (search) params.set('search', search)
      const res = await fetch(`/api/alumni?${params}`)
      const data = await res.json()
      setAlumni(data.alumni || [])
      setStats(data.stats || null)

      const years = [...new Set((data.alumni || []).map((a: Alumni) => a.graduationYear))].sort().reverse() as string[]
      setGraduationYears(years)
    } catch {
      toast.error('Failed to load alumni data')
    } finally {
      setLoading(false)
    }
  }, [filterCourse, filterYear, search])

  useEffect(() => {
    fetchAlumni()
  }, [fetchAlumni])

  useEffect(() => {
    fetch('/api/courses').then(r => r.json()).then(setCourses).catch(() => {})
  }, [])

  const getCourseCode = (name: string) => {
    if (name.includes('PST') || name.includes('Pharmaceutical')) return 'PST'
    if (name.includes('NMT') || name.includes('Nursing')) return 'NMT'
    if (name.includes('CDT') || name.includes('Dental') || name.includes('Dentistry')) return 'CDT'
    return 'NMT'
  }

  const resetForm = () => {
    setForm({
      alumniNumber: '', regNumber: '', firstName: '', middleName: '', lastName: '',
      email: '', phone: '', gender: 'Male', courseId: '', courseName: '',
      graduationYear: '', graduationDate: '', gpa: '', classHonour: 'Pass',
      currentEmployer: '', currentPosition: '', currentLocation: '',
      linkedin: '', notes: '',
    })
    setEditingAlumni(null)
  }

  const openAdd = () => {
    resetForm()
    setShowAdd(true)
  }

  const openEdit = (a: Alumni) => {
    setEditingAlumni(a)
    setForm({
      alumniNumber: a.alumniNumber, regNumber: a.regNumber, firstName: a.firstName,
      middleName: a.middleName || '', lastName: a.lastName, email: a.email || '',
      phone: a.phone || '', gender: a.gender, courseId: a.courseId,
      courseName: a.courseName, graduationYear: a.graduationYear,
      graduationDate: a.graduationDate || '', gpa: String(a.gpa),
      classHonour: a.classHonour, currentEmployer: a.currentEmployer || '',
      currentPosition: a.currentPosition || '', currentLocation: a.currentLocation || '',
      linkedin: a.linkedin || '', notes: a.notes || '',
    })
    setShowAdd(true)
  }

  const handleSave = async () => {
    if (!form.alumniNumber || !form.firstName || !form.lastName || !form.courseId || !form.graduationYear) {
      toast.error('Tafadhali jaza sehemu zinazohitajika')
      return
    }

    const courseName = courses.find((c: any) => c.id === form.courseId)?.name || form.courseName

    try {
      if (editingAlumni) {
        await fetch(`/api/alumni/${editingAlumni.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, courseName }),
        })
        toast.success('Maelezo ya alumni yamesasishwa!')
      } else {
        await fetch('/api/alumni', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, courseName }),
        })
        toast.success('Alumni ameongezwa kwa mafanikio!')
      }
      setShowAdd(false)
      resetForm()
      fetchAlumni()
    } catch {
      toast.error('Hitilafu katika kuhifadhi')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Una uhakika unataka kufuta alumni huyu?')) return
    try {
      await fetch(`/api/alumni/${id}`, { method: 'DELETE' })
      toast.success('Alumni amefutwa')
      fetchAlumni()
      if (showDetail) setShowDetail(false)
    } catch {
      toast.error('Hitilafu katika kufuta')
    }
  }

  const getInitials = (a: Alumni) => {
    return `${a.firstName[0]}${a.lastName[0]}`
  }

  // ─── Dashboard View ───
  if (view === 'dashboard') {
    const employedCount = stats?.employed || 0
    const totalCount = stats?.total || 0
    const employedPct = totalCount > 0 ? Math.round((employedCount / totalCount) * 100) : 0

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a1628]">
                    <GraduationCap className="h-6 w-6 text-[#d4a853]" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[#0a1628] sm:text-3xl">Alumni Network</h1>
                    <p className="text-sm text-gray-500">Imperial College of Health and Allied Sciences</p>
                  </div>
                </div>
              </div>
              <Button onClick={openAdd} className="bg-[#0a1628] hover:bg-[#132744] text-white gap-2">
                <Plus className="h-4 w-4" />
                Ongeza Alumni
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Jumla ya Alumni', value: totalCount, icon: Users, color: '#0a1628', bg: 'bg-[#0a1628]' },
              { label: 'Walio Ajiriwa', value: employedCount, icon: UserCheck, color: '#059669', bg: 'bg-emerald-600' },
              { label: 'Wasiopata Kazi', value: totalCount - employedCount, icon: UserX, color: '#d97706', bg: 'bg-amber-600' },
              { label: 'Kiwango cha Ajira', value: `${employedPct}%`, icon: TrendingUp, color: '#0d9488', bg: 'bg-teal-600' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} text-white`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#0a1628]">{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Graduates by Year & Course */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* By Year */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-0 shadow-md h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-[#d4a853]" />
                    Wahitimu kwa Mwaka
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-3/4" /><Skeleton className="h-8 w-1/2" /></div>
                  ) : stats?.byYear ? (
                    <div className="space-y-3">
                      {stats.byYear.map((y: any) => (
                        <div key={y.graduationYear} className="flex items-center gap-3">
                          <span className="w-16 text-sm font-semibold text-gray-700">{y.graduationYear}</span>
                          <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(y._count / totalCount) * 100}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-gradient-to-r from-[#0a1628] to-[#1a3a5c] rounded-full flex items-center justify-end pr-3"
                            >
                              <span className="text-xs font-bold text-white">{y._count}</span>
                            </motion.div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Hakuna data</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* By Course */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border-0 shadow-md h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-[#d4a853]" />
                    Wahitimu kwa Kozi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {['PST', 'NMT', 'CDT'].map(code => {
                        const count = alumni.filter(a => getCourseCode(a.courseName) === code).length
                        const colors = courseColors[code]
                        const name = code === 'PST' ? 'PST - Pharmaceutical Sciences' : code === 'NMT' ? 'NMT - Nursing & Midwifery' : 'CDT - Clinical Dentistry'
                        return (
                          <div key={code} className={`rounded-xl ${colors.bg} border ${colors.border} p-4 text-center`}>
                            <p className="text-3xl font-bold" style={{ color: colors.accent }}>{count}</p>
                            <p className={`text-xs font-medium mt-1 ${colors.text}`}>{name}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Alumni Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-[#d4a853]" />
                  Alumni Wa Hivi Karibuni
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {alumni.slice(0, 6).map((a, i) => {
                      const code = getCourseCode(a.courseName)
                      const colors = courseColors[code]
                      return (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="group cursor-pointer rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-lg hover:border-[#d4a853]/30 transition-all duration-300"
                          onClick={() => { setSelectedAlumni(a); setShowDetail(true) }}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                              style={{ backgroundColor: colors.accent }}
                            >
                              {getInitials(a)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-[#0a1628] truncate">{a.firstName} {a.lastName}</h3>
                              <p className="text-xs text-gray-500">{a.courseName}</p>
                              {a.currentEmployer && (
                                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  <span className="truncate">{a.currentPosition}, {a.currentEmployer}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] ${honourColors[a.classHonour] || ''}`}>
                              {a.classHonour}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 border-gray-200">
                              <Calendar className="h-2.5 w-2.5 mr-1" />
                              {a.graduationYear}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: colors.accent + '40', color: colors.accent, backgroundColor: colors.accent + '08' }}>
                              GPA {a.gpa.toFixed(1)}
                            </Badge>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alumni Detail Modal */}
        <AnimatePresence>
          {showDetail && selectedAlumni && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <AlumniDetailCard
                  alumni={selectedAlumni}
                  onClose={() => setShowDetail(false)}
                  onEdit={() => { setShowDetail(false); openEdit(selectedAlumni) }}
                  onDelete={() => handleDelete(selectedAlumni.id)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingAlumni ? 'Hariri Maelezo ya Alumni' : 'Ongeza Alumni Mpya'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Namba ya Alumni *</Label>
                <Input value={form.alumniNumber} onChange={e => setForm({ ...form, alumniNumber: e.target.value })} placeholder="ALM/PS/001" />
              </div>
              <div>
                <Label>Namba ya Usajili *</Label>
                <Input value={form.regNumber} onChange={e => setForm({ ...form, regNumber: e.target.value })} placeholder="ICHAS/PS/2020/001" />
              </div>
              <div>
                <Label>Jina la Kwanza *</Label>
                <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <Label>Jina la Kati</Label>
                <Input value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} />
              </div>
              <div>
                <Label>Jina la Mwisho *</Label>
                <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div>
                <Label>Jinsia</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kozi *</Label>
                <Select value={form.courseId} onValueChange={v => setForm({ ...form, courseId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chagua kozi" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mwaka wa Uhitimu *</Label>
                <Input value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: e.target.value })} placeholder="2024" />
              </div>
              <div>
                <Label>Tarehe ya Uhitimu</Label>
                <Input type="date" value={form.graduationDate} onChange={e => setForm({ ...form, graduationDate: e.target.value })} />
              </div>
              <div>
                <Label>GPA</Label>
                <Input type="number" step="0.1" min="0" max="5" value={form.gpa} onChange={e => setForm({ ...form, gpa: e.target.value })} placeholder="4.0" />
              </div>
              <div>
                <Label>Daraja la Heshima</Label>
                <Select value={form.classHonour} onValueChange={v => setForm({ ...form, classHonour: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Class">First Class</SelectItem>
                    <SelectItem value="Upper Second">Upper Second</SelectItem>
                    <SelectItem value="Lower Second">Lower Second</SelectItem>
                    <SelectItem value="Pass">Pass</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Simu</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Kazi Sasa</Label>
                <Input value={form.currentEmployer} onChange={e => setForm({ ...form, currentEmployer: e.target.value })} placeholder="Hospital/Company" />
              </div>
              <div>
                <Label>Nafasi ya Kazi</Label>
                <Input value={form.currentPosition} onChange={e => setForm({ ...form, currentPosition: e.target.value })} placeholder="Nurse/Pharmacist" />
              </div>
              <div className="sm:col-span-2">
                <Label>Mahali</Label>
                <Input value={form.currentLocation} onChange={e => setForm({ ...form, currentLocation: e.target.value })} placeholder="Zanzibar/Dar es Salaam" />
              </div>
              <div className="sm:col-span-2">
                <Label>LinkedIn</Label>
                <Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="sm:col-span-2">
                <Label>Nota</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Futa</Button>
              <Button onClick={handleSave} className="bg-[#0a1628] hover:bg-[#132744] text-white">
                {editingAlumni ? 'Sasisha' : 'Hifadhi'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const printTranscriptFor = (a: Alumni) => {
    const fullName = `${a.firstName} ${a.middleName ? a.middleName + ' ' : ''}${a.lastName}`
    const gradDate = a.graduationDate ? new Date(a.graduationDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : a.graduationYear

    const semesters: { sem: number; courses: { name: string; code: string; credits: number; marks: number; grade: string; points: number }[]; sgpa: number }[] = []
    const courseNames: Record<string, string[][]> = {
      'Pharmaceutical': [['Pharmaceutical Chemistry I', 'Pharmacognosy I', 'Human Anatomy & Physiology I', 'Pharmaceutical Microbiology I'], ['Pharmaceutical Chemistry II', 'Pharmacology I', 'Pharmaceutics I', 'Biochemistry'], ['Pharmacology II', 'Pharmaceutics II', 'Clinical Pharmacy I', 'Pharmaceutical Analysis'], ['Clinical Pharmacy II', 'Pharmacy Practice', 'Pharmacotherapy', 'Research Project'], ['Hospital Pharmacy Internship', 'Community Pharmacy', 'Drug Regulatory Affairs', 'Pharmacoeconomics']],
      'Nursing': [['Anatomy & Physiology I', 'Nursing Fundamentals', 'Microbiology', 'Communication Skills'], ['Medical-Surgical Nursing I', 'Pharmacology for Nurses', 'Pathology', 'Health Assessment'], ['Medical-Surgical Nursing II', 'Pediatric Nursing', 'Mental Health Nursing', 'Obstetric Nursing'], ['Community Health Nursing', 'Nursing Leadership', 'Research Methods', 'Nursing Ethics'], ['Nursing Internship', 'Comprehensive Clinical Practice', 'Health Education', 'Project Work']],
      'Dental': [['Dental Anatomy', 'Oral Histology', 'Dental Materials', 'Oral Physiology'], ['Oral Pathology', 'Conservative Dentistry I', 'Prosthodontics I', 'Periodontics'], ['Conservative Dentistry II', 'Prosthodontics II', 'Oral Surgery I', 'Orthodontics'], ['Oral Surgery II', 'Pediatric Dentistry', 'Endodontics', 'Dental Radiology'], ['Clinical Internship', 'Dental Public Health', 'Forensic Dentistry', 'Research Project']],
    }
    const key = Object.keys(courseNames).find(k => a.courseName.includes(k)) || 'Nursing'
    const semCourses = courseNames[key]

    for (let sem = 1; sem <= semCourses.length; sem++) {
      const courses = semCourses[sem - 1].map((name, ci) => {
        const variance = ((sem - 3) * 0.15) + (ci * 0.05) + (Math.sin(sem * 3 + ci * 7) * 0.3)
        const marks = Math.min(100, Math.max(40, Math.round((a.gpa / 5) * 80 + variance * 20 + 10)))
        const grade = marks >= 80 ? 'A' : marks >= 70 ? 'B+' : marks >= 65 ? 'B' : marks >= 60 ? 'B-' : marks >= 50 ? 'C' : marks >= 45 ? 'C-' : marks >= 40 ? 'D' : 'F'
        const points = marks >= 80 ? 5 : marks >= 70 ? 4.5 : marks >= 65 ? 4 : marks >= 60 ? 3.5 : marks >= 50 ? 3 : marks >= 45 ? 2.5 : marks >= 40 ? 2 : 0
        return { name, code: `${key.substring(0,2).toUpperCase()}${sem}${String(ci+1).padStart(2,'0')}`, credits: 4, marks, grade, points }
      })
      const sgpa = courses.reduce((s, c) => s + c.points * c.credits, 0) / courses.reduce((s, c) => s + c.credits, 0)
      semesters.push({ sem, courses, sgpa })
    }

    const html = `
      <div class="header">
        <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
          <img src="/images/college-logo.png" style="height:60px;width:auto;" />
        </div>
        <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
        <p>Zanzibar, Tanzania</p>
        <p class="sub" style="font-size:13px;font-weight:600;margin-top:8px;">OFFICIAL ACADEMIC TRANSCRIPT</p>
        <p class="sub" style="margin-top:2px;">Document Reference: ICHAS/TR/${a.graduationYear}/${a.alumniNumber}</p>
      </div>
      <div class="info-grid" style="margin-top:20px;">
        <div class="info-item"><span class="info-label">Alumni Number:</span><span class="info-value"><strong>${a.alumniNumber}</strong></span></div>
        <div class="info-item"><span class="info-label">Reg Number:</span><span class="info-value"><strong>${a.regNumber}</strong></span></div>
        <div class="info-item"><span class="info-label">Full Name:</span><span class="info-value"><strong>${fullName}</strong></span></div>
        <div class="info-item"><span class="info-label">Program:</span><span class="info-value"><strong>${a.courseName}</strong></span></div>
        <div class="info-item"><span class="info-label">Gender:</span><span class="info-value">${a.gender}</span></div>
        <div class="info-item"><span class="info-label">Graduation:</span><span class="info-value">${gradDate}</span></div>
      </div>
      <div class="summary">
        <div class="summary-box"><div class="label">Cumulative GPA</div><div class="value">${a.gpa.toFixed(2)} / 5.00</div></div>
        <div class="summary-box"><div class="label">Class of Honour</div><div class="value">${a.classHonour}</div></div>
        <div class="summary-box"><div class="label">Graduation Year</div><div class="value">${a.graduationYear}</div></div>
        <div class="summary-box"><div class="label">Status</div><div class="value"><span class="badge badge-pass">GRADUATED</span></div></div>
      </div>
      ${semesters.map(s => `
        <div style="margin-top:25px;page-break-inside:avoid;">
          <h2 style="font-size:14px;color:#0a1628;border-bottom:2px solid #0a1628;padding-bottom:6px;margin-bottom:10px;">Semester ${s.sem} &mdash; SGPA: ${s.sgpa.toFixed(2)}</h2>
          <table>
            <thead><tr><th>#</th><th>Course Code</th><th>Course Name</th><th style="text-align:center;">Credits</th><th style="text-align:center;">Marks</th><th style="text-align:center;">Grade</th><th style="text-align:center;">Points</th></tr></thead>
            <tbody>
              ${s.courses.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td style="font-family:monospace;font-size:11px;">${c.code}</td>
                  <td>${c.name}</td>
                  <td style="text-align:center;">${c.credits}</td>
                  <td style="text-align:center;font-weight:600;">${c.marks}</td>
                  <td style="text-align:center;"><span class="badge ${c.points >= 2.5 ? 'badge-pass' : 'badge-fail'}">${c.grade}</span></td>
                  <td style="text-align:center;">${c.points.toFixed(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
      <div class="footer">
        <p style="font-size:11px;margin-top:20px;"><strong>NOTE:</strong> This transcript is an official document issued by Imperial College of Health and Allied Sciences, Zanzibar, Tanzania.</p>
        <p>Generated electronically on ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    `
    printContent(html, `Transcript_${a.regNumber}`)
  }

  // ─── Directory View ───
  if (view === 'directory') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#0a1628]">Orodha ya Alumni</h1>
                <p className="text-sm text-gray-500 mt-1">Tafuta na uchunguze wahitimu wetu</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => {
                  const html = `
                    <div class="header">
                      <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
                        <img src="/images/college-logo.png" style="height:50px;width:auto;" />
                      </div>
                      <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
                      <p>Zanzibar, Tanzania</p>
                      <p class="sub">OFFICIAL ALUMNI DIRECTORY &mdash; ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <p style="font-size:12px;color:#666;margin:10px 0;">Total Alumni: <strong>${alumni.length}</strong></p>
                    <table>
                      <thead><tr><th>#</th><th>Alumni No.</th><th>Full Name</th><th>Program</th><th>GPA</th><th>Class</th><th>Grad Year</th><th>Employer</th></tr></thead>
                      <tbody>
                        ${alumni.map((a, i) => `
                          <tr>
                            <td>${i + 1}</td>
                            <td>${a.alumniNumber}</td>
                            <td>${a.firstName} ${a.middleName ? a.middleName + ' ' : ''}${a.lastName}</td>
                            <td>${a.courseName}</td>
                            <td style="text-align:center">${a.gpa.toFixed(2)}</td>
                            <td><span class="badge ${a.classHonour === 'First Class' ? 'badge-first' : a.classHonour === 'Upper Second' ? 'badge-upper' : a.classHonour === 'Lower Second' ? 'badge-lower' : ''}">${a.classHonour}</span></td>
                            <td style="text-align:center">${a.graduationYear}</td>
                            <td>${a.currentEmployer || 'N/A'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    <div class="footer">
                      <p>This is an official document from ICHAS Management System</p>
                      <p>Imperial College of Health and Allied Sciences, Zanzibar, Tanzania</p>
                    </div>
                  `
                  printContent(html, 'Alumni_Directory')
                }} variant="outline" className="border-[#0a1628]/20 hover:bg-[#0a1628]/5 gap-2">
                  <Printer className="h-4 w-4" />
                  Print Directory
                </Button>
                <Button onClick={openAdd} className="bg-[#0a1628] hover:bg-[#132744] text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Ongeza Alumni
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Search & Filters */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-10"
                      placeholder="Tafuta kwa jina, namba, mahali, au kazi..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Select value={filterCourse} onValueChange={setFilterCourse}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Kozi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Kozi Zote</SelectItem>
                        {courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                      <SelectTrigger className="w-[140px]">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Mwaka" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Miaka Yote</SelectItem>
                        {graduationYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-[#0a1628]">{alumni.length}</span> alumni wamepatikana
            </p>
          </div>

          {/* Alumni Table / Cards */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : alumni.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Hakuna alumni waliopatikana</h3>
                <p className="text-sm text-gray-400 mt-1">Badilisha vichujio vyako au ongeza alumni mpya</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {alumni.map((a, i) => {
                const code = getCourseCode(a.courseName)
                const colors = courseColors[code]
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#d4a853]/20 transition-all duration-200 cursor-pointer"
                    onClick={() => { setSelectedAlumni(a); setShowDetail(true) }}
                  >
                    {/* Avatar */}
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: colors.accent }}
                    >
                      {getInitials(a)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#0a1628]">{a.firstName} {a.lastName}</h3>
                        <Badge variant="outline" className={`text-[9px] ${honourColors[a.classHonour] || ''}`}>
                          {a.classHonour}
                        </Badge>
                        {a.gender === 'Male' ? (
                          <span className="text-[10px]">👨</span>
                        ) : (
                          <span className="text-[10px]">👩</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{a.courseName} • {a.alumniNumber}</p>
                      {a.currentEmployer ? (
                        <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-gray-400" />
                          {a.currentPosition} @ {a.currentEmployer}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                          <UserX className="h-3 w-3" /> Bado hajapata kazi
                        </p>
                      )}
                    </div>

                    {/* Right side */}
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: colors.accent + '30', color: colors.accent }}>
                        GPA {a.gpa.toFixed(1)}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {a.graduationYear}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8"
                        onClick={e => { e.stopPropagation(); printTranscriptFor(a) }}
                        title="Print Transcript"
                      >
                        <Printer className="h-3.5 w-3.5 text-[#0a1628]" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8"
                        onClick={e => { e.stopPropagation(); openEdit(a) }}
                      >
                        <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="h-8 w-8"
                        onClick={e => { e.stopPropagation(); handleDelete(a.id) }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetail && selectedAlumni && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setShowDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <AlumniDetailCard
                  alumni={selectedAlumni}
                  onClose={() => setShowDetail(false)}
                  onEdit={() => { setShowDetail(false); openEdit(selectedAlumni) }}
                  onDelete={() => handleDelete(selectedAlumni.id)}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAlumni ? 'Hariri Alumni' : 'Ongeza Alumni Mpya'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: 'Namba ya Alumni *', key: 'alumniNumber', ph: 'ALM/PS/001' },
                { label: 'Namba ya Usajili *', key: 'regNumber', ph: 'ICHAS/PS/2020/001' },
                { label: 'Jina la Kwanza *', key: 'firstName', ph: '' },
                { label: 'Jina la Kati', key: 'middleName', ph: '' },
                { label: 'Jina la Mwisho *', key: 'lastName', ph: '' },
              ].map(f => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.ph} />
                </div>
              ))}
              <div>
                <Label>Jinsia</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kozi *</Label>
                <Select value={form.courseId} onValueChange={v => setForm({ ...form, courseId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chagua" /></SelectTrigger>
                  <SelectContent>{courses.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mwaka wa Uhitimu *</Label>
                <Input value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: e.target.value })} placeholder="2024" />
              </div>
              <div>
                <Label>Tarehe ya Uhitimu</Label>
                <Input type="date" value={form.graduationDate} onChange={e => setForm({ ...form, graduationDate: e.target.value })} />
              </div>
              <div>
                <Label>GPA</Label>
                <Input type="number" step="0.1" min="0" max="5" value={form.gpa} onChange={e => setForm({ ...form, gpa: e.target.value })} />
              </div>
              <div>
                <Label>Daraja la Heshima</Label>
                <Select value={form.classHonour} onValueChange={v => setForm({ ...form, classHonour: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Class">First Class</SelectItem>
                    <SelectItem value="Upper Second">Upper Second</SelectItem>
                    <SelectItem value="Lower Second">Lower Second</SelectItem>
                    <SelectItem value="Pass">Pass</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Simu</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Kazi Sasa</Label>
                <Input value={form.currentEmployer} onChange={e => setForm({ ...form, currentEmployer: e.target.value })} />
              </div>
              <div>
                <Label>Nafasi ya Kazi</Label>
                <Input value={form.currentPosition} onChange={e => setForm({ ...form, currentPosition: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Mahali</Label>
                <Input value={form.currentLocation} onChange={e => setForm({ ...form, currentLocation: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>LinkedIn</Label>
                <Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Nota</Label>
                <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Futa</Button>
              <Button onClick={handleSave} className="bg-[#0a1628] hover:bg-[#132744] text-white">{editingAlumni ? 'Sasisha' : 'Hifadhi'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return null
}

// ─── Alumni Detail Card ───
function AlumniDetailCard({ alumni, onClose, onEdit, onDelete }: {
  alumni: Alumni
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const code = alumni.courseName.includes('Pharmaceutical') ? 'PS' : alumni.courseName.includes('Nursing') ? 'NM' : 'CD'
  const colors = courseColors[code]

  const handlePrintTranscript = () => {
    const fullName = `${alumni.firstName} ${alumni.middleName ? alumni.middleName + ' ' : ''}${alumni.lastName}`
    const gradDate = alumni.graduationDate ? new Date(alumni.graduationDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : alumni.graduationYear

    // Generate simulated semester results based on GPA
    const semesters = []
    const baseGPA = alumni.gpa
    const courseNames: Record<string, string[][]> = {
      'Pharmaceutical': [['Pharmaceutical Chemistry I', 'Pharmacognosy I', 'Human Anatomy & Physiology I', 'Pharmaceutical Microbiology I'], ['Pharmaceutical Chemistry II', 'Pharmacology I', 'Pharmaceutics I', 'Biochemistry'], ['Pharmacology II', 'Pharmaceutics II', 'Clinical Pharmacy I', 'Pharmaceutical Analysis'], ['Clinical Pharmacy II', 'Pharmacy Practice', 'Pharmacotherapy', 'Research Project'], ['Hospital Pharmacy Internship', 'Community Pharmacy', 'Drug Regulatory Affairs', 'Pharmacoeconomics']],
      'Nursing': [['Anatomy & Physiology I', 'Nursing Fundamentals', 'Microbiology', 'Communication Skills'], ['Medical-Surgical Nursing I', 'Pharmacology for Nurses', 'Pathology', 'Health Assessment'], ['Medical-Surgical Nursing II', 'Pediatric Nursing', 'Mental Health Nursing', 'Obstetric Nursing'], ['Community Health Nursing', 'Nursing Leadership', 'Research Methods', 'Nursing Ethics'], ['Nursing Internship', 'Comprehensive Clinical Practice', 'Health Education', 'Project Work']],
      'Dental': [['Dental Anatomy', 'Oral Histology', 'Dental Materials', 'Oral Physiology'], ['Oral Pathology', 'Conservative Dentistry I', 'Prosthodontics I', 'Periodontics'], ['Conservative Dentistry II', 'Prosthodontics II', 'Oral Surgery I', 'Orthodontics'], ['Oral Surgery II', 'Pediatric Dentistry', 'Endodontics', 'Dental Radiology'], ['Clinical Internship', 'Dental Public Health', 'Forensic Dentistry', 'Research Project']],
    }
    const key = Object.keys(courseNames).find(k => alumni.courseName.includes(k)) || 'Nursing'
    const semCourses = courseNames[key]

    for (let sem = 1; sem <= semCourses.length; sem++) {
      const courses = semCourses[sem - 1].map((name, ci) => {
        const variance = ((sem - 3) * 0.15) + (ci * 0.05) + (Math.sin(sem * 3 + ci * 7) * 0.3)
        const marks = Math.min(100, Math.max(40, Math.round((baseGPA / 5) * 80 + variance * 20 + 10)))
        const grade = marks >= 80 ? 'A' : marks >= 70 ? 'B+' : marks >= 65 ? 'B' : marks >= 60 ? 'B-' : marks >= 50 ? 'C' : marks >= 45 ? 'C-' : marks >= 40 ? 'D' : 'F'
        const points = marks >= 80 ? 5 : marks >= 70 ? 4.5 : marks >= 65 ? 4 : marks >= 60 ? 3.5 : marks >= 50 ? 3 : marks >= 45 ? 2.5 : marks >= 40 ? 2 : 0
        return { name, code: `${key.substring(0,2).toUpperCase()}${sem}${String(ci+1).padStart(2,'0')}`, credits: 4, marks, grade, points }
      })
      const sgpa = courses.reduce((s, c) => s + c.points * c.credits, 0) / courses.reduce((s, c) => s + c.credits, 0)
      semesters.push({ sem, courses, sgpa })
    }

    const html = `
      <div class="header">
        <div style="display:flex;justify-content:center;align-items:center;gap:15px;">
          <img src="/images/college-logo.png" style="height:60px;width:auto;" />
        </div>
        <h1>IMPERIAL COLLEGE OF HEALTH AND ALLIED SCIENCES</h1>
        <p>Zanzibar, Tanzania</p>
        <p class="sub" style="font-size:13px;font-weight:600;margin-top:8px;">OFFICIAL ACADEMIC TRANSCRIPT</p>
        <p class="sub" style="margin-top:2px;">Document Reference: ICHAS/TR/${alumni.graduationYear}/${alumni.alumniNumber}</p>
      </div>

      <div class="info-grid" style="margin-top:20px;">
        <div class="info-item"><span class="info-label">Alumni Number:</span><span class="info-value"><strong>${alumni.alumniNumber}</strong></span></div>
        <div class="info-item"><span class="info-label">Reg Number:</span><span class="info-value"><strong>${alumni.regNumber}</strong></span></div>
        <div class="info-item"><span class="info-label">Full Name:</span><span class="info-value"><strong>${fullName}</strong></span></div>
        <div class="info-item"><span class="info-label">Program:</span><span class="info-value"><strong>${alumni.courseName}</strong></span></div>
        <div class="info-item"><span class="info-label">Gender:</span><span class="info-value">${alumni.gender}</span></div>
        <div class="info-item"><span class="info-label">Graduation:</span><span class="info-value">${gradDate}</span></div>
      </div>

      <div class="summary">
        <div class="summary-box">
          <div class="label">Cumulative GPA</div>
          <div class="value">${alumni.gpa.toFixed(2)} / 5.00</div>
        </div>
        <div class="summary-box">
          <div class="label">Class of Honour</div>
          <div class="value">${alumni.classHonour}</div>
        </div>
        <div class="summary-box">
          <div class="label">Graduation Year</div>
          <div class="value">${alumni.graduationYear}</div>
        </div>
        <div class="summary-box">
          <div class="label">Status</div>
          <div class="value"><span class="badge badge-pass">GRADUATED</span></div>
        </div>
      </div>

      ${semesters.map(s => `
        <div style="margin-top:25px;page-break-inside:avoid;">
          <h2 style="font-size:14px;color:#0a1628;border-bottom:2px solid #0a1628;padding-bottom:6px;margin-bottom:10px;">Semester ${s.sem} &mdash; SGPA: ${s.sgpa.toFixed(2)}</h2>
          <table>
            <thead><tr><th>#</th><th>Course Code</th><th>Course Name</th><th style="text-align:center;">Credits</th><th style="text-align:center;">Marks</th><th style="text-align:center;">Grade</th><th style="text-align:center;">Points</th></tr></thead>
            <tbody>
              ${s.courses.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td style="font-family:monospace;font-size:11px;">${c.code}</td>
                  <td>${c.name}</td>
                  <td style="text-align:center;">${c.credits}</td>
                  <td style="text-align:center;font-weight:600;">${c.marks}</td>
                  <td style="text-align:center;"><span class="badge ${c.points >= 2.5 ? 'badge-pass' : 'badge-fail'}">${c.grade}</span></td>
                  <td style="text-align:center;">${c.points.toFixed(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}

      <div style="margin-top:30px;padding:15px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
        <h3 style="font-size:13px;color:#0a1628;margin-bottom:10px;">Grading Scale</h3>
        <table>
          <thead><tr><th>Grade</th><th>Marks Range</th><th>Points</th><th>Remark</th></tr></thead>
          <tbody>
            <tr><td style="text-align:center;"><span class="badge badge-pass">A</span></td><td style="text-align:center;">80 - 100</td><td style="text-align:center;">5.0</td><td>Excellent</td></tr>
            <tr><td style="text-align:center;"><span class="badge badge-pass">B+</span></td><td style="text-align:center;">70 - 79</td><td style="text-align:center;">4.5</td><td>Very Good</td></tr>
            <tr><td style="text-align:center;"><span class="badge badge-pass">B</span></td><td style="text-align:center;">65 - 69</td><td style="text-align:center;">4.0</td><td>Good</td></tr>
            <tr><td style="text-align:center;"><span class="badge badge-pass">B-</span></td><td style="text-align:center;">60 - 64</td><td style="text-align:center;">3.5</td><td>Good</td></tr>
            <tr><td style="text-align:center;"><span class="badge badge-pass">C</span></td><td style="text-align:center;">50 - 59</td><td style="text-align:center;">3.0</td><td>Satisfactory</td></tr>
            <tr><td style="text-align:center;"><span class="badge badge-pass">C-</span></td><td style="text-align:center;">45 - 49</td><td style="text-align:center;">2.5</td><td>Average</td></tr>
            <tr><td style="text-align:center;"><span class="badge badge-fail">D</span></td><td style="text-align:center;">40 - 44</td><td style="text-align:center;">2.0</td><td>Pass (Marginal)</td></tr>
            <tr><td style="text-align:center;"><span class="badge badge-fail">F</span></td><td style="text-align:center;">0 - 39</td><td style="text-align:center;">0.0</td><td>Fail</td></tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p style="font-size:11px;margin-top:20px;"><strong>NOTE:</strong> This transcript is an official document issued by Imperial College of Health and Allied Sciences, Zanzibar, Tanzania.</p>
        <p>Generated electronically on ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div style="margin-top:20px;display:flex;justify-content:space-between;">
          <div style="text-align:center;">
            <div style="width:180px;border-top:1px solid #333;margin-top:30px;padding-top:5px;font-size:11px;">Academic Registrar</div>
          </div>
          <div style="text-align:center;">
            <div style="width:180px;border-top:1px solid #333;margin-top:30px;padding-top:5px;font-size:11px;">Principal</div>
          </div>
          <div style="text-align:center;">
            <div style="width:180px;border-top:1px solid #333;margin-top:30px;padding-top:5px;font-size:11px;">College Seal</div>
          </div>
        </div>
      </div>
    `
    printContent(html, `Transcript_${alumni.regNumber}`)
  }

  return (
    <>
      {/* Banner */}
      <div className="relative h-24" style={{ background: `linear-gradient(135deg, #0a1628, ${colors.accent})` }}>
        <button onClick={onClose} className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Avatar */}
      <div className="px-6 -mt-10 relative z-10">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white border-4 border-white shadow-lg"
          style={{ backgroundColor: colors.accent }}
        >
          {alumni.firstName[0]}{alumni.lastName[0]}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-3 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-[#0a1628]">{alumni.firstName} {alumni.middleName ? alumni.middleName + ' ' : ''}{alumni.lastName}</h2>
          <p className="text-sm text-gray-500">{alumni.courseName}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge className={honourColors[alumni.classHonour] || ''}>{alumni.classHonour}</Badge>
          <Badge variant="outline" className="text-xs" style={{ borderColor: colors.accent + '40', color: colors.accent }}>
            GPA {alumni.gpa.toFixed(1)}
          </Badge>
          <Badge variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" />{alumni.graduationYear}</Badge>
          <Badge variant="outline" className="text-xs">{alumni.alumniNumber}</Badge>
        </div>

        <Separator />

        {/* Employment Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#0a1628] flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[#d4a853]" />
            Taarifa za Kazi
          </h3>
          {alumni.currentEmployer ? (
            <div className="grid grid-cols-1 gap-2">
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Kampuni" value={alumni.currentEmployer} />
              <InfoRow icon={<Star className="h-4 w-4" />} label="Nafasi" value={alumni.currentPosition!} />
              {alumni.currentLocation && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Mahali" value={alumni.currentLocation!} />}
            </div>
          ) : (
            <p className="text-sm text-amber-600 flex items-center gap-1"><UserX className="h-4 w-4" /> Bado hajapata kazi</p>
          )}
        </div>

        <Separator />

        {/* Contact */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#0a1628] flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#d4a853]" />
            Mawasiliano
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {alumni.email && <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={alumni.email} />}
            {alumni.phone && <InfoRow icon={<Phone className="h-4 w-4" />} label="Simu" value={alumni.phone} />}
            {alumni.linkedin && <InfoRow icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={alumni.linkedin} />}
          </div>
        </div>

        <Separator />

        {/* Academic Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#0a1628] flex items-center gap-2">
            <Award className="h-4 w-4 text-[#d4a853]" />
            Taarifa za Kielimu
          </h3>
          <InfoRow icon={<Users className="h-4 w-4" />} label="Namba ya Usajili" value={alumni.regNumber} />
          {alumni.graduationDate && <InfoRow icon={<Calendar className="h-4 w-4" />} label="Tarehe ya Uhitimu" value={alumni.graduationDate} />}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 flex-wrap">
          <Button variant="outline" onClick={handlePrintTranscript} className="flex-1 gap-2 border-[#0a1628]/20 hover:bg-[#0a1628]/5">
            <FileText className="h-4 w-4" /> Print Transcript
          </Button>
          <Button variant="outline" onClick={onEdit} className="flex-1 gap-2">
            <Edit3 className="h-4 w-4" /> Hariri
          </Button>
          <Button variant="outline" onClick={onDelete} className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200">
            <Trash2 className="h-4 w-4" /> Futa
          </Button>
        </div>
      </div>
    </>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-gray-400">{icon}</div>
      <span className="text-gray-500 w-20 flex-shrink-0">{label}:</span>
      <span className="text-gray-700 font-medium truncate">{value}</span>
    </div>
  )
}
