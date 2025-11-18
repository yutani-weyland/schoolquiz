import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate DATABASE_URL format before Prisma tries to use it
function validateDatabaseUrl(): boolean {
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl || dbUrl.trim() === '') {
    return false
  }

  // Basic validation - should start with postgresql://
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    return false
  }

  return true
}

// Wrap PrismaClient initialization in try-catch to handle invalid DATABASE_URL
let prismaInstance: PrismaClient | undefined

function createPrismaClient(): PrismaClient {
  // Validate DATABASE_URL before attempting to create PrismaClient
  if (!validateDatabaseUrl()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required and must be a valid PostgreSQL connection string in production')
    }
    // In development, throw a more helpful error
    throw new Error('DATABASE_URL is not set or invalid. Please set it in your .env.local file. Example: postgresql://user:password@localhost:5432/dbname')
  }

  try {
    return new PrismaClient()
  } catch (error: any) {
    // If Prisma still fails, provide helpful error message
    if (process.env.NODE_ENV !== 'production') {
      console.error('Prisma client initialization failed:', error.message)
      console.error('Please check your DATABASE_URL format. It should be: postgresql://user:password@host:port/database')
      throw error
    }
    throw new Error('Failed to initialize Prisma client. Check your DATABASE_URL format.')
  }
}

// Only initialize if not already cached
if (!globalForPrisma.prisma) {
  try {
    prismaInstance = createPrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance
    }
  } catch (error) {
    // In development, create a proxy that throws helpful errors when accessed
    if (process.env.NODE_ENV !== 'production') {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Prisma client not initialized. Please set a valid DATABASE_URL in your .env.local file.'
      
      // Create a proxy that provides helpful error messages
      prismaInstance = new Proxy({} as PrismaClient, {
        get() {
          throw new Error(errorMessage)
        }
      })
    } else {
      throw error
    }
  }
}

export const prisma = globalForPrisma.prisma ?? prismaInstance!