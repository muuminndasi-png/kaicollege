'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  BookOpen,
  FileCheck,
  DollarSign,
  LayoutDashboard,
  FileText,
  User,
  CreditCard,
  PenTool,
  Users,
  Library,
  List,
  Upload,
  BarChart3,
  Receipt,
  LogOut,
  X,
  Menu,
  Shield,
  Award,
  Search,
  ScrollText,
  ClipboardList,
  UserCheck,
  Lock,
  ArrowLeftRight,
  HelpCircle,
  Bell,
  FilePlus,
  ShieldX,
  ClipboardList as ClipboardListIcon,
  ChevronDown,
  ChevronRight,
  Settings,
  KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useIsMobile } from '@/hooks/use-mobile'
import { useAppStore } from '@/store/college-store'
import type { LucideIcon } from 'lucide-react'

interface AppSidebarProps {
  currentRole: string | null
  currentView: string
  onNavigate: (view: string) => void
  onLogout: () => void
  isOpen: boolean
  onToggle: () => void
}

interface NavItem {
  key: string
  label: string
  icon: LucideIcon
}

interface StaffCategory {
  key: string
  label: string
  icon: LucideIcon
  items: NavItem[]
  allowedRoles: string[]
}

// ─── Student nav – flat list (same keys as before) ───────────────────────────
const studentNavItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'results', label: 'My Results', icon: FileText },
  { key: 'profile', label: 'My Profile', icon: User },
  { key: 'fees', label: 'Fee Status', icon: CreditCard },
  { key: 'notes', label: 'Course Materials', icon: FileText },
  { key: 'quizzes', label: 'Quizzes', icon: HelpCircle },
  { key: 'assignments', label: 'Assignments', icon: ClipboardList },
  { key: 'notifications', label: 'Notifications', icon: Bell },
]

// ─── Alumni nav – flat list ──────────────────────────────────────────────────
const alumniNavItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'profile', label: 'My Profile', icon: User },
  { key: 'directory', label: 'Alumni Directory', icon: Search },
]

// ─── Staff categories with sub-items ─────────────────────────────────────────
const staffCategories: StaffCategory[] = [
  {
    key: 'admission',
    label: 'Admission Office',
    icon: ClipboardList,
    allowedRoles: ['admin', 'admission'],
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'students', label: 'Students', icon: GraduationCap },
      { key: 'teachers', label: 'Teachers', icon: BookOpen },
      { key: 'courses', label: 'Courses', icon: Library },
      { key: 'subjects', label: 'Subjects', icon: List },
      { key: 'semester-transfer', label: 'Semester Transfer', icon: ArrowLeftRight },
      { key: 'transcripts', label: 'Transcript Templates', icon: ScrollText },
    ],
  },
  {
    key: 'teaching',
    label: 'Teaching',
    icon: BookOpen,
    allowedRoles: ['admin', 'teacher'],
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'subjects', label: 'My Subjects', icon: BookOpen },
      { key: 'grades', label: 'Enter Grades', icon: PenTool },
      { key: 'students', label: 'My Students', icon: Users },
      { key: 'notes', label: 'Course Materials', icon: FileText },
      { key: 'quizzes', label: 'Quizzes', icon: HelpCircle },
      { key: 'assignments', label: 'Assignments', icon: ClipboardList },
    ],
  },
  {
    key: 'examination',
    label: 'Examination Office',
    icon: FileCheck,
    allowedRoles: ['admin', 'exam'],
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'results', label: 'Results Management', icon: FileCheck },
      { key: 'student-info', label: 'Student Info', icon: Users },
      { key: 'lock-results', label: 'Lock Results', icon: ShieldX },
      { key: 'coursework-templates', label: 'Coursework Templates', icon: ClipboardListIcon },
      { key: 'publish', label: 'Publish Results', icon: Upload },
      { key: 'student-results', label: 'Student Results', icon: UserCheck },
      { key: 'class-results', label: 'Class Results', icon: ClipboardList },
      { key: 'transcript', label: 'Transcript', icon: ScrollText },
      { key: 'result-statement', label: 'Result Statement', icon: FileText },
      { key: 'permissions', label: 'Student Access', icon: Lock },
      { key: 'transcript-batches', label: 'Transcript Batches', icon: FilePlus },
      { key: 'reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    key: 'finance',
    label: 'Finance Office',
    icon: DollarSign,
    allowedRoles: ['admin', 'finance'],
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'structure', label: 'Fee Structure', icon: Receipt },
      { key: 'payments', label: 'Payments', icon: CreditCard },
      { key: 'reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    key: 'alumni',
    label: 'Alumni Network',
    icon: Award,
    allowedRoles: ['admin'],
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'directory', label: 'Alumni Directory', icon: Search },
    ],
  },
  {
    key: 'system',
    label: 'System Admin',
    icon: Settings,
    allowedRoles: ['admin'],
    items: [
      { key: 'staff', label: 'Staff Management', icon: Users },
      { key: 'password-recovery', label: 'Password Recovery', icon: KeyRound },
      { key: 'settings', label: 'System Settings', icon: Settings },
    ],
  },
]

// ─── Role display names & icons (mapped to portal type) ─────────────────────
const roleDisplayNames: Record<string, string> = {
  student: 'Student Portal',
  staff: 'Staff Portal',
  alumni: 'Alumni Portal',
}

const roleSpecificNames: Record<string, string> = {
  admin: 'System Administrator',
  admission: 'Admission Officer',
  teacher: 'Lecturer',
  exam: 'Examination Officer',
  finance: 'Finance Officer',
}

const roleIcons: Record<string, LucideIcon> = {
  student: GraduationCap,
  staff: Shield,
  alumni: Award,
}

// ─── Animation variants ──────────────────────────────────────────────────────
const sidebarVariants = {
  closed: {
    x: -280,
    opacity: 0,
    transition: { type: 'spring' as const, damping: 25, stiffness: 200 },
  },
  open: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, damping: 25, stiffness: 200 },
  },
} as const

const mobileOverlayVariants = {
  closed: { opacity: 0, pointerEvents: 'none' as const },
  open: { opacity: 1, pointerEvents: 'auto' as const },
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AppSidebar({
  currentRole,
  currentView,
  onNavigate,
  onLogout,
  isOpen,
  onToggle,
}: AppSidebarProps) {
  const isMobile = useIsMobile()
  const currentUser = useAppStore((s) => s.currentUser)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const isStaff = currentRole !== null && currentRole !== 'student' && currentRole !== 'alumni'
  const isAlumni = currentRole === 'alumni'
  const resolvedRole = isAlumni ? 'alumni' : isStaff ? 'staff' : (currentRole || 'student')

  // Get the actual underlying role from the logged-in user (admin/teacher/exam/finance)
  const actualRole = currentUser?.role || currentRole

  // ── Derived: visible categories for the current staff role ──
  const visibleCategories = useMemo(() => {
    if (!isStaff || !actualRole) return []
    return staffCategories.filter((cat) => cat.allowedRoles.includes(actualRole))
  }, [isStaff, actualRole])

  // ── Derived: which category is active based on currentView ──
  const activeCategory = useMemo(() => {
    if (!isStaff || currentView === 'profile') return null

    const slashIdx = currentView.indexOf('/')
    if (slashIdx > -1) {
      return currentView.substring(0, slashIdx)
    }
    // bare "dashboard" → first allowed category
    if (currentView === 'dashboard' && visibleCategories.length > 0) {
      return visibleCategories[0].key
    }
    return null
  }, [isStaff, currentView, visibleCategories])

  // ── Derived: which sub-item key is active ──
  const activeSubItem = useMemo(() => {
    if (!isStaff || currentView === 'profile') return null

    const slashIdx = currentView.indexOf('/')
    if (slashIdx > -1) {
      return currentView.substring(slashIdx + 1)
    }
    if (currentView === 'dashboard') return 'dashboard'
    return null
  }, [isStaff, currentView])

  // ── Effective expanded set: always includes the active category ──
  const effectiveExpanded = useMemo(() => {
    const set = new Set(expandedCategories)
    if (isStaff && activeCategory) {
      set.add(activeCategory)
    }
    return set
  }, [isStaff, activeCategory, expandedCategories])

  // ── Toggle a category ──
  const toggleCategory = (catKey: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catKey) ? prev.filter((k) => k !== catKey) : [...prev, catKey],
    )
  }

  // ── Early return when no role selected ──
  if (!currentRole) return null

  const RoleIcon = roleIcons[resolvedRole] || Shield
  const roleDisplayName = roleDisplayNames[resolvedRole] || currentRole
  const specificRoleName = isStaff ? (roleSpecificNames[actualRole] || actualRole) : roleDisplayName

  const isCategoryActive = (catKey: string) => activeCategory === catKey
  const isSubItemActive = (catKey: string, itemKey: string) =>
    activeCategory === catKey && activeSubItem === itemKey

  // ═══════════════════════════════════════════════════════════════════════════
  //  Sidebar content (shared between mobile & desktop)
  // ═══════════════════════════════════════════════════════════════════════════
  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0a1628]">
      {/* ── Sidebar Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <div className="relative h-9 w-auto flex-shrink-0 overflow-hidden rounded-lg border border-[#d4a853]/30 p-0.5">
          <Image
            src="/images/college-logo.png"
            alt="ICHAS Logo"
            width={44}
            height={28}
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold tracking-wide text-white">ICHAS</h2>
          <p className="truncate text-[10px] text-[#64748b]">Imperial College</p>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 text-[#94a3b8] hover:bg-white/10 hover:text-white"
            onClick={onToggle}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* ── Back Button ─────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-1 sm:px-4">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all duration-200 hover:bg-white/[0.06]"
        >
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.06] transition-colors duration-200 group-hover:bg-[#d4a853]/15">
            <svg
              className="h-4 w-4 text-[#64748b] transition-colors duration-200 group-hover:text-[#d4a853]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-xs font-medium text-[#64748b] transition-colors duration-200 group-hover:text-[#d4a853]">
            &larr; Back to Menu
          </span>
        </button>
      </div>

      {/* ── User Profile / Role Badge ──────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 sm:px-5">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3">
          {currentUser?.user?.profilePhoto ? (
            <div className="h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden border border-[#d4a853]/30">
              <img
                src={currentUser.user.profilePhoto}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#d4a853]/15">
              <RoleIcon className="h-4.5 w-4.5 text-[#d4a853]" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {currentUser?.relatedInfo
                ? `${currentUser.relatedInfo.firstName} ${currentUser.relatedInfo.lastName}`
                : currentUser?.user?.firstName && currentUser?.user?.lastName
                  ? `${currentUser.user.firstName} ${currentUser.user.lastName}`
                  : specificRoleName
              }
            </p>
            <p className="text-[10px] text-[#64748b]">{specificRoleName}</p>
          </div>
        </div>
      </div>

      {/* ── Navigation Label ────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 sm:px-5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#475569]">
          Navigation
        </span>
      </div>

      {/* ── Navigation Items ────────────────────────────────────────── */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 pb-4">
        {!isStaff && !isAlumni ? (
          /* ═══════════ Student: flat nav ═══════════ */
          <ul className="space-y-1">
            {studentNavItems.map((item, index) => {
              const isActive = currentView === item.key
              const ItemIcon = item.icon
              return (
                <motion.li
                  key={item.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <button
                    onClick={() => {
                      onNavigate(item.key)
                      if (isMobile) onToggle()
                    }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 sm:px-4 ${
                      isActive
                        ? 'bg-[#d4a853] text-[#0a1628] shadow-md shadow-[#d4a853]/20'
                        : 'text-[#94a3b8] hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        isActive ? 'bg-[#0a1628]/10' : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
                      }`}
                    >
                      <ItemIcon
                        className={`h-4 w-4 transition-colors duration-200 ${
                          isActive ? 'text-[#0a1628]' : 'text-[#64748b] group-hover:text-[#d4a853]'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-200 ${
                        isActive ? 'font-semibold text-[#0a1628]' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-[#0a1628]/40" />}
                  </button>
                </motion.li>
              )
            })}
          </ul>
        ) : isAlumni ? (
          /* ═══════════ Alumni: flat nav ═══════════ */
          <ul className="space-y-1">
            {alumniNavItems.map((item, index) => {
              const isActive = currentView === item.key
              const ItemIcon = item.icon
              return (
                <motion.li
                  key={item.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <button
                    onClick={() => {
                      onNavigate(item.key)
                      if (isMobile) onToggle()
                    }}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 sm:px-4 ${
                      isActive
                        ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/20'
                        : 'text-[#94a3b8] hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        isActive ? 'bg-white/10' : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
                      }`}
                    >
                      <ItemIcon
                        className={`h-4 w-4 transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-[#64748b] group-hover:text-[#7c3aed]'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-200 ${
                        isActive ? 'font-semibold' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    {isActive && <div className="ml-auto h-2 w-2 rounded-full bg-white/40" />}
                  </button>
                </motion.li>
              )
            })}
          </ul>
        ) : (
          /* ═══════════ Staff: categorised nav with expand / collapse ═══════════ */
          <div className="space-y-1">
            {visibleCategories.map((category, catIndex) => {
              const isExpanded = effectiveExpanded.has(category.key)
              const isActive = isCategoryActive(category.key)
              const CategoryIcon = category.icon

              return (
                <motion.div
                  key={category.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: catIndex * 0.04 }}
                >
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category.key)}
                    className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 sm:px-4 ${
                      isActive
                        ? 'bg-[#d4a853] text-[#0a1628] shadow-md shadow-[#d4a853]/20'
                        : 'text-[#94a3b8] hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        isActive ? 'bg-[#0a1628]/10' : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
                      }`}
                    >
                      <CategoryIcon
                        className={`h-4 w-4 transition-colors duration-200 ${
                          isActive ? 'text-[#0a1628]' : 'text-[#64748b] group-hover:text-[#d4a853]'
                        }`}
                      />
                    </div>
                    <span
                      className={`flex-1 text-sm font-medium transition-colors duration-200 ${
                        isActive ? 'font-semibold text-[#0a1628]' : ''
                      }`}
                    >
                      {category.label}
                    </span>
                    {isExpanded ? (
                      <ChevronDown
                        className={`h-4 w-4 transition-colors duration-200 ${
                          isActive ? 'text-[#0a1628]' : 'text-[#64748b]'
                        }`}
                      />
                    ) : (
                      <ChevronRight
                        className={`h-4 w-4 transition-colors duration-200 ${
                          isActive ? 'text-[#0a1628]' : 'text-[#64748b]'
                        }`}
                      />
                    )}
                  </button>

                  {/* Expandable sub-items */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/[0.06] pl-3">
                          {category.items.map((item) => {
                            const isItemActive = isSubItemActive(category.key, item.key)
                            const ItemIcon = item.icon

                            return (
                              <button
                                key={item.key}
                                onClick={() => {
                                  onNavigate(`${category.key}/${item.key}`)
                                  if (isMobile) onToggle()
                                }}
                                className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all duration-200 ${
                                  isItemActive
                                    ? 'bg-[#d4a853]/15 text-[#d4a853]'
                                    : 'text-[#64748b] hover:bg-white/[0.04] hover:text-[#94a3b8]'
                                }`}
                              >
                                <ItemIcon
                                  className={`h-3.5 w-3.5 flex-shrink-0 transition-colors duration-200 ${
                                    isItemActive
                                      ? 'text-[#d4a853]'
                                      : 'text-[#475569] group-hover:text-[#d4a853]'
                                  }`}
                                />
                                <span
                                  className={`text-[13px] transition-colors duration-200 ${
                                    isItemActive ? 'font-semibold' : 'font-medium'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {isItemActive && (
                                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#d4a853]" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}

            {/* ── My Profile (always shown for staff) ────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: visibleCategories.length * 0.04 }}
            >
              <div className="my-2 border-t border-white/[0.04]" />
              <button
                onClick={() => {
                  onNavigate('profile')
                  if (isMobile) onToggle()
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 sm:px-4 ${
                  currentView === 'profile'
                    ? 'bg-[#d4a853] text-[#0a1628] shadow-md shadow-[#d4a853]/20'
                    : 'text-[#94a3b8] hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                    currentView === 'profile'
                      ? 'bg-[#0a1628]/10'
                      : 'bg-white/[0.04] group-hover:bg-white/[0.08]'
                  }`}
                >
                  <User
                    className={`h-4 w-4 transition-colors duration-200 ${
                      currentView === 'profile'
                        ? 'text-[#0a1628]'
                        : 'text-[#64748b] group-hover:text-[#d4a853]'
                    }`}
                  />
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-200 ${
                    currentView === 'profile' ? 'font-semibold text-[#0a1628]' : ''
                  }`}
                >
                  My Profile
                </span>
                {currentView === 'profile' && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-[#0a1628]/40" />
                )}
              </button>
            </motion.div>
          </div>
        )}
      </nav>

      {/* ── Sidebar Footer ──────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] px-3 py-3 sm:px-4">
        <button
          onClick={onLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 hover:bg-[#e11d48]/10 sm:px-4"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.04] transition-colors duration-200 group-hover:bg-[#e11d48]/15">
            <LogOut className="h-4 w-4 text-[#64748b] transition-colors duration-200 group-hover:text-[#e11d48]" />
          </div>
          <span className="text-sm font-medium text-[#94a3b8] transition-colors duration-200 group-hover:text-[#e11d48]">
            Logout
          </span>
        </button>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════════
  //  Render wrapper (mobile slide-in / desktop fixed)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── Mobile Hamburger Header ──────────────────────────────────── */}
      {isMobile && (
        <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-[#0a1628]/10 bg-white/80 px-4 backdrop-blur-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#0a1628] hover:bg-[#0a1628]/10"
            onClick={onToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-auto overflow-hidden rounded border border-[#d4a853]/30 p-0.5">
              <Image
                src="/images/college-logo.png"
                alt="ICHAS"
                width={33}
                height={21}
                className="h-5 w-auto object-contain"
              />
            </div>
            <span className="text-sm font-bold text-[#0a1628]">ICHAS</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs text-[#64748b] hover:text-[#d4a853] hover:bg-[#d4a853]/10"
              onClick={onLogout}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </div>
        </div>
      )}

      {/* ── Mobile Overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            variants={mobileOverlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      {isMobile ? (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl shadow-black/30"
            >
              {sidebarContent}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-y-0 left-0 z-30 w-[260px] border-r border-white/[0.06]"
        >
          {sidebarContent}
        </motion.aside>
      )}
    </>
  )
}
