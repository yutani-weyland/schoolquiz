import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { prisma } from '@schoolquiz/db'

async function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  let userId: string | null = request.headers.get('X-User-Id')
  
  if (!userId && token.startsWith('mock-token-')) {
    const parts = token.split('-')
    if (parts.length >= 3) {
      userId = parts.slice(2, -1).join('-')
    }
  }

  if (!userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
      },
    })
    return user
  } catch (error: any) {
    const errorMsg = error.message || String(error)
    if (errorMsg.includes('does not exist') || 
        errorMsg.includes('P2022') ||
        errorMsg.includes('column')) {
      try {
        const user = await (prisma as any).user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            tier: true,
          },
        })
        return user
      } catch (fallbackError) {
        return null
      }
    }
    throw error
  }
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB max
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_DIMENSIONS = { width: 512, height: 512 } // School logos should be square and reasonable size

/**
 * POST /api/premium/custom-quizzes/upload-logo
 * Upload school logo/emblem for custom quiz branding
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isPremium = user.tier === 'premium' || 
      (user as any).subscriptionStatus === 'ACTIVE' ||
      (user as any).subscriptionStatus === 'TRIALING'
    
    if (!isPremium) {
      return NextResponse.json(
        { error: 'Custom quizzes are only available to premium users' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: PNG, JPG, WebP, or SVG` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Check if Supabase Storage is available
    if (!supabaseAdmin) {
      // Fallback: return a data URL (for development without Supabase)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      
      return NextResponse.json({
        success: true,
        url: dataUrl,
        size: file.size,
        type: file.type,
        warning: 'Supabase Storage not configured - using data URL (temporary)',
      })
    }

    // Generate unique filename with user ID prefix for organization
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const fileName = `school-logos/${user.id}/${timestamp}-${random}.${ext}`

    // Convert File to ArrayBuffer for Supabase upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    // Use 'achievements' bucket or create a 'custom-quizzes' bucket
    const bucketName = 'achievements' // Reuse existing bucket, or create 'custom-quizzes' bucket
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      
      if (error.message.includes('Bucket not found')) {
        return NextResponse.json(
          { error: 'Storage bucket not configured. Please contact support.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to upload logo', details: error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get public URL for uploaded file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
    })
  } catch (error: any) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo', details: error.message },
      { status: 500 }
    )
  }
}

