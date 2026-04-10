'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminDashboard from './AdminDashboard'
import TeacherDashboard from './TeacherDashboard'
import ExamOffice from './ExamOffice'
import FinanceOffice from './FinanceOffice'
import AlumniDashboard from './AlumniDashboard'
import ProfileView from './ProfileView'
import SystemAdmin from './SystemAdmin'

interface StaffDashboardProps {
  view: string
  userRole: string // 'admin' | 'admission' | 'teacher' | 'exam' | 'finance'
  userId?: string | null
}

// Define which categories each role can access
const roleCategories: Record<string, string[]> = {
  admin: ['admission', 'teaching', 'examination', 'finance', 'alumni', 'system', 'profile'],
  admission: ['admission', 'profile'],
  teacher: ['teaching', 'profile'],
  exam: ['examination', 'profile'],
  finance: ['finance', 'profile'],
}

// Default view per role
const roleDefaults: Record<string, string> = {
  admin: 'admission/dashboard',
  admission: 'admission/dashboard',
  teacher: 'teaching/dashboard',
  exam: 'examination/dashboard',
  finance: 'finance/dashboard',
}

export default function StaffDashboard({ view, userRole, userId }: StaffDashboardProps) {
  // Parse view into category and subview
  // e.g., "admission/students" → category="admission", subview="students"
  // Handle "dashboard" (no prefix) by mapping to role default
  // Handle "profile" as a special case that renders ProfileView

  let category = ''
  let subview = view

  const firstSlash = view.indexOf('/')
  if (firstSlash > -1) {
    category = view.substring(0, firstSlash)
    subview = view.substring(firstSlash + 1)
  } else if (view === 'dashboard') {
    const defaultView = roleDefaults[userRole] || 'dashboard'
    category = defaultView.split('/')[0]
    subview = defaultView.split('/')[1]
  } else if (view === 'profile') {
    category = 'profile'
    subview = 'profile'
  }

  // Check access
  const allowedCategories = roleCategories[userRole] || []
  if (category && !allowedCategories.includes(category) && !allowedCategories.includes(view)) {
    // Show access denied
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-600">Access Denied</h2>
          <p className="text-gray-400 mt-2">You don&apos;t have permission to view this section.</p>
        </div>
      </div>
    )
  }

  // Render the appropriate dashboard based on category
  const renderContent = () => {
    if (view === 'profile' || category === 'profile') {
      return <ProfileView userId={userId || ''} role={userRole} />
    }

    switch (category) {
      case 'admission':
        return <AdminDashboard view={subview} />
      case 'teaching':
        return <TeacherDashboard view={subview} teacherId={userId || null} />
      case 'examination':
        return <ExamOffice view={subview} />
      case 'finance':
        return <FinanceOffice view={subview} />
      case 'alumni':
        return <AlumniDashboard view={subview} />
      case 'system':
        return <SystemAdmin view={subview} />
      default:
        // Fallback: check if view matches an old pattern and route appropriately
        if (['students', 'teachers', 'courses', 'subjects', 'staff', 'semester-transfer', 'transcripts'].includes(view)) {
          return <AdminDashboard view={view} />
        }
        if (['subjects', 'grades', 'students', 'notes', 'quizzes', 'assignments'].includes(view)) {
          return <TeacherDashboard view={view} teacherId={userId || null} />
        }
        if (['results', 'publish', 'student-results', 'class-results', 'transcript', 'result-statement', 'permissions', 'transcript-batches', 'reports', 'student-info', 'lock-results', 'coursework-templates'].includes(view)) {
          return <ExamOffice view={view} />
        }
        if (['structure', 'payments', 'reports'].includes(view)) {
          return <FinanceOffice view={view} />
        }
        if (['directory'].includes(view)) {
          return <AlumniDashboard view={view} />
        }
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
