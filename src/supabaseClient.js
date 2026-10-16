import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bclbyuizdcwiorhgjtjf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbGJ5dWl6ZGN3aW9yaGdqdGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMjY4NTIsImV4cCI6MjEwNjcwMjg1Mn0.ssqcfNsDOg8_DoC5XIpHX0D4xk-Qbk89D_F5P9lK4MA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
