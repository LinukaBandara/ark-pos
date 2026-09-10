import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase env vars. Create a .env.local file in your project root with:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fixed IDs from ark-pos-seed.sql — in a real multi-tenant deploy these come
// from the logged-in user's session (their tenant, their branch, their
// employee record), not hardcoded constants like this.
export const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_BRANCH_ID = '00000000-0000-0000-0000-000000000002';
export const DEMO_EMPLOYEE_ID = '00000000-0000-0000-0000-000000000004';
