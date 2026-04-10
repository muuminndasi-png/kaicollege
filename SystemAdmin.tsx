'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users,
  Settings,
  Search,
  Plus,
  Pencil,
  KeyRound,
  ShieldCheck,
  ShieldX,
  LogOut,
  Monitor,
  Clock,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { useAppStore } from '@/store/college-store'

interface SystemAdminProps {
  view: string
}

// ─── Helper: API headers ──────────────────────────────────────────────
function getHeaders(): Record<string, string> {
  const sessionToken = useAppStore.getState().currentUser?.sessionToken
  return {
    'Content-Type': 'application/json',
    ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
  }
}

// ─── Helper: Role badge config ────────────────────────────────────────
const roleConfig: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrator', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  admission: { label: 'Admission', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  teacher: { label: 'Lecturer', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  exam: { label: 'Exam Officer', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  finance: { label: 'Finance', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  student: { label: 'Student', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  alumni: { label: 'Alumni', color: 'bg-teal-100 text-teal-700 border-teal-200' },
}

const actionColors: Record<string, string> = {
  LOGIN: 'bg-emerald-100 text-emerald-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  USER_UPDATED: 'bg-blue-100 text-blue-700',
  SESSION_INVALIDATED: 'bg-red-100 text-red-700',
  PASSWORD_RESET: 'bg-amber-100 text-amber-700',
  PASSWORD_CHANGED: 'bg-violet-100 text-violet-700',
  PROFILE_UPDATED: 'bg-sky-100 text-sky-700',
}

// ─── Fade-in animation wrapper ────────────────────────────────────────
const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

// ═══════════════════════════════════════════════════════════════════════
//  STAFF MANAGEMENT VIEW
// ═══════════════════════════════════════════════════════════════════════
function StaffManagementView() {
  const [staff, setStaff] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  // Selected user
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'teacher',
  }
  const [addForm, setAddForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

  const fetchStaff = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/users', { headers: getHeaders() })
      if (!res.ok) throw new Error('Failed to fetch staff')
      const data = await res.json()
      // Filter out student users — show only staff roles
      const staffUsers = (data.users || []).filter(
        (u: any) => !['student', 'alumni'].includes(u.role)
      )
      setStaff(staffUsers)
    } catch {
      toast.error('Failed to load staff list')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // ─── Filter logic ───────────────────────────────────────────────────
  const filteredStaff = staff.filter((user) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      !search ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.username || '').toLowerCase().includes(searchLower)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  // ─── Add Staff ──────────────────────────────────────────────────────
  const handleOpenAdd = () => {
    setAddForm(emptyForm)
    setAddDialogOpen(true)
  }

  const handleAddStaff = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.email) {
      toast.error('Please fill in first name, last name, and email')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          username: addForm.email,
          password: 'ichas2025',
          role: addForm.role,
          firstName: addForm.firstName,
          lastName: addForm.lastName,
          email: addForm.email,
          phone: addForm.phone || null,
          mustChangePassword: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create staff')
      }
      toast.success(`Staff member ${addForm.firstName} ${addForm.lastName} created successfully. Default password: ichas2025`)
      setAddDialogOpen(false)
      fetchStaff()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create staff member')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Edit Staff ─────────────────────────────────────────────────────
  const handleOpenEdit = (user: any) => {
    setSelectedUser(user)
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
    })
    setEditDialogOpen(true)
  }

  const handleEditStaff = async () => {
    if (!editForm.firstName || !editForm.lastName) {
      toast.error('Please fill in first name and last name')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email || null,
          phone: editForm.phone || null,
          role: editForm.role,
          isActive: selectedUser.isActive,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }
      toast.success(`${editForm.firstName} ${editForm.lastName} updated successfully`)
      setEditDialogOpen(false)
      fetchStaff()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update staff member')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Reset Password ────────────────────────────────────────────────
  const handleOpenReset = (user: any) => {
    setSelectedUser(user)
    setResetDialogOpen(true)
  }

  const handleResetPassword = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          resetPassword: 'ichas2025',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to reset password')
      }
      toast.success(`Password reset for ${selectedUser.firstName} ${selectedUser.lastName}. New password: ichas2025`)
      setResetDialogOpen(false)
      fetchStaff()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Activate / Deactivate ──────────────────────────────────────────
  const handleOpenToggle = (user: any) => {
    setSelectedUser(user)
    setActivateDialogOpen(true)
  }

  const handleToggleActive = async () => {
    if (!selectedUser) return
    // Prevent deactivating self
    const currentUserId = useAppStore.getState().currentUser?.id
    if (selectedUser.id === currentUserId && selectedUser.isActive) {
      toast.error('You cannot deactivate your own account')
      setActivateDialogOpen(false)
      return
    }
    setIsSaving(true)
    try {
      const newStatus = !selectedUser.isActive
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update status')
      }
      toast.success(`${selectedUser.firstName} ${selectedUser.lastName} ${newStatus ? 'activated' : 'deactivated'}`)
      setActivateDialogOpen(false)
      fetchStaff()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Force Logout ───────────────────────────────────────────────────
  const handleOpenLogout = (user: any) => {
    setSelectedUser(user)
    setLogoutDialogOpen(true)
  }

  const handleForceLogout = async () => {
    if (!selectedUser) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ targetUserId: selectedUser.id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to force logout')
      }
      toast.success(`${selectedUser.firstName} ${selectedUser.lastName} has been logged out`)
      setLogoutDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to force logout')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div {...fadeIn} className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0a1628]">Staff Management</h2>
          <p className="text-sm text-muted-foreground">Manage all staff user accounts</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white gap-2">
          <Plus className="size-4" />
          Add New Staff
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, username..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="w-[160px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Role</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="admission">Admission</SelectItem>
              <SelectItem value="teacher">Lecturer</SelectItem>
              <SelectItem value="exam">Exam Officer</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[140px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Badge variant="outline" className="h-9 px-3 text-sm border-[#d4a853]/50 text-[#d4a853] shrink-0">
          {filteredStaff.length} staff
        </Badge>
      </div>

      {/* Table */}
      <Card className="py-0">
        <CardContent className="p-0">
          <div className="max-h-[520px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="size-12 mx-auto mb-3 opacity-30" />
                <p>No staff members found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email / Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((user, idx) => {
                    const rc = roleConfig[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-600' }
                    return (
                      <TableRow key={user.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {(user.firstName || 'U')[0]}{(user.lastName || '')[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{user.firstName} {user.lastName}</p>
                              {user.mustChangePassword && (
                                <p className="text-[10px] text-amber-600 truncate">Password change required</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm text-muted-foreground truncate">{user.email || '—'}</p>
                          <p className="text-xs text-muted-foreground/70 truncate">@{user.username}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${rc.color}`}>
                            {rc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              user.isActive
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Edit"
                              onClick={() => handleOpenEdit(user)}
                            >
                              <Pencil className="size-3.5 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Reset Password"
                              onClick={() => handleOpenReset(user)}
                            >
                              <KeyRound className="size-3.5 text-amber-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                              onClick={() => handleOpenToggle(user)}
                            >
                              {user.isActive ? (
                                <ShieldX className="size-3.5 text-red-500" />
                              ) : (
                                <ShieldCheck className="size-3.5 text-emerald-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Force Logout"
                              onClick={() => handleOpenLogout(user)}
                            >
                              <LogOut className="size-3.5 text-orange-500" />
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

      {/* ─── Add Staff Dialog ─────────────────────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Staff</DialogTitle>
            <DialogDescription>
              Create a new staff account. The user will receive a default password that must be changed on first login.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">First Name *</Label>
                <Input
                  placeholder="First name"
                  className="mt-1"
                  value={addForm.firstName}
                  onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm">Last Name *</Label>
                <Input
                  placeholder="Last name"
                  className="mt-1"
                  value={addForm.lastName}
                  onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Email (becomes username) *</Label>
              <Input
                type="email"
                placeholder="staff@ichas.ac.tz"
                className="mt-1"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm">Phone</Label>
              <Input
                placeholder="+255 700 000 000"
                className="mt-1"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm">Role *</Label>
              <Select value={addForm.role} onValueChange={(v) => setAddForm({ ...addForm, role: v })}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="admission">Admission Officer</SelectItem>
                  <SelectItem value="teacher">Lecturer</SelectItem>
                  <SelectItem value="exam">Exam Officer</SelectItem>
                  <SelectItem value="finance">Finance Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <KeyRound className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Default Password: ichas2025</p>
                  <p className="text-amber-600 text-xs mt-1">The user will be required to change their password on first login.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStaff}
              disabled={isSaving}
              className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white"
            >
              {isSaving ? 'Creating...' : 'Create Staff Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Staff Dialog ────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff information. You cannot change passwords here — users change their own passwords.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">First Name *</Label>
                <Input
                  placeholder="First name"
                  className="mt-1"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm">Last Name *</Label>
                <Input
                  placeholder="Last name"
                  className="mt-1"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input
                type="email"
                placeholder="staff@ichas.ac.tz"
                className="mt-1"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm">Phone</Label>
              <Input
                placeholder="+255 700 000 000"
                className="mt-1"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm">Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="admission">Admission Officer</SelectItem>
                  <SelectItem value="teacher">Lecturer</SelectItem>
                  <SelectItem value="exam">Exam Officer</SelectItem>
                  <SelectItem value="finance">Finance Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <div className="flex items-start gap-2">
                <Settings className="size-4 text-gray-500 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Account Status</p>
                  <p className="text-xs mt-1">
                    Currently: <span className={selectedUser?.isActive ? 'text-emerald-600' : 'text-red-500'}>
                      {selectedUser?.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {' '}— Use the toggle button in the table to change status.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditStaff}
              disabled={isSaving}
              className="bg-[#0a1628] hover:bg-[#0a1628]/90 text-white"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reset Password Confirmation ──────────────────────────────── */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for{' '}
              <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 my-2">
            <div className="flex items-start gap-2">
              <KeyRound className="size-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">New Password: ichas2025</p>
                <p className="text-amber-600 text-xs mt-1">
                  The user will be forced to change their password on next login.
                </p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isSaving ? 'Resetting...' : 'Reset Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Activate / Deactivate Confirmation ───────────────────────── */}
      <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.isActive ? 'Deactivate' : 'Activate'} Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{' '}
              {selectedUser?.isActive ? 'deactivate' : 'activate'} the account for{' '}
              <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
              {selectedUser?.isActive && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Deactivated users will not be able to log in.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={isSaving}
              className={selectedUser?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {isSaving
                ? 'Updating...'
                : selectedUser?.isActive
                  ? 'Deactivate'
                  : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Force Logout Confirmation ────────────────────────────────── */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to force-logout{' '}
              <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
              All active sessions for this user will be terminated immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceLogout}
              disabled={isSaving}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSaving ? 'Logging out...' : 'Force Logout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  SYSTEM SETTINGS VIEW
// ═══════════════════════════════════════════════════════════════════════
function SystemSettingsView() {
  // ─── Sessions State ─────────────────────────────────────────────────
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // ─── Audit State ────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(true)
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotalPages, setAuditTotalPages] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditActionFilter, setAuditActionFilter] = useState('all')
  const [auditUserFilter, setAuditUserFilter] = useState('all')
  const [auditStartDate, setAuditStartDate] = useState('')
  const [auditEndDate, setAuditEndDate] = useState('')

  // ─── Force logout dialog ────────────────────────────────────────────
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [sessionToLogout, setSessionToLogout] = useState<any>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // ─── Summary stats ──────────────────────────────────────────────────
  const [stats, setStats] = useState({
    activeSessions: 0,
    loginsToday: 0,
    activeUsers: 0,
    suspiciousActivities: 0,
  })

  // ─── Fetch Sessions ─────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/sessions', { headers: getHeaders() })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      toast.error('Failed to load active sessions')
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  // ─── Fetch Audit Logs ───────────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(auditPage))
      params.set('limit', '50')
      if (auditActionFilter && auditActionFilter !== 'all') params.set('action', auditActionFilter)
      if (auditUserFilter && auditUserFilter !== 'all') params.set('userId', auditUserFilter)
      if (auditStartDate) params.set('startDate', auditStartDate)
      if (auditEndDate) params.set('endDate', auditEndDate)

      const res = await fetch(`/api/audit?${params.toString()}`, { headers: getHeaders() })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAuditLogs(data.logs || [])
      setAuditTotalPages(data.pagination?.totalPages || 1)
      setAuditTotal(data.pagination?.total || 0)
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setAuditLoading(false)
    }
  }, [auditPage, auditActionFilter, auditUserFilter, auditStartDate, auditEndDate])

  // ─── Fetch Summary Stats ────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const [sessionsRes, auditRes] = await Promise.all([
        fetch('/api/sessions', { headers: getHeaders() }),
        fetch('/api/audit?limit=1', { headers: getHeaders() }),
      ])

      if (sessionsRes.ok) {
        const sessData = await sessionsRes.json()
        const sess = sessData.sessions || []
        setStats((prev) => ({ ...prev, activeSessions: sess.length }))
      }

      if (auditRes.ok) {
        const auditData = await auditRes.json()
        const total = auditData.pagination?.total || 0
        setStats((prev) => ({ ...prev, activeUsers: new Set(
          (auditData.logs || []).map((l: any) => l.userId)
        ).size }))

        // Fetch today's logins
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayParams = new URLSearchParams()
        todayParams.set('page', '1')
        todayParams.set('limit', '500')
        todayParams.set('action', 'LOGIN')
        todayParams.set('startDate', todayStart.toISOString())
        const todayRes = await fetch(`/api/audit?${todayParams.toString()}`, { headers: getHeaders() })
        if (todayRes.ok) {
          const todayData = await todayRes.json()
          setStats((prev) => ({ ...prev, loginsToday: todayData.pagination?.total || 0 }))
        }
      }
    } catch {
      // Stats are non-critical
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    fetchStats()
  }, [fetchSessions, fetchStats])

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  // ─── Unique users for filter dropdown ───────────────────────────────
  const uniqueUsers = auditLogs.reduce((acc: any[], log) => {
    if (!acc.find((u) => u.userId === log.userId)) {
      acc.push({
        userId: log.userId,
        name: `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim() || log.user?.username || 'Unknown',
        role: log.user?.role,
      })
    }
    return acc
  }, [])

  // ─── Unique actions for filter dropdown ─────────────────────────────
  const uniqueActions = Array.from(new Set(auditLogs.map((l) => l.action))).sort()

  // ─── Force Logout Handler ───────────────────────────────────────────
  const handleForceLogout = async () => {
    if (!sessionToLogout) return
    setIsLoggingOut(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ targetUserId: sessionToLogout.userId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to force logout')
      }
      toast.success(`${sessionToLogout.user?.firstName || 'User'} has been logged out`)
      setLogoutDialogOpen(false)
      setSessionToLogout(null)
      fetchSessions()
      fetchStats()
    } catch (err: any) {
      toast.error(err.message || 'Failed to force logout')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-[#0a1628]">System Settings</h2>
        <p className="text-sm text-muted-foreground">Monitor sessions, audit logs, and system security</p>
      </div>

      {/* ─── Security Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-0 border-l-4 border-l-emerald-500">
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="flex items-center justify-center size-12 rounded-lg bg-emerald-500/10">
              <Monitor className="size-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stats.activeSessions}</p>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 border-l-4 border-l-blue-500">
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="flex items-center justify-center size-12 rounded-lg bg-blue-500/10">
              <Activity className="size-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stats.loginsToday}</p>
              <p className="text-sm text-muted-foreground">Logins Today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 border-l-4 border-l-amber-500">
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="flex items-center justify-center size-12 rounded-lg bg-amber-500/10">
              <Users className="size-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stats.activeUsers}</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 border-l-4 border-l-red-500">
          <CardContent className="flex items-center gap-4 pt-0">
            <div className="flex items-center justify-center size-12 rounded-lg bg-red-500/10">
              <AlertTriangle className="size-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{stats.suspiciousActivities}</p>
              <p className="text-sm text-muted-foreground">Suspicious Activities</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Active Sessions Panel ───────────────────────────────────── */}
      <Card className="py-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Monitor className="size-4 text-[#d4a853]" />
                Active Sessions
              </CardTitle>
              <CardDescription>Currently logged-in users</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={fetchSessions}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            {sessionsLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Monitor className="size-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active sessions</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Role</TableHead>
                    <TableHead className="hidden lg:table-cell">Device</TableHead>
                    <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                    <TableHead className="hidden xl:table-cell">Location</TableHead>
                    <TableHead className="hidden md:table-cell">Last Activity</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const rc = roleConfig[session.user?.role] || { label: 'Unknown', color: 'bg-gray-100 text-gray-600' }
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {(session.user?.firstName || 'U')[0]}{(session.user?.lastName || '')[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {session.user?.firstName} {session.user?.lastName}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={`text-xs ${rc.color}`}>
                            {rc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {session.deviceInfo || '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">
                          {session.ipAddress || '—'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                          {session.location || '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {session.lastActivity
                            ? new Date(session.lastActivity).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSessionToLogout(session)
                              setLogoutDialogOpen(true)
                            }}
                            title="Force Logout"
                          >
                            <LogOut className="size-3.5" />
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

      {/* ─── Force Logout Session Dialog ─────────────────────────────── */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Logout This Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will terminate all active sessions for{' '}
              <strong>{sessionToLogout?.user?.firstName} {sessionToLogout?.user?.lastName}</strong>.
              They will need to log in again to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoggingOut ? 'Terminating...' : 'Force Logout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Audit Log Panel ─────────────────────────────────────────── */}
      <Card className="py-0">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="size-4 text-[#d4a853]" />
                Audit Log
              </CardTitle>
              <CardDescription>
                {auditTotal > 0 ? `${auditTotal} total events` : 'System event history'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={fetchAuditLogs}
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3 mt-3">
            <div className="w-[150px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Action</Label>
              <Select value={auditActionFilter} onValueChange={(v) => { setAuditActionFilter(v); setAuditPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="USER_UPDATED">User Updated</SelectItem>
                  <SelectItem value="SESSION_INVALIDATED">Session Invalidated</SelectItem>
                  <SelectItem value="PASSWORD_RESET">Password Reset</SelectItem>
                  <SelectItem value="PASSWORD_CHANGED">Password Changed</SelectItem>
                  <SelectItem value="PROFILE_UPDATED">Profile Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">User</Label>
              <Select value={auditUserFilter} onValueChange={(v) => { setAuditUserFilter(v); setAuditPage(1) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((u) => (
                    <SelectItem key={u.userId} value={u.userId}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
              <Input
                type="date"
                value={auditStartDate}
                onChange={(e) => { setAuditStartDate(e.target.value); setAuditPage(1) }}
                className="text-sm"
              />
            </div>
            <div className="w-[140px]">
              <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
              <Input
                type="date"
                value={auditEndDate}
                onChange={(e) => { setAuditEndDate(e.target.value); setAuditPage(1) }}
                className="text-sm"
              />
            </div>
            {(auditActionFilter !== 'all' || auditUserFilter !== 'all' || auditStartDate || auditEndDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={() => {
                  setAuditActionFilter('all')
                  setAuditUserFilter('all')
                  setAuditStartDate('')
                  setAuditEndDate('')
                  setAuditPage(1)
                }}
              >
                <X className="size-3.5" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[450px] overflow-y-auto">
            {auditLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Eye className="size-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No audit events found</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628]/5 hover:bg-[#0a1628]/5">
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="hidden lg:table-cell">Details</TableHead>
                    <TableHead className="hidden xl:table-cell">IP Address</TableHead>
                    <TableHead className="hidden xl:table-cell">Location</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => {
                    const actionColor = actionColors[log.action] || 'bg-gray-100 text-gray-600'
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {log.user?.firstName} {log.user?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">@{log.user?.username}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${actionColor}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[300px]">
                            {log.details || '—'}
                          </p>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs font-mono text-muted-foreground">
                          {log.ipAddress || '—'}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                          {log.location || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {auditTotalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {auditPage} of {auditTotalPages} ({auditTotal} events)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage(auditPage - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="size-3.5" />
                  Previous
                </Button>
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(auditTotalPages, 5) }, (_, i) => {
                    let pageNum: number
                    if (auditTotalPages <= 5) {
                      pageNum = i + 1
                    } else if (auditPage <= 3) {
                      pageNum = i + 1
                    } else if (auditPage >= auditTotalPages - 2) {
                      pageNum = auditTotalPages - 4 + i
                    } else {
                      pageNum = auditPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={auditPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setAuditPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditPage >= auditTotalPages}
                  onClick={() => setAuditPage(auditPage + 1)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  PASSWORD RECOVERY VIEW
// ═══════════════════════════════════════════════════════════════════════
function PasswordRecoveryView() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  // Reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/users', { headers: getHeaders() })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllUsers()
  }, [fetchAllUsers])

  // Filter users
  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase()
    const matchSearch =
      !s ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) ||
      (u.username || '').toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  // Get related info (student reg number, teacher employee ID)
  const [relatedInfo, setRelatedInfo] = useState<Record<string, any>>({})
  useEffect(() => {
    const fetchRelated = async () => {
      const info: Record<string, any> = {}
      for (const u of users) {
        if (u.role === 'student' && u.relatedId) {
          try {
            const res = await fetch(`/api/students/${u.relatedId}`)
            if (res.ok) {
              const student = await res.json()
              info[u.id] = { regNumber: student.regNumber, course: student.course?.name }
            }
          } catch { /* skip */ }
        } else if (u.role === 'teacher' && u.relatedId) {
          try {
            const res = await fetch(`/api/teachers/${u.relatedId}`)
            if (res.ok) {
              const teacher = await res.json()
              info[u.id] = { employeeId: teacher.employeeId, department: teacher.department }
            }
          } catch { /* skip */ }
        }
      }
      setRelatedInfo(info)
    }
    if (users.length > 0) fetchRelated()
  }, [users])

  const handleOpenReset = (user: any) => {
    setSelectedUser(user)
    setNewPassword('password123')
    setResetDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    try {
      setIsResetting(true)
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ resetPassword: newPassword, mustChangePassword: true }),
      })
      if (!res.ok) throw new Error('Failed to reset password')

      toast.success(
        `✅ Password imebadilishwa kwa ${selectedUser.firstName} ${selectedUser.lastName}!\n` +
        `Username: ${selectedUser.username}\n` +
        `New Password: ${newPassword}`,
        { duration: 8000 }
      )
      setResetDialogOpen(false)
      fetchAllUsers()
    } catch {
      toast.error('Failed to reset password')
    } finally {
      setIsResetting(false)
    }
  }

  // Counts
  const studentCount = users.filter((u) => u.role === 'student').length
  const staffCount = users.filter((u) => u.role !== 'student' && u.role !== 'alumni').length
  const mustChangeCount = users.filter((u) => u.mustChangePassword).length

  return (
    <motion.div {...fadeIn} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#0a1628] flex items-center gap-2">
          <KeyRound className="size-5 text-[#d4a853]" />
          Password Recovery
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Angalia na rekebisha password za watumiaji wote (wanafunzi + wafanyakazi)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="py-0 border-l-4 border-l-[#0a1628]">
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Jumla Watumiaji</p>
            <p className="text-2xl font-bold text-[#0a1628] mt-1">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="py-0 border-l-4 border-l-sky-500">
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Wanafunzi</p>
            <p className="text-2xl font-bold text-sky-600 mt-1">{studentCount}</p>
          </CardContent>
        </Card>
        <Card className="py-0 border-l-4 border-l-emerald-500">
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Wafanyakazi</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{staffCount}</p>
          </CardContent>
        </Card>
        <Card className="py-0 border-l-4 border-l-amber-500">
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Wanaohitaji Kubadilisha</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{mustChangeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-0">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Tafuta kwa jina, username, au email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chagua role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wote</SelectItem>
                <SelectItem value="student">Wanafunzi</SelectItem>
                <SelectItem value="teacher">Walimu</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="exam">Exam Officer</SelectItem>
                <SelectItem value="finance">Finance Officer</SelectItem>
                <SelectItem value="admission">Admission</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">Orodha ya Watumiaji ({filteredUsers.length})</CardTitle>
          <CardDescription>Bonyeza kitufe cha &quot;Reset Password&quot; kwa mmtu yeyote ili kubadilisha password yake</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="size-12 mx-auto mb-3 opacity-30" />
                <p>Hakuna watumiaji waliopatikana</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0a1628] hover:bg-[#0a1628]">
                    <TableHead className="text-white/90">#</TableHead>
                    <TableHead className="text-white/90">Jina</TableHead>
                    <TableHead className="text-white/90">Username / ID</TableHead>
                    <TableHead className="text-white/90">Role</TableHead>
                    <TableHead className="text-white/90 text-center">Status</TableHead>
                    <TableHead className="text-white/90 text-center">Mabadiliko ya Password</TableHead>
                    <TableHead className="text-white/90 text-center">Login Mwisho</TableHead>
                    <TableHead className="text-white/90 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, idx) => {
                    const ri = relatedInfo[user.id]
                    const rc = roleConfig[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-700 border-gray-200' }
                    return (
                      <TableRow key={user.id} className={idx % 2 === 1 ? 'bg-gray-50/50' : ''}>
                        <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                            {ri?.regNumber && (
                              <p className="text-[11px] text-muted-foreground">{ri.regNumber} — {ri.course}</p>
                            )}
                            {ri?.employeeId && (
                              <p className="text-[11px] text-muted-foreground">{ri.employeeId} — {ri.department}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-mono">{user.username}</p>
                          <p className="text-[11px] text-muted-foreground">{user.email || '—'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${rc.color} text-xs`}>
                            {rc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {user.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {user.mustChangePassword ? (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                              ⚠️ Inahitajika
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                              ✅ Imebadilishwa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 text-xs"
                            onClick={() => handleOpenReset(user)}
                          >
                            <KeyRound className="size-3.5" />
                            Reset
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

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-amber-600" />
              Badilisha Password
            </DialogTitle>
            <DialogDescription>
              Weka password mpya kwa mtumiaji huyu. Atahitajika kubadilisha tena anapojiandaa kuingia.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jina:</span>
                  <span className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-mono text-xs">{selectedUser.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="outline" className={`${roleConfig[selectedUser.role]?.color || ''} text-xs`}>
                    {roleConfig[selectedUser.role]?.label || selectedUser.role}
                  </Badge>
                </div>
                {relatedInfo[selectedUser.id]?.regNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reg No:</span>
                    <span className="font-mono text-xs">{relatedInfo[selectedUser.id].regNumber}</span>
                  </div>
                )}
              </div>

              {/* New Password Input */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Mpya</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    placeholder="Weka password mpya"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <Eye className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Password lazima iwe angalau herufi 6. Mtumiaji atahitajika kubadilisha mara ya kwanza anapojiandaa kuingia.
                </p>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium">Tahadhari!</p>
                  <p>Password ya mtumiaji itabadilishwa na atahitaji kutumia password hii mpya anapojiandaa kuingia.</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Ghairi
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={isResetting || !newPassword || newPassword.length < 6}
              className="bg-[#0a1628] hover:bg-[#162040]"
            >
              {isResetting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <KeyRound className="size-4 mr-2" />
              )}
              Badilisha Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function SystemAdmin({ view }: SystemAdminProps) {
  if (view === 'staff') {
    return <StaffManagementView />
  }

  if (view === 'password-recovery') {
    return <PasswordRecoveryView />
  }

  if (view === 'settings') {
    return <SystemSettingsView />
  }

  // Default fallback
  return (
    <motion.div {...fadeIn} className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Settings className="h-12 w-12 mx-auto text-[#d4a853] mb-4" />
        <h2 className="text-xl font-bold text-gray-700">System Administration</h2>
        <p className="text-gray-400 mt-2">Select a section from the sidebar.</p>
      </div>
    </motion.div>
  )
}
