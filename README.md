# FormFill AI – Chrome Extension

Auto-fill job application forms using your resume and profile, powered by Claude AI.

## Features

- 🤖 **AI-powered filling** – Claude reads your resume + profile to fill open-ended fields
- 📄 **Resume ingestion** – Upload your PDF resume for smarter field matching  
- 👤 **Full profile editor** – Store all your job application details locally
- ⚡ **Auto-detection** – Floating button appears on job application pages automatically
- 🎯 **Works everywhere** – Google Forms, Greenhouse, Lever, Workday, Ashby, and more
- 🔒 **Private by default** – All data stored locally in your browser

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select this `formfill-extension` folder
5. The ✦ extension icon will appear in your toolbar

## Setup

1. Click the extension icon to open the popup
2. **Settings tab** → Enter your groq API key (`sk-ant-api03-…`)
   - Get one at https://console.anthropic.com
3. **Profile tab** → Fill in your personal and professional info
4. **Resume tab** → Upload your PDF resume
5. Click **Save Profile**

## Usage

1. Navigate to any job application page
2. The "✦ Auto-Fill Form" button will appear at the bottom-right
3. Click it to open the side panel
4. Click ⚡ Start Auto-Fill
5. Watch as fields are filled automatically!

## How It Works

- **Direct mapping** – Common fields (name, email, phone, etc.) are filled instantly from your profile
- **AI fallback** – Open-ended questions (cover letter, "why us?", salary) are answered by Claude
- **Highlight mode** – Filled fields are outlined in green so you can review them
- **Always review** – Check filled fields before submitting!
