import { computeMatchScore, rankJobs } from '../src/services/jobMatching.service.js';

describe('Job Matching Service', () => {
  const baseProfile = {
    skills: ['javascript', 'react', 'node.js', 'postgresql', 'rest api'],
    jobTitles: ['software engineer', 'frontend developer'],
    yearsOfExperience: 3,
    education: { keywords: ['b.tech', 'computer science'] },
    experience: [],
  };

  const baseJob = {
    title: 'Senior Software Engineer',
    description: 'Looking for a developer with React and Node.js experience. Must know PostgreSQL and REST API design.',
    requiredSkills: ['react', 'node.js', 'postgresql', 'rest api'],
    employmentType: 'Full-time',
    workMode: 'hybrid',
  };

  test('computes a match score between 0 and 100', () => {
    const { score } = computeMatchScore(baseJob, baseProfile);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('gives higher score when skills match', () => {
    const goodProfile = { ...baseProfile, skills: ['react', 'node.js', 'postgresql', 'rest api'] };
    const poorProfile = { ...baseProfile, skills: ['java', 'spring', 'oracle'] };

    const { score: goodScore } = computeMatchScore(baseJob, goodProfile);
    const { score: poorScore } = computeMatchScore(baseJob, poorProfile);
    expect(goodScore).toBeGreaterThan(poorScore);
  });

  test('returns matched and missing skills', () => {
    const { matchedSkills, missingSkills } = computeMatchScore(baseJob, baseProfile);
    expect(matchedSkills).toContain('react');
    expect(matchedSkills).toContain('node.js');
  });

  test('generates a non-empty explanation', () => {
    const { explanation } = computeMatchScore(baseJob, baseProfile);
    expect(explanation).toBeTruthy();
    expect(typeof explanation).toBe('string');
    expect(explanation.length).toBeGreaterThan(20);
  });

  test('handles job with no required skills', () => {
    const jobNoSkills = { ...baseJob, requiredSkills: [], description: 'Generic job description.' };
    const { score } = computeMatchScore(jobNoSkills, baseProfile);
    expect(score).toBeGreaterThan(0);
  });

  test('handles profile with no skills gracefully', () => {
    const emptyProfile = { skills: [], jobTitles: [], yearsOfExperience: null, education: {} };
    const { score } = computeMatchScore(baseJob, emptyProfile);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('rankJobs returns sorted by score descending', () => {
    const jobs = [
      { ...baseJob, title: 'Java Developer', requiredSkills: ['java', 'spring', 'oracle'] },
      { ...baseJob, title: 'React Developer', requiredSkills: ['react', 'javascript', 'node.js'] },
    ];
    const ranked = rankJobs(jobs, baseProfile, 'Bengaluru');
    expect(ranked[0].matchScore).toBeGreaterThanOrEqual(ranked[1].matchScore);
    // React developer should rank higher for a JS profile
    expect(ranked[0].title).toBe('React Developer');
  });

  test('score is higher for senior roles when user has more experience', () => {
    const seniorProfile = { ...baseProfile, yearsOfExperience: 7 };
    const juniorProfile = { ...baseProfile, yearsOfExperience: 1 };
    const seniorJob = { ...baseJob, title: 'Senior Software Engineer', description: 'Senior developer needed. 5+ years required.' };

    const { score: seniorScore } = computeMatchScore(seniorJob, seniorProfile);
    const { score: juniorScore } = computeMatchScore(seniorJob, juniorProfile);
    expect(seniorScore).toBeGreaterThan(juniorScore);
  });
});
