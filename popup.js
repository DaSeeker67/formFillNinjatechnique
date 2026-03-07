// popup.js — FormFill AI v4

const STORAGE_KEY = 'formfill_profile';

// All field IDs — must match popup.html exactly
const TEXT_FIELDS = [
  // Personal tab
  'firstName','lastName','email','phone','whatsapp','dob','gender',
  'city','state','pincode','nationality',
  'linkedin','github','portfolio',
  'workAuth','visaRequired','currentCTC','expectedCTC',
  'noticePeriod','availability','workType','relocate','preferredCities','disability',
  // Career tab
  'jobTitle','experience','currentCompany','currentDesignation','empType','industry',
  'currentRoleDesc','prevRoleDesc',
  'educationDegree','educationBranch','college','gradYear','gpa','class12','class10',
  'languages','aiStack','frameworks','cloudTools','certifications',
  'project1','project2','project3',
  'summary','whySwitching','strength','weakness','fiveYear','achievements',
  // Settings
  'apiKey'
];
const TOGGLE_FIELDS = ['autoDetect','fillGoogleForms','showHighlights'];

// ── Tab switching ────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
    tab.classList.add('on');
    const panelEl = document.getElementById('tab-' + tab.dataset.tab);
    if (panelEl) panelEl.classList.add('on');
  });
});

// ── Skills tag input ─────────────────────────────────────────────────────
let skills = [];

document.getElementById('skillsInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(/,$/, '');
    if (val && !skills.includes(val)) { skills.push(val); renderSkills(); }
    e.target.value = '';
  }
});

function renderSkills() {
  const c = document.getElementById('skillsTags');
  c.innerHTML = skills.map((s, i) =>
    `<span class="stag" data-i="${i}">${escHtml(s)} ✕</span>`
  ).join('');
  c.querySelectorAll('.stag').forEach(t => {
    t.onclick = () => { skills.splice(+t.dataset.i, 1); renderSkills(); };
  });
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── API key visibility toggle ────────────────────────────────────────────
document.getElementById('toggleKey').addEventListener('click', () => {
  const inp = document.getElementById('apiKey');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

// ── Resume: Analyze with Groq ────────────────────────────────────────────
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const text = (document.getElementById('resumeText').value || '').trim();
  const preview = document.getElementById('resumePreview');

  if (text.length < 80) {
    preview.textContent = '⚠ Please paste your resume text first (at least a few lines).';
    return;
  }

  const stored = await new Promise(r => chrome.storage.local.get(STORAGE_KEY, r));
  const p = stored[STORAGE_KEY] || {};
  if (!p.apiKey || !p.apiKey.startsWith('gsk_')) {
    preview.textContent = '⚠ Add your Groq API key in Settings tab and Save Profile first.';
    return;
  }

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Analyzing…';
  preview.textContent = '🤖 Sending to Groq for analysis…';

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${p.apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 700,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: 'You are a resume parser. Extract key information clearly and concisely. Return plain text, no markdown.'
          },
          {
            role: 'user',
            content: `Parse this resume and return a structured summary with these sections:
Name | Contact | Location
Education: degree, college, year, CGPA/percentage
Experience: company, role, duration, 2-3 key achievements with metrics
Projects: name, tech stack, outcome (one line each, max 3 projects)  
Skills: top 10 skills comma-separated
Achievements/Awards: any notable ones

Keep each section to 1-3 lines. Be specific — include numbers and tech names.

RESUME TEXT:
${text.substring(0, 6000)}`
          }
        ]
      })
    });

    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);
    const summary = data.choices?.[0]?.message?.content?.trim() || 'Could not parse resume.';
    preview.textContent = summary;

    // Save raw text + AI summary
    await new Promise(r => chrome.storage.local.set({
      formfill_resume: { name: 'pasted_resume.txt', text, isPdf: false },
      formfill_resume_summary: summary
    }, r));

    preview.textContent = '✓ Saved!\n\n' + summary;
  } catch (err) {
    preview.textContent = '❌ Error: ' + err.message;
  }

  btn.disabled = false;
  btn.textContent = '🤖 Analyze & Save';
});

document.getElementById('clearResumeBtn').addEventListener('click', () => {
  if (confirm('Clear saved resume text?')) {
    document.getElementById('resumeText').value = '';
    document.getElementById('resumePreview').textContent = 'Resume cleared.';
    chrome.storage.local.remove(['formfill_resume', 'formfill_resume_summary']);
  }
});

// ── Save profile ─────────────────────────────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', saveProfile);

function getFormData() {
  const profile = {};
  TEXT_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) profile[id] = el.value.trim();
  });
  TOGGLE_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) profile[id] = el.checked;
  });
  profile.skills = [...skills];
  return profile;
}

function saveProfile() {
  const profile = getFormData();

  // If resume text is present, save it too
  const resumeTextEl = document.getElementById('resumeText');
  if (resumeTextEl && resumeTextEl.value.trim().length > 50) {
    chrome.storage.local.set({
      formfill_resume: { name: 'pasted_resume.txt', text: resumeTextEl.value.trim(), isPdf: false }
    });
  }

  chrome.storage.local.set({ [STORAGE_KEY]: profile }, () => {
    showSaved();
    updatePill(profile.apiKey);
  });
}

function showSaved() {
  const el = document.getElementById('ss');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function updatePill(apiKey) {
  const pill = document.getElementById('pill');
  const ok = apiKey && apiKey.startsWith('gsk_');
  pill.textContent = ok ? 'Ready' : 'No Key';
  pill.className = 'pill ' + (ok ? 'ok' : 'no');
}

// ── Run agent on current tab ─────────────────────────────────────────────
document.getElementById('runBtn').addEventListener('click', async () => {
  saveProfile();
  await new Promise(r => setTimeout(r, 250));
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { action: 'triggerFill' });
  window.close();
});

// ── Clear all data ───────────────────────────────────────────────────────
document.getElementById('clearData').addEventListener('click', () => {
  if (confirm('This will delete your entire saved profile and resume. Are you sure?')) {
    chrome.storage.local.clear(() => {
      skills = [];
      loadProfile();
    });
  }
});

// ── Load saved profile ───────────────────────────────────────────────────
function loadProfile() {
  chrome.storage.local.get(
    [STORAGE_KEY, 'formfill_resume', 'formfill_resume_summary'],
    result => {
      const p = result[STORAGE_KEY] || {};

      TEXT_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && p[id]) el.value = p[id];
      });
      TOGGLE_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el && p[id] !== undefined) el.checked = p[id];
      });

      skills = Array.isArray(p.skills) ? p.skills : [];
      renderSkills();
      updatePill(p.apiKey);

      // Load resume text
      const resume = result['formfill_resume'];
      if (resume && resume.text) {
        document.getElementById('resumeText').value = resume.text;
      }
      const summary = result['formfill_resume_summary'];
      if (summary) {
        document.getElementById('resumePreview').textContent = summary;
      }
    }
  );
}

loadProfile();

// ═══════════════════════════════════════
// PREMIUM LICENSE MANAGEMENT
// ═══════════════════════════════════════

const LICENSE_API = "https://formfill-api.amitmishra4447.workers.dev";

// Load license status on startup
async function loadLicenseStatus() {
  const data = await chrome.storage.local.get(["license_key", "license_plan", "license_expires", "license_valid", "license_checked_at", "daily_fills"]);

  // Update daily fills counter
  const today = new Date().toISOString().slice(0, 10);
  const fills = data.daily_fills || { date: today, count: 0 };
  if (fills.date !== today) {
    fills.date = today;
    fills.count = 0;
    await chrome.storage.local.set({ daily_fills: fills });
  }

  if (data.license_valid && data.license_key) {
    // Check if we need to re-validate (every 24 hours)
    const lastCheck = data.license_checked_at || 0;
    const hoursSinceCheck = (Date.now() - lastCheck) / (1000 * 60 * 60);

    if (hoursSinceCheck > 24) {
      await validateLicenseKey(data.license_key, true);
    } else {
      showPremiumUI(data.license_plan, data.license_expires);
    }
  } else {
    showFreeUI(fills.count);
  }
}

function showPremiumUI(plan, expiresAt) {
  const premiumStatus = document.getElementById("premiumStatus");
  const freeStatus = document.getElementById("freeStatus");
  const licenseInputGroup = document.getElementById("licenseInputGroup");
  const deactivateGroup = document.getElementById("deactivateGroup");
  const upgradeLink = document.getElementById("upgradeLink");
  const pill = document.getElementById("pill");

  premiumStatus.style.display = "block";
  freeStatus.style.display = "none";
  licenseInputGroup.style.display = "none";
  deactivateGroup.style.display = "block";
  upgradeLink.style.display = "none";

  const planText = plan === "lifetime" ? "Lifetime Plan" : "Monthly Plan";
  const expiryText = plan === "lifetime" ? "Never expires" : `Expires: ${new Date(expiresAt).toLocaleDateString("en-IN")}`;
  document.getElementById("premiumPlanText").textContent = `${planText} · ${expiryText}`;

  // Update header pill
  pill.textContent = "PRO ✦";
  pill.className = "pill ok";
}

function showFreeUI(fillCount) {
  const premiumStatus = document.getElementById("premiumStatus");
  const freeStatus = document.getElementById("freeStatus");
  const licenseInputGroup = document.getElementById("licenseInputGroup");
  const deactivateGroup = document.getElementById("deactivateGroup");
  const upgradeLink = document.getElementById("upgradeLink");

  premiumStatus.style.display = "none";
  freeStatus.style.display = "block";
  licenseInputGroup.style.display = "block";
  deactivateGroup.style.display = "none";
  upgradeLink.style.display = "block";

  document.getElementById("fillsUsedText").textContent = `${fillCount}/5 fills used today`;
}

async function validateLicenseKey(key, silent = false) {
  try {
    const res = await fetch(`${LICENSE_API}/api/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key }),
    });
    const data = await res.json();

    if (data.valid) {
      await chrome.storage.local.set({
        license_key: key,
        license_plan: data.plan,
        license_expires: data.expires_at,
        license_valid: true,
        license_checked_at: Date.now(),
      });
      showPremiumUI(data.plan, data.expires_at);
      if (!silent) {
        showSaveStatus("✅ License activated!");
      }
    } else {
      await chrome.storage.local.set({ license_valid: false });
      if (!silent) {
        showSaveStatus("❌ " + (data.error || "Invalid license key"));
      }
      const fills = (await chrome.storage.local.get("daily_fills")).daily_fills || { date: new Date().toISOString().slice(0, 10), count: 0 };
      showFreeUI(fills.count);
    }
  } catch (err) {
    if (!silent) {
      showSaveStatus("⚠️ Could not verify. Check internet.");
    }
  }
}

function showSaveStatus(msg) {
  const ss = document.getElementById("ss");
  ss.textContent = msg;
  ss.classList.add("show");
  setTimeout(() => ss.classList.remove("show"), 3000);
}

// Activate button
document.getElementById("activateBtn").addEventListener("click", async () => {
  const key = document.getElementById("licenseKey").value.trim().toUpperCase();
  if (!key || !key.startsWith("FF-")) {
    showSaveStatus("❌ Enter a valid license key (FF-XXXX-...)");
    return;
  }
  document.getElementById("activateBtn").textContent = "⏳ Verifying...";
  await validateLicenseKey(key);
  document.getElementById("activateBtn").textContent = "🔑 Activate";
});

// Recover button
document.getElementById("recoverBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  if (!email) {
    showSaveStatus("❌ Enter your email in the Personal tab first");
    return;
  }

  try {
    document.getElementById("recoverBtn").textContent = "⏳ Looking up...";
    const res = await fetch(`${LICENSE_API}/api/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (data.license_key) {
      document.getElementById("licenseKey").value = data.license_key;
      await validateLicenseKey(data.license_key);
      showSaveStatus("✅ License recovered!");
    } else {
      showSaveStatus("❌ " + (data.error || "No license found for this email"));
    }
  } catch (err) {
    showSaveStatus("⚠️ Recovery failed. Check internet.");
  }
  document.getElementById("recoverBtn").textContent = "📧 Recover by Email";
});

// Deactivate button
document.getElementById("deactivateBtn").addEventListener("click", async () => {
  if (confirm("Are you sure you want to deactivate your license on this device?")) {
    await chrome.storage.local.set({ license_key: "", license_valid: false, license_plan: "", license_expires: "" });
    const pill = document.getElementById("pill");
    pill.textContent = "FREE";
    pill.className = "pill no";
    showFreeUI(0);
    showSaveStatus("License deactivated");
  }
});

// Load on startup
loadLicenseStatus();
