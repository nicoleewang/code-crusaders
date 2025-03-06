
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tazwhzrshlohnvgqqccl.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhendoenJzaGxvaG52Z3FxY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMzgzODMsImV4cCI6MjA1NjcxNDM4M30.rb9HI6yHt0kySEzf6FiLzersd4KbONSrTeO4j-1zcJA"
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;