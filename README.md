# Imperial College of Health and Allied Sciences (ICHAS) - Management System

A comprehensive, modern management system for Imperial College of Health and Allied Sciences built with **Next.js 16**, **TypeScript**, **Prisma**, and **Tailwind CSS**.

## 🎯 Overview

This system provides complete management capabilities for:
- **Students** - Registration, enrollment, coursework tracking
- **Teachers** - Course management, assignment creation, grading
- **Administrative Staff** - System administration and auditing
- **Finance Office** - Fee management and financial records
- **Exam Office** - Result management and transcripts
- **Alumni** - Alumni portal access

## 🚀 Features

### Core Functionality
- ✅ User authentication with role-based access control (RBAC)
- ✅ Multi-role dashboards (Student, Teacher, Admin, Finance, Exam, Alumni)
- ✅ Session management with concurrent device detection
- ✅ Comprehensive audit logging
- ✅ Real-time notifications
- ✅ Material management for teachers
- ✅ Coursework and assignment tracking
- ✅ Grade management and result locking
- ✅ Transcript generation
- ✅ Fee structure and payment tracking
- ✅ Semester management

### Technology Stack
- **Frontend**: React 19, Next.js 16, TypeScript
- **UI Components**: Shadcn/ui with Radix UI
- **Styling**: Tailwind CSS 4, Framer Motion animations
- **Database**: SQLite with Prisma ORM
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Charts**: Recharts
- **Code Quality**: ESLint, TypeScript strict mode

## 📋 Prerequisites

- Node.js 18+ (or Bun)
- npm/yarn/bun package manager

## 🔧 Installation

```bash
# Clone the repository
git clone <repository-url>
cd kaicollege

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env.local

# Set up the database
npm run db:generate
npm run db:push
```

## 📝 Environment Variables

Create a `.env.local` file:

```env
# Database URL (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Session Configuration
SESSION_TIMEOUT=3600000
```

## 🚀 Development

```bash
# Start development server (http://localhost:3000)
npm run dev

# Run ESLint with auto-fix
npm run lint

# Check TypeScript types
npm run type-check

# Run database migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset
```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # REST API endpoints
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── college/           # Domain-specific components
│   │   ├── AdminDashboard.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── TeacherDashboard.tsx
│   │   └── ...
│   └── ui/                # Reusable UI components
├── lib/                    # Utilities and helpers
├── hooks/                  # Custom React hooks
└── store/                  # Zustand store (state management)

prisma/
├── schema.prisma          # Database schema definition
└── migrations/            # Database migrations

public/
└── images/               # Static assets
```

## 📚 Database Schema

The system uses Prisma ORM with SQLite. Key models:
- **User** - Authentication and user management
- **Student** - Student profiles and enrollment
- **Teacher** - Teacher information and courses
- **Course** - Course definitions
- **Student Coursework** - Assignment tracking
- **Quiz** - Quiz management
- **Result** - Grade and result management
- **Fee Structure** - Fee configuration
- **Audit Log** - System audit trail

## 🔐 Security Features

- ✅ Password hashing with bcryptjs
- ✅ Session-based authentication
- ✅ Device detection and session invalidation
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive audit logging
- ✅ TypeScript strict mode enabled
- ✅ No plain text password storage

## 🧪 Code Quality

- TypeScript strict mode enabled
- ESLint configured with Next.js and React best practices
- Type-safe database queries with Prisma
- Form validation with Zod
- Proper error handling throughout

## 🎨 UI/UX

- Modern, responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Dark mode support
- Accessible components using Radix UI
- Professional dashboard layouts
- Real-time notifications with Sonner

## 📦 Build & Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

The build creates a standalone Next.js server that can be deployed anywhere.

## 🔄 Database Migrations

```bash
# Create a new migration
npm run db:migrate

# Apply migrations to review database
npm run db:push

# Reset database (development only)
npm run db:reset
```

## 📊 Performance

- Image optimization with Sharp
- Standalone server output for minimal dependencies
- React Strict Mode enabled for development checks
- Production console logging disabled
- Optimized bundle size

## 🤝 Contributing

1. Ensure code passes ESLint: `npm run lint`
2. Check TypeScript: `npm run type-check`
3. Follow the existing code structure
4. Update tests for new features
5. Keep migrations clean and focused

## 📄 License

This project is proprietary to Imperial College of Health and Allied Sciences.

## 📞 Support

For technical support, contact the development team.

---

**Last Updated**: April 2026  
**Version**: 1.0.0
