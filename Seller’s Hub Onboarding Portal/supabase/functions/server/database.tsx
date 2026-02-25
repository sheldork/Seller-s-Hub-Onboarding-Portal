import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Initialize database tables and default data
export async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    const { error: workmatesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.workmates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name TEXT NOT NULL,
          position TEXT NOT NULL,
          department TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.onboarding_progress (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workmate_id UUID REFERENCES public.workmates(id) ON DELETE CASCADE,
          step_completed INTEGER DEFAULT 1,
          quiz_score INTEGER DEFAULT 0,
          quiz_passed BOOLEAN DEFAULT FALSE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.onboarding_video (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          embed_url TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.quiz_questions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          question_text TEXT NOT NULL,
          question_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.quiz_options (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
          option_text TEXT NOT NULL,
          is_correct BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.quiz_attempts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workmate_id UUID REFERENCES public.workmates(id) ON DELETE CASCADE,
          score INTEGER NOT NULL,
          percentage NUMERIC(5,2) NOT NULL,
          passed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.quiz_answers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
          question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
          selected_option_id UUID REFERENCES public.quiz_options(id) ON DELETE CASCADE,
          is_correct BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          must_change_password BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public.admin_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_workmates_name_dept 
          ON public.workmates(full_name, department);
      `
    });

    console.log('Database initialization completed');
  } catch (error) {
    console.log('Database initialization note:', error);
  }
}
