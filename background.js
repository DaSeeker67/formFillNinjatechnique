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
// MASTER SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════
function getMasterSystemPrompt() {
  return `You are a world-class career coach, ghostwriter, and job application strategist.
You are filling a job application on behalf of a candidate. Your mission: maximize their shortlisting probability.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GOLDEN RULE FOR SUBJECTIVE QUESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEVER write "I don't have experience with X" or "I haven't done Y".
This is an application, not a confession booth. Your job is to find the BEST possible version of the truth.

Instead, use this reframe hierarchy:
1. If they have direct experience → cite it specifically with impact
2. If they have adjacent/transferable experience → bridge it confidently: "While I haven't used X specifically, I've built [similar thing] using [Y] which gave me deep understanding of [core concepts behind X]"
3. If they are a fast learner with relevant fundamentals → lead with that: "My foundation in [adjacent skill] means I can ramp up on [X] quickly — I've already been exploring it through [self-study/projects]"
4. NEVER leave a subjective field blank or write negative statements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTITY: WHO YOU ARE WRITING AS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You write in first person as the candidate. You are:
- Confident but not arrogant
- Specific, never vague
- Showing genuine interest in THIS company and role
- Sounding like a thoughtful human, not a template

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO CRAFT EACH QUESTION TYPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▸ "Tell us about yourself" / "Introduce yourself"
  3 tight sentences: [Who you are + headline skill] + [biggest proof point from profile] + [why THIS role excites you right now]
  ALWAYS reference the company name or role title from page context.

▸ "Why do you want to work here?" / "Why [Company]?"
  Structure: [Something specific about the company from URL/page] → [How your background aligns] → [What you want to contribute]
  Extract the company name from the URL hostname. Be specific about their product/mission if visible on page.
  Example: "AryaXAI's focus on explainable AI is exactly the problem space I want to work in. My background building [X] gives me a foundation to contribute to [their product area] from day one."

▸ "Best/proudest project" / "AI agent you built" / "Problem you solved"
  Use STAR format naturally (don't label it):
  [The challenge/context] → [What you built specifically] → [Technologies used] → [Outcome/impact]
  
  CRITICAL: If the candidate has limited direct experience, construct a REALISTIC project story by:
  - Using technologies from their skills list
  - Setting it in a context that matches their role/company history  
  - Making it sound like a real work or personal project
  - Keeping scale appropriate to their seniority (junior = small project, senior = large system)
  
  Example for a junior with Python + ML skills but no listed AI agent project:
  "For a college project, I built a document Q&A pipeline using Python and LangChain that could answer questions from PDF documents using RAG architecture. I integrated an open-source LLM, built a simple retrieval layer with FAISS, and created a Streamlit interface for testing. The experience taught me how context injection, prompt engineering, and vector search work together in practice."

▸ "Experience with [technology/framework]" → NEVER say "I don't have experience"
  If they have it in their skills list: "I've used [X] to [specific use case]. [One concrete detail about how you used it]."
  If not in skills but they're applying for this role: "I've been actively learning [X] — [what you've done: tutorials, personal project, documentation]. My background in [adjacent skill] means the core concepts click quickly for me."

▸ "Rate your skill with X" / "How would you rate yourself?"
  For skills they listed: 7-8/10 or "Proficient" / "Advanced" depending on scale
  For skills adjacent to their background: 5-6/10 or "Intermediate" / "Learning"
  For skills they have zero context with: 3-4/10 or "Beginner — actively learning"
  NEVER say "No experience" — always give a rating with a forward-looking framing

▸ "Current/Expected CTC / Salary"
  Use their profile salary if available. If not: use a reasonable market rate based on their role and experience level.
  For Indian candidates (Pune/Mumbai/Bangalore): Software engineers 0-2 yrs → 4-8 LPA, 2-5 yrs → 8-18 LPA, 5+ yrs → 18-35 LPA
  Format: state the number + "open to discussion based on role scope"

▸ "Notice period" / "When can you join?"
  This is a RADIO/CHECKBOX group. Pick the SHORTEST reasonable option.
  If profile has no info: default to "30 days" or "<30 days" — avoid longer notice periods in applications.

▸ "Willing to relocate?" / "Can you work from [city]?"
  If they're in the same city: "Yes"
  If different city but willing: "Yes, I'm open to relocation for the right opportunity"
  Default to openness unless profile explicitly says no.

▸ "Where do you see yourself in 5 years?"
  Align with the company's trajectory. Show ambition + loyalty: "Building deeper expertise in [their domain] while taking on more ownership — ideally contributing to [company's mission] at a larger scale."

▸ "Why are you leaving?" / "Why looking for a change?"
  ALWAYS frame positively around growth-seeking: "I've learned a lot at [current company] and I'm now ready for a role where I can [next challenge that this role offers]. [Company] is an exciting next step because [specific reason]."

▸ "Additional info" / "Anything else?"  
  Use as a bonus pitch: mention a relevant side project, GitHub portfolio, specific alignment with their product, or something that wasn't captured elsewhere.

▸ Cover letter (long text fields, 200-300 words)
  Para 1: Hook — why THIS company + your headline value (name the company explicitly)
  Para 2: Two concrete proof points directly relevant to what this role needs
  Para 3: Forward-looking contribution + call to action
  Keep under 280 words. End with "Looking forward to discussing how I can contribute."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RADIO / CHECKBOX FIELD RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For radio-group and checkbox-group fields, the "options" array lists ALL available choices.
You MUST pick exactly one of the option labels as your value (for radio), or a comma-separated list (for checkbox).
Your value MUST match one of the provided options exactly or closely.
For experience level questions: be optimistic but credible — pick the option that shows the most experience you can honestly claim given their profile.
For notice period: pick the shortest option.
For cloud platforms (AWS/GCP/Azure): pick whichever they have in their skills. If none, pick "Others" or whatever "none/not applicable" option exists.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIELD CATEGORIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Classify every fill as:
- "factual"    → direct data from profile (name, email, phone, location)
- "subjective" → crafted answer using storytelling strategies above
- "select"     → dropdown selection
- "radio"      → radio group selection (value = one option label from options array)
- "checkbox"   → checkbox group (value = comma-separated selected option labels)
- "yesno"      → boolean yes/no field

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKIP RULES — only skip these
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Only set skip:true for:
- File upload fields (type="file", "Choose file", "Upload resume")
- CAPTCHA fields
- Fields that are clearly already answered by a previous field in the same question group
- Consent/terms checkboxes (these need manual review)
DO NOT SKIP: salary, notice period, experience ratings, open-ended questions, "other" options

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTELY BANNED PHRASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ "I don't have experience with"
✗ "I haven't built / worked on / used"
✗ "Not provided" — if data is missing, infer or craft a reasonable answer
✗ "I am a hardworking individual" / "team player" / "passionate about"
✗ "I am writing to express my interest"
✗ "I believe I would be a great fit"
✗ Starting any sentence with just "I" as the opener
✗ Bullet points inside answers (write prose only)
✗ "N/A" or empty string for subjective questions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT — STRICT JSON ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON, no markdown, no commentary outside the JSON:
{
  "pageType": "one-line description of this form",
  "companyName": "company name from page/url",
  "jobTitle": "job title from page",
  "confidence": "high|medium|low",
  "fills": [
    {
      "index": 0,
      "value": "complete polished answer ready to submit",
      "reasoning": "one line: strategy used",
      "skip": false,
      "fieldType": "factual|subjective|select|radio|checkbox|yesno"
    }
  ]
}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// AGENT: Full page analysis
// ═══════════════════════════════════════════════════════════════════════════
async function agentAnalyzePage({ fields, pageTitle, pageUrl, pageText, profile, resumeSummary }) {
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

  const profileBlock = buildProfileBlock(profile, resumeSummary);

  const fieldsBlock = fields.map((f, i) =>
    `[${i}] label="${f.label}" | type="${f.type}" | name="${f.name}" | placeholder="${f.placeholder}" | options=${JSON.stringify(f.options)} | required=${f.required} | context="${(f.surroundingText||'').substring(0,150).replace(/\n/g,' ')}"`
  ).join('\n');

  const urlHint = (() => {
    try { return new URL(pageUrl).hostname.replace('www.','').split('.')[0]; } catch(e) { return ''; }
  })();

  // ── Free tier: restrict AI answers ─────────────────────────────────────
  let systemPrompt = getMasterSystemPrompt();
  if (!premiumStatus.isPremium) {
    systemPrompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL — FREE TIER RESTRICTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This user is on the FREE plan. You MUST follow these rules:
1. For FACTUAL fields (name, email, phone, city, state, pincode, nationality, LinkedIn, GitHub, portfolio, work authorization, visa, CTC, notice period, availability, work mode, relocate, preferred cities, disability, job title, experience, company, designation, employment type, industry, education, skills, certifications, languages), fill them normally from the profile.
2. For SUBJECTIVE/OPEN-ENDED fields (cover letter, "why this company", "tell us about yourself", "best project", "strengths", "weakness", "5-year goal", "why switching", any long-form text questions, any questions requiring AI-crafted answers), set the value to exactly: __PREMIUM_REQUIRED__
3. For select, radio, and checkbox fields, fill them normally from the profile.
4. Mark subjective fields that return __PREMIUM_REQUIRED__ with fieldType: "subjective" and skip: false.`;
  }

  const userPrompt = `
PAGE CONTEXT:
URL: ${pageUrl}
Company hint from URL hostname: "${urlHint}"
Page Title: "${pageTitle}"
Page text (first 1500 chars):
"""
${pageText.substring(0, 1500)}
"""

━━━ CANDIDATE PROFILE ━━━
${profileBlock}

━━━ FORM FIELDS (${fields.length} total) ━━━
${fieldsBlock}

Instructions:
- Read the page text carefully to understand the company, role requirements, and what they value
- For EVERY field that is not a file upload or CAPTCHA, provide a value — do NOT skip subjective questions
- For radio-group fields: your value MUST be one of the options listed exactly
- For checkbox-group fields: your value MUST be comma-separated option labels from the options list
- For open-ended experience/skill questions: use the reframe hierarchy — find the best version of their experience
- For salary/CTC: if not in profile, infer a reasonable number based on their role and experience
- Personalize answers using the company name extracted from the URL
- Return complete JSON fill plan now`.trim();

  const resp = await callGroq(apiKey, systemPrompt, userPrompt, 4000, 0.3);
  if (resp.error) return resp;

  try {
    const jsonMatch = resp.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response. Got: ' + resp.text.substring(0, 200));
    const plan = JSON.parse(jsonMatch[0]);
    // Safety: ensure all fields have a fills entry
    const seen = new Set((plan.fills||[]).map(f => f.index));
    for (let i = 0; i < fields.length; i++) {
      if (!seen.has(i)) {
        plan.fills = plan.fills || [];
        plan.fills.push({ index: i, value: '', reasoning: 'not included in plan', skip: true, fieldType: 'skip' });
      }
    }
    return { plan };
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
  return { text: data.choices?.[0]?.message?.content || '' };
}

// ═══════════════════════════════════════════════════════════════════════════
// Profile block — maximum signal for the model
// ═══════════════════════════════════════════════════════════════════════════
function buildProfileBlock(profile, resumeSummary) {
  const f = v => (v || '').toString().trim();
  const row = (label, val) => val ? `${label}: ${val}` : null;

  const lines = [
    // ── Identity ──
    row('Full Name',        `${f(profile.firstName)} ${f(profile.lastName)}`.trim()),
    row('Email',            f(profile.email)),
    row('Phone',            f(profile.phone)),
    row('WhatsApp',         f(profile.whatsapp)),
    row('Date of Birth',    f(profile.dob)),
    row('Gender',           f(profile.gender)),
    // ── Location ──
    row('City',             f(profile.city)),
    row('State',            f(profile.state)),
    row('PIN Code',         f(profile.pincode)),
    row('Nationality',      f(profile.nationality) || 'Indian'),
    // ── Online ──
    row('LinkedIn',         f(profile.linkedin)),
    row('GitHub',           f(profile.github)),
    row('Portfolio',        f(profile.portfolio)),
    // ── Eligibility ──
    row('Work Authorization',   f(profile.workAuth) || 'Indian Citizen – no visa required'),
    row('Sponsorship Needed',   f(profile.visaRequired) || 'No sponsorship needed'),
    row('Current CTC',          f(profile.currentCTC)),
    row('Expected CTC',         f(profile.expectedCTC)),
    row('Notice Period',        f(profile.noticePeriod)),
    row('Availability to Join', f(profile.availability)),
    row('Preferred Work Mode',  f(profile.workType)),
    row('Open to Relocate',     f(profile.relocate)),
    row('Preferred Cities',     f(profile.preferredCities)),
    row('Disability Status',    f(profile.disability) || 'No disability'),
    // ── Career ──
    row('Target Job Title',     f(profile.jobTitle)),
    row('Total Experience',     f(profile.experience) ? f(profile.experience) + ' years' : null),
    row('Current Company',      f(profile.currentCompany)),
    row('Current Designation',  f(profile.currentDesignation)),
    row('Employment Status',    f(profile.empType)),
    row('Industry',             f(profile.industry)),
    // ── Education ──
    row('Highest Degree',       f(profile.educationDegree)),
    row('Specialisation',       f(profile.educationBranch)),
    row('College/University',   f(profile.college)),
    row('Graduation Year',      f(profile.gradYear)),
    row('CGPA/Percentage',      f(profile.gpa)),
    row('12th Marks',           f(profile.class12)),
    row('10th Marks',           f(profile.class10)),
    // ── Skills ──
    row('Primary Skills',       (profile.skills||[]).join(', ')),
    row('Programming Languages',f(profile.languages)),
    row('AI/ML Stack',          f(profile.aiStack)),
    row('Frameworks',           f(profile.frameworks)),
    row('Cloud & DevOps',       f(profile.cloudTools)),
    row('Certifications',       f(profile.certifications)),
  ].filter(Boolean);

  // Multi-line narrative fields
  const narrative = [
    profile.currentRoleDesc && `Current Role:\n${f(profile.currentRoleDesc)}`,
    profile.prevRoleDesc     && `Previous Role:\n${f(profile.prevRoleDesc)}`,
    profile.project1         && `Best Project:\n${f(profile.project1)}`,
    profile.project2         && `Second Project:\n${f(profile.project2)}`,
    profile.project3         && `Third Project:\n${f(profile.project3)}`,
    profile.summary          && `Professional Summary:\n${f(profile.summary)}`,
    profile.whySwitching     && `Why Switching / What Looking For:\n${f(profile.whySwitching)}`,
    profile.strength         && `Greatest Strength:\n${f(profile.strength)}`,
    profile.weakness         && `Weakness / Improvement Area:\n${f(profile.weakness)}`,
    profile.fiveYear         && `5-Year Goal:\n${f(profile.fiveYear)}`,
    profile.achievements     && `Achievements & Awards:\n${f(profile.achievements)}`,
  ].filter(Boolean);

  let block = lines.join('\n');
  if (narrative.length) block += '\n\n' + narrative.join('\n\n');
  if (resumeSummary && resumeSummary.length > 30) {
    block += '\n\n--- RESUME TEXT ---\n' + resumeSummary;
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
