import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eymxpphofhhfeuvaqfad.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bXhwcGhvZmhoZmV1dmFxZmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NzE0NzQsImV4cCI6MjA1MjM0NzQ3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)