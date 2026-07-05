/**
 * API Configuration Constants
 * Centralized API base URL and endpoint definitions
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://brain.getajob.com';

const API_V1_BASE = '/api/v1';

export const API_ENDPOINTS = {
  // Documents
  DOCUMENTS: `${API_V1_BASE}/documents/documents/`,
  DOCUMENT_DETAIL: (id: string | number) => `${API_V1_BASE}/documents/documents/${id}/`,
  DOCUMENT_DOWNLOAD: (id: string | number) =>
    `${API_V1_BASE}/documents/documents/${id}/download/`,

  // Positions
  POSITIONS: `${API_V1_BASE}/positions/positions/`,
  POSITION_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/positions/positions/${id}/`,

  // Skills
  SKILLS: `${API_V1_BASE}/positions/skills/`,
  SKILL_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/positions/skills/${id}/`,

  // Conditions
  CONDITIONS: `${API_V1_BASE}/positions/conditions/`,
  CONDITION_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/positions/conditions/${id}/`,

  // Categories (Position Categories)
  CATEGORIES: `${API_V1_BASE}/positions/categories/`,

  // Libraries
  LIBRARIES: `${API_V1_BASE}/positions/libraries/`,

  // Assessment Templates
  ASSESSMENT_TEMPLATES: `${API_V1_BASE}/assessment/templates/`,
  ASSESSMENT_TEMPLATE_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/assessment/templates/${id}/`,

  // Assessment Categories
  ASSESSMENT_CATEGORIES: `${API_V1_BASE}/assessment/categories/`,
  ASSESSMENT_CATEGORY_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/assessment/categories/${id}/`,

  // Assessment Choices
  ASSESSMENT_CHOICES: `${API_V1_BASE}/assessment/choices/`,
  ASSESSMENT_CHOICE_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/assessment/choices/${id}/`,

  // Assessment Questions
  ASSESSMENT_QUESTIONS: `${API_V1_BASE}/assessment/questions/`,
  ASSESSMENT_QUESTION_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/assessment/questions/${id}/`,

  // Assessment Quizzes
  ASSESSMENT_QUIZZES_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/assessment/quizzes/${id}/`,
  ASSESSMENT_QUIZZES_COMPLETE: (id: string | number) =>
    `${API_V1_BASE}/assessment/quizzes/${id}/complete/`,

  // Matching
  MATCHING_POSITION: (id: string | number) =>
    `${API_V1_BASE}/matching/position/${id}/`,

  // Candidates
  CANDIDATES: `${API_V1_BASE}/candidates/candidates/`,
  CANDIDATE_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/candidates/candidates/${id}/`,
  RESUMES: `${API_V1_BASE}/candidates/resumes/`,
  RESUME_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/candidates/resumes/${id}/`,

  // Workflow Config
  WORKFLOW_CONFIG: `${API_V1_BASE}/workflow/config/`,
  WORKFLOW_CONFIG_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/workflow/config/${id}/`,

  // Accounts - Workplaces
  WORKPLACES: `${API_V1_BASE}/accounts/workplaces/`,
  WORKPLACE_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/accounts/workplaces/${id}/`,

  // Dashboard
  DASHBOARD_TOP_MATCHES: `${API_V1_BASE}/dashboard/top-matches/`,
  DASHBOARD_POSITIONS_MATCHING: `${API_V1_BASE}/dashboard/positions-matching/`,
  DASHBOARD_CANDIDATES_TREND: `${API_V1_BASE}/dashboard/candidates-trend/`,
  DASHBOARD_GETAJOB_CANDIDATES_TREND: `${API_V1_BASE}/dashboard/getajob-candidates-trend/`,

  // Quiz (Public Assessment)
  QUIZ_GENERATE: `${API_V1_BASE}/assessment/public/generate_quiz/`,
  QUIZ_DETAIL: (id: string | number) =>
    `${API_V1_BASE}/assessment/public/quiz/${id}/`,
  QUIZ_SUBMIT: (id: string | number) =>
    `${API_V1_BASE}/assessment/public/quiz/${id}/submit/`
} as const;
