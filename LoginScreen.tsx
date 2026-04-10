'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Building2, MapPin, Heart, Shield, ArrowLeft, Eye, EyeOff, Loader2, KeyRound, Lock, AlertCircle, X, ChevronDown, ChevronUp, Info, MonitorSmartphone, AlertTriangle, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import Image from 'next/image'
import { useAppStore } from '@/store/college-store'

interface LoginScreenProps {
  onRoleSelect: (role: string, userId?: string) => void
}

const roles = [
  {
    key: 'student',
    title: 'Student',
    description: 'View results, fees & academic progress',
    icon: GraduationCap,
    accent: '#0d9488',
    accentHover: '#0f766e',
    bgAccent: 'rgba(13, 148, 136, 0.12)',
  },
  {
    key: 'staff',
    title: 'Staff Portal',
    description: 'Admissions, teaching, exams & finance',
    icon: Building2,
    accent: '#d97706',
    accentHover: '#b45309',
    bgAccent: 'rgba(217, 119, 6, 0.12)',
  },
  {
    key: 'alumni',
    title: 'Alumni',
    description: 'Graduate network & connections',
    icon: Award,
    accent: '#7c3aed',
    accentHover: '#6d28d9',
    bgAccent: 'rgba(124, 58, 237, 0.12)',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
} as const

const formVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: { duration: 0.3, ease: 'easeIn' as const },
  },
} as const

export default function LoginScreen({ onRoleSelect }: LoginScreenProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [changePasswordData, setChangePasswordData] = useState({
    userId: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)
  const [changePasswordError, setChangePasswordError] = useState('')
  const [pendingLogin, setPendingLogin] = useState<{
    role: string
    userId: string
    loginData: any
  } | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const sessionInvalidated = useAppStore((s) => s.sessionInvalidated)
  const setSessionInvalidated = useAppStore((s) => s.setSessionInvalidated)

  const selectedRoleData = roles.find((r) => r.key === selectedRole)

  const handleRoleClick = (roleKey: string) => {
    setSelectedRole(roleKey)
    setUsername('')
    setPassword('')
    setError('')
    setShowPassword(false)
    setShowCredentials(false)
  }

  const handleBack = () => {
    setSelectedRole(null)
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      // Check if password change is required
      if (data.mustChangePassword) {
        setPendingLogin({
          role: selectedRole === 'staff' ? 'staff' : selectedRole === 'alumni' ? 'alumni' : data.role,
          userId: data.user.id,
          loginData: data,
        })
        setChangePasswordData({
          userId: data.user.id,
          currentPassword: password,
          newPassword: '',
          confirmPassword: '',
        })
        setShowChangePassword(true)
        setIsLoading(false)
        return
      }

      // Successful login - store session token
      if (data.sessionToken) {
        useAppStore.getState().setSessionToken(data.sessionToken)
        localStorage.setItem('ichas_session_token', data.sessionToken)
      }

      if (selectedRole === 'staff') {
        // Store full user data so StaffDashboard knows the actual role
        useAppStore.getState().setCurrentUser(data)
        useAppStore.getState().setIsAuthenticated(true)
        onRoleSelect('staff', data.user.id)
      } else if (selectedRole === 'alumni') {
        useAppStore.getState().setCurrentUser(data)
        useAppStore.getState().setIsAuthenticated(true)
        onRoleSelect('alumni', data.user.relatedId || data.user.id)
      } else {
        // Student login - use relatedId (Student record ID) so data fetch works correctly
        useAppStore.getState().setCurrentUser(data)
        useAppStore.getState().setIsAuthenticated(true)
        onRoleSelect('student', data.user.relatedId || data.user.id)
      }
    } catch {
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangePasswordError('')

    if (changePasswordData.newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters')
      return
    }

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setChangePasswordError('Passwords do not match')
      return
    }

    setChangePasswordLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: changePasswordData.userId,
          currentPassword: changePasswordData.currentPassword,
          newPassword: changePasswordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setChangePasswordError(data.error || 'Failed to change password')
        setChangePasswordLoading(false)
        return
      }

      // Password changed, proceed with login
      setShowChangePassword(false)
      toast.success('Password changed successfully!')

      if (pendingLogin) {
        // Store session token after password change
        if (pendingLogin.loginData?.sessionToken) {
          useAppStore.getState().setSessionToken(pendingLogin.loginData.sessionToken)
          localStorage.setItem('ichas_session_token', pendingLogin.loginData.sessionToken)
        }
        if (pendingLogin.role === 'staff') {
          useAppStore.getState().setCurrentUser(pendingLogin.loginData)
          useAppStore.getState().setIsAuthenticated(true)
        } else if (pendingLogin.role === 'alumni') {
          useAppStore.getState().setCurrentUser(pendingLogin.loginData)
          useAppStore.getState().setIsAuthenticated(true)
          onRoleSelect('alumni', pendingLogin.loginData.user.relatedId || pendingLogin.userId)
          return
        } else {
          // Student
          useAppStore.getState().setCurrentUser(pendingLogin.loginData)
          useAppStore.getState().setIsAuthenticated(true)
          onRoleSelect('student', pendingLogin.loginData.user.relatedId || pendingLogin.userId)
          return
        }
        onRoleSelect(pendingLogin.role, pendingLogin.userId)
      }
    } catch {
      setChangePasswordError('Network error. Please try again.')
      setChangePasswordLoading(false)
    }
  }

  const handleForgotPassword = () => {
    toast.info('Please contact the system administrator to reset your password.', {
      duration: 4000,
    })
  }

  const isStudent = selectedRole === 'student'
  const isAlumni = selectedRole === 'alumni'
  const RoleIcon = selectedRoleData?.icon

  const loginFormContent = selectedRoleData ? (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mx-auto w-full max-w-md"
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        className="mb-6 flex items-center gap-2 text-sm text-[#94a3b8] transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to roles
      </button>

      {/* Login Card */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-md">
        {/* Card Header with role accent */}
        <div
          className="px-8 py-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${selectedRoleData.accent}20, ${selectedRoleData.accent}08)`,
          }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: selectedRoleData.bgAccent,
              border: `1px solid ${selectedRoleData.accent}30`,
            }}
          >
            {RoleIcon && <RoleIcon className="h-8 w-8" style={{ color: selectedRoleData.accent }} />}
          </div>
          <h2 className="text-xl font-bold text-white">
            {selectedRoleData.title} Login
          </h2>
          <p className="mt-1 text-sm text-[#94a3b8]">
            {selectedRoleData.description}
          </p>
        </div>

        {/* Card Body */}
        <div className="px-8 py-6">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username / Registration Number */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-[#cbd5e1]">
                {isStudent ? 'Registration Number' : isAlumni ? 'Alumni Number or Email' : 'Email or Username'}
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError('')
                  }}
                  placeholder={isStudent ? 'e.g. NS0001/0009/2024' : 'e.g. admin@ichas.ac.tz'}
                  className="h-11 border-white/[0.1] bg-white/[0.06] pl-10 text-white placeholder:text-[#4b5563] focus:border-[#d4a853]/50 focus:ring-[#d4a853]/30"
                  autoComplete="username"
                  autoFocus
                />
                {RoleIcon && <RoleIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4b5563]" />}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-[#cbd5e1]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter your password"
                  className="h-11 border-white/[0.1] bg-white/[0.06] pl-10 pr-10 text-white placeholder:text-[#4b5563] focus:border-[#d4a853]/50 focus:ring-[#d4a853]/30"
                  autoComplete="current-password"
                />
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4b5563]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4b5563] transition-colors hover:text-[#94a3b8]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-[#d4a853] transition-colors hover:text-[#e6bc6a] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full font-semibold text-white transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundColor: isLoading ? '#64748b' : selectedRoleData.accent,
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>

            {/* Credentials guide */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
              <button
                type="button"
                onClick={() => setShowCredentials(!showCredentials)}
                className="flex w-full items-center justify-center gap-2 text-xs text-[#94a3b8] transition-colors hover:text-[#d4a853]"
              >
                <Info className="h-3.5 w-3.5" />
                <span>Show Login Credentials & Guide</span>
                {showCredentials ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <AnimatePresence>
                {showCredentials && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 text-left text-[11px] leading-relaxed text-[#94a3b8]">
                      {selectedRole === 'student' ? (
                        <>
                          <div className="rounded bg-white/[0.04] p-2">
                            <p className="font-semibold text-[#d4a853]">🎓 Student Login:</p>
                            <p className="mt-1">Username = <span className="font-mono text-white">Registration Number</span></p>
                            <p>Password = <span className="font-mono text-white">ichas2025</span> (default)</p>
                          </div>
                          <div className="rounded bg-white/[0.04] p-2">
                            <p className="font-semibold text-[#d4a853]">Format ya Namba ya Usajili:</p>
                            <p className="mt-1"><span className="font-mono text-white">NS</span> = Nursing (NMT)</p>
                            <p><span className="font-mono text-white">NP</span> = Pharmacy (PST)</p>
                            <p><span className="font-mono text-white">NE</span> = Dentistry (CDT)</p>
                            <p className="mt-1 text-[#64748b]">Mfano: NS0001/0009/2024</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="rounded bg-white/[0.04] p-2">
                            <p className="font-semibold text-[#d4a853]">🔐 System Admin:</p>
                            <p className="mt-1">admin@ichas.ac.tz / <span className="font-mono text-white">admin123</span></p>
                            <p className="text-[10px] text-[#64748b] mt-1">Ana-access sehemu ZOTE</p>
                          </div>
                          <div className="rounded bg-white/[0.04] p-2">
                            <p className="font-semibold text-[#d4a853]">📋 Admission Office:</p>
                            <p className="mt-1">admission@ichas.ac.tz / <span className="font-mono text-white">admission123</span></p>
                            <p className="text-[10px] text-[#64748b] mt-1">Anasajili wanafunzi tu</p>
                          </div>
                          <div className="rounded bg-white/[0.04] p-2">
                            <p className="font-semibold text-[#d4a853]">👨‍🏫 Lecturer:</p>
                            <p className="mt-1">dr. fatma.mohamed@ichas.ac.tz / <span className="font-mono text-white">ichas2025</span></p>
                          </div>
                          <div className="rounded bg-white/[0.04] p-2">
                            <p className="font-semibold text-[#d4a853]">📝 Exam Office:</p>
                            <p className="mt-1">exam@ichas.ac.tz / <span className="font-mono text-white">exam123</span></p>
                          </div>
                          <div className="rounded bg-white/[0.04] p-2">
                            <p className="font-semibold text-[#d4a853]">💰 Finance Office:</p>
                            <p className="mt-1">finance@ichas.ac.tz / <span className="font-mono text-white">finance123</span></p>
                          </div>
                          <div className="mt-1 rounded bg-amber-500/10 p-2">
                            <p className="text-[10px] text-amber-400">💡 System Admin ana uwezo wa ku-access sehemu zote</p>
                          </div>
                        </>
                      )}
                      <p className="text-center text-[#4b5563]">
                        ⚠️ Badilisha nywila mara ya kwanza unapo-login
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  ) : null

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a1628]">
      {/* Background gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0f2035] to-[#0a1628]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(13,148,136,0.08)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(212,168,83,0.06)_0%,_transparent_50%)]" />

      {/* Decorative floating orbs */}
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-[rgba(13,148,136,0.04)] blur-3xl" />
      <div className="absolute bottom-32 right-10 h-80 w-80 rounded-full bg-[rgba(212,168,83,0.04)] blur-3xl" />
      <div className="absolute top-1/2 left-1/3 h-48 w-48 rounded-full bg-[rgba(37,99,235,0.03)] blur-3xl" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8">
        {/* Header / College Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8 flex flex-col items-center text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="relative mb-5"
          >
            <div className="absolute inset-0 rounded-2xl bg-[rgba(212,168,83,0.2)] blur-xl" />
            <div className="relative overflow-hidden rounded-2xl border-4 border-[#d4a853]/30 bg-white/10 p-1 backdrop-blur-sm">
              <Image
                src="/images/college-logo.png"
                alt="Imperial College Logo"
                width={220}
                height={140}
                className="h-[100px] w-auto rounded-xl object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Gold line separator */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="mb-4 h-[2px] w-24 bg-gradient-to-r from-transparent via-[#d4a853] to-transparent"
          />

          {/* College Name */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-2 max-w-2xl text-xl font-bold tracking-wide text-white sm:text-2xl md:text-3xl lg:text-[2.25rem]"
          >
            IMPERIAL COLLEGE OF HEALTH
            <br />
            <span className="text-[#d4a853]">AND ALLIED SCIENCES</span>
          </motion.h1>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-3 flex items-center gap-2 text-xs text-[#94a3b8] sm:text-sm"
          >
            <MapPin className="h-3 w-3 text-[#d4a853]" />
            <span>Zanzibar, Tanzania</span>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="max-w-md text-xs italic text-[#64748b] sm:text-sm"
          >
            &quot;Shaping the Future of Healthcare Education&quot;
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Session Invalidated Warning */}
          {sessionInvalidated && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-center"
            >
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-red-400" />
              <h3 className="text-sm font-semibold text-red-300">Session Terminated</h3>
              <p className="mt-1 text-xs text-red-400/80">
                Your session was ended because you logged in from another device or the system administrator terminated it.
              </p>
              <button
                onClick={() => setSessionInvalidated(false)}
                className="mt-2 text-xs font-medium text-red-300 underline hover:text-red-200"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {!selectedRole ? (
            /* Role Selection View */
            <motion.div
              key="roles"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              {/* Section title */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="mb-6 flex items-center gap-3"
              >
                <div className="h-px w-8 bg-[#1a3a5c] sm:w-12" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b] sm:text-sm">
                  Select Your Role
                </span>
                <div className="h-px w-8 bg-[#1a3a5c] sm:w-12" />
              </motion.div>

              {/* Role Cards Grid */}
              <motion.div
                className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2"
              >
                {roles.map((role) => {
                  const IconComponent = role.icon
                  return (
                    <motion.div
                      key={role.key}
                      variants={itemVariants}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="group cursor-pointer"
                      onClick={() => handleRoleClick(role.key)}
                    >
                      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.07] sm:p-7">
                        {/* Top accent line */}
                        <div
                          className="absolute left-0 top-0 h-1 w-full opacity-70 transition-all duration-300 group-hover:opacity-100"
                          style={{ background: `linear-gradient(90deg, ${role.accent}, transparent)` }}
                        />

                        {/* Glow effect on hover */}
                        <div
                          className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                          style={{ backgroundColor: `${role.accent}15` }}
                        />

                        {/* Icon */}
                        <div
                          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 sm:h-[72px] sm:w-[72px]"
                          style={{
                            backgroundColor: role.bgAccent,
                            border: `1px solid ${role.accent}25`,
                          }}
                        >
                          <IconComponent
                            className="h-7 w-7 transition-transform duration-300 group-hover:scale-110 sm:h-8 sm:w-8"
                            style={{ color: role.accent }}
                          />
                        </div>

                        {/* Title */}
                        <h3 className="mb-2 text-center text-lg font-bold text-white sm:text-xl">
                          {role.title}
                        </h3>

                        {/* Description */}
                        <p className="mb-5 text-center text-sm leading-relaxed text-[#94a3b8]">
                          {role.description}
                        </p>

                        {/* Enter Button */}
                        <div className="flex justify-center">
                          <Button
                            className="w-full max-w-[180px] font-semibold text-white transition-all duration-300 hover:shadow-lg"
                            style={{
                              backgroundColor: role.accent,
                              '--tw-shadow-color': `${role.accent}40`,
                            } as React.CSSProperties}
                            onMouseEnter={(e) => {
                              ;(e.currentTarget as HTMLElement).style.backgroundColor = role.accentHover
                            }}
                            onMouseLeave={(e) => {
                              ;(e.currentTarget as HTMLElement).style.backgroundColor = role.accent
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRoleClick(role.key)
                            }}
                          >
                            Enter
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </motion.div>
          ) : (
            /* Login Form View */
            <motion.div
              key="login"
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              {loginFormContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="sm:max-w-md border-white/[0.1] bg-[#0f1d32] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-[#d4a853]" />
              Change Your Password
            </DialogTitle>
            <DialogDescription className="text-[#94a3b8]">
              You must change your password before continuing. Create a new password with at least 6 characters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm text-[#cbd5e1]">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={changePasswordData.newPassword}
                onChange={(e) => setChangePasswordData({ ...changePasswordData, newPassword: e.target.value })}
                placeholder="Enter new password (min. 6 characters)"
                className="h-11 border-white/[0.1] bg-white/[0.06] text-white placeholder:text-[#4b5563] focus:border-[#d4a853]/50 focus:ring-[#d4a853]/30"
                autoFocus
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-[#cbd5e1]">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={changePasswordData.confirmPassword}
                onChange={(e) => setChangePasswordData({ ...changePasswordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="h-11 border-white/[0.1] bg-white/[0.06] text-white placeholder:text-[#4b5563] focus:border-[#d4a853]/50 focus:ring-[#d4a853]/30"
              />
            </div>

            {/* Change Password Error */}
            {changePasswordError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {changePasswordError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowChangePassword(false)
                  setPendingLogin(null)
                }}
                className="flex-1 border-white/[0.1] bg-transparent text-[#94a3b8] hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changePasswordLoading}
                className="flex-1 bg-[#d4a853] font-semibold text-white hover:bg-[#c49a47]"
              >
                {changePasswordLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Update Password
                  </span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Zanzibar background image overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 z-[5] h-48 sm:h-64 lg:h-80">
        <Image
          src="/images/zanzibar-bg.png"
          alt="Zanzibar"
          fill
          className="object-cover object-top"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-[#0a1628]/70 to-transparent" />
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="absolute inset-x-0 bottom-0 z-20 px-4 pb-5 pt-12"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span>&copy; 2025 Imperial College of Health and Allied Sciences.</span>
          </div>
          <p className="text-[10px] text-[#475569] sm:text-xs">
            All Rights Reserved.
          </p>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#475569]">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-[#e11d48]" />
            <span>in Zanzibar</span>
            <Shield className="ml-1 h-3 w-3 text-[#d4a853]" />
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
