import { createClient } from '@supabase/supabase-js'

// Browser-side client — anon key is safe to expose (NEXT_PUBLIC_)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
