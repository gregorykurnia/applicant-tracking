import { initials, normalizePhone } from '@/components/workspace/format';
import { Candidate } from '@/types/ats';

export type ParsedCandidate = {
  candidate: Candidate;
  rowNumber: number;
  missingFields: string[];
};

export type CandidateCsvImport = {
  rows: ParsedCandidate[];
  skippedRows: number;
  errors: string[];
};

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === ',' && !quoted) {
      row.push(field);
      field = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += character;
  }

  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  if (quoted) throw new Error('The CSV contains an unterminated quoted field.');
  return rows;
}

function valueFor(record: Record<string, string>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeHeader);
  const entry = Object.entries(record).find(([key, value]) => normalizedAliases.includes(normalizeHeader(key)) && value.trim());
  return entry?.[1].trim() || '';
}

function splitList(value: string) {
  return value
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInteger(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
}

function makeDateLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function parseCandidateCsv(text: string, jobId: string, jobTitle: string): CandidateCsvImport {
  const rows = parseRows(text);
  if (rows.length < 2) throw new Error('The CSV needs a header row and at least one candidate row.');

  const headers = rows[0].map((header, index) => header.trim() || `Column ${index + 1}`);
  const dateAdded = makeDateLabel();
  const parsedRows: ParsedCandidate[] = [];
  const errors: string[] = [];
  let skippedRows = 0;

  rows.slice(1).forEach((cells, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const record = Object.fromEntries(headers.map((header, index) => [header, (cells[index] || '').trim()]));
    const name = valueFor(record, ['name', 'full name', 'candidate name', 'candidate']);

    if (!name) {
      skippedRows += 1;
      errors.push(`Row ${rowNumber} was skipped because it has no name.`);
      return;
    }

    const email = valueFor(record, ['email', 'email address', 'email address']);
    const phone = valueFor(record, ['phone', 'phone number', 'mobile', 'mobile number', 'whatsapp', 'whatsapp number']);
    const currentRole = valueFor(record, ['current role', 'current title', 'job title', 'role', 'position']);
    const location = valueFor(record, ['location', 'current location', 'city']);
    const missingFields = [
      !email && 'Email',
      !phone && 'Phone',
      !currentRole && 'Current role',
      !location && 'Location',
    ].filter(Boolean) as string[];
    const id = `candidate-${Date.now()}-${rowNumber}`;
    const application = {
      candidateId: id,
      jobId,
      stage: 'new',
      source: valueFor(record, ['source', 'application source']) || 'CSV import',
      added: dateAdded,
      needsReview: missingFields.length > 0,
      notes: valueFor(record, ['notes', 'recruiter notes']),
    };
    const candidate: Candidate = {
      id,
      name,
      initials: initials(name),
      currentRole: currentRole || 'Needs review',
      location: location || 'Needs review',
      email,
      phone: phone || 'Needs review',
      whatsapp: normalizePhone(phone),
      summary: valueFor(record, ['summary', 'professional summary', 'profile', 'about']),
      skills: splitList(valueFor(record, ['skills', 'skill set'])),
      experience: parseInteger(valueFor(record, ['experience', 'years experience', 'years of experience'])),
      desiredTitle: valueFor(record, ['desired title', 'desired role', 'target role']) || jobTitle,
      salary: parseInteger(valueFor(record, ['salary', 'expected salary', 'salary expectation', 'expected salary per month'])),
      availability: valueFor(record, ['availability', 'notice period']) || 'Needs review',
      linkedin: valueFor(record, ['linkedin', 'linkedin url']),
      portfolio: valueFor(record, ['portfolio', 'portfolio url', 'website']),
      cvName: valueFor(record, ['cv name', 'cv', 'resume', 'resume file']),
      education: valueFor(record, ['education', 'degree']),
      certifications: splitList(valueFor(record, ['certifications', 'certificates'])),
      employment: [],
      applications: { [jobId]: application },
    };

    parsedRows.push({ candidate, rowNumber, missingFields });
  });

  if (!parsedRows.length) throw new Error(errors[0] || 'No candidate rows could be read from this CSV.');
  return { rows: parsedRows, skippedRows, errors };
}
