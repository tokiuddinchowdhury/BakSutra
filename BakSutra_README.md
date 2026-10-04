# 🎙️ BakSutra — Voice Typing & Live Translation

> **কথা থেকে লেখা, আরও সুন্দরভাবে।**  
> **Turn your voice into polished text — with Bengali & English support.**

[![Made with HTML](https://img.shields.io/badge/HTML5-vanilla-orange?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Styled with CSS](https://img.shields.io/badge/CSS3-custom-blue?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-yellow?logo=javascript&logoColor=111)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8?logo=pwa&logoColor=white)](https://web.dev/explore/progressive-web-apps)
[![Free & Open](https://img.shields.io/badge/API%20cost-$0-success)](#-100-free-no-paid-backend)
[![Service Worker](https://img.shields.io/badge/Offline--first-service%20worker-0f172a?logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## 🇧🇩 বাংলা পরিচিতি

**BakSutra** একটি lightweight, mobile-friendly **Voice Typing + Live Translation web app**। এটি **HTML, CSS, Vanilla JavaScript এবং Service Worker** দিয়ে তৈরি করা হয়েছে — কোনো paid API বা database backend ছাড়াই।

আপনি মাইক্রোফোনে বাংলা বা English-এ কথা বললে BakSutra সেটিকে text-এ রূপান্তর করতে পারে। Translation mode-এ লেখা Google Translate-এর free `client=gtx` endpoint ব্যবহার করে translate করা হয়।

### ✨ প্রধান বৈশিষ্ট্য

- 🎤 **Voice Typing** — বাংলা ও English speech-to-text
- 🌐 **Live Translation** — voice/text workflow-এর জন্য translation mode
- ⏱️ **1.5s Debounce** — দ্রুত API request না পাঠিয়ে user pause করার পর translation request পাঠায়
- ↩️ **Undo** — ভুল করে Clear করলে সর্বশেষ text ফিরিয়ে আনা যায়
- 📤 **Native Share** — supported mobile browsers-এ WhatsApp, Messenger, Email ইত্যাদিতে share করা যায়
- 📄 **Word Export** — `.docx` export support
- 🧾 **PDF Export** — `html2pdf.js` দিয়ে PDF তৈরি করা যায়
- 🔊 **Text-to-Speech** — transcript পড়ে শোনানো
- 📋 **Copy & Save** — clipboard copy এবং text file save
- 🪄 **AI Polish Prompt** — AI-assisted writing workflow খোলার shortcut
- 🌙 **Dark / Light Theme** — modern premium UI
- 📱 **Mobile-first responsive design**
- 💾 **Local autosave** — browser storage-এ কাজের text সংরক্ষণ
- 📴 **Offline shell caching** — app UI এবং external assets-এর cached version ব্যবহার করে offline launch সম্ভব
- ⚡ **Performance optimized ambient effects** — heavy blur বাদ দিয়ে lightweight radial gradients
- 🧩 **PWA-ready** — manifest + service worker সহ installable web-app structure

> **নোট:** App shell/assets offline-এ চলতে পারে, কিন্তু **live translation-এর জন্য internet connection প্রয়োজন**, কারণ translation request network-এর মাধ্যমে যায়।

---

## 🇬🇧 English Overview

**BakSutra** is a lightweight, mobile-first **voice typing and live translation web app** built with **HTML, CSS, Vanilla JavaScript, and a Service Worker**.

It focuses on a fast, clean voice-to-text workflow for **Bengali and English** users while keeping the project **100% free to run** with no paid API subscription or database requirement.

### ✨ Key Features

- 🎤 **Voice Typing** — Bengali and English speech recognition
- 🌐 **Live Translation Mode** — translate text through the free Google Translate `client=gtx` endpoint
- ⏱️ **1.5-second Translation Debounce** — reduces unnecessary translation requests and helps avoid rate-limit pressure
- ↩️ **Undo Last Clear** — recover the previous transcript after an accidental clear
- 📤 **Native Web Share** — share text through supported device/browser share targets
- 📄 **Microsoft Word Export** — `.docx`
- 🧾 **PDF Export** — powered by `html2pdf.js`
- 🔊 **Text-to-Speech** — listen to the transcript
- 📋 **Copy / Save** — clipboard and text-file actions
- 🪄 **AI Polish shortcut** — quick prompt workflow for polishing text
- 🌙 **Dark & Light themes**
- 📱 **Responsive mobile-first UI**
- 💾 **Local autosave** using browser storage
- 📴 **Offline asset caching** with stale-while-revalidate for selected CDN assets
- ⚡ **Low-lag visual effects** using CSS gradients instead of expensive large blur filters
- 🧩 **PWA-ready architecture** with `manifest.json` and `service-worker.js`

> **Offline limitation:** the cached app shell can open without internet, but **live translation remains network-dependent** because the translation endpoint is intentionally kept network-only.

---

## 🖼️ Interface Preview

Add your screenshots here after uploading them to the repository:

```md
![BakSutra Desktop Preview](assets/desktop-preview.png)
![BakSutra Mobile Preview](assets/mobile-preview.png)
```

### Suggested screenshots

| Preview | What to show |
|---|---|
| 🖥️ Desktop | Main voice typing workspace |
| 📱 Mobile | Action dock and responsive layout |
| 🌐 Translation | Live translation mode |
| 📄 Export | Word/PDF export actions |

---

## 🧱 Tech Stack

| Technology | Purpose |
|---|---|
| **HTML5** | App structure and semantic UI |
| **CSS3** | Responsive layout, themes, animations, visual effects |
| **Vanilla JavaScript** | Speech, translation, storage, exports, UI state |
| **Web Speech API** | Speech recognition and text-to-speech |
| **Service Worker** | App-shell caching and offline asset strategy |
| **Web Share API** | Native device sharing |
| **Google Translate `client=gtx`** | Free translation endpoint used by the app |
| **docx** | Word document generation |
| **html2pdf.js** | PDF export |
| **Font Awesome** | UI icons |
| **Google Fonts** | Bengali/English typography |

---

## 💰 100% Free — No Paid Backend

BakSutra is designed to be deployable as a **static website**.

### ✅ No database required

There is no Firebase, Supabase, MongoDB, MySQL, or custom server database in the core app.

### ✅ No paid API subscription required

The translation workflow uses the Google Translate endpoint configured with `client=gtx` rather than a paid Google Cloud Translation API account.

### ✅ Free hosting friendly

Because the project is static, it can be hosted on platforms such as:

- **GitHub Pages**
- **Cloudflare Pages**
- **Netlify**
- **Vercel static hosting**
- Any standard static web server

> **Important:** free endpoints and browser APIs can change, impose rate limits, or vary by browser/vendor. The 1.5-second debounce reduces request pressure but cannot guarantee unlimited API access.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/BakSutra.git
cd BakSutra
```

### 2. Run locally

Because service workers and some browser APIs behave better on an HTTP origin, use a local static server instead of opening `index.html` directly.

#### Option A — VS Code Live Server

Install the **Live Server** extension, then open `index.html` through the local server.

#### Option B — Python

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

### 3. Use a supported browser

For the best voice typing experience, use:

- **Google Chrome**
- **Microsoft Edge**

Safari and Firefox receive a compatibility notice because `SpeechRecognition` support can be limited or inconsistent.

---

## 📁 Project Structure

```text
BakSutra/
├── index.html           # Main application UI
├── style.css            # Theme, layout and responsive styles
├── script.js            # Voice, translation and app logic
├── service-worker.js    # Cache + offline strategy
├── manifest.json        # PWA metadata
├── new-logo.png         # Primary logo / favicon
├── icon-192.png         # PWA icon
├── icon-512.png         # PWA icon
└── README.md            # Project documentation
```

---

## 🎙️ Voice Typing Flow

```text
User speaks
    ↓
Web Speech API
    ↓
Interim preview
    ↓
Final transcript
    ↓
Editor + local autosave
```

### Translation Flow

```text
User speaks / edits text
    ↓
1.5 second debounce
    ↓
Google Translate gtx endpoint
    ↓
Translated result
    ↓
Updated UI
```

This debounce is intentionally used to avoid sending a translation request for every tiny recognition update.

---

## 📴 Offline Strategy

BakSutra's service worker follows a hybrid caching approach:

1. **App shell** is cached locally.
2. **Google Fonts, Font Awesome, DOCX CDN, and html2pdf.js** use a **stale-while-revalidate** strategy.
3. Cached resources can be served quickly while newer copies are refreshed in the background.
4. Translation requests are kept **network-only** so cached translation responses do not become stale.

### Why this approach?

**Fast local UI + fresh CDN libraries + live translation when internet is available.**

---

## 📤 Native Share

BakSutra uses the browser's native Web Share API when available:

```js
navigator.share({
  title: 'BakSutra Transcript',
  text: transcript
});
```

On unsupported desktop browsers, the app shows a helpful fallback message rather than silently failing.

---

## 🧾 PDF Export

PDF export is implemented using `html2pdf.js` loaded from a free CDN.

The library is lazy-loaded when the PDF action is used, keeping the initial page lighter than loading every export dependency immediately.

---

## 🔐 Privacy & Data Notes

- **No account is required** for the core UI.
- Transcript autosave is handled locally in the browser.
- BakSutra does not require a custom database for normal operation.
- Translation requests are sent to the configured Google Translate endpoint when translation is used.
- Speech recognition behavior depends on the browser's Web Speech implementation.

> Before production use, review the privacy and acceptable-use terms of every third-party service/end-point you keep enabled.

---

## 🛠️ Customization

### Change the logo

Replace:

```text
new-logo.png
```

with your own PNG while keeping the same filename, or update the references in `index.html` and `manifest.json`.

### Change the app name

Update the `BakSutra` title, metadata, manifest name, and visible brand text in `index.html`.

### Change theme colors

Most UI colors are controlled through CSS custom properties near the top of `style.css`.

---

## ✅ Feature Checklist

- [x] Bengali voice typing
- [x] English voice typing
- [x] Live translation mode
- [x] Translation debounce
- [x] Text-to-speech
- [x] Copy to clipboard
- [x] Save as text
- [x] Word export
- [x] PDF export
- [x] Native Share
- [x] Undo last clear
- [x] Dark / Light mode
- [x] Local autosave
- [x] Responsive mobile UI
- [x] PWA manifest
- [x] Service worker caching
- [x] External asset stale-while-revalidate
- [x] Lightweight ambient background effects
- [x] Browser compatibility warning

---

## 🤝 Contributing

Contributions, bug reports, UI ideas, and performance improvements are welcome.

### Recommended workflow

```bash
git checkout -b feature/your-feature
git add .
git commit -m "feat: improve BakSutra"
git push origin feature/your-feature
```

Then open a **Pull Request** with:

- What changed
- Why it changed
- Screenshots for UI changes
- Browser/device tested
- Any known limitations

---

## 🐛 Known Platform Limitations

| Area | Limitation |
|---|---|
| Speech Recognition | Browser support varies; Chrome/Edge are recommended |
| Translation | Requires an active network connection |
| Web Share | Mainly useful on supported mobile/modern browsers |
| Offline mode | Cached UI/assets work offline, but live translation does not |
| Free translation endpoint | May be rate-limited or changed by the provider |
| Service Worker | Requires a secure context such as HTTPS or a local development server |

---

## 🌟 Why BakSutra?

> **BakSutra is built around a simple idea: speaking should be easier than typing.**

বাংলা ভাষাভাষী ব্যবহারকারীদের জন্য একটি clean, fast, installable এবং practical voice workspace তৈরি করাই এর মূল লক্ষ্য।

**Speak → Transcribe → Translate → Edit → Share → Export**

---

## 👨‍💻 Developer

**Designed & Developed with ❤️ by Omar Mohammad Chowdhury**  
📍 Chattogram, Bangladesh

---

## ⭐ Support the Project

যদি **BakSutra** আপনার কাজে লাগে, তাহলে GitHub repository-তে একটি **⭐ Star** দিতে পারেন।

If BakSutra helps you, consider giving the repository a **⭐ Star** — it helps the project get discovered and motivates future improvements.

---

## 📜 License

This repository currently does not include a dedicated `LICENSE` file. Add the license that matches how you want others to use, modify, and redistribute the project.

---

<div align="center">

**BakSutra — কথা থেকে লেখা, আরও সুন্দরভাবে 🎙️**

Made with ❤️ using **HTML + CSS + Vanilla JavaScript**

</div>
