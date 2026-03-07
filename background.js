// background.js – FormFill AI Agent v3 (Groq-powered)

const STORAGE_KEY   = 'formfill_profile';
const GROQ_API_URL  = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL    = 'llama-3.3-70b-versatile';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getProfile') {
    chrome.storage.local.get([STORAGE_KEY, 'formfill_resume', 'formfill_resume_summary'], (r) => {
      sendResponse({ profile: r[STORAGE_KEY]||{}, resume: r['formfill_resume']||null, resumeSummary: r['formfill_resume_summary']||'' });
    });
    return true;
  }
  if (msg.action === 'agentAnalyzePage') {
    agentAnalyzePage(msg).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DYNAMIC SYSTEM PROMPT — modular, only includes relevant templates
// ═══════════════════════════════════════════════════════════════════════════

const PROMPT_CORE = `You are a world-class career coach, ghostwriter, and job application strategist.
You are filling a job application on behalf of a candidate. Your mission: maximize their shortlisting probability.

GOLDEN RULE: NEVER write "I don't have experience with X" or "I haven't done Y".
Reframe hierarchy: 1) Direct experience → cite with impact. 2) Adjacent experience → bridge confidently. 3) Fast learner → lead with fundamentals. 4) NEVER leave subjective fields blank or negative.

You write in first person as the candidate. Be confident but not arrogant, specific, genuinely interested in THIS company and role, sound human not template.

BANNED PHRASES: "I don't have experience with", "I haven't built/worked on/used", "Not provided", "hardworking individual", "team player", "passionate about", "writing to express my interest", "believe I would be a great fit", starting sentences with bare "I", bullet points in answers, "N/A" or empty strings for subjective questions.

SKIP RULES: Only skip file uploads, CAPTCHAs, fields already answered by another field in same group, and consent/terms checkboxes.

OUTPUT — STRICT JSON ONLY:
{
  "fills": [
    {
      "index": 0,
      "value": "complete polished answer ready to submit",
      "skip": false,
      "fieldType": "factual|subjective|select|radio|checkbox|yesno"
    }
  ]
}`;

const PROMPT_TEMPLATES = {
  tell_about: {
    tags: ['tell.*about', 'introduce', 'about yourself', 'describe yourself'],
    text: `▸ "Tell us about yourself": 3 tight sentences: [Who + headline skill] + [biggest proof point] + [why THIS role]. Reference the company name.`
  },
  why_company: {
    tags: ['why.*work here', 'why.*company', 'why.*join', 'why us', 'why.*interested'],
    text: `▸ "Why this company?": [Something specific about company from URL/page] → [Background alignment] → [What you'll contribute]. Use company name from URL.`
  },
  project: {
    tags: ['project', 'built', 'problem.*solved', 'achievement', 'accomplishment'],
    text: `▸ "Best project / Problem solved": Use STAR format naturally: [Challenge] → [What you built] → [Tech used] → [Outcome]. If limited experience, construct REALISTIC story using their skills list and role context.`
  },
  experience_rating: {
    tags: ['experience with', 'rate.*skill', 'proficien', 'how.*rate', 'familiarity'],
    text: `▸ "Experience with X / Rate your skill": Listed skills → 7-8/10. Adjacent → 5-6/10. Unknown → 3-4/10 + "actively learning". NEVER say "No experience".`
  },
  salary: {
    tags: ['ctc', 'salary', 'compensation', 'pay', 'package'],
    text: `▸ "CTC/Salary": Use profile value if available. Otherwise infer from role+experience. Format: number + "open to discussion based on role scope".`
  },
  notice_period: {
    tags: ['notice.?period', 'when.*join', 'start.?date', 'availab'],
    text: `▸ "Notice period / When can you join?": Pick the SHORTEST reasonable option. Default to "30 days" or "<30 days".`
  },
  relocate: {
    tags: ['relocat', 'work from', 'on.?site', 'remote', 'hybrid'],
    text: `▸ "Willing to relocate?": Default to openness. Same city → "Yes". Different → "Open to relocation for the right opportunity".`
  },
  five_year: {
    tags: ['5.?year', 'five.?year', 'where.*see.*yourself', 'future.*plan'],
    text: `▸ "5-year plan": Align with company trajectory. Show ambition + loyalty. Reference their domain.`
  },
  why_leaving: {
    tags: ['why.*leav', 'why.*switch', 'why.*change', 'looking for.*change', 'reason.*change'],
    text: `▸ "Why leaving?": ALWAYS frame positively around growth-seeking. Reference current company learning + next challenge this role offers.`
  },
  cover_letter: {
    tags: ['cover.?letter', 'letter.*application', 'write.*about'],
    text: `▸ Cover letter (200-280 words): Para 1: Hook — why THIS company + headline value. Para 2: Two relevant proof points. Para 3: Forward contribution + call to action. End: "Looking forward to discussing how I can contribute."`
  },
  additional: {
    tags: ['additional', 'anything.?else', 'other.*info'],
    text: `▸ "Additional info / Anything else?": Bonus pitch — relevant side project, GitHub portfolio, alignment with product, or uncaptured info.`
  },
  radio_checkbox: {
    tags: ['radio-group', 'checkbox-group'],
    text: `RADIO/CHECKBOX RULES: For radio-group, pick EXACTLY one option label. For checkbox-group, use comma-separated labels. Value MUST match provided options exactly. Experience questions → be optimistic but credible. Notice period → pick shortest.`
  },
  strength_weakness: {
    tags: ['strength', 'weakness', 'improvement'],
    text: `▸ "Strength/Weakness": Strength → specific, backed by example. Weakness → genuine but manageable, show self-awareness and active improvement.`
  }
};

function detectNeededTemplates(fields) {
  const needed = new Set();
  for (const f of fields) {
    const combined = `${f.label} ${f.name} ${f.placeholder} ${f.type}`.toLowerCase();
    for (const [key, tmpl] of Object.entries(PROMPT_TEMPLATES)) {
      if (tmpl.tags.some(tag => new RegExp(tag, 'i').test(combined))) {
        needed.add(key);
      }
    }
    // For textareas and long text fields without specific match, include general templates
    if ((f.type === 'textarea' || f.type === 'text') && !needed.size) {
      needed.add('tell_about');
      needed.add('cover_letter');
    }
  }
  // Always include radio/checkbox rules if any such fields exist
  if (fields.some(f => f.type === 'radio-group' || f.type === 'checkbox-group')) {
    needed.add('radio_checkbox');
  }
  return needed;
}

function buildDynamicSystemPrompt(fields) {
  const needed = detectNeededTemplates(fields);
  let prompt = PROMPT_CORE;
  if (needed.size > 0) {
    prompt += '\n\nQUESTION-TYPE INSTRUCTIONS (only for fields in this form):';
    for (const key of needed) {
      prompt += '\n' + PROMPT_TEMPLATES[key].text;
    }
  }
  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE SECTION PRUNING — only send sections relevant to LLM fields
// ═══════════════════════════════════════════════════════════════════════════

const PROFILE_SECTIONS = {
  identity: ['firstName','lastName','email','phone','whatsapp','dob','gender'],
  location: ['city','state','pincode','nationality'],
  online:   ['linkedin','github','portfolio'],
  eligibility: ['workAuth','visaRequired','currentCTC','expectedCTC','noticePeriod','availability','workType','relocate','preferredCities','disability'],
  career:   ['jobTitle','experience','currentCompany','currentDesignation','empType','industry'],
  education: ['educationDegree','educationBranch','college','gradYear','gpa','class12','class10'],
  skills:   ['skills','languages','aiStack','frameworks','cloudTools','certifications'],
  narrative: ['currentRoleDesc','prevRoleDesc','project1','project2','project3','summary','whySwitching','strength','weakness','fiveYear','achievements']
};

function detectNeededProfileSections(fields) {
  const sections = new Set(['career', 'skills']); // always include these for context
  for (const f of fields) {
    const combined = `${f.label} ${f.name} ${f.placeholder}`.toLowerCase();
    if (/tell.*about|introduce|about yourself|cover.?letter|summary/.test(combined)) {
      sections.add('career'); sections.add('skills'); sections.add('narrative');
    }
    if (/why.*company|why.*work|why.*join/.test(combined)) {
      sections.add('career'); sections.add('narrative');
    }
    if (/project|built|problem|achievement|accomplishment/.test(combined)) {
      sections.add('narrative'); sections.add('skills');
    }
    if (/experience|rate|proficien|skill|familiar/.test(combined)) {
      sections.add('skills');
    }
    if (/salary|ctc|compensation/.test(combined)) {
      sections.add('eligibility'); sections.add('career');
    }
    if (/notice|join|availab|start.?date/.test(combined)) {
      sections.add('eligibility');
    }
    if (/relocat|work.*mode|remote|hybrid/.test(combined)) {
      sections.add('eligibility'); sections.add('location');
    }
    if (/strength|weakness|5.?year|five.?year|future|leaving|switch|change/.test(combined)) {
      sections.add('narrative'); sections.add('career');
    }
    if (/education|degree|college|university|gpa|cgpa/.test(combined)) {
      sections.add('education');
    }
    if (/city|state|location|address/.test(combined)) {
      sections.add('location');
    }
    // Select/radio with many options often need career + skills context
    if (f.type === 'radio-group' || f.type === 'checkbox-group' || f.type === 'select-one') {
      sections.add('career'); sections.add('skills'); sections.add('eligibility');
    }
  }
  return sections;
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT: Full page analysis (optimized — only receives non-factual fields)
// ═══════════════════════════════════════════════════════════════════════════
async function agentAnalyzePage({ fields, localFillCount, pageContext, pageTitle, pageUrl, pageText, profile, resumeSummary }) {
  const apiKey = profile?.apiKey;
  if (!apiKey) return { error: 'No Groq API key. Open extension popup → Settings.' };

  // ── Freemium gating ────────────────────────────────────────────────────
  const premiumStatus = await checkPremiumStatus();

  if (!premiumStatus.isPremium) {
    const fillCheck = await checkAndIncrementFills();
    if (!fillCheck.allowed) {
      return {
        error: 'limit_reached',
        message: `Daily limit reached (${fillCheck.limit}/${fillCheck.limit}). Upgrade to Premium for unlimited fills + AI answers.`,
        fillsUsed: fillCheck.count,
        fillsLimit: fillCheck.limit
      };
    }
  }

  // ── Profile pruning: only include sections relevant to these fields ────
  const neededSections = detectNeededProfileSections(fields);
  const profileBlock = buildProfileBlock(profile, resumeSummary, neededSections);

  // ── Compact field serialization ────────────────────────────────────────
  const fieldsBlock = fields.map(f => {
    let line = `[${f.index}] "${f.label}" type=${f.type}`;
    if (f.options && f.options.length) line += ` options=${JSON.stringify(f.options)}`;
    if (f.required) line += ' required';
    // Only include context for unlabeled/ambiguous fields
    if (f.surroundingText && (!f.label || f.label === f.type || f.label === 'field') && f.surroundingText.length > 10) {
      line += ` ctx="${f.surroundingText.substring(0,80).replace(/\n/g,' ')}"`;
    }
    return line;
  }).join('\n');

  // ── Compressed page context ────────────────────────────────────────────
  const ctx = pageContext || {};
  const urlHint = ctx.companyName || (() => {
    try { return new URL(pageUrl).hostname.replace('www.','').split('.')[0]; } catch(e) { return ''; }
  })();

  // Only send a short page excerpt (500 chars max) instead of 1500
  const shortPageText = pageText.substring(0, 500);

  // ── Dynamic system prompt: only include relevant templates ─────────────
  let systemPrompt = buildDynamicSystemPrompt(fields);

  if (!premiumStatus.isPremium) {
    systemPrompt += `\n\nFREE TIER: For SUBJECTIVE/OPEN-ENDED fields (cover letter, "why this company", "tell about yourself", "best project", strengths, weakness, 5-year goal, "why switching", long-form text), set value to exactly: __PREMIUM_REQUIRED__ with fieldType: "subjective".`;
  }

  // ── Dynamic max_tokens based on field count and types ──────────────────
  const subjectiveCount = fields.filter(f => {
    const c = `${f.label} ${f.name}`.toLowerCase();
    return f.type === 'textarea' || /cover.?letter|about|project|why|strength|weakness|goal|summary|experience with/.test(c);
  }).length;
  const maxTokens = Math.min(4000, Math.max(500, 200 + (subjectiveCount * 350) + ((fields.length - subjectiveCount) * 40)));

  const userPrompt = `Company: "${urlHint}" | Title: "${ctx.jobTitle || pageTitle}"${ctx.techKeywords?.length ? ` | Tech: ${ctx.techKeywords.join(', ')}` : ''}
Page excerpt: "${shortPageText}"

PROFILE:
${profileBlock}

FIELDS (${fields.length} need AI, ${localFillCount || 0} already filled locally):
${fieldsBlock}

Fill EVERY field. Radio/checkbox values MUST match provided options. Return JSON.`.trim();

  const resp = await callGroq(apiKey, systemPrompt, userPrompt, maxTokens, 0.3);
  if (resp.error) return resp;

  try {
    const jsonMatch = resp.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response. Got: ' + resp.text.substring(0, 200));
    const plan = JSON.parse(jsonMatch[0]);
    // Safety: ensure all LLM fields have a fills entry
    const seen = new Set((plan.fills||[]).map(f => f.index));
    for (const f of fields) {
      if (!seen.has(f.index)) {
        plan.fills = plan.fills || [];
        plan.fills.push({ index: f.index, value: '', skip: true, fieldType: 'skip' });
      }
    }
    // Log token usage
    if (resp.usage) {
      console.log(`[FormFill] Tokens — prompt: ${resp.usage.prompt_tokens}, completion: ${resp.usage.completion_tokens}, total: ${resp.usage.total_tokens} | Fields sent to LLM: ${fields.length}, filled locally: ${localFillCount || 0}`);
    }
    return { plan, tokenUsage: resp.usage };
  } catch (e) {
    return { error: 'Parse error: ' + e.message, raw: resp.text.substring(0, 400) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Groq call
// ═══════════════════════════════════════════════════════════════════════════
async function callGroq(apiKey, systemPrompt, userPrompt, maxTokens = 2000, temperature = 0.3) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   }
      ]
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Groq API ${response.status}`);
  }
  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || '',
    usage: data.usage || null
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Profile block — maximum signal for the model
// ═══════════════════════════════════════════════════════════════════════════
function buildProfileBlock(profile, resumeSummary, neededSections) {
  const f = v => (v || '').toString().trim();
  const row = (label, val) => val ? `${label}: ${val}` : null;
  const has = (section) => !neededSections || neededSections.has(section);

  const lines = [];

  if (has('identity')) {
    lines.push(
      row('Name', `${f(profile.firstName)} ${f(profile.lastName)}`.trim()),
      row('Email', f(profile.email)),
      row('Phone', f(profile.phone)),
      row('Gender', f(profile.gender))
    );
  }
  if (has('location')) {
    lines.push(
      row('City', f(profile.city)),
      row('State', f(profile.state))
    );
  }
  if (has('online')) {
    lines.push(
      row('LinkedIn', f(profile.linkedin)),
      row('GitHub', f(profile.github)),
      row('Portfolio', f(profile.portfolio))
    );
  }
  if (has('eligibility')) {
    lines.push(
      row('Current CTC', f(profile.currentCTC)),
      row('Expected CTC', f(profile.expectedCTC)),
      row('Notice Period', f(profile.noticePeriod)),
      row('Work Mode', f(profile.workType)),
      row('Open to Relocate', f(profile.relocate))
    );
  }
  if (has('career')) {
    lines.push(
      row('Job Title', f(profile.jobTitle)),
      row('Experience', f(profile.experience) ? f(profile.experience) + ' yrs' : null),
      row('Company', f(profile.currentCompany)),
      row('Designation', f(profile.currentDesignation)),
      row('Industry', f(profile.industry))
    );
  }
  if (has('education')) {
    lines.push(
      row('Degree', f(profile.educationDegree)),
      row('Branch', f(profile.educationBranch)),
      row('College', f(profile.college)),
      row('Grad Year', f(profile.gradYear)),
      row('CGPA', f(profile.gpa))
    );
  }
  if (has('skills')) {
    lines.push(
      row('Skills', (profile.skills||[]).join(', ')),
      row('Languages', f(profile.languages)),
      row('AI/ML', f(profile.aiStack)),
      row('Frameworks', f(profile.frameworks)),
      row('Cloud', f(profile.cloudTools)),
      row('Certs', f(profile.certifications))
    );
  }

  const filtered = lines.filter(Boolean);

  // Narrative fields — only if needed
  const narrativeLines = [];
  if (has('narrative')) {
    if (profile.currentRoleDesc) narrativeLines.push(`Current Role: ${f(profile.currentRoleDesc)}`);
    if (profile.prevRoleDesc) narrativeLines.push(`Previous Role: ${f(profile.prevRoleDesc)}`);
    if (profile.project1) narrativeLines.push(`Project 1: ${f(profile.project1)}`);
    if (profile.project2) narrativeLines.push(`Project 2: ${f(profile.project2)}`);
    if (profile.project3) narrativeLines.push(`Project 3: ${f(profile.project3)}`);
    if (profile.summary) narrativeLines.push(`Summary: ${f(profile.summary)}`);
    if (profile.whySwitching) narrativeLines.push(`Why Switching: ${f(profile.whySwitching)}`);
    if (profile.strength) narrativeLines.push(`Strength: ${f(profile.strength)}`);
    if (profile.weakness) narrativeLines.push(`Weakness: ${f(profile.weakness)}`);
    if (profile.fiveYear) narrativeLines.push(`5yr Goal: ${f(profile.fiveYear)}`);
    if (profile.achievements) narrativeLines.push(`Achievements: ${f(profile.achievements)}`);
  }

  let block = filtered.join('\n');
  if (narrativeLines.length) block += '\n' + narrativeLines.join('\n');
  // Only append resume text when narrative is needed and resume exists
  if (has('narrative') && resumeSummary && resumeSummary.length > 30) {
    block += '\nResume: ' + resumeSummary.substring(0, 1000);
  }
  return block;
}

// ═══════════════════════════════════════
// FREEMIUM GATING
// ═══════════════════════════════════════

const FREE_DAILY_LIMIT = 5;

async function checkPremiumStatus() {
  const data = await chrome.storage.local.get(["license_valid", "license_plan", "license_expires"]);

  if (!data.license_valid) return { isPremium: false };

  // Check expiry
  if (data.license_expires && new Date(data.license_expires) < new Date()) {
    await chrome.storage.local.set({ license_valid: false });
    return { isPremium: false };
  }

  return { isPremium: true, plan: data.license_plan };
}

async function checkAndIncrementFills() {
  const today = new Date().toISOString().slice(0, 10);
  const data = await chrome.storage.local.get("daily_fills");
  let fills = data.daily_fills || { date: today, count: 0 };

  if (fills.date !== today) {
    fills = { date: today, count: 0 };
  }

  if (fills.count >= FREE_DAILY_LIMIT) {
    return { allowed: false, count: fills.count, limit: FREE_DAILY_LIMIT };
  }

  fills.count += 1;
  await chrome.storage.local.set({ daily_fills: fills });
  return { allowed: true, count: fills.count, limit: FREE_DAILY_LIMIT };
}

// Modify your existing message handler where you process the AI agent
// Freemium gating is now wired into agentAnalyzePage above.
