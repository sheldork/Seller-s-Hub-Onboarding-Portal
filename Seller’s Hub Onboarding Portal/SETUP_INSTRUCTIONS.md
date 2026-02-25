# Seller's Hub Onboarding Portal - Setup Instructions

## Overview
This is a comprehensive onboarding portal built with React, Supabase, and Tailwind CSS. It includes both workmate onboarding flow and admin management features.

## Initial Setup

### 1. Database Initialization
The database tables are automatically created when the server starts. The following tables will be created:

- `workmates` - Stores workmate information
- `onboarding_progress` - Tracks onboarding completion
- `onboarding_video` - Stores training video information
- `quiz_questions` - Quiz questions
- `quiz_options` - Quiz answer options
- `quiz_attempts` - Quiz submission records
- `quiz_answers` - Individual quiz answers
- `profiles` - Admin user profiles
- `admin_settings` - System settings (passing score, etc.)

### 2. Create First Admin Account

1. Navigate to `/admin-signup` in your browser
2. Fill in the form with:
   - Full Name
   - Email
   - Password (must be ≥8 characters with uppercase, lowercase, number, and symbol)
   - Confirm Password
3. Click "Create Admin Account"
4. You'll be redirected to the admin login page

### 3. Admin Login

1. Navigate to `/admin-login` or click "Admin Access" from the home page
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard

## Admin Portal Features

### Dashboard
- View total workmates onboarded
- See completion rates
- Monitor average quiz scores
- View recent submissions

### Onboarding Records
- Browse all workmate records
- Search by name, position, or department
- View progress status and quiz results

### Video Management
- Upload/update training videos
- Preview current active video
- Supports YouTube embed URLs

### Question Management
- Add quiz questions with multiple choice options
- Edit existing questions
- Delete questions
- Mark correct answers
- Minimum 2 options, exactly 1 correct answer required

### Export Data
- Export all onboarding data to CSV
- Includes workmate details, progress, and quiz results
- Compatible with Excel and Google Sheets

### Settings
- Update quiz passing score percentage (default: 70%)
- Change admin password
- Password complexity requirements enforced

## Workmate Onboarding Flow

### Step 1: Workmate Entry
- Workmates enter their full name, position, and department
- System checks for duplicates (same name + department)
- Creates workmate record and progress tracker

### Step 2: Company Rules
- Static content page showing:
  - Introduction
  - Your Role Matters
  - Core Values (Integrity, Driven, Ownership, Learner)
- Progress tracked automatically

### Step 3: Training Video
- Displays the current active video (uploaded by admin)
- Workmate must mark video as complete
- Progress to next step only after video completion

### Step 4: Knowledge Check (Quiz)
- Multiple choice quiz
- Questions managed by admin
- Auto-grading based on passing score percentage
- Must pass to proceed to next step
- Results tracked and visible to admin

### Step 5: Company Offenses & Disciplinary Process
- Interactive flip cards showing offense types:
  - Minor Offenses
  - Medium Offenses
  - Major Offenses
- Timeline visualization of disciplinary process
- Final step completion

## Security Features

✅ Parameterized queries (via Supabase client) prevent SQL injection
✅ Password complexity requirements enforced
✅ Secure password hashing (handled by Supabase Auth)
✅ Admin authentication required for all admin routes
✅ Input sanitization for workmate registration
✅ Duplicate entry prevention
✅ Access token validation on protected routes

## Important Notes

### Database Tables
- The system uses Supabase's built-in auth system
- Custom tables are created automatically via the backend
- No manual SQL migrations needed for initial setup

### Adding Quiz Content
After creating your admin account:
1. Go to "Question Management"
2. Click "Add Question"
3. Enter question text
4. Add at least 2 options
5. Mark one option as correct
6. Save

### Adding Training Video
1. Go to "Video Management"
2. Enter video title
3. Paste YouTube URL (will auto-convert to embed format)
4. Preview to verify
5. Click "Update Video"

### Setting Passing Score
1. Go to "Settings"
2. Update the passing score percentage (0-100)
3. This affects all future quiz attempts

## Default Configuration

- **Passing Score**: 70%
- **Brand Color**: #FBB704 (Yellow/Gold)
- **Font**: Inter (system sans-serif fallback)
- **Responsive**: Desktop optimized (1440px), mobile responsive

## User Flow Summary

**Workmate Journey:**
1. Enter details on home page → 
2. Company rules → 
3. Watch video → 
4. Take quiz → 
5. Review disciplinary process → 
6. Complete onboarding

**Admin Journey:**
1. Create admin account →
2. Login →
3. Upload video content →
4. Add quiz questions →
5. Monitor workmate progress →
6. Export data for reporting

## Troubleshooting

### "No video available"
- Admin must upload a video in Video Management first

### "No quiz questions available"
- Admin must add questions in Question Management first

### "Unauthorized" error on admin pages
- Ensure you're logged in with admin credentials
- Session may have expired - try logging in again

### "Failed to register workmate"
- Check if workmate with same name + department already exists
- Ensure all required fields are filled

## Data Export

The CSV export includes:
- Full Name
- Position
- Department
- Current Step
- Quiz Score
- Quiz Pass Status
- Completion Date
- Registration Date

Perfect for reporting and record-keeping!
