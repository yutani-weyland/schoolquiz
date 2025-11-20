/**
 * POST /api/admin/setup
 * 
 * One-time setup endpoint to create an admin user
 * This should be disabled in production after initial setup
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@schoolquiz/db'

export async function POST(request: NextRequest) {
  // Only allow in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_SETUP !== 'true') {
    return NextResponse.json(
      { error: 'Admin setup is disabled in production' },
      { status: 403 }
    )
  }

  try {
    // Get or create a default school
    let school = await prisma.school.findFirst()
    if (!school) {
      school = await prisma.school.create({
        data: {
          name: 'Admin School',
        },
      })
    }

    // Check if admin teacher already exists
    let adminTeacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { email: 'admin@schoolquiz.com' },
          { role: 'PlatformAdmin' },
          { role: 'admin' },
        ],
      },
    })

    if (!adminTeacher) {
      // Create admin teacher
      adminTeacher = await prisma.teacher.create({
        data: {
          email: 'admin@schoolquiz.com',
          name: 'Platform Admin',
          role: 'PlatformAdmin',
          schoolId: school.id,
        },
      })
    } else {
      // Update existing teacher to be PlatformAdmin
      adminTeacher = await prisma.teacher.update({
        where: { id: adminTeacher.id },
        data: { role: 'PlatformAdmin' },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created/updated successfully',
      user: {
        id: adminTeacher.id,
        email: adminTeacher.email,
        name: adminTeacher.name,
        role: adminTeacher.role,
      },
    })
  } catch (error: any) {
    console.error('Error setting up admin user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create admin user' },
      { status: 500 }
    )
  }
}

