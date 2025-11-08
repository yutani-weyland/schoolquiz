import { prisma } from './client'

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test a simple query
    const schoolCount = await prisma.school.count()
    console.log(`📊 Found ${schoolCount} schools in database`)
    
    const teacherCount = await prisma.teacher.count()
    console.log(`👥 Found ${teacherCount} teachers in database`)
    
    const questionCount = await prisma.question.count()
    console.log(`❓ Found ${questionCount} questions in database`)
    
    console.log('🎉 All tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

