import type { Resume, ResumeDataPatch, RawEducation, RawExperience, Experience } from './types';
import {
  norm,
  normalizeDuration,
  sanitizeExperience,
  sanitizeEducation,
  upsertExperience,
  removeExperienceByIdOrCompany,
  upsertEducation,
  dedupeSkills,
} from './utils';

export function applyPatchLogic(resume: Resume, patch: ResumeDataPatch): Resume {
  let next: Resume = { ...resume };

  // Handle granular operations first
  if (patch.editExperienceField) {
    const { company, field, newValue } = patch.editExperienceField;
    next.experiences = next.experiences.map(exp =>
      norm(exp.company) === norm(company)
        ? { ...exp, [field]: field === 'duration' ? normalizeDuration(newValue) || '' : newValue.trim() }
        : exp
    );
  }

  if (patch.editDescriptionLine) {
    const { company, lineIndex, newText } = patch.editDescriptionLine;
    next.experiences = next.experiences.map(exp =>
      norm(exp.company) === norm(company)
        ? {
            ...exp,
            description: exp.description.map((desc, idx) =>
              idx === lineIndex ? newText.trim() : desc
            )
          }
        : exp
    );
  }

  if (patch.removeDescriptionLine) {
    const { company, lineIndex } = patch.removeDescriptionLine;
    next.experiences = next.experiences.map(exp =>
      norm(exp.company) === norm(company)
        ? {
            ...exp,
            description: exp.description.filter((_, idx) => idx !== lineIndex)
          }
        : exp
    );
  }

  if (patch.addDescriptionLine) {
    const { company, text, position } = patch.addDescriptionLine;
    next.experiences = next.experiences.map(exp =>
      norm(exp.company) === norm(company)
        ? {
            ...exp,
            description: position !== undefined
              ? [
                  ...exp.description.slice(0, position),
                  text.trim(),
                  ...exp.description.slice(position)
                ]
              : [...exp.description, text.trim()]
          }
        : exp
    );
  }

  if (patch.editContactField) {
    const { field, value } = patch.editContactField;
    (next as any)[field] = value.trim();
  }

  if (patch.editEducationField) {
    const { institution, field, newValue } = patch.editEducationField;
    next.education = next.education.map(edu =>
      norm(edu.institution) === norm(institution)
        ? { ...edu, [field]: field === 'duration' ? normalizeDuration(newValue) || '' : newValue.trim() }
        : edu
    );
  }

  if (patch.editSkill) {
    const { oldSkill, newSkill } = patch.editSkill;
    next.skills = next.skills.map(skill =>
      skill.toLowerCase().trim() === oldSkill.toLowerCase().trim()
        ? newSkill.trim()
        : skill
    );
  }

  if (patch.editSummary) {
    const { type, text } = patch.editSummary;
    next.summary = type === 'replace'
      ? text.trim()
      : type === 'append'
      ? (next.summary + ' ' + text).trim()
      : (text + ' ' + next.summary).trim();
  }

  if (patch.appendToSummary) {
    next.summary = (next.summary + ' ' + patch.appendToSummary).trim();
  }

  if (patch.replaceSkills) {
    next.skills = dedupeSkills(patch.replaceSkills);
  }

  if (patch.reorganize) {
    const { experiences, skills, summary, contact } = patch.reorganize;
    if (experiences) {
        if (experiences.every(e => typeof e === 'string')) {
            const companyNames = experiences as string[];
            const ordered = companyNames.map(name => next.experiences.find(e => e.company === name)).filter(Boolean) as Experience[];
            const remaining = next.experiences.filter(e => !companyNames.includes(e.company));
            next.experiences = [...ordered, ...remaining];
        } else {
            next.experiences = (experiences as RawExperience[]).map(sanitizeExperience);
        }
    }
    if (skills) next.skills = dedupeSkills(skills);
    if (summary !== undefined) next.summary = summary;
    if (contact) next = { ...next, ...contact };
  }

  if (patch.replaceComplete) {
    next = patch.replaceComplete;
  }

  if (patch.clearSection) {
    if (patch.clearSection === 'experiences') next.experiences = [];
    if (patch.clearSection === 'skills') next.skills = [];
    if (patch.clearSection === 'education') next.education = [];
    if (patch.clearSection === 'summary') next.summary = '';
    if (patch.clearSection === 'contact') {
      next.fullName = '';
      next.email = '';
      next.phone = '';
      next.location = '';
      next.title = '';
    }
  }

  // 1) Operation: replace (complete resume)
  if (patch.operation === 'replace' && patch.completeResume) {
    next = {
      experiences: (patch.completeResume.experiences || []).map(sanitizeExperience),
      education: (patch.completeResume.education || []).map(sanitizeEducation),
      skills: dedupeSkills(patch.completeResume.skills || []),
      summary: patch.completeResume.summary || '',
      fullName: patch.completeResume.contact?.fullName || '',
      email: patch.completeResume.contact?.email || '',
      phone: patch.completeResume.contact?.phone || '',
      location: patch.completeResume.contact?.location || '',
      title: patch.completeResume.contact?.title || '',
    };
    return next;
  }

  // 2) Operation: reset
  if (patch.operation === 'reset') {
    return {
      experiences: [],
      education: [],
      skills: [],
      summary: '',
      fullName: '',
      email: '',
      phone: '',
      location: '',
      title: '',
    };
  }

  // 3) Experience (single)
  if (patch.experience) {
    const sanitized = sanitizeExperience(patch.experience as RawExperience);
    if (patch.operation === 'remove') {
      next.experiences = removeExperienceByIdOrCompany(next.experiences, sanitized.id || sanitized.company);
    } else if (patch.operation === 'update' || patch.operation === 'add' || !patch.operation || patch.operation === 'patch') {
      next.experiences = upsertExperience(next.experiences, sanitized);
    }
  }

  // 4) Experiences (bulk)
  if (Array.isArray(patch.experiences)) {
    const incoming = patch.experiences.map(e => sanitizeExperience(e as RawExperience));
    if (patch.operation === 'remove') {
      for (const e of incoming) next.experiences = removeExperienceByIdOrCompany(next.experiences, e.id || e.company);
    } else if (patch.operation === 'update' || patch.operation === 'add' || !patch.operation || patch.operation === 'patch') {
      for (const e of incoming) next.experiences = upsertExperience(next.experiences, e);
    } else if (patch.operation === 'clear') {
      next.experiences = [];
    }
  }

  // Handle education (single and bulk)
  const educationItems = [
    ...(patch.education ? [patch.education] : []),
    ...(Array.isArray(patch.educations) ? patch.educations : []),
    ...((patch as any).updateEducation ? [(patch as any).updateEducation] : [])
  ];

  for (const edu of educationItems) {
    const sanitized = sanitizeEducation(edu as RawEducation);
    next.education = upsertEducation(next.education, sanitized);
  }

  // 5) Skills
  if (Array.isArray(patch.skills)) {
    if (patch.operation === 'replace' || patch.operation === 'redesign') {
      next.skills = dedupeSkills(patch.skills);
    } else if (patch.operation === 'remove') {
      const toRemove = new Set(patch.skills.map((k) => k.toLowerCase().trim()));
      next.skills = next.skills.filter((k) => !toRemove.has(k.toLowerCase().trim()));
    } else {
      next.skills = dedupeSkills([...next.skills, ...patch.skills]);
    }
  }
  if (Array.isArray(patch.removeSkills) && patch.removeSkills.length) {
    const toRemove = new Set(patch.removeSkills.map((k) => k.toLowerCase().trim()));
    next.skills = next.skills.filter((k) => !toRemove.has(k.toLowerCase().trim()));
  }

  // 6) Summary
  if (typeof patch.summary === 'string') next.summary = patch.summary;

  // 7) Contact
  if (patch.contact) {
    next = { ...next, ...patch.contact };
  }

  // 7.5) Update experience description
  if (patch.updateExperienceDescription) {
    const { company, newDescriptions } = patch.updateExperienceDescription;
    next.experiences = next.experiences.map(exp =>
      norm(exp.company) === norm(company)
        ? { ...exp, description: newDescriptions }
        : exp
    );
  }

  // 8) Remove experiences by name/id
  if (Array.isArray(patch.removeExperiences) && patch.removeExperiences.length) {
    for (const key of patch.removeExperiences) {
      next.experiences = removeExperienceByIdOrCompany(next.experiences, key);
    }
  }

  // 9) Clear specific sections
  if (Array.isArray(patch.clearSections) && patch.clearSections.length) {
    const setClear = new Set(patch.clearSections.map((x) => x.toLowerCase().trim()));
    if (setClear.has('experiences')) next.experiences = [];
    if (setClear.has('skills')) next.skills = [];
    if (setClear.has('education')) next.education = [];
    if (setClear.has('summary')) next.summary = '';
    if (setClear.has('contact')) {
      next.fullName = '';
      next.email = '';
      next.phone = '';
      next.location = '';
      next.title = '';
    }
  }

  return next;
}
