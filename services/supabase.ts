
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = 'https://seweuyiyvicoqvtgjwss.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNld2V1eWl5dmljb3F2dGdqd3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODkxMDQsImV4cCI6MjA1OTc2NTEwNH0.VmAIM06-p4MZz8fxB3HbTzo1QiA9-JBoabp-Aehu2ko';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
