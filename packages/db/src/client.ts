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
    // Simply create Prisma client - it will read DATABASE_URL from env
    // Prisma should handle the connection string format correctly
    const client = new PrismaClient()
    return client
  } catch (error: any) {
    // If Prisma still fails, provide helpful error message
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌❌❌ Prisma client constructor failed ❌❌❌')
      console.error('Error message:', error.message)
      console.error('Error type:', error.constructor.name)
      console.error('Error code:', error.code)
      console.error('Error name:', error.name)
      console.error('Full error object:', error)
      console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL)
      console.error('DATABASE_URL length:', process.env.DATABASE_URL?.length)
      console.error('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 100))
      
      // Check if it's a URL parsing issue
      try {
        const url = new URL(process.env.DATABASE_URL || '')
        console.error('URL parsed successfully:', {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          search: url.search,
        })
      } catch (urlError: any) {
        console.error('❌ URL parsing failed:', urlError.message)
      }
      
      console.error('Please check your DATABASE_URL format. It should be: postgresql://user:password@host:port/database')
      throw error
    }
    throw new Error('Failed to initialize Prisma client. Check your DATABASE_URL format.')
  }
}

// Lazy initialization function
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  if (prismaInstance) {
    return prismaInstance
  }
  
  try {
    prismaInstance = createPrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance
    }
    return prismaInstance
  } catch (error) {
    // Log the actual error for debugging
    console.error('❌❌❌ Prisma client initialization failed ❌❌❌');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
    }
    console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.error('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 80) + '...');
    
    // In development, create a proxy that throws helpful errors when accessed
    if (process.env.NODE_ENV !== 'production') {
      const errorMessage = error instanceof Error 
        ? `Prisma initialization failed: ${error.message}. Check your DATABASE_URL in .env.local`
        : 'Prisma client not initialized. Please set a valid DATABASE_URL in your .env.local file.'
      
      // Create a proxy that provides helpful error messages
      prismaInstance = new Proxy({} as PrismaClient, {
        get() {
          throw new Error(errorMessage)
        }
      }) as PrismaClient
      return prismaInstance
    } else {
      throw error
    }
  }
}

// Export a getter that initializes on first access
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
}) as PrismaClient