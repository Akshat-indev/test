import { supabase } from '../config/supabase.js';
import { extractText, parseResumeText } from '../services/resumeParser.service.js';

export async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { buffer, originalname, size, mimetype } = req.file;
    const userId = req.user.id;

    // Create a pending record
    const { data: resumeRecord, error: insertError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        original_filename: originalname,
        parsing_status: 'processing',
        file_size: size,
        mime_type: mimetype,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Extract text
    const { text, error: parseError } = await extractText(buffer, originalname);

    if (parseError || !text) {
      await supabase
        .from('resumes')
        .update({ parsing_status: 'failed', parsing_error: parseError })
        .eq('id', resumeRecord.id);

      return res.status(422).json({
        error: parseError || 'Could not extract text from the uploaded file.',
        resumeId: resumeRecord.id,
      });
    }

    // Parse structured data
    const extracted = parseResumeText(text);

    // Update record with extracted data (do NOT store full text)
    const { data: updated, error: updateError } = await supabase
      .from('resumes')
      .update({
        extracted_skills: extracted,
        parsing_status: 'success',
        parsing_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeRecord.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(201).json({
      message: 'Resume processed successfully',
      resume: {
        id: updated.id,
        originalFilename: updated.original_filename,
        parsingStatus: updated.parsing_status,
        skillCount: extracted.skills.length,
        topSkills: extracted.skills.slice(0, 10),
        jobTitles: extracted.jobTitles,
        yearsOfExperience: extracted.yearsOfExperience,
        createdAt: updated.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLatestResume(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('id, original_filename, parsing_status, parsing_error, extracted_skills, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'No resume found' });

    res.json({ resume: data });
  } catch (err) {
    next(err);
  }
}

export async function deleteResume(req, res, next) {
  try {
    const { id } = req.params;

    // Verify ownership before deletion
    const { data, error: findError } = await supabase
      .from('resumes')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (findError) throw findError;
    if (!data) return res.status(404).json({ error: 'Resume not found' });
    if (data.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const { error } = await supabase.from('resumes').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Resume deleted' });
  } catch (err) {
    next(err);
  }
}

