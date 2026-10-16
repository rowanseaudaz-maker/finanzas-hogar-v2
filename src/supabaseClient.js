import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bclbyuizdcwiorhgjtjf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGJ5dWl6ZGN3aW9yaGdqdGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NDUxNDAsImV4cCI6MjA1ODUyMTE0MH0.7tHqJk6g-_Xb8j1I4a6S0VbN0fX2W1pY3qZ4a5b6c7d'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
