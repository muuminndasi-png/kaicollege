'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  User, Camera, Eye, EyeOff, Edit, Save, X, Shield, Lock,
  Mail, Phone, GraduationCap, Building2, BookOpen, Award,
  CreditCard, Calendar, Hash,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { getAcademicLevel, getIntakeLabel } from '@/lib/academic-levels'
import { useAppStore } from '@/store/college-store'

interface ProfileViewProps {
  userId: string
  role: string
}

interface UserData {
  id: string
  username: string
  role: string
  relatedId: string | null
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  profilePhoto: string | null
  mustChangePassword: boolean
  lastLogin: string | null
  createdAt: string
}

interface StudentData {
  id: string
  regNumber: string
  firstName: string
  middleName?: string | null
  lastName: string
  gender: string
  dateOfBirth?: string | null
  courseId: string
  year: number
  semester: number
  intake: string
  status: string
  course?: { id: string; name: string; code: string; duration: string } | null
}

interface TeacherData {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  qualification?: string | null
  department: string
  specialization?: string | null
  status: string
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'student': return 'Student'
    case 'teacher': return 'Lecturer'
    case 'admin': return 'Administrator'
    case 'exam': return 'Exam Officer'
    case 'finance': return 'Finance Officer'
    default: return role
  }
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'student': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'teacher': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'admin': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'exam': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'finance': return 'bg-rose-100 text-rose-700 border-rose-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getInitials(firstName: string, lastName: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() || ''
  const l = lastName?.charAt(0)?.toUpperCase() || ''
  return f + l
}

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (!password || password.length === 0) {
    return { label: '', color: 'bg-gray-200', width: 'w-0' }
  }
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' }
  if (score <= 3) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/3' }
  return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' }
}

function resizeImageToBase64(file: File, maxWidth: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas context failed')); return }
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        // Check size (~500KB base64)
        if (dataUrl.length > 700000) {
          reject(new Error('Image is too large. Please choose a smaller image.'))
          return
        }
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export default function ProfileView({ userId, role }: ProfileViewProps) {
  // Data state
  const [user, setUser] = useState<UserData | null>(null)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Change password state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Notification settings (local state for now)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)

  // Fetch data on mount
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const profileRes = await fetch(`/api/auth/profile?userId=${userId}`)
      if (!profileRes.ok) throw new Error('Failed to fetch profile')
      const profileJson = await profileRes.json()
      const userData = profileJson.user
      setUser(userData)
      setEditFirstName(userData.firstName || '')
      setEditLastName(userData.lastName || '')
      setEditEmail(userData.email || '')
      setEditPhone(userData.phone || '')

      // Fetch role-specific data
      if (userData.role === 'student' && userData.relatedId) {
        const studentRes = await fetch(`/api/students/${userData.relatedId}`)
        if (studentRes.ok) {
          const studentJson = await studentRes.json()
          setStudentData(studentJson)
        }
      } else if (userData.role === 'teacher' && userData.relatedId) {
        const teacherRes = await fetch(`/api/teachers/${userData.relatedId}`)
        if (teacherRes.ok) {
          const teacherJson = await teacherRes.json()
          setTeacherData(teacherJson)
        }
      }
    } catch (error) {
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Handle photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    try {
      setUploadingPhoto(true)
      const base64 = await resizeImageToBase64(file)

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profilePhoto: base64 }),
      })

      if (!res.ok) throw new Error('Failed to upload photo')
      const json = await res.json()
      setUser(json.user)
      // Update global store so sidebar/header reflect the change
      const storeUser = useAppStore.getState().currentUser
      if (storeUser) {
        useAppStore.getState().setCurrentUser({
          ...storeUser,
          user: { ...storeUser.user, profilePhoto: json.user.profilePhoto },
        })
      }
      toast.success('Profile photo updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          firstName: editFirstName,
          lastName: editLastName,
          email: editEmail,
          phone: editPhone,
        }),
      })

      if (!res.ok) throw new Error('Failed to update profile')
      const json = await res.json()
      setUser(json.user)
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (user) {
      setEditFirstName(user.firstName || '')
      setEditLastName(user.lastName || '')
      setEditEmail(user.email || '')
      setEditPhone(user.phone || '')
    }
    setIsEditing(false)
  }

  // Handle change password
  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Please enter your current password')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    try {
      setChangingPassword(true)
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'Failed to change password')
        return
      }

      toast.success(json.message || 'Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      // Update mustChangePassword state
      if (user) {
        setUser({ ...user, mustChangePassword: false })
      }
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  // Role-specific subtitle
  const getRoleSubtitle = (): string => {
    if (role === 'student' && studentData?.course) {
      const level = getAcademicLevel(studentData.year)
      return `${level} - ${studentData.course.name}`
    }
    if (role === 'teacher' && teacherData) {
      return `${teacherData.department} Department`
    }
    if (role === 'admin') return 'System Administrator'
    if (role === 'exam') return 'Examination Office'
    if (role === 'finance') return 'Finance Office'
    return getRoleLabel(role)
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto space-y-6 p-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-[900px] mx-auto p-4">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-gray-500">Failed to load profile data.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const strength = getPasswordStrength(newPassword)
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username

  return (
    <div className="max-w-[900px] mx-auto space-y-6 p-4">
      {/* Must Change Password Warning */}
      {user.mustChangePassword && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="border-amber-300 bg-amber-50">
            <Shield className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Password Change Required</AlertTitle>
            <AlertDescription className="text-amber-700">
              You must change your password before accessing other features. Please set a new password below.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* ===== Profile Header Card ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-[#0a1628] to-[#162040] px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div
                className="relative group cursor-pointer flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-3 border-white/20 shadow-lg">
                  {user.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={`${fullName}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#d4a853] to-[#b8862d] flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {getInitials(user.firstName, user.lastName)}
                      </span>
                    </div>
                  )}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {uploadingPhoto ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-white mb-1" />
                      <span className="text-[10px] text-white font-medium">Change Photo</span>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Name & Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-white">{fullName}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge className={`${getRoleBadgeColor(role)} border`}>
                    {getRoleSubtitle()}
                  </Badge>
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-gray-300 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{user.email || 'No email'}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-gray-300 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone || 'No phone'}</span>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <><X className="w-4 h-4 mr-2" /> Cancel</>
                    ) : (
                      <><Edit className="w-4 h-4 mr-2" /> Edit Profile</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ===== Profile Information Card ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-[#d4a853]" />
              Profile Information
            </CardTitle>
            <CardDescription>
              {isEditing ? 'Edit your personal information below' : 'Your personal information and account details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFirstName">First Name</Label>
                    <Input
                      id="editFirstName"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="First Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLastName">Last Name</Label>
                    <Input
                      id="editLastName"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Last Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="editEmail"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Email"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="editPhone"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Phone"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="bg-[#d4a853] hover:bg-[#c49843] text-white"
                  >
                    {savingProfile ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                {/* Common fields for all roles */}
                <InfoItem icon={User} label="First Name" value={user.firstName || '-'} />
                <InfoItem icon={User} label="Last Name" value={user.lastName || '-'} />
                <InfoItem icon={Mail} label="Email" value={user.email || '-'} />
                <InfoItem icon={Phone} label="Phone" value={user.phone || '-'} />
                <InfoItem icon={Hash} label="Username" value={user.username || '-'} />

                {/* Student-specific fields */}
                {role === 'student' && studentData && (
                  <>
                    <Separator className="sm:col-span-2 my-1" />
                    <InfoItem icon={Hash} label="Registration Number" value={studentData.regNumber} highlight />
                    <InfoItem
                      icon={BookOpen}
                      label="Course"
                      value={studentData.course ? `${studentData.course.name} (${studentData.course.code})` : '-'}
                      highlight
                    />
                    <InfoItem icon={GraduationCap} label="Academic Level" value={getAcademicLevel(studentData.year)} highlight />
                    <InfoItem
                      icon={Calendar}
                      label="Year / Semester"
                      value={`Year ${studentData.year} / Semester ${studentData.semester}`}
                      highlight
                    />
                    <InfoItem icon={CreditCard} label="Intake" value={getIntakeLabel(studentData.intake)} highlight />
                    <InfoItem icon={Award} label="NTA Level" value={getAcademicLevel(studentData.year)} highlight />
                    <InfoItem icon={User} label="Gender" value={studentData.gender || '-'} highlight />
                    <InfoItem icon={Calendar} label="Date of Birth" value={studentData.dateOfBirth || '-'} highlight />
                  </>
                )}

                {/* Teacher-specific fields */}
                {role === 'teacher' && teacherData && (
                  <>
                    <Separator className="sm:col-span-2 my-1" />
                    <InfoItem icon={Hash} label="Employee ID" value={teacherData.employeeId} highlight />
                    <InfoItem icon={Building2} label="Department" value={teacherData.department} highlight />
                    <InfoItem icon={Award} label="Qualification" value={teacherData.qualification || '-'} highlight />
                    <InfoItem icon={BookOpen} label="Specialization" value={teacherData.specialization || '-'} highlight />
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Change Password Card ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-[#d4a853]" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password. Must be at least 6 characters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {newPassword.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`text-xs ${strength.label === 'Weak' ? 'text-red-500' : strength.label === 'Fair' ? 'text-amber-500' : 'text-emerald-500'}`}>
                    Password strength: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`pl-10 pr-10 ${
                    confirmPassword.length > 0 && confirmPassword !== newPassword
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : confirmPassword.length > 0 && confirmPassword === newPassword
                        ? 'border-emerald-500 focus-visible:ring-emerald-500'
                        : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {confirmPassword.length > 0 && confirmPassword === newPassword && (
                <p className="text-xs text-emerald-500">Passwords match</p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="bg-[#0a1628] hover:bg-[#162040] text-white"
            >
              {changingPassword ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Change Password
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Notification Settings Card ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="w-5 h-5 text-[#d4a853]" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive login notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Login notifications via Email</Label>
                <p className="text-xs text-gray-500">Receive an email when your account is accessed</p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Login notifications via SMS</Label>
                <p className="text-xs text-gray-500">Receive an SMS when your account is accessed</p>
              </div>
              <Switch
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

/* ===== Info Item Sub-component ===== */
function InfoItem({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`flex items-start gap-3 py-1 ${highlight ? 'pl-2' : ''}`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlight ? 'text-[#d4a853]' : 'text-gray-400'}`} />
      <div className="min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  )
}
