import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qncciizmpqyfxjxnyhxt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuY2NpaXptcHF5ZnhqeG54aHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2NDQ4MDAsImV4cCI6MjA0ODIyMDgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('Connection test result:', error.message)
    } else {
      console.log('✅ Supabase connection successful!')
      console.log('Data:', data)
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message)
  }
}

testConnection()