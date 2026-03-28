// background.js – FormFill AI Agent v4 (Server-proxied)

const STORAGE_KEY   = 'formfill_profile';
const FILL_API_URL  = 'https://formfill-api.amitmishra4447.workers.dev';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getProfile') {
    chrome.storage.local.get([STORAGE_KEY, 'formfill_resume', 'formfill_resume_summary'], (r) => {
      sendResponse({ profile: r[STORAGE_KEY]||{}, resume: r['formfill_resume']||null, resumeSummary: r['formfill_resume_summary']||'' });
    });
    return true;
  }
  if (msg.action === 'captureScreenshot') {
    chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 60 }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ screenshot: dataUrl });
      }
    });
    return true;
  }
  if (msg.action === 'identifyFieldsWithVision') {
    identifyFieldsWithVision(msg).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true;
  }
  if (msg.action === 'agentAnalyzePage') {
    agentAnalyzePage(msg).then(sendResponse).catch(e => sendResponse({ error: e.message }));
    return true;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE ID — stable per-installation identifier for server-side usage tracking
// ═══════════════════════════════════════════════════════════════════════════
async function getDeviceId() {
  const data = await chrome.storage.local.get('device_id');
  if (data.device_id) return data.device_id;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ device_id: id });
  return id;
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT: Full page analysis — proxied through server
// All prompt construction, Groq calls, premium checks, and usage limits
// are enforced server-side. The client just sends field + profile data.
// ═══════════════════════════════════════════════════════════════════════════
async function agentAnalyzePage({ fields, localFillCount, pageContext, pageTitle, pageUrl, pageText, profile, resumeSummary }) {
  const deviceId = await getDeviceId();
  const licenseData = await chrome.storage.local.get(['license_key']);

  try {
    const resp = await fetch(`${FILL_API_URL}/api/fill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
      },
      body: JSON.stringify({
        license_key: licenseData.license_key || '',
        apiKey: (profile?.apiKey || '').trim(),
        fields,
        localFillCount: localFillCount || 0,
        pageContext: pageContext || {},
        pageTitle: (pageTitle || '').substring(0, 200),
        pageUrl: (pageUrl || '').substring(0, 500),
        pageText: (pageText || '').substring(0, 500),
        profile: sanitizeProfileForServer(profile),
        resumeSummary: (resumeSummary || '').substring(0, 2000),
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      // Handle specific server errors
      if (errData.error === 'limit_reached') {
        // Update local counter for UI display
        if (errData.fillsUsed !== undefined) {
          const today = new Date().toISOString().slice(0, 10);
          await chrome.storage.local.set({ daily_fills: { date: today, count: errData.fillsUsed } });
        }
        return errData;
      }
      return { error: errData.error || `Server error ${resp.status}` };
    }

    const result = await resp.json();

    // Update local fill counter from server response (for UI display only)
    if (result.fillsUsed !== undefined) {
      const today = new Date().toISOString().slice(0, 10);
      await chrome.storage.local.set({ daily_fills: { date: today, count: result.fillsUsed } });
    }

    // Parse AI response
    if (!result.plan) {
      // Server returned raw AI text — parse it client-side
      if (result.aiResponse) {
        const jsonMatch = result.aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return { error: 'No JSON in AI response' };
        const plan = JSON.parse(jsonMatch[0]);
        // Safety: ensure all fields have a fills entry
        const seen = new Set((plan.fills || []).map(f => f.index));
        for (const f of fields) {
          if (!seen.has(f.index)) {
            plan.fills = plan.fills || [];
            plan.fills.push({ index: f.index, value: '', skip: true, fieldType: 'skip' });
          }
        }
        // Post-LLM negativity filter
        if (plan.fills) {
          plan.fills = sanitizeNegativeFills(plan.fills);
        }
        return { plan, tokenUsage: result.usage };
      }
      return { error: 'Invalid server response' };
    }

    // Server already parsed the plan
    if (result.plan.fills) {
      result.plan.fills = sanitizeNegativeFills(result.plan.fills);
    }
    return { plan: result.plan, tokenUsage: result.usage };

  } catch (e) {
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      return { error: 'Cannot reach server. Check your internet connection.' };
    }
    return { error: 'Request failed: ' + e.message };
  }
}

// Strip profile for server — keep apiKey separate, don't embed in profile object
function sanitizeProfileForServer(profile) {
  if (!profile) return {};
  const clean = { ...profile };
  delete clean.apiKey; // sent as top-level field, not inside profile
  return clean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Post-LLM negativity filter — catches negative phrasing that slips through
// ═══════════════════════════════════════════════════════════════════════════
const NEGATIVE_PATTERNS = [
  /\bI don'?t have experience\b/i,
  /\bI have no experience\b/i,
  /\bI haven'?t (worked|built|used|done|managed|led)\b/i,
  /\bI lack\b/i,
  /\blimited experience\b/i,
  /\bno experience\b/i,
  /\bno professional experience\b/i,
  /\bbasic knowledge\b/i,
  /\bbasic understanding\b/i,
  /\bentry.?level knowledge\b/i,
  /\bunfortunately\b/i,
  /\bregrettably\b/i,
  /\bI('m| am) not (sure|qualified|experienced|confident)\b/i,
  /\bI don'?t know\b/i,
  /\bnot provided\b/i,
  /\bN\/A\b/,
  /\bnot applicable\b/i,
  /\bweak(ness)? (is|in|at|with)\b/i,
  /\bstruggle (with|to)\b/i,
  /\bI('m| am) (still|only|just) (a |an )?(beginner|learning|junior|starter)\b/i,
  /\bI('m| am) not (good|great|strong) (at|with|in)\b/i,
  /\bgap in (my )?(experience|employment|resume|career)\b/i,
  /\bI (only|just) have\b/i,
];

function sanitizeNegativeFills(fills) {
  return fills.map(fill => {
    if (!fill.value || typeof fill.value !== 'string' || fill.skip) return fill;
    if (fill.fieldType === 'factual') return fill;
    let flagged = false;
    for (const pattern of NEGATIVE_PATTERNS) {
      if (pattern.test(fill.value)) {
        flagged = true;
        console.warn(`[FormFill] Negativity detected in field ${fill.index}: matched "${pattern}"`);
        break;
      }
    }
    if (flagged) fill._negativityFlagged = true;
    return fill;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Vision-based field identification — also proxied through server
// ═══════════════════════════════════════════════════════════════════════════
async function identifyFieldsWithVision({ screenshots, fields, profile, pageTitle, pageUrl }) {
  const deviceId = await getDeviceId();
  const licenseData = await chrome.storage.local.get(['license_key']);

  try {
    const resp = await fetch(`${FILL_API_URL}/api/vision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': deviceId,
      },
      body: JSON.stringify({
        license_key: licenseData.license_key || '',
        apiKey: (profile?.apiKey || '').trim(),
        screenshots,
        fields,
        profile: sanitizeProfileForServer(profile),
        pageTitle: (pageTitle || '').substring(0, 200),
        pageUrl: (pageUrl || '').substring(0, 500),
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return { error: errData.error || `Vision API ${resp.status}` };
    }

    return await resp.json();
  } catch (e) {
    return { error: 'Vision request failed: ' + e.message };
  }
}
