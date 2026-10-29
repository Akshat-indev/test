import { extractText, parseResumeText } from '../src/services/resumeParser.service.js';
import path from 'path';

describe('Resume Parser Service', () => {
  describe('parseResumeText', () => {
    const sampleResumeText = `
John Doe
Software Engineer
john.doe@email.com | +91-9876543210 | LinkedIn: linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 5 years of experience in building web applications.

EXPERIENCE
Senior Software Engineer — TechCorp India (2021 - Present)
- Developed React frontend with Node.js backend
- Designed PostgreSQL database schemas
- Deployed applications on AWS using Docker and Kubernetes

Software Engineer — StartupXYZ (2019 - 2021)
- Built REST APIs using Node.js and Express
- Worked with MongoDB and Redis

EDUCATION
B.Tech in Computer Science — IIT Bombay (2015 - 2019)

SKILLS
JavaScript, TypeScript, React, Node.js, Express, PostgreSQL, MongoDB, 
Redis, AWS, Docker, Kubernetes, Git, Agile, REST API

PROJECTS
CareerMatch Platform: Built a job-matching platform using React and Node.js.
Portfolio Website: Personal portfolio built with Next.js and Tailwind CSS.

CERTIFICATIONS
AWS Certified Developer Associate (2022)
`;

    test('extracts JavaScript as a skill', () => {
      const result = parseResumeText(sampleResumeText);
      expect(result.skills).toContain('javascript');
    });

    test('extracts React as a skill', () => {
      const result = parseResumeText(sampleResumeText);
      expect(result.skills).toContain('react');
    });

    test('extracts Node.js as a skill', () => {
      const result = parseResumeText(sampleResumeText);
      expect(result.skills).toContain('node.js');
    });

    test('extracts AWS as a skill', () => {
      const result = parseResumeText(sampleResumeText);
      expect(result.skills).toContain('aws');
    });

    test('estimates years of experience', () => {
      const result = parseResumeText(sampleResumeText);
      expect(result.yearsOfExperience).toBe(5);
    });

    test('detects software engineer job title', () => {
      const result = parseResumeText(sampleResumeText);
      expect(result.jobTitles).toContain('software engineer');
    });

    test('returns arrays for all fields', () => {
      const result = parseResumeText(sampleResumeText);
      expect(Array.isArray(result.skills)).toBe(true);
      expect(Array.isArray(result.jobTitles)).toBe(true);
    });

    test('handles empty text gracefully', () => {
      const result = parseResumeText('');
      expect(result.skills).toEqual([]);
      expect(result.jobTitles).toEqual([]);
      expect(result.yearsOfExperience).toBeNull();
    });
  });

  describe('extractText file validation', () => {
    test('rejects unsupported file extension', async () => {
      const buf = Buffer.from('some content');
      const { text, error } = await extractText(buf, 'resume.txt');
      expect(text).toBeNull();
      expect(error).toBeTruthy();
    });

    test('handles corrupted PDF buffer', async () => {
      const corruptBuffer = Buffer.from('This is not a real PDF file at all %%EOF');
      const { text, error } = await extractText(corruptBuffer, 'resume.pdf');
      // Either returns error or very short text (scanned PDF message)
      if (text === null) {
        expect(error).toBeTruthy();
      }
    });
  });
});
