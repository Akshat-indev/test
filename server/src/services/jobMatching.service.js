/**
 * Deterministic job matching algorithm.
 *
 * Scoring weights:
 *   - Skills overlap:       50%
 *   - Role/title relevance: 25%
 *   - Experience alignment: 15%
 *   - Education/other:      10%
 *
 * Returns a score from 0–100 and a human-readable explanation.
 */

const WEIGHTS = {
  skills: 0.5,
  title: 0.25,
  experience: 0.15,
  education: 0.1,
};

/**
 * Computes a match score and explanation for a single job against a resume profile.
 *
 * @param {object} job - Normalized job object
 * @param {object} profile - Extracted resume profile
 * @returns {{ score: number, explanation: string, matchedSkills: string[], missingSkills: string[] }}
 */
export function computeMatchScore(job, profile) {
  const jobSkills = normalizeSkills(job.requiredSkills || []);
  const jobDescSkills = extractSkillsFromText(job.description || '');
  const allJobSkills = [...new Set([...jobSkills, ...jobDescSkills])];

  const userSkills = normalizeSkills(profile.skills || []);
  const userTitles = (profile.jobTitles || []).map((t) => t.toLowerCase());

  // 1. Skills overlap score
  const matchedSkills = allJobSkills.filter((s) => userSkills.includes(s));
  const missingSkills = allJobSkills.filter((s) => !userSkills.includes(s)).slice(0, 5);

  const skillScore =
    allJobSkills.length > 0
      ? Math.min((matchedSkills.length / allJobSkills.length) * 100, 100)
      : 50; // No required skills listed → neutral score

  // 2. Title/role relevance
  const jobTitleLower = (job.title || '').toLowerCase();
  let titleScore = 0;
  for (const ut of userTitles) {
    const words = ut.split(' ');
    const overlap = words.filter((w) => jobTitleLower.includes(w));
    titleScore = Math.max(titleScore, (overlap.length / Math.max(words.length, 1)) * 100);
  }
  // Also check if job title keywords appear in user skills
  if (titleScore === 0) {
    const titleWords = jobTitleLower.split(/\s+/);
    const inSkills = titleWords.filter((w) => w.length > 3 && userSkills.some((s) => s.includes(w)));
    titleScore = Math.min((inSkills.length / Math.max(titleWords.length, 1)) * 100, 80);
  }

  // 3. Experience alignment
  let experienceScore = 50; // Default: unknown → neutral
  const jobDesc = (job.description || '').toLowerCase();
  const userYears = profile.yearsOfExperience;

  if (userYears !== null) {
    const seniorPattern = /senior|lead|principal|staff|architect/i;
    const juniorPattern = /junior|fresher|entry.level|0.2 years/i;
    const midPattern = /2.5 years|3.7 years|mid.level/i;

    if (seniorPattern.test(job.title) || seniorPattern.test(jobDesc)) {
      experienceScore = userYears >= 5 ? 100 : userYears >= 3 ? 60 : 20;
    } else if (juniorPattern.test(job.title) || juniorPattern.test(jobDesc)) {
      experienceScore = userYears <= 2 ? 100 : userYears <= 4 ? 70 : 40;
    } else {
      experienceScore = 70; // Mid-level or unspecified
    }
  }

  // 4. Education score
  let educationScore = 50; // Default neutral
  const userEduKeywords = (profile.education?.keywords || []).map((k) => k.toLowerCase());
  if (
    userEduKeywords.some((k) =>
      ['b.tech', 'btech', 'm.tech', 'mtech', 'bachelor', 'master'].includes(k)
    )
  ) {
    educationScore = 80;
  }

  // Weighted final score
  const rawScore =
    skillScore * WEIGHTS.skills +
    titleScore * WEIGHTS.title +
    experienceScore * WEIGHTS.experience +
    educationScore * WEIGHTS.education;

  const score = Math.round(Math.min(Math.max(rawScore, 0), 100));

  // Build explanation
  const explanation = buildExplanation({
    score,
    matchedSkills,
    missingSkills,
    skillScore,
    titleScore,
    userTitles,
    jobTitle: job.title,
    userYears,
  });

  return { score, explanation, matchedSkills, missingSkills };
}

function buildExplanation({ score, matchedSkills, missingSkills, skillScore, titleScore, userTitles, jobTitle, userYears }) {
  const parts = [];

  if (matchedSkills.length > 0) {
    const listed = matchedSkills.slice(0, 5).join(', ');
    parts.push(`Your resume includes ${listed}${matchedSkills.length > 5 ? ` and ${matchedSkills.length - 5} more skills` : ''} that match this role.`);
  } else {
    parts.push('No direct skill matches were found between your resume and this job\'s requirements.');
  }

  if (titleScore >= 60 && userTitles.length > 0) {
    parts.push(`Your experience as ${userTitles[0]} aligns with the "${jobTitle}" role.`);
  }

  if (userYears !== null) {
    parts.push(`Your resume indicates approximately ${userYears} year${userYears !== 1 ? 's' : ''} of experience.`);
  }

  if (missingSkills.length > 0) {
    parts.push(`Skills not found in your resume: ${missingSkills.join(', ')}.`);
  }

  return parts.join(' ');
}

function normalizeSkills(skills) {
  return skills.map((s) => s.toLowerCase().trim()).filter(Boolean);
}

const SKILL_KEYWORDS_FOR_DESC = [
  'javascript','typescript','python','java','kotlin','swift','go','rust','c++','c#','ruby','php',
  'react','vue','angular','svelte','next.js','html','css','tailwind','webpack','vite',
  'node.js','express','fastapi','django','flask','spring','graphql','rest api','grpc',
  'postgresql','mysql','mongodb','redis','sqlite','elasticsearch','dynamodb','supabase','firebase',
  'aws','gcp','azure','docker','kubernetes','terraform','ci/cd','linux',
  'machine learning','tensorflow','pytorch','pandas','numpy','scikit-learn','sql','tableau',
  'flutter','react native','android','ios','git','agile','scrum',
];

function extractSkillsFromText(text) {
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS_FOR_DESC.filter((kw) => lower.includes(kw));
}

/**
 * Matches and ranks a list of jobs against a resume profile.
 * Filters by location as a hard constraint (not a keyword match).
 *
 * @param {object[]} jobs
 * @param {object} profile - Extracted resume data
 * @param {string} preferredLocation - e.g. 'Bengaluru', 'Remote'
 * @returns {object[]} Ranked jobs with score and explanation added
 */
export function rankJobs(jobs, profile, preferredLocation) {
  return jobs
    .map((job) => {
      const { score, explanation, matchedSkills, missingSkills } = computeMatchScore(job, profile);
      return { ...job, matchScore: score, matchExplanation: explanation, matchedSkills, missingSkills };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

