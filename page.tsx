'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/college-store'
import LoginScreen from '@/components/college/LoginScreen'
import AppSidebar from '@/components/college/AppSidebar'
import StaffDashboard from '@/components/college/StaffDashboard'
import StudentDashboard from '@/components/college/StudentDashboard'
import AlumniDashboard from '@/components/college/AlumniDashboard'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster, toast } from 'sonner'

export default function Home() {
  const {
    currentRole,
    currentView,
    currentUserId,
    currentUser,
    setCurrentRole,
    setCurrentUserId,
    setCurrentView,
    setSidebarOpen,
    logout,
    sessionToken,
  } = useAppStore()

  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Session validation - periodically check if session is still valid
  const checkSession = useCallback(async () => {
    const token = useAppStore.getState().sessionToken
    if (!token) return

    try {
      const res = await fetch('/api/sessions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: token }),
      })
      const data = await res.json()

      if (!data.valid) {
        // Session was invalidated (e.g., logged in from another device)
        clearInterval(sessionCheckInterval.current!)
        useAppStore.getState().setSessionInvalidated(true)
        logout()
        toast.error('Your session has been terminated. You may have logged in from another device.', {
          duration: 6000,
        })
      }
    } catch {
      // Network error - don't logout, just try again later
    }
  }, [logout])

  // Start session checking when logged in as staff
  useEffect(() => {
    if (currentRole && currentRole !== 'student' && sessionToken) {
      // Check every 30 seconds
      sessionCheckInterval.current = setInterval(checkSession, 30000)
      // Also check immediately
      checkSession()

      return () => {
        if (sessionCheckInterval.current) {
          clearInterval(sessionCheckInterval.current)
        }
      }
    } else {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current)
      }
    }
  }, [currentRole, sessionToken, checkSession])

  const handleRoleSelect = (role: string, userId?: string) => {
    setCurrentRole(role as any)
    if (userId) setCurrentUserId(userId)
    setCurrentView('dashboard')
  }

  const handleNavigate = (view: string) => {
    setCurrentView(view)
  }

  const handleLogout = async () => {
    const token = useAppStore.getState().sessionToken
    const userId = useAppStore.getState().currentUserId

    // Notify server about logout
    if (token && userId) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: token, userId }),
        })
      } catch {
        // Silently fail - logout locally anyway
      }
    }

    // Clear session token from localStorage
    localStorage.removeItem('ichas_session_token')

    // Clear interval
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current)
    }

    logout()
    toast.success('Logged out successfully')
  }

  // Determine the effective role for sidebar (staff or student or alumni)
  const effectiveRole = currentRole === 'student' ? 'student' : currentRole === 'alumni' ? 'alumni' : 'staff'
  const actualRole = currentUser?.role || currentRole

  // Role Selection / Login Screen
  if (!currentRole) {
    return (
      <>
        <LoginScreen onRoleSelect={handleRoleSelect} />
        <Toaster position="top-right" richColors />
      </>
    )
  }

  const renderDashboard = () => {
    if (currentRole === 'student') {
      return <StudentDashboard view={currentView} studentId={currentUserId} />
    }
    if (currentRole === 'alumni') {
      return <AlumniDashboard view={currentView} />
    }
    // All staff roles use the unified StaffDashboard
    return (
      <StaffDashboard
        view={currentView}
        userRole={actualRole}
        userId={currentUserId}
      />
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <AppSidebar
        currentRole={effectiveRole}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isOpen={useAppStore.getState().sidebarOpen}
        onToggle={() => setSidebarOpen(!useAppStore.getState().sidebarOpen)}
      />

      {/* Main Content */}
      <main className="flex-1 transition-all duration-300">
        <div className="pt-16 md:pt-0 min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderDashboard()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  )
}
