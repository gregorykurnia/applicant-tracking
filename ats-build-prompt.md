# Applicant Tracking System Build Prompt

Build a simple, modern applicant tracking system called `[APP NAME]`.

The product should help a recruiter manage multiple open job positions, upload CVs into a specific job, automatically extract candidate information, review and edit the extracted data, and move candidates through a hiring pipeline.

The primary workspace model is job-first: recruiters create and manage job positions, then review the candidates and pipeline associated with each job. A candidate may be associated with one or more jobs without duplicating their core profile data.

This should feel like a polished modern SaaS product, not an old-fashioned HR system. Keep the scope focused and avoid unnecessary enterprise features.

## Design direction

Use the **Calm Premium SaaS** visual direction:

- Off-white or very light neutral background
- Dark slate typography
- Indigo or cobalt as the primary accent color
- Thin, subtle borders instead of heavy shadows
- Generous but practical spacing
- Clean left navigation and a clear content hierarchy
- Moderate corner radius; avoid making every element a floating rounded card
- Professional, calm, and easy to use every day
- Avoid excessive gradients, glassmorphism, oversized pill buttons, decorative blobs, and repetitive AI-generated card grids

The interface should feel closer to a well-designed productivity tool than a traditional HR system.

## Core workflow

1. Recruiter creates or selects a job position.
2. Recruiter uploads a CV in PDF or DOCX format into that job.
3. The system parses the CV and extracts structured candidate information.
4. The recruiter reviews and edits the extracted information.
5. The candidate appears in that job's hiring pipeline.
6. The recruiter can drag the candidate between hiring stages for that job.
7. The recruiter can search, filter, open WhatsApp, view the original CV, and add notes.

## Job positions

Jobs are the top-level recruiting workspace. Each job should support:

- Job title
- Department or team
- Location and work arrangement
- Employment type
- Salary range in Indonesian Rupiah
- Job description
- Hiring manager
- Status: Open, Paused, or Closed
- Created date and target hire date, if available
- Candidate count by pipeline stage
- Job-specific notes

Recruiters should be able to create, edit, pause, close, and reopen jobs. The main navigation should make it easy to switch between jobs, and the active job context should always be clear when viewing candidates. A job detail view should include an overview, candidate list, Kanban pipeline, and job settings.

Candidate records should be reusable across jobs. The canonical candidate profile, original CV, contact details, employment history, education, skills, and notes should not be duplicated when the same person is added to another job. Pipeline stage, stage history, application source, and job-specific recruiter notes should belong to the candidate's application for that job.

## Candidate information to extract

- Full name
- Date of birth, if available
- Email address
- Phone number
- WhatsApp number
- Current location
- Current job title
- Desired job title
- Professional summary
- Skills
- Total years of experience
- Previous employment history
- Company names
- Job titles
- Employment dates
- Education
- Certifications
- LinkedIn URL
- Portfolio URL
- Expected salary in Indonesian Rupiah
- Availability or notice period
- Source of application
- Recruiter notes
- Tags

All extracted data must remain editable because CV parsing is not always perfect. Clearly indicate fields that are missing or uncertain with a `Needs review` state.

Salary should be stored as a numeric Indonesian Rupiah value, for example:

`Rp 8,000,000 per month`

## WhatsApp behavior

- Normalize Indonesian phone numbers where possible.
- Add an `Open WhatsApp` button on each candidate.
- Use a WhatsApp click-to-chat link such as `wa.me`.
- Include a button to copy the phone number.
- Do not send messages automatically in the MVP.
- Do not require WhatsApp Business API integration yet.

## Hiring pipeline stages

- New
- Shortlist
- Interview
- User Interview
- Hired
- Rejected

The stages should be displayed as a clean Kanban board. Candidates should be draggable between columns. Also provide a table/list view for faster searching and filtering.

## Main screens

### 1. Dashboard

Show:

- Total open jobs
- Total candidates across the workspace
- Candidates by stage for the selected job
- Recently added candidates across open jobs
- Candidates needing review
- A concise list of active jobs with candidate counts and pipeline progress

### 2. Jobs page

Include:

- Search and filter jobs by status, department, location, and work arrangement
- Create a new job
- Job cards or a compact table with title, status, location, hiring manager, candidate count, and last activity
- Empty state for a workspace with no jobs
- A clear way to open a job workspace

### 3. Job workspace / Candidates page

Include:

- Clear active job header with job title, status, location, and candidate count
- Tabs or equivalent navigation for Overview, Candidates, Pipeline, and Job settings
- Search
- Filters for stage, skills, location, salary, experience, and tags
- List/table view
- Kanban view
- Clear empty and loading states

### 4. Upload CV page or modal

Include:

- The selected job context and an option to change the job before upload
- Drag-and-drop upload
- Upload progress
- Parsing status
- Parsing error state
- A clear review step before saving the candidate
- Duplicate detection across the workspace by email or phone, with an option to attach an existing candidate to the selected job

### 5. Candidate detail page

Include:

- The jobs the candidate is associated with
- Candidate name and contact information
- Editable profile fields
- Employment history
- Skills and tags
- Salary expectation
- Notes
- Hiring stage selector
- Open WhatsApp button
- View/download original CV
- Basic activity history

### 6. Settings

Include:

- Manage pipeline stages
- Manage tags
- Basic workspace settings

Settings should also include sensible defaults for new jobs, such as the default hiring pipeline stages and available employment types.

## Important behavior

- Prevent duplicate candidates when the email or phone number already exists.
- When a candidate already exists, offer to attach them to the selected job instead of creating a duplicate candidate record.
- Keep job-specific application data separate from the canonical candidate profile.
- Allow the recruiter to manually add a candidate without uploading a CV.
- Allow deletion of a candidate and their uploaded CV.
- Show clear loading, success, empty, and error states.
- Preserve the original CV file.
- Do not automatically reject candidates based on age, date of birth, gender, or other sensitive information.
- Use extracted information to help the recruiter review candidates, not to make irreversible hiring decisions automatically.
- Keep candidate data private and scoped to the recruiting workspace. For this initial prototype, open directly into the workspace without a login screen; authentication can be connected later without changing the job and candidate data model.

## Keep the MVP intentionally small

Do not add these features yet:

- Payroll
- Employee management
- Complex recruitment analytics
- Automated rejection emails
- Interview calendar scheduling
- Assessments
- Complex role-based permissions
- Automatic AI candidate scoring
- Automatic WhatsApp messaging

The MVP should support multiple jobs inside one recruiting workspace. Do not build complex multi-tenant administration, but do model workspace, job, candidate, and job-application relationships cleanly so Firestore can support them later.

## Recommended technical direction

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui or a similar accessible component system
- Firebase Authentication can be added later; the initial prototype should open directly into a single recruiting workspace
- Cloud Firestore for candidate records, pipeline stages, tags, notes, and activity history
- Firebase Storage for uploaded CV files
- A CV parsing service or LLM-based structured extraction using a strict JSON schema
- Store parsed data separately from the original uploaded file
- Make the system responsive for desktop and tablet use

Firebase is available for the prototype. Keep the data model and data-access layer modular so the UI can use Firestore for workspace data and Firebase Storage for original CV files without requiring a major rewrite. Do not use Supabase.

## Quality bar

Use realistic sample candidate data and build the main screens as a cohesive product. Prioritize usability, clear information hierarchy, accessibility, and reliable empty/loading/error states over adding more features.
