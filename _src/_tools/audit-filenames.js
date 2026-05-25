#!/usr/bin/env node
// Usage: node audit-filenames.js <media-root-path>

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const EXCLUDED_EXTENSIONS = new Set([
  '.lab', '.htm', '.html', '.txt', '.ttf', '.graffle',
  '.doc', '.docx', '.xls', '.xlsx', '.csv', '.prproj', '.db', '.code-workspace'
]);

// Date formats: YYYY, YYYY-MM, YYYY-MM-DD
const DATE_RE        = /^\d{4}(-\d{2}(-\d{2})?)?$/;
// Ordering prefixes: 1–3 digits, or XX-XX (e.g. "01", "01-02")
const ORDER_RE       = /^\d{1,3}$|^\d{2}-\d{2}$/;
// Arrangement indicator: all lowercase letters (e.g. "lr", "cw", "ccw", "br", "fr")
const ARRANGEMENT_RE = /^[a-z]+$/;
// Family member code: starts uppercase, rest any case or digit, 1–5 chars (e.g. "U", "JAS", "J1Sa", "DMSa")
const CODE_RE        = /^[A-Z][A-Za-z0-9]{0,4}$/;

// ---------------------------------------------------------------------------
// Filename parsing
// ---------------------------------------------------------------------------

function parseCodesSection(str) {
  const tokens = str.split('-');

  // All tokens are codes with no arrangement indicator  (e.g. "JAS" or "JKS-DAS")
  if (tokens.every(t => CODE_RE.test(t))) {
    return { arrangements: [], codes: tokens };
  }

  // Must start with a lowercase arrangement indicator
  if (!ARRANGEMENT_RE.test(tokens[0])) return null;

  // Remaining tokens must each be a code (starts uppercase) or another arrangement indicator
  const rest = tokens.slice(1);
  if (!rest.every(t => CODE_RE.test(t) || ARRANGEMENT_RE.test(t))) return null;

  // Must contain at least one actual code
  const codes = rest.filter(t => CODE_RE.test(t));
  if (codes.length === 0) return null;

  const arrangements = [tokens[0], ...rest.filter(t => ARRANGEMENT_RE.test(t))];

  return { arrangements, codes };
}

function parseFilename(filename) {
  const ext  = path.extname(filename);
  const base = filename.slice(0, filename.length - ext.length);
  const parts = base.split(' - ');

  let date         = '';
  let arrangements = [];
  let codes        = [];
  let detectedType;
  const notes = [];

  let remaining = [...parts];

  // --- Part 0: date, ordering prefix, or start of description ---
  const part0    = remaining[0];
  let hasDate    = false;
  let isNumbered = false;

  if (DATE_RE.test(part0)) {
    hasDate = true;
    date    = part0;
    remaining.shift();
  } else if (ORDER_RE.test(part0)) {
    isNumbered = true;
    remaining.shift();
    // An ordering prefix can be followed by a date (e.g. "01 - 2006-03-12 - Description - codes")
    if (remaining.length > 0 && DATE_RE.test(remaining[0])) {
      hasDate = true;
      date    = remaining[0];
      remaining.shift();
    }
  }

  // --- Last part: codes section ---
  let hasCodes = false;

  if (remaining.length > 0) {
    const codeResult = parseCodesSection(remaining[remaining.length - 1]);
    if (codeResult) {
      hasCodes     = true;
      arrangements = codeResult.arrangements;
      codes        = codeResult.codes;
      remaining.pop();
    }
  }

  // --- Everything remaining is the description ---
  const description = remaining.join(' - ');

  // --- Determine detected type and notes ---
  if (isNumbered) {
    detectedType = 'Numbered/Ordered';
    notes.push('Starts with ordering prefix — not treated as a date');
  } else if (hasDate && hasCodes) {
    detectedType = 'Full (date + description + codes)';
  } else if (hasDate && !hasCodes) {
    detectedType = 'Date + description';
    notes.push('No family member codes found');
  } else if (!hasDate && hasCodes) {
    detectedType = 'Description + codes (no date)';
    notes.push('No date — date is unknown');
  } else {
    detectedType = 'Description only';
    notes.push('No date or codes found');
  }

  if (hasCodes && arrangements.length === 0 && codes.length > 1) {
    notes.push('Multiple codes present but no arrangement indicator');
  }

  if (hasCodes && arrangements.length > 1) {
    notes.push(`Multiple arrangement groups: ${arrangements.join(', ')}`);
  }

  if (!description && !isNumbered) {
    notes.push('No description found');
  }

  return {
    detectedType,
    parsedDate:        date,
    parsedDescription: description,
    parsedArrangement: arrangements.join(', '),
    parsedCodes:       codes.join(', '),
    notes:             notes.join('; '),
  };
}

// ---------------------------------------------------------------------------
// Exclusion list  (_folio-exclude.txt at the media root)
// ---------------------------------------------------------------------------

function loadExclusions(mediaRoot) {
  const excludeFile = path.join(mediaRoot, '_folio-exclude.txt');
  if (!fs.existsSync(excludeFile)) return { exact: new Set(), prefixes: [] };

  const lines = fs.readFileSync(excludeFile, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  const exact    = new Set();
  const prefixes = [];

  for (const line of lines) {
    if (line.endsWith('/*')) {
      prefixes.push(line.slice(0, -2)); // strip trailing /*
    } else {
      exact.add(line);
    }
  }

  return { exact, prefixes };
}

function isExcluded(relativePath, exclusions) {
  if (exclusions.exact.has(relativePath)) return true;
  return exclusions.prefixes.some(
    prefix => relativePath === prefix || relativePath.startsWith(prefix + path.sep)
  );
}

// ---------------------------------------------------------------------------
// Directory traversal
// ---------------------------------------------------------------------------

function walkDir(dir, mediaRoot, exclusions, results) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    // Skip hidden entries
    if (entry.startsWith('.')) continue;
    // Skip root-level entries starting with _
    if (dir === mediaRoot && entry.startsWith('_')) continue;

    const fullPath    = path.join(dir, entry);
    const relativePath = path.relative(mediaRoot, fullPath);

    if (isExcluded(relativePath, exclusions)) continue;

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      walkDir(fullPath, mediaRoot, exclusions, results);
    } else if (stat.isFile()) {
      const ext = path.extname(entry).toLowerCase();
      if (EXCLUDED_EXTENSIONS.has(ext)) continue;
      results.push(fullPath);
    }
  }
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

function escapeCSV(value) {
  const str = value == null ? '' : String(value);
  return (str.includes(',') || str.includes('"') || str.includes('\n'))
    ? '"' + str.replace(/"/g, '""') + '"'
    : str;
}

function rowToCSV(row) {
  return row.map(escapeCSV).join(',');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // Default to the Media Root (two levels up from _src/) when run via npm
  const mediaRoot = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', '..'));

  if (!fs.existsSync(mediaRoot)) {
    console.error(`Media root not found: ${mediaRoot}`);
    process.exit(1);
  }

  console.log(`Scanning: ${mediaRoot}`);

  const exclusions = loadExclusions(mediaRoot);
  if (exclusions.exact.size > 0 || exclusions.prefixes.length > 0) {
    console.log(`Exclusions loaded: ${exclusions.exact.size} exact, ${exclusions.prefixes.length} wildcard.`);
  }

  const files = [];
  walkDir(mediaRoot, mediaRoot, exclusions, files);
  files.sort();

  console.log(`Found ${files.length} files to audit.`);

  const header = [
    'File Path',
    'Filename',
    'Extension',
    'Detected Type',
    'Parsed Date',
    'Parsed Description',
    'Parsed Arrangement',
    'Parsed Codes',
    'Notes',
  ];

  const rows = [header];

  for (const filePath of files) {
    const relativePath = path.relative(mediaRoot, filePath);
    const filename     = path.basename(filePath);
    const ext          = path.extname(filename);
    const parsed       = parseFilename(filename);

    rows.push([
      relativePath,
      filename,
      ext,
      parsed.detectedType,
      parsed.parsedDate,
      parsed.parsedDescription,
      parsed.parsedArrangement,
      parsed.parsedCodes,
      parsed.notes,
    ]);
  }

  const csv        = rows.map(rowToCSV).join('\n');
  const outputPath = path.join(mediaRoot, 'filename-audit.csv');

  fs.writeFileSync(outputPath, csv, 'utf8');
  console.log(`Audit written to: ${outputPath}`);
}

main();
