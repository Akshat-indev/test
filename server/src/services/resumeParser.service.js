import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import path from 'path';

/**
 * Extracts raw text from a PDF or DOCX buffer.
 * Returns { text, error } — never throws.
 */
export async function extractText(buffer, originalname) {
  const ext = path.extname(originalname).toLowerCase();

  try {
    if (ext === '.pdf') {
      const data = await pdfParse(buffer);
      if (!data.text || data.text.trim().length < 50) {
        return {
          text: null,
          error:
            'The PDF appears to be scanned or image-based. OCR is not supported in this version. Please upload a text-based PDF or a DOCX file.',
        };
      }
      return { text: data.text, error: null };
    }

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value || result.value.trim().length < 50) {
        return { text: null, error: 'Could not extract readable text from the DOCX file.' };
      }
      return { text: result.value, error: null };
    }

    return { text: null, error: 'Unsupported file format.' };
  } catch (err) {
    console.error('[ResumeParser] Text extraction failed:', err.message);
    return { text: null, error: 'Failed to read the file. It may be corrupted or password-protected.' };
  }
}

// Skill keyword dictionary (expandable)
const SKILL_KEYWORDS = [
  // Languages
  'javascript','typescript','python','java','kotlin','swift','go','rust','c++','c#','ruby','php','scala','r','matlab',
  // Frontend
  'react','vue','angular','svelte','next.js','nuxt','html','css','tailwind','sass','webpack','vite',
  // Backend
  'node.js','express','fastapi','django','flask','spring','rails','laravel','graphql','rest api','grpc',
  // Databases
  'postgresql','mysql','mongodb','redis','sqlite','elasticsearch','cassandra','dynamodb','supabase','firebase',
  // Cloud / DevOps
  'aws','gcp','azure','docker','kubernetes','terraform','ci/cd','github actions','jenkins','linux',
  // Data / ML
  'machine learning','deep learning','tensorflow','pytorch','pandas','numpy','scikit-learn','sql','tableau','power bi',
  // Mobile
  'flutter','react native','android','ios','swift','kotlin',
  // Other
  'git','agile','scrum','jira','figma','postman','unit testing','jest','mocha','selenium',
];

const EDUCATION_KEYWORDS = [
  'b.tech','b.e.','btech','be ','b.sc','bsc ','m.tech','m.e.','mtech','m.sc','msc ','mba','phd','ph.d',
  'bachelor','master','bachelor\'s','master\'s','degree','engineering','computer science','information technology',
  'electronics','mechanical','electrical','data science','statistics','mathematics',
];

/**
 * Extracts structured profile data from raw resume text.
 */
export function parseResumeText(text) {
  const lower = text.toLowerCase();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const skills = extractSkills(lower);
  const experience = extractExperience(text, lines);
  const education = extractEducation(lower, lines);
  const projects = extractProjects(lines);
  const certifications = extractCertifications(lines);
  const jobTitles = extractJobTitles(lower);
  const yearsOfExperience = estimateYearsOfExperience(text);

  return {
    skills,
    experience,
    education,
    projects,
    certifications,
    jobTitles,
    yearsOfExperience,
  };
}

function extractSkills(lower) {
  return [...new Set(SKILL_KEYWORDS.filter((skill) => lower.includes(skill)))];
}

function extractExperience(text, lines) {
  const expSection = extractSection(lines, ['experience', 'work history', 'employment']);
  return expSection.slice(0, 20); // Keep first 20 lines of experience section
}

function extractEducation(lower, lines) {
  const eduSection = extractSection(lines, ['education', 'academic', 'qualification']);
  const found = [];
  const combined = eduSection.join(' ').toLowerCase();
  for (const kw of EDUCATION_KEYWORDS) {
    if (combined.includes(kw) && !found.includes(kw)) {
      found.push(kw);
    }
  }
  return { keywords: found, lines: eduSection.slice(0, 10) };
}

function extractProjects(lines) {
  return extractSection(lines, ['projects', 'personal projects', 'academic projects']).slice(0, 15);
}

function extractCertifications(lines) {
  return extractSection(lines, ['certifications', 'certificates', 'achievements', 'awards']).slice(0, 10);
}

function extractJobTitles(lower) {
  const titles = [
    'software engineer','software developer','frontend developer','backend developer','full stack developer',
    'fullstack developer','data scientist','data analyst','machine learning engineer','ml engineer',
    'devops engineer','cloud engineer','mobile developer','android developer','ios developer',
    'product manager','project manager','ui/ux designer','qa engineer','test engineer',
    'system architect','technical lead','engineering manager',
  ];
  return titles.filter((t) => lower.includes(t));
}

function estimateYearsOfExperience(text) {
  const patterns = [
    /(\d+)\+?\s*years?\s+of\s+experience/gi,
    /experience\s+of\s+(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*years?\s+(?:in|of)\s+(?:software|development|engineering|industry)/gi,
  ];
  const found = [];
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    matches.forEach((m) => found.push(parseInt(m[1], 10)));
  }
  return found.length > 0 ? Math.max(...found) : null;
}

function extractSection(lines, headings) {
  const headingPattern = new RegExp(`^(${headings.join('|')})`, 'i');
  const sectionEndPattern = /^(skills|education|experience|projects|certifications|references|awards|languages|summary|objective|profile|contact)/i;

  let inSection = false;
  const result = [];

  for (const line of lines) {
    if (headingPattern.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (sectionEndPattern.test(line) && !headingPattern.test(line)) break;
      if (line.length > 2) result.push(line);
    }
  }
  return result;
}

