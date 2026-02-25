import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { supabaseAdmin, supabaseAnonKey, initializeDatabase } from "./database.tsx";
import bcrypt from "npm:bcryptjs";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize database on startup
initializeDatabase();

// Health check endpoint
app.get("/make-server-68b869dd/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// WORKMATE ROUTES
// ============================================

// Workmate registration (identification gate)
app.post("/make-server-68b869dd/workmate/register", async (c) => {
  try {
    const { full_name, position, department } = await c.req.json();

    // Validation
    if (!full_name || !position || !department) {
      return c.json({ error: "All fields are required" }, 400);
    }

    // Sanitize inputs
    const sanitizedName = full_name.trim();
    const sanitizedPosition = position.trim();
    const sanitizedDepartment = department.trim();

    // Check for duplicate
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('workmates')
      .select('id')
      .eq('full_name', sanitizedName)
      .eq('department', sanitizedDepartment)
      .maybeSingle();

    if (existing) {
      return c.json({ error: "Workmate with this name and department already exists" }, 409);
    }

    // Insert workmate
    const { data: workmate, error: insertError } = await supabaseAdmin
      .from('workmates')
      .insert([{ 
        full_name: sanitizedName, 
        position: sanitizedPosition, 
        department: sanitizedDepartment 
      }])
      .select()
      .single();

    if (insertError) {
      console.log('Error inserting workmate:', insertError);
      return c.json({ error: "Failed to register workmate" }, 500);
    }

    // Create onboarding progress record
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('onboarding_progress')
      .insert([{ 
        workmate_id: workmate.id,
        step_completed: 1
      }])
      .select()
      .single();

    if (progressError) {
      console.log('Error creating onboarding progress:', progressError);
      return c.json({ error: "Failed to create onboarding progress" }, 500);
    }

    return c.json({ 
      success: true, 
      workmate: workmate,
      progress: progress
    });
  } catch (error) {
    console.log('Error in workmate registration:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get workmate by ID
app.get("/make-server-68b869dd/workmate/:id", async (c) => {
  try {
    const id = c.req.param('id');

    const { data: workmate, error } = await supabaseAdmin
      .from('workmates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !workmate) {
      return c.json({ error: "Workmate not found" }, 404);
    }

    return c.json({ workmate });
  } catch (error) {
    console.log('Error fetching workmate:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// ONBOARDING PROGRESS ROUTES
// ============================================

// Get onboarding progress
app.get("/make-server-68b869dd/onboarding/progress/:workmate_id", async (c) => {
  try {
    const workmate_id = c.req.param('workmate_id');

    const { data: progress, error } = await supabaseAdmin
      .from('onboarding_progress')
      .select('*')
      .eq('workmate_id', workmate_id)
      .single();

    if (error || !progress) {
      return c.json({ error: "Progress not found" }, 404);
    }

    return c.json({ progress });
  } catch (error) {
    console.log('Error fetching progress:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update onboarding progress
app.put("/make-server-68b869dd/onboarding/progress/:workmate_id", async (c) => {
  try {
    const workmate_id = c.req.param('workmate_id');
    const updates = await c.req.json();

    const { data: progress, error } = await supabaseAdmin
      .from('onboarding_progress')
      .update(updates)
      .eq('workmate_id', workmate_id)
      .select()
      .single();

    if (error) {
      console.log('Error updating progress:', error);
      return c.json({ error: "Failed to update progress" }, 500);
    }

    return c.json({ progress });
  } catch (error) {
    console.log('Error updating progress:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// VIDEO ROUTES
// ============================================

// Get current active video
app.get("/make-server-68b869dd/video/current", async (c) => {
  try {
    const { data: video, error } = await supabaseAdmin
      .from('onboarding_video')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return c.json({ video: video || null });
  } catch (error) {
    console.log('Error fetching video:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all videos (admin)
app.get("/make-server-68b869dd/admin/videos", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: videos, error } = await supabaseAdmin
      .from('onboarding_video')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching videos:', error);
      return c.json({ error: "Failed to fetch videos" }, 500);
    }

    return c.json({ videos });
  } catch (error) {
    console.log('Error fetching videos:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create/Update video (admin)
app.post("/make-server-68b869dd/admin/video", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { title, embed_url } = await c.req.json();

    if (!title || !embed_url) {
      return c.json({ error: "Title and embed URL are required" }, 400);
    }

    // Deactivate all existing videos
    await supabaseAdmin
      .from('onboarding_video')
      .update({ is_active: false })
      .eq('is_active', true);

    // Create new video
    const { data: video, error } = await supabaseAdmin
      .from('onboarding_video')
      .insert([{ title, embed_url, is_active: true }])
      .select()
      .single();

    if (error) {
      console.log('Error creating video:', error);
      return c.json({ error: "Failed to create video" }, 500);
    }

    return c.json({ video });
  } catch (error) {
    console.log('Error creating video:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// QUIZ ROUTES
// ============================================

// Get all quiz questions with options
app.get("/make-server-68b869dd/quiz/questions", async (c) => {
  try {
    const { data: questions, error } = await supabaseAdmin
      .from('quiz_questions')
      .select(`
        *,
        quiz_options (*)
      `)
      .order('question_order', { ascending: true });

    if (error) {
      console.log('Error fetching questions:', error);
      return c.json({ error: "Failed to fetch questions" }, 500);
    }

    return c.json({ questions });
  } catch (error) {
    console.log('Error fetching questions:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Submit quiz attempt
app.post("/make-server-68b869dd/quiz/submit", async (c) => {
  try {
    const { workmate_id, answers } = await c.req.json();

    if (!workmate_id || !answers || !Array.isArray(answers)) {
      return c.json({ error: "Invalid submission data" }, 400);
    }

    // Get passing score
    const { data: settingData } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'passing_score_percentage')
      .maybeSingle();

    const passingScore = settingData ? parseFloat(settingData.setting_value) : 70;

    // Calculate score
    let correctCount = 0;
    const answerDetails = [];

    for (const answer of answers) {
      const { data: option } = await supabaseAdmin
        .from('quiz_options')
        .select('is_correct')
        .eq('id', answer.selected_option_id)
        .single();

      const isCorrect = option?.is_correct || false;
      if (isCorrect) correctCount++;

      answerDetails.push({
        question_id: answer.question_id,
        selected_option_id: answer.selected_option_id,
        is_correct: isCorrect
      });
    }

    const totalQuestions = answers.length;
    const percentage = (correctCount / totalQuestions) * 100;
    const passed = percentage >= passingScore;

    // Create quiz attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('quiz_attempts')
      .insert([{
        workmate_id,
        score: correctCount,
        percentage: percentage.toFixed(2),
        passed
      }])
      .select()
      .single();

    if (attemptError) {
      console.log('Error creating quiz attempt:', attemptError);
      return c.json({ error: "Failed to submit quiz" }, 500);
    }

    // Save individual answers
    const answersToInsert = answerDetails.map(detail => ({
      attempt_id: attempt.id,
      ...detail
    }));

    await supabaseAdmin
      .from('quiz_answers')
      .insert(answersToInsert);

    // Update onboarding progress
    const updateData: any = {
      quiz_score: correctCount,
      quiz_passed: passed
    };

    if (passed) {
      updateData.step_completed = 4;
    }

    await supabaseAdmin
      .from('onboarding_progress')
      .update(updateData)
      .eq('workmate_id', workmate_id);

    return c.json({ 
      attempt,
      score: correctCount,
      total: totalQuestions,
      percentage: percentage.toFixed(2),
      passed,
      answers: answerDetails
    });
  } catch (error) {
    console.log('Error submitting quiz:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// ADMIN QUIZ MANAGEMENT ROUTES
// ============================================

// Create question (admin)
app.post("/make-server-68b869dd/admin/question", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { question_text, options, question_order } = await c.req.json();

    if (!question_text || !options || options.length < 2) {
      return c.json({ error: "Question must have text and at least 2 options" }, 400);
    }

    const correctOptions = options.filter((opt: any) => opt.is_correct);
    if (correctOptions.length !== 1) {
      return c.json({ error: "Question must have exactly one correct answer" }, 400);
    }

    // Create question
    const { data: question, error: questionError } = await supabaseAdmin
      .from('quiz_questions')
      .insert([{ question_text, question_order: question_order || 0 }])
      .select()
      .single();

    if (questionError) {
      console.log('Error creating question:', questionError);
      return c.json({ error: "Failed to create question" }, 500);
    }

    // Create options
    const optionsToInsert = options.map((opt: any) => ({
      question_id: question.id,
      option_text: opt.option_text,
      is_correct: opt.is_correct || false
    }));

    const { data: createdOptions, error: optionsError } = await supabaseAdmin
      .from('quiz_options')
      .insert(optionsToInsert)
      .select();

    if (optionsError) {
      console.log('Error creating options:', optionsError);
      return c.json({ error: "Failed to create options" }, 500);
    }

    return c.json({ 
      question: {
        ...question,
        quiz_options: createdOptions
      }
    });
  } catch (error) {
    console.log('Error creating question:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update question (admin)
app.put("/make-server-68b869dd/admin/question/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const questionId = c.req.param('id');
    const { question_text, options } = await c.req.json();

    if (!question_text) {
      return c.json({ error: "Question text is required" }, 400);
    }

    // Update question
    const { data: question, error: questionError } = await supabaseAdmin
      .from('quiz_questions')
      .update({ question_text })
      .eq('id', questionId)
      .select()
      .single();

    if (questionError) {
      console.log('Error updating question:', questionError);
      return c.json({ error: "Failed to update question" }, 500);
    }

    // If options provided, update them
    if (options && options.length >= 2) {
      const correctOptions = options.filter((opt: any) => opt.is_correct);
      if (correctOptions.length !== 1) {
        return c.json({ error: "Question must have exactly one correct answer" }, 400);
      }

      // Delete existing options
      await supabaseAdmin
        .from('quiz_options')
        .delete()
        .eq('question_id', questionId);

      // Create new options
      const optionsToInsert = options.map((opt: any) => ({
        question_id: questionId,
        option_text: opt.option_text,
        is_correct: opt.is_correct || false
      }));

      await supabaseAdmin
        .from('quiz_options')
        .insert(optionsToInsert);
    }

    // Fetch updated question with options
    const { data: updatedQuestion } = await supabaseAdmin
      .from('quiz_questions')
      .select(`
        *,
        quiz_options (*)
      `)
      .eq('id', questionId)
      .single();

    return c.json({ question: updatedQuestion });
  } catch (error) {
    console.log('Error updating question:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete question (admin)
app.delete("/make-server-68b869dd/admin/question/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const questionId = c.req.param('id');

    const { error } = await supabaseAdmin
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      console.log('Error deleting question:', error);
      return c.json({ error: "Failed to delete question" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting question:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// ADMIN AUTHENTICATION ROUTES
// ============================================

// Admin signup (create admin user)
app.post("/make-server-68b869dd/admin/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Validate password complexity
    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
      return c.json({ 
        error: "Password must contain uppercase, lowercase, number, and symbol" 
      }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || '' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Error creating admin user:', error);
      return c.json({ error: error.message || "Failed to create admin user" }, 500);
    }

    // Create profile
    await supabaseAdmin
      .from('profiles')
      .insert([{
        id: data.user.id,
        email,
        role: 'admin',
        must_change_password: false
      }]);

    return c.json({ 
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.log('Error in admin signup:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// ADMIN DASHBOARD ROUTES
// ============================================

// Get dashboard stats
app.get("/make-server-68b869dd/admin/stats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Total workmates
    const { count: totalWorkmates } = await supabaseAdmin
      .from('workmates')
      .select('*', { count: 'exact', head: true });

    // Completed onboarding
    const { count: completedCount } = await supabaseAdmin
      .from('onboarding_progress')
      .select('*', { count: 'exact', head: true })
      .not('completed_at', 'is', null);

    // Average quiz score
    const { data: attempts } = await supabaseAdmin
      .from('quiz_attempts')
      .select('percentage');

    let avgScore = 0;
    if (attempts && attempts.length > 0) {
      const total = attempts.reduce((sum, a) => sum + parseFloat(a.percentage), 0);
      avgScore = total / attempts.length;
    }

    // Recent submissions
    const { data: recent } = await supabaseAdmin
      .from('workmates')
      .select(`
        *,
        onboarding_progress (*)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    return c.json({
      totalWorkmates: totalWorkmates || 0,
      completedCount: completedCount || 0,
      completionRate: totalWorkmates ? ((completedCount || 0) / totalWorkmates * 100).toFixed(1) : 0,
      avgQuizScore: avgScore.toFixed(1),
      recentSubmissions: recent || []
    });
  } catch (error) {
    console.log('Error fetching stats:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get all workmates with progress
app.get("/make-server-68b869dd/admin/workmates", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: workmates, error } = await supabaseAdmin
      .from('workmates')
      .select(`
        *,
        onboarding_progress (*),
        quiz_attempts (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching workmates:', error);
      return c.json({ error: "Failed to fetch workmates" }, 500);
    }

    return c.json({ workmates });
  } catch (error) {
    console.log('Error fetching workmates:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ============================================
// ADMIN SETTINGS ROUTES
// ============================================

// Get admin settings
app.get("/make-server-68b869dd/admin/settings", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get passing score
    const { data: passingScoreSetting } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .eq('setting_key', 'passing_score_percentage')
      .maybeSingle();

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return c.json({
      passingScore: passingScoreSetting?.setting_value || '70',
      profile
    });
  } catch (error) {
    console.log('Error fetching settings:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update passing score
app.put("/make-server-68b869dd/admin/settings/passing-score", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { passing_score } = await c.req.json();

    if (!passing_score || isNaN(passing_score) || passing_score < 0 || passing_score > 100) {
      return c.json({ error: "Passing score must be between 0 and 100" }, 400);
    }

    // Upsert setting
    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .upsert([{
        setting_key: 'passing_score_percentage',
        setting_value: passing_score.toString(),
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'setting_key'
      })
      .select()
      .single();

    if (error) {
      console.log('Error updating passing score:', error);
      return c.json({ error: "Failed to update passing score" }, 500);
    }

    return c.json({ success: true, setting: data });
  } catch (error) {
    console.log('Error updating passing score:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update admin password
app.put("/make-server-68b869dd/admin/settings/password", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { password } = await c.req.json();

    if (!password || password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters" }, 400);
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
      return c.json({ 
        error: "Password must contain uppercase, lowercase, number, and symbol" 
      }, 400);
    }

    // Update password
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (error) {
      console.log('Error updating password:', error);
      return c.json({ error: "Failed to update password" }, 500);
    }

    // Update must_change_password flag
    await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', user.id);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating password:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Export data as CSV
app.get("/make-server-68b869dd/admin/export", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (!user?.id) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data: workmates, error } = await supabaseAdmin
      .from('workmates')
      .select(`
        *,
        onboarding_progress (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching data for export:', error);
      return c.json({ error: "Failed to fetch data" }, 500);
    }

    // Build CSV
    let csv = 'Full Name,Position,Department,Step Completed,Quiz Score,Quiz Passed,Completed At,Created At\n';
    
    for (const wm of workmates || []) {
      const progress = Array.isArray(wm.onboarding_progress) ? wm.onboarding_progress[0] : wm.onboarding_progress;
      csv += `"${wm.full_name}","${wm.position}","${wm.department}",`;
      csv += `${progress?.step_completed || 1},`;
      csv += `${progress?.quiz_score || 0},`;
      csv += `${progress?.quiz_passed ? 'Yes' : 'No'},`;
      csv += `"${progress?.completed_at || ''}",`;
      csv += `"${wm.created_at}"\n`;
    }

    return c.text(csv, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="onboarding-data.csv"'
    });
  } catch (error) {
    console.log('Error exporting data:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);
