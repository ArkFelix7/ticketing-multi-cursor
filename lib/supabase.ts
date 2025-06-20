import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
