# FormFill AI – Your AI Job Application Agent 🚀

> **They use AI to reject you. Now you use AI to fight back.**

---

## 😤 The Problem

Let's be real — **the modern job application process is broken**.

Companies now use **AI-powered Applicant Tracking Systems (ATS)** to automatically screen, filter, and reject resumes before a human ever sees them. Here's what you're up against:

- **75%+ of resumes are rejected by ATS** before reaching a recruiter's inbox.
- You spend **30–45 minutes** filling out the same repetitive forms — name, email, experience, "Why do you want to work here?" — over and over again.
- Each job posting gets **250+ applicants** on average. You're competing against a wall of automation.
- Even qualified candidates get ghosted because a keyword was missing or a field was left blank.

You're not losing because you're not good enough.  
**You're losing because the system was never designed to be fair.**

---

## 💡 The Solution — Fight AI with AI

If companies are going to use AI to auto-reject you, **why not use an AI agent to auto-apply for you?**

**FormFill AI** is a Chrome extension that acts as your personal job application agent. It reads your resume, understands your profile, and **intelligently fills out every field** on any job application form — including the tricky open-ended questions like *"Why do you want to work here?"* or *"Tell us about yourself."*

> One-time setup. Infinite applications. **Massively increase your odds.**

Instead of spending 40 minutes per application, you spend **10 seconds**. Click one button, review the answers, and submit. That's it.

---

## ⚡ What It Can Do

| Capability | Description |
|---|---|
| 🤖 **AI-Powered Smart Fill** | Uses LLM intelligence (Groq / LLaMA 3.3 70B) to craft personalized answers for every open-ended question — cover letters, "Why us?", salary expectations, and more. |
| 📄 **Resume Parsing** | Upload your PDF resume once. The AI extracts and uses your skills, experience, and achievements to tailor every response. |
| 👤 **Full Profile Storage** | Store all your details — personal info, work history, education, skills, links — locally in your browser. Fill once, reuse forever. |
| 🎯 **Auto-Detection** | The extension automatically detects when you're on a job application page and shows a floating "Auto-Fill" button. No manual activation needed. |
| 🧠 **Context-Aware Answers** | The AI reads the actual job page — company name, role title, job description — and writes answers specifically tailored to *that* application. |
| 📝 **Handles All Field Types** | Text inputs, textareas, dropdowns, radio buttons, checkboxes — it fills them all. |
| 🌐 **Works on All Major Platforms** | Greenhouse, Lever, Workday, Ashby, SmartRecruiters, BambooHR, Jobvite, iCIMS, Taleo, Rippling, Google Forms, and more. |
| ✅ **Visual Review** | Every filled field is highlighted in green so you can quickly review before submitting. |
| 🔒 **100% Private** | All your data stays in your browser's local storage. Nothing is sent anywhere except the AI API call to generate answers. |

---

## 🛠️ How to Install (5 Minutes, No Coding Required)

### Step 1 — Download the Extension

Download or clone this repository to your computer.

```
git clone https://github.com/your-username/formfill-extension.git
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
   - Don't have one? Get a free key at [console.groq.com](https://console.groq.com)
3. Go to the **👤 Profile** tab → Fill in your personal info, work experience, education, skills, and links.
4. Go to the **📄 Resume** tab → Upload your PDF resume.
5. Hit **Save Profile**. You're all set!

### Step 4 — Start Filling Applications

1. Navigate to **any job application page** (Greenhouse, Lever, Workday, Google Forms, etc.).
2. A floating **"✦ Auto-Fill Form"** button appears at the bottom-right of the page.
3. Click it to open the side panel.
4. Hit **⚡ Start Auto-Fill** and watch the magic happen.
5. **Review** the green-highlighted fields, make any tweaks, and **submit**!

---

## 🔁 How It Works Under the Hood

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Your Profile   │────▶│  FormFill Agent  │────▶│  Filled Form ✅  │
│   + Resume PDF   │     │  (AI + Mapping)  │     │  Ready to Submit │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
              Direct Mapping        AI Generation
              (name, email,       (cover letter,
               phone, links)      "why us?", etc.)
```

1. **Direct Mapping** — Standard fields like name, email, phone, LinkedIn are filled instantly from your saved profile.
2. **AI Generation** — Open-ended and subjective questions are sent to the LLM along with your resume, profile, and the job page context. The AI writes confident, tailored, first-person responses.
3. **Smart Reframing** — The AI never says *"I don't have experience with X."* Instead, it bridges transferable skills and positions you as the best-fit candidate.
4. **Visual Feedback** — All filled fields glow green so you can review everything before hitting submit.

---

## 🤔 FAQ

**Is this free?**  
The extension is completely free. You just need a Groq API key (free tier available at [console.groq.com](https://console.groq.com)).

**Is my data safe?**  
Yes. All your profile data and resume are stored locally in your browser. The only external call is to the Groq API to generate AI answers — nothing else is shared.

**Does it work on every job site?**  
It works on all major applicant tracking systems including Greenhouse, Lever, Workday, Ashby, SmartRecruiters, BambooHR, iCIMS, Taleo, Rippling, Google Forms, and any standard web form.

**Should I review before submitting?**  
**Always.** The AI does a great job, but you should review every answer before submitting to make sure it matches your voice and is accurate.

---

## ⭐ Star This Repo

If this extension saves you time and helps you land more interviews, give it a ⭐ on GitHub. Let's level the playing field together.

---

<p align="center">
  <b>Stop filling forms manually. Let AI work for you.</b><br/>
  <i>Built for job seekers who refuse to be filtered out by machines.</i>
</p>
