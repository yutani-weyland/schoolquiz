import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * POST /api/admin/achievements/upload
 * Upload an image file (background or sticker/icon)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'background' or 'sticker'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || !['background', 'sticker'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "background" or "sticker"' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${sanitizedName}`
    
    // Determine upload path based on type
    const uploadDir = type === 'background' ? 'achievements/backgrounds' : 'achievements/stickers'
    const publicPath = `/${uploadDir}/${filename}`
    
    // Get the correct path - handle both dev and production
    const publicDir = join(process.cwd(), 'public')
    const dirPath = join(publicDir, uploadDir)
    const filePath = join(dirPath, filename)

    // Ensure public directory exists
    if (!existsSync(publicDir)) {
      console.error('Public directory does not exist:', publicDir)
      return NextResponse.json(
        { error: 'Public directory not found', details: `Expected: ${publicDir}` },
        { status: 500 }
      )
    }

    // Ensure upload directory exists
    try {
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true })
        console.log('Created directory:', dirPath)
      }
    } catch (error: any) {
      console.error('Error creating directory:', error)
      return NextResponse.json(
        { error: 'Failed to create upload directory', details: error.message },
        { status: 500 }
      )
    }

    // Convert file to buffer and save
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      console.log('File saved successfully:', filePath)
    } catch (error: any) {
      console.error('Error writing file:', error)
      return NextResponse.json(
        { error: 'Failed to save file', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: publicPath,
      filename,
      type,
    })
  } catch (error: any) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    )
  }
}

