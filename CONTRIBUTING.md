# Contributing Guide

Thank you for contributing to the ICHAS Management System! This guide will help you get started.

## 📋 Prerequisites

- Node.js 18+
- Familiarity with TypeScript, React, and Next.js
- Knowledge of database concepts and Prisma ORM

## 🚀 Getting Started

### 1. Clone and Setup
```bash
git clone <repository-url>
cd kaicollege
npm install
cp .env.example .env.local
npm run db:generate
npm run db:push
```

### 2. Start Development
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

## 📝 Development Workflow

### Before Committing
```bash
# 1. Check and fix linting issues
npm run lint

# 2. Verify TypeScript types
npm run type-check

# 3. Test your changes locally
npm run dev
```

### Making Changes

#### 1. **Creating Database Migrations**
When modifying `prisma/schema.prisma`:
```bash
npm run db:migrate
# Give your migration a descriptive name
```

#### 2. **Code Organization**
- **Components**: Place in `src/components/`
  - Domain-specific components: `src/components/college/`
  - Reusable UI: `src/components/ui/`
- **API Routes**: Place in `src/app/api/`
- **Utilities**: Place in `src/lib/`
- **Hooks**: Place in `src/hooks/`
- **Store**: Place in `src/store/`

#### 3. **Naming Conventions**
- Components: PascalCase (`StudentDashboard.tsx`)
- Hooks: camelCase with `use` prefix (`useStudentData.ts`)
- Utilities: camelCase (`calculateGPA.ts`)
- API routes: kebab-case params (`/api/students/[id]`)

#### 4. **Type Safety**
- Always use TypeScript types
- Avoid `any` type (use `unknown` and narrow down)
- Export types from components:

```typescript
export interface StudentDashboardProps {
  studentId: string;
  // ...
}

export default function StudentDashboard(props: StudentDashboardProps) {
  // ...
}
```

#### 5. **Form Validation**
Use Zod schemas and React Hook Form:

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    // form JSX
  );
}
```

## 🎨 Style Guidelines

### Tailwind CSS
```typescript
// Use Tailwind utilities instead of inline styles
<div className="flex items-center justify-between p-4 rounded-lg bg-card">
  {content}
</div>
```

### Component Structure
```typescript
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface MyComponentProps {
  title: string
}

export default function MyComponent({ title }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
    </div>
  )
}
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  const data = await response.json()
  return data
} catch (error) {
  console.error('Error:', error)
  throw error // or handle gracefully
}
```

## 🔒 Security Best Practices

1. **Never store plain passwords** - Always hash with bcryptjs
2. **Validate server-side** - Don't trust client-side validation alone
3. **Use TypeScript strict mode** - Catch type errors early
4. **Sanitize user input** - Use Zod for validation
5. **Audit sensitive operations** - Log to AuditLog table
6. **Session management** - Use proper session middleware

Example secure endpoint:
```typescript
// src/app/api/users/change-password/route.ts
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const schema = z.object({
  sessionToken: z.string(),
  oldPassword: z.string(),
  newPassword: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sessionToken, oldPassword, newPassword } = schema.parse(body)

    // Verify session
    const session = await db.session.findUnique({
      where: { token: sessionToken },
    })
    if (!session) throw new Error('Invalid session')

    // Verify old password
    const user = await db.user.findUnique({
      where: { id: session.userId },
    })
    const valid = await bcrypt.compare(oldPassword, user.password)
    if (!valid) throw new Error('Invalid password')

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        details: `User changed password`,
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to change password' }, { status: 400 })
  }
}
```

## 🧪 Testing

While comprehensive test setup isn't configured yet, follow these practices:
- Test API endpoints with curl or Postman
- Manually test flows in development
- Check accessibility with browser DevTools

## 📚 Database Schema

Before modifying the schema, understand the relationships:
- Users have many sessions and audit logs
- Students belong to courses
- Teachers teach courses and create assignments
- Grades link assignments to students

Always back up data before running `db:reset`

## 🐛 Debugging

### Enable Debug Logging
Set in `.env.local`:
```env
DEBUG=true
```

### Check Database State
```bash
npm run db:studio  # Opens Prisma Studio at http://localhost:5555
```

### Browser DevTools
- Check Console for errors
- Use Network tab to inspect API calls
- Check Application tab for session data

## 📤 Submitting Changes

### Before PR
1. ✅ No TypeScript errors: `npm run type-check`
2. ✅ Linting passes: `npm run lint`
3. ✅ Feature tested locally
4. ✅ Database migrations included (if needed)
5. ✅ No sensitive data committed

### PR Description
- Clear title and description
- Link related issues
- Explain changes clearly
- Include testing steps

## 🔄 Common Tasks

### Adding a New Table to Database
1. Update `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Create API routes in `src/app/api/`
4. Create components in `src/components/`

### Adding a New Role
1. Update role check logic
2. Create new dashboard component
3. Add role-specific UI in AppSidebar
4. Test access control

### Fixing a Bug
1. Create new branch: `git checkout -b fix/issue-description`
2. Write tests to reproduce bug
3. Fix the issue
4. Verify with `npm run lint && npm run type-check`
5. Submit PR

## ❓ Need Help?

- Check CLEANUP_SUMMARY.md for recent changes
- Review existing code for patterns
- Check TypeScript errors for guidance
- Review Prisma documentation for database questions

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Hook Form](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

Happy coding! 🚀
