# FormFill AI – Your AI Job Application Agent 🚀

> **They use AI to reject you. Now you use AI to fight back.**

---

## 😤 The Problem

Let's be real — **the modern job application process is broken**.

Companies now use **AI-powered Applicant Tracking Systems (ATS)** to automatically screen, filter, and reject candidates before a human ever reads their application. Here's what you're up against:

- **75%+ of applications are rejected by ATS** before reaching a recruiter's inbox.
- You spend **30–45 minutes** filling out the same repetitive forms — name, email, experience, "Why do you want to work here?" — over and over again.
- Each job posting gets **250+ applicants** on average. You're competing against a wall of automation.
- Even qualified candidates get ghosted because a keyword was missing, a field was left blank, or the phrasing didn't match what the ATS was scanning for.

You're not losing because you're not good enough.  
**You're losing because the system was never designed to be fair.**

---

## 💡 The Solution — Fight AI with AI

If companies are going to use AI to auto-reject you, **why not use an AI agent to auto-apply for you — and write answers that actually get past the filter?**

**FormFill AI** is a Chrome extension that acts as your personal job application agent. It reads your resume, understands your profile, and **intelligently fills out every field** on any job application form — including the tricky open-ended questions like *"Why do you want to work here?"* or *"Tell us about yourself."*

Unlike basic autofill tools, FormFill AI uses a **dual-layer detection engine** (DOM analysis + AI-powered screenshot vision) to handle even the most complex, dynamically-rendered forms. It doesn't just fill fields — it writes **ATS-optimized, interview-winning answers** specifically tailored to each company and role.

> One-time setup. Infinite applications. **Massively increase your odds.**

Instead of spending 40 minutes per application, you spend **10 seconds**. Click one button, review the answers, and submit. That's it.

---

## ⚡ What Makes It Different

### 🎯 Dual-Layer Field Detection — Never Misses a Field

Most form-fill tools break on modern application portals because they rely on simple HTML label matching. FormFill AI uses a **two-pass detection system**:

1. **Deep DOM Analysis** — Walks the page DOM, reads labels, ARIA attributes, placeholders, surrounding text, and parent containers to identify every field — even on heavily nested frameworks like React, Angular, and Shadow DOM-based ATS portals.

2. **AI Vision Fallback** — When DOM labels are ambiguous or missing (common on Workday, iCIMS, and custom portals), the agent takes annotated **screenshots** of the form, marks each field with numbered indicators, and sends them to a vision AI model that reads the actual visual layout to identify what each field is asking. This means it works on forms where every other tool fails.

> **Result:** Near-100% field detection accuracy across every major ATS — including the ones that render entire forms inside iframes and dynamic JavaScript widgets.

### 🧠 ATS-Optimized, Interview-Winning Answers

Every subjective answer is written by an AI career strategist trained to **maximize your interview callback rate**:

- **Role-Aware Tailoring** — Extracts the company name, job title, and tech keywords directly from the page. Every answer is written *for that specific role at that specific company* — not generic.
- **Resume-Backed Proof Points** — Pulls real achievements, project names, metrics, and skills from your resume. No hallucinated facts, no generic filler.
- **ATS Keyword Injection** — Naturally weaves role-relevant keywords into answers so they score higher in automated screening systems.
- **Absolute Positivity Engine** — The AI never says *"I don't have experience with X."* Instead, it bridges transferable skills, highlights adjacent experience, and positions you as the strongest candidate. Every answer is engineered to make the recruiter think *"We need to talk to this person."*
- **Smart Reframing for Hard Questions** — Weaknesses become growth stories. Career gaps become pivots. Salary questions get confident, well-anchored responses. Nothing is left that could trigger a rejection.

### ⚡ Handles Every Field Type on Every Platform

| Field Type | How It Works |
|---|---|
| **Text Inputs** | Factual fields (name, email, phone) are filled instantly from your profile. No AI call needed. |
| **Textareas / Long-form** | AI writes first-person, polished answers — cover letters, "Tell us about yourself", project descriptions. |
| **Dropdowns / Selects** | Detects all options, picks the best match from your profile data. |
| **Radio Buttons** | Reads the full question context (not just labels) and selects the optimal answer. |
| **Checkbox Groups** | Multi-select fields are handled with intelligent option matching. |
| **Dynamic / AJAX Forms** | DOM observation handles forms that render fields after page load or on scroll. |
| **Custom UI Components** | Listboxes, ARIA widgets, Google Forms custom selects — all detected and filled. |

### 🌐 Works on All Major Platforms

Greenhouse · Lever · Workday · Ashby · SmartRecruiters · BambooHR · Jobvite · iCIMS · Taleo · Rippling · Google Forms · Typeform · JazzHR · Breezy HR · and any standard web form.

---

## ⚡ Feature Highlights

| Feature | Description |
|---|---|
| 🤖 **LLM-Powered Smart Fill** | Uses LLaMA 3.3 70B (via Groq) to craft personalized, recruiter-ready answers for every open-ended question. |
| 👁️ **Vision AI Fallback** | When DOM parsing isn't enough, takes annotated screenshots and uses a vision model (LLaMA 4 Scout) to identify fields visually — handles even the messiest forms. |
| 📄 **One-Click Resume Import** | Paste your resume text and the AI extracts skills, experience, and achievements — then uses them in every application automatically. |
| 👤 **Full Profile Storage** | Store all your details — personal info, work history, education, skills, links — locally. Fill once, reuse forever. |
| 🎯 **Auto-Detection** | Automatically detects when you're on a job application page and shows a floating side panel. No manual activation needed. |
| 🔄 **Regex + Local Fill Engine** | Factual fields (name, email, phone, LinkedIn, etc.) are filled instantly using fast local matching — no AI round-trip needed, near-zero latency. |
| 🧠 **Page Context Extraction** | Reads the page URL, title, and body text to extract company name, job title, and tech stack — feeds it all into the AI for hyper-relevant answers. |
| 📊 **Smart Token Management** | Dynamically calculates token budget based on field complexity — short factual forms use minimal tokens, long subjective forms get full AI power. |
| ✅ **Visual Review Mode** | Every filled field glows green. Skipped fields are marked. Premium-locked fields show a clear badge. Review everything before submitting. |
| 🔒 **Privacy-First** | All profile data stays in your browser's local storage. Your Groq API key is yours — we never see it. |

---

## 🔁 How It Works Under the Hood

```
┌──────────────────┐     ┌──────────────────────────────┐     ┌──────────────────┐
│   Your Profile   │────▶│       FormFill AI Agent       │────▶│  Filled Form ✅  │
│   + Resume       │     │                              │     │  Ready to Submit │
└──────────────────┘     │  1. Deep DOM field detection  │     └──────────────────┘
                         │  2. Vision AI fallback        │
                         │  3. Local regex fill (fast)   │
                         │  4. AI generation (subjective)│
                         │  5. Negativity filter         │
                         └──────────────────────────────┘
```

**Step-by-step:**

1. **Page Detection** — The extension detects you're on a job application page and surfaces the Auto-Fill panel.
2. **Field Discovery (DOM)** — Walks the entire page DOM to find inputs, textareas, selects, radio groups, checkbox groups, and custom ARIA widgets. Extracts labels, placeholders, surrounding text, group labels, and available options.
3. **Vision Fallback** — For fields with weak or missing DOM labels (common on Workday, iCIMS), the agent screenshots the form, annotates fields with numbered markers, and sends them to a vision AI model that reads the *visual* layout to identify each question.
4. **Page Context Extraction** — Extracts company name from the URL, job title from the page heading, and tech keywords from the job description. All of this is fed to the AI so answers are tailored to *this specific role*.
5. **Local Fast Fill** — Factual fields (name, email, phone, city, LinkedIn, GitHub) are matched and filled instantly from your profile using regex patterns — no API call needed.
6. **AI Generation** — Remaining subjective fields (cover letter, "Why us?", strengths, projects, etc.) go to the LLM along with your full profile, resume, and page context. The AI writes confident, first-person, interview-optimized answers.
7. **Negativity Guard** — A post-generation filter scans every AI response and blocks anything with self-deprecating language, admissions of weakness, or negative phrasing. Nothing gets through that could hurt your chances.
8. **Visual Review** — All filled fields glow green. You review, tweak if needed, and submit.

---

## 🛠️ How to Install (5 Minutes, No Coding Required)

### Step 1 — Download the Extension

Download or clone this repository to your computer.

```
git clone https://github.com/DaSeeker67/formFillNinjatechnique.git
```

Or just click **Code → Download ZIP** and extract the folder.

### Step 2 — Load It in Chrome

1. Open Chrome and type `chrome://extensions/` in the address bar.
2. Turn on **Developer Mode** (toggle in the top-right corner).
3. Click the **"Load unpacked"** button.
4. Select the `formfill-extension` folder you just downloaded.
5. Done! You'll see the ✦ FormFill AI icon in your Chrome toolbar.

> 💡 **Tip:** Pin the extension to your toolbar for quick access — click the puzzle icon 🧩 in Chrome → find FormFill AI → click the pin 📌.

### Step 3 — Set Up Your Profile (One-Time)

1. Click the **FormFill AI icon** in your toolbar to open the popup.
2. Go to the **⚙️ Settings** tab → Paste your **Groq API key**.
   - Don't have one? Get a free key at [console.groq.com/keys](https://console.groq.com/keys)
3. Fill in your **Personal**, **Career**, and **Resume** tabs with your details.
4. Hit **Save**. You're all set!

### Step 4 — Start Filling Applications

1. Navigate to **any job application page** (Greenhouse, Lever, Workday, Google Forms, etc.).
2. A floating **"✦ Auto-Fill"** panel appears on the right side of the page.
3. Hit **⚡ Start Auto-Fill** and watch every field get filled in seconds.
4. **Review** the green-highlighted fields, make any tweaks, and **submit**!

---

## 💎 Free vs Premium

| | Free | Premium |
|---|---|---|
| **Factual Auto-Fill** (name, email, phone, etc.) | ✅ Unlimited | ✅ Unlimited |
| **AI Form Fills** | 5 per day | ♾️ Unlimited |
| **AI-Written Subjective Answers** (cover letters, "why us?", etc.) | ❌ | ✅ Full AI power |
| **Vision AI Fallback** | ✅ | ✅ |
| **All ATS Platforms** | ✅ | ✅ |

> [Upgrade to Premium →](https://form-fill-ai-ninja.vercel.app/)

---

## 🤔 FAQ

**Is this free?**  
Yes — the extension is free with 5 AI fills per day. You just need a Groq API key (free tier available at [console.groq.com](https://console.groq.com)). Premium unlocks unlimited fills and full AI-written answers for subjective questions.

**How is this different from Chrome autofill?**  
Chrome autofill only handles basic fields like name and address. FormFill AI writes intelligent, tailored answers for open-ended questions (cover letters, "why this company?", project descriptions), handles dynamic forms, and uses vision AI to detect fields that other tools miss entirely.

**Is my data safe?**  
Yes. All your profile data and resume are stored locally in your browser. Your Groq API key stays in your browser — we never see it or store it.

**Does it work on every job site?**  
It works on all major ATS platforms including Greenhouse, Lever, Workday, Ashby, SmartRecruiters, BambooHR, iCIMS, Taleo, Rippling, Google Forms, and any standard web form. The vision AI fallback ensures it handles even custom or poorly-built portals.

**What about dynamically-loaded forms?**  
That's where FormFill AI shines. The DOM analysis engine handles forms that render fields after page load, inside iframes, or via JavaScript — and the vision fallback catches anything the DOM layer misses.

**Should I review before submitting?**  
**Always.** The AI does a great job, but you should review every answer before submitting to make sure it matches your voice and is accurate.

---

## ⭐ Star This Repo

If this extension saves you even one hour of form filling, give it a ⭐ on GitHub. Every star helps other job seekers discover it.

---

<p align="center">
  <b>Stop filling forms manually. Let AI fight the ATS for you.</b><br/>
  <i>Built for job seekers who refuse to be filtered out by machines.</i>
</p>
