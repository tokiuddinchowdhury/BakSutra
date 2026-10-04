(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);

    const themeToggleBtn = $('theme-toggle');
    const themeIcon = $('theme-icon');
    const recordBtn = $('record-btn');
    const recordIcon = $('record-icon');
    const pulseRing = $('pulse-ring');
    const voiceMeter = $('voice-meter');
    const recordHint = $('record-hint');
    const recordSubhint = $('record-subhint');
    const statusBadge = $('status-badge');
    const statusText = $('status-text');
    const editor = $('editor');
    const interimText = $('interim-text');
    const langSelector = $('lang-selector');
    const langPill = $('lang-pill');
    const modePill = $('mode-pill');
    const editorSubtitle = $('editor-subtitle');
    const autosaveIndicator = $('autosave-indicator');
    const wordCount = $('word-count');
    const charCount = $('char-count');
    const lineCount = $('line-count');
    const btnCopy = $('btn-copy');
    const btnTts = $('btn-tts');
    const btnDownload = $('btn-download');
    const btnDocx = $('btn-docx');
    const btnPdf = $('btn-pdf');
    const btnUndo = $('btn-undo');
    const btnShare = $('btn-share');
    const btnAiCheck = $('btn-ai-check');
    const btnClear = $('btn-clear');
    const btnInfo = $('btn-info');
    const infoModal = $('info-modal');
    const modalClose = $('modal-close');
    const modalOk = $('modal-ok');
    const toast = $('toast');
    const toastMessage = $('toast-message');
    const toastIcon = $('toast-icon');
    const btnModeTyping = $('btn-mode-typing');
    const btnModeTranslation = $('btn-mode-translation');

    const STORAGE = { theme: 'baksutra:theme', text: 'baksutra:transcript', lang: 'baksutra:lang', mode: 'baksutra:mode' };
    const DEFAULT_LANG = 'bn-BD';
    // Keep the microphone alive through normal pauses and breathing.
    // Auto-stop only after a long period of true inactivity.
    const SILENCE_MS = 120000;
    const TRANSLATION_TIMEOUT_MS = 9000;
    const TRANSLATION_DEBOUNCE_MS = 1500;
    const DOCX_URL = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';
    const HTML2PDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js';

    let isRecording = false;
    let isStarting = false;
    let shouldRestart = false;
    let recognition = null;
    let currentMode = localStorage.getItem(STORAGE.mode) === 'translation' ? 'translation' : 'typing';
    let selectedLanguage = localStorage.getItem(STORAGE.lang) || DEFAULT_LANG;
    let silenceTimer = null;
    let toastTimer = null;
    let autosaveTimer = null;
    let lastClearedText = '';
    let activeTranslationChain = Promise.resolve();
    let recognitionSession = 0;
    let voices = [];
    let lastModalFocus = null;
    let docxPromise = null;
    let html2pdfPromise = null;
    let translationDebounceTimer = null;
    let pendingTranslationText = '';
    let pendingTranslationSession = 0;
    let processedFinalResults = new Map();
    let lastFinalFingerprint = '';
    let lastFinalAt = 0;
    const FINAL_DEDUP_WINDOW_MS = 3200;
    const RECENT_FINAL_LIMIT = 24;
    const recentFinals = [];
    let onlineState = navigator.onLine;
    let offlineToastShown = false;

    function setStatus(state, text) {
      if (!statusBadge || !statusText) return;
      statusBadge.dataset.state = state;
      statusText.textContent = text;
    }

    function refreshNetworkState() {
      onlineState = navigator.onLine;
      if (!onlineState) {
        if (!isRecording) setStatus('error', 'Offline');
        if (!offlineToastShown) {
          showToast('You are offline. Saved text remains available; live speech/translation need a connection.', 'info');
          offlineToastShown = true;
        }
      } else {
        offlineToastShown = false;
        if (!isRecording) setStatus('idle', 'Ready');
      }
    }

    function setRecordingUI(active) {
      document.body.classList.toggle('is-recording', active);
      if (recordBtn) {
        recordBtn.classList.toggle('is-active', active);
        recordBtn.setAttribute('aria-pressed', String(active));
        recordBtn.setAttribute('aria-label', active ? 'Stop voice recording' : 'Start voice recording');
      }
      if (recordIcon) recordIcon.className = active ? 'fa-solid fa-stop' : 'fa-solid fa-microphone';
      if (pulseRing) pulseRing.classList.toggle('is-active', active);
      if (voiceMeter) voiceMeter.classList.toggle('is-active', active);
      if (recordHint) recordHint.textContent = active ? 'Listening…' : 'Tap to speak';
      if (recordSubhint) recordSubhint.textContent = active ? 'Pause naturally — stays on through normal pauses' : 'Auto-stops only after 2 minutes of silence';
    }

    function finishRecordingUi(reason = 'Ready') {
      isRecording = false;
      isStarting = false;
      shouldRestart = false;
      clearTimeout(silenceTimer);
      setRecordingUI(false);
      setStatus('idle', reason);
      if (interimText) interimText.textContent = 'আপনার কথা বলা শুরু হলে এখানে লাইভ প্রিভিউ দেখা যাবে…';
    }

    function showToast(message, kind = 'success') {
      if (!toast || !toastMessage) return;
      clearTimeout(toastTimer);
      toastMessage.textContent = message;
      if (toastIcon) {
        toastIcon.className = kind === 'error' ? 'fa-solid fa-circle-exclamation' : kind === 'info' ? 'fa-solid fa-circle-info' : 'fa-solid fa-circle-check';
      }
      toast.dataset.kind = kind;
      toast.classList.add('show');
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function warnUnsupportedVoiceBrowser() {
      const ua = navigator.userAgent || '';
      const isFirefox = /Firefox|FxiOS/i.test(ua);
      const isSafari = /Safari/i.test(ua) && !/(Chrome|Chromium|CriOS|Edg|OPR|Android)/i.test(ua);
      if (isFirefox || isSafari) {
        window.setTimeout(() => {
          showToast('For the best voice typing experience, please use Google Chrome or Microsoft Edge.', 'info');
        }, 900);
      }
    }

    warnUnsupportedVoiceBrowser();

    function applyTheme(theme, persist = true) {
      const isDark = theme === 'dark';
      document.body.classList.toggle('dark-theme', isDark);
      document.body.classList.toggle('light-theme', !isDark);
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      if (themeIcon) themeIcon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      if (themeToggleBtn) themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', isDark ? '#0b1020' : '#f6f8fc');
      if (persist) localStorage.setItem(STORAGE.theme, isDark ? 'dark' : 'light');
    }

    applyTheme(localStorage.getItem(STORAGE.theme) === 'light' ? 'light' : 'dark', false);

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => {
      const next = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
      applyTheme(next);
      showToast(next === 'dark' ? 'Dark theme enabled' : 'Light theme enabled');
    });

    function updateMetrics() {
      if (!editor) return;
      const text = editor.value;
      const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
      if (wordCount) wordCount.textContent = String(words);
      if (charCount) charCount.textContent = String(text.length);
      if (lineCount) lineCount.textContent = text ? String(text.split('\n').length) : '0';
    }

    function saveText(immediate = false) {
      if (!editor) return;
      clearTimeout(autosaveTimer);
      const run = () => {
        localStorage.setItem(STORAGE.text, editor.value);
        if (autosaveIndicator) {
          autosaveIndicator.innerHTML = '<i class="fa-solid fa-check-circle" aria-hidden="true"></i><span>Saved locally</span>';
          autosaveIndicator.dataset.state = 'saved';
        }
      };
      if (immediate) run();
      else {
        if (autosaveIndicator) {
          autosaveIndicator.innerHTML = '<i class="fa-solid fa-rotate" aria-hidden="true"></i><span>Saving…</span>';
          autosaveIndicator.dataset.state = 'saving';
        }
        autosaveTimer = setTimeout(run, 450);
      }
    }

    function updateUndoAvailability() {
      if (btnUndo) btnUndo.disabled = !lastClearedText;
    }

    const savedText = localStorage.getItem(STORAGE.text);
    if (editor && savedText) editor.value = savedText;
    if (langSelector) langSelector.value = [...langSelector.options].some(o => o.value === selectedLanguage) ? selectedLanguage : DEFAULT_LANG;
    if (langPill) langPill.textContent = langSelector?.selectedOptions?.[0]?.text.split('—')[0].trim() || 'বাংলা';
    updateMetrics();
    updateUndoAvailability();
    saveText(true);

    function normalizeBanglaCommands(text) {
      return text
        .replace(/(?:^|\s)(দাঁড়ি|দাড়ি|ফুলস্টপ)(?=\s|$)/gu, '।')
        .replace(/(?:^|\s)(কমা)(?=\s|$)/gu, ',')
        .replace(/(?:^|\s)(প্রশ্নবোধক(?:\s+চিহ্ন)?)(?=\s|$)/gu, '?')
        .replace(/(?:^|\s)(বিস্ময়বোধক(?:\s+চিহ্ন)?)(?=\s|$)/gu, '!')
        .replace(/(?:^|\s)(কোলোন)(?=\s|$)/gu, ':')
        .replace(/(?:^|\s)(সেমিকোলোন)(?=\s|$)/gu, ';')
        .replace(/(?:^|\s)(নতুন\s+(?:লাইন|অনুচ্ছেদ))(?=\s|$)/gu, '\n')
        .replace(/[ \t]+([,;:!?।])/gu, '$1')
        .replace(/\n[ \t]+/gu, '\n')
        .trim();
    }

    function normalizeEnglishCommands(text) {
      return text
        .replace(/(?:^|\s)(period|full stop)(?=\s|$)/gi, '.')
        .replace(/(?:^|\s)(comma)(?=\s|$)/gi, ',')
        .replace(/(?:^|\s)(question mark)(?=\s|$)/gi, '?')
        .replace(/(?:^|\s)(exclamation mark)(?=\s|$)/gi, '!')
        .replace(/(?:^|\s)(colon)(?=\s|$)/gi, ':')
        .replace(/(?:^|\s)(semicolon)(?=\s|$)/gi, ';')
        .replace(/(?:^|\s)(new line|new paragraph)(?=\s|$)/gi, '\n')
        .replace(/[ \t]+([,;:!?\.])/g, '$1')
        .replace(/\n[ \t]+/g, '\n')
        .trim();
    }

    function parseVoiceCommands(text, lang) {
      return lang.toLowerCase().startsWith('bn') ? normalizeBanglaCommands(text) : normalizeEnglishCommands(text);
    }

    function loadVoices() {
      voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    }
    window.addEventListener('offline', refreshNetworkState);
    window.addEventListener('online', refreshNetworkState);
    refreshNetworkState();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(() => {
          // PWA enhancement is optional; the core app continues to work without it.
        });
      });
    }

    loadVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);

    function getMatchingVoice(lang) {
      const base = lang.split('-')[0].toLowerCase();
      const exact = voices.find(v => v.lang?.toLowerCase() === lang.toLowerCase());
      if (exact) return exact;
      return voices.find(v => v.lang?.toLowerCase().startsWith(base));
    }

    function ensureRecognition() {
      if (recognition || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) return recognition;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isStarting = false;
        if (!isRecording) return;
        setRecordingUI(true);
        setStatus('recording', 'Listening');
      };

      recognition.onresult = (event) => {
        if (!isRecording) return;

        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => stopRecording('Auto-stopped'), SILENCE_MS);

        let interim = '';
        const finalChunks = [];
        const now = Date.now();

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result?.[0]?.transcript || '';

          if (result?.isFinal) {
            const normalized = transcript.trim().replace(/\s+/gu, ' ');
            if (!normalized) continue;
            const fingerprint = normalized.toLocaleLowerCase();
            const resultKey = `${i}::${fingerprint}`;
            if (processedFinalResults.has(resultKey)) continue;
            processedFinalResults.set(resultKey, now);

            const duplicateRecent = recentFinals.some((item) => {
              if (now - item.at > FINAL_DEDUP_WINDOW_MS) return false;
              return item.fingerprint === fingerprint ||
                item.fingerprint.endsWith(` ${fingerprint}`) ||
                fingerprint.endsWith(` ${item.fingerprint}`);
            });
            if (duplicateRecent) continue;

            recentFinals.push({ fingerprint, at: now });
            while (recentFinals.length > RECENT_FINAL_LIMIT) recentFinals.shift();
            finalChunks.push(normalized);
          } else if (transcript) {
            interim += transcript;
          }
        }

        if (interimText) {
          interimText.textContent = interim || 'Listening…';
        }

        if (!finalChunks.length) return;

        const finals = finalChunks.join(' ').trim();
        const fingerprint = finals.toLocaleLowerCase().replace(/\s+/gu, ' ');
        if (fingerprint && fingerprint === lastFinalFingerprint && now - lastFinalAt < FINAL_DEDUP_WINDOW_MS) return;
        lastFinalFingerprint = fingerprint;
        lastFinalAt = now;

        for (const [key, timestamp] of processedFinalResults) {
          if (now - timestamp > FINAL_DEDUP_WINDOW_MS * 2) processedFinalResults.delete(key);
        }

        const sessionAtResult = recognitionSession;
        const parsed = parseVoiceCommands(finals, selectedLanguage);
        if (!parsed.trim()) return;

        if (currentMode === 'translation') {
          queueTranslation(parsed, sessionAtResult);
          if (interimText) interimText.textContent = 'Waiting for a pause before translating…';
        } else {
          appendToEditor(parsed);
          if (interimText) interimText.textContent = 'Listening…';
        }
      };

      recognition.onerror = (event) => {
        const error = event?.error || 'unknown';
        if (error === 'no-speech') {
          if (isRecording) {
            setStatus('recording', 'Listening');
            if (interimText) interimText.textContent = 'No speech detected — still listening…';
          }
          return;
        }
        if (error === 'aborted') return;
        if (error === 'not-allowed' || error === 'service-not-allowed') {
          finishRecordingUi('Mic permission needed');
          showToast('Microphone permission is required.', 'error');
          return;
        }
        if (error === 'audio-capture') {
          finishRecordingUi('Mic unavailable');
          showToast('No microphone was available.', 'error');
          return;
        }
        if (error === 'network') {
          shouldRestart = false;
          finishRecordingUi('Network error');
          showToast('Internet connection dropped. Check your network and tap the microphone to retry.', 'error');
          if (interimText) interimText.textContent = 'Connection lost — tap the microphone to try again.';
          return;
        }
        finishRecordingUi('Speech error');
        showToast(`Speech error: ${error}`, 'error');
      };

      recognition.onend = () => {
        isStarting = false;
        if (!isRecording) {
          finishRecordingUi('Ready');
          return;
        }
        if (shouldRestart) {
          shouldRestart = false;
          window.setTimeout(() => {
            if (!isRecording || isStarting) return;
            try { isStarting = true; recognition.lang = selectedLanguage; recognition.start(); }
            catch (err) {
              isStarting = false;
              finishRecordingUi('Ready');
              showToast('Voice engine stopped. Tap the microphone to try again.', 'error');
            }
          }, 180);
        } else {
          finishRecordingUi('Ready');
        }
      };

      return recognition;
    }

    function appendToEditor(text) {
      if (!editor || !text) return;
      const value = editor.value;
      const needsSpace = value && !/[\s\n]$/u.test(value) && !/^[,.;:!?।]/u.test(text);
      editor.value += `${needsSpace ? ' ' : ''}${text}`;
      updateMetrics();
      saveText();
    }

    function queueTranslation(text, sessionAtResult = recognitionSession) {
      const cleanText = text?.trim();
      if (!cleanText || currentMode !== 'translation') return;
      pendingTranslationText = [pendingTranslationText, cleanText].filter(Boolean).join(' ').trim();
      pendingTranslationSession = sessionAtResult;
      clearTimeout(translationDebounceTimer);
      translationDebounceTimer = window.setTimeout(() => {
        translationDebounceTimer = null;
        flushPendingTranslation();
      }, TRANSLATION_DEBOUNCE_MS);
    }

    function flushPendingTranslation() {
      clearTimeout(translationDebounceTimer);
      translationDebounceTimer = null;
      const textToTranslate = pendingTranslationText.trim();
      const sessionAtResult = pendingTranslationSession;
      pendingTranslationText = '';
      pendingTranslationSession = 0;
      if (!textToTranslate || currentMode !== 'translation' || sessionAtResult !== recognitionSession) {
        return Promise.resolve();
      }

      const targetLang = selectedLanguage;
      const job = activeTranslationChain.then(async () => {
        if (currentMode !== 'translation' || sessionAtResult !== recognitionSession) return;
        const translated = await translateText(textToTranslate, targetLang);
        if (currentMode === 'translation' && sessionAtResult === recognitionSession) {
          appendToEditor(translated);
          if (interimText) interimText.textContent = isRecording ? 'Listening…' : 'Translation complete.';
        }
      }).catch((err) => {
        if (currentMode === 'translation' && sessionAtResult === recognitionSession) {
          showToast(err.message || 'Translation failed. Please try again.', 'error');
          if (interimText) interimText.textContent = 'Translation failed — please continue speaking.';
        }
      });
      activeTranslationChain = job.catch(() => undefined);
      return job;
    }

    async function translateText(text, sourceLang) {
      if (!text?.trim()) return '';
      const source = sourceLang.toLowerCase().startsWith('bn') ? 'bn' : 'en';
      const target = source === 'bn' ? 'en' : 'bn';
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);
      try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Translation service returned ${response.status}.`);
        const data = await response.json();
        const translated = Array.isArray(data?.[0]) ? data[0].map(item => item?.[0] || '').join('') : '';
        return translated || text;
      } catch (error) {
        if (error.name === 'AbortError') throw new Error('Translation timed out. Please check your connection.');
        throw new Error('Translation failed. Please try again.');
      } finally {
        clearTimeout(timeout);
      }
    }

    function startRecording() {
      const rec = ensureRecognition();
      if (!rec) {
        showToast('This browser does not support voice recognition. Try Chrome or Edge.', 'error');
        return;
      }
      if (isStarting || isRecording) return;
      selectedLanguage = langSelector?.value || DEFAULT_LANG;
      localStorage.setItem(STORAGE.lang, selectedLanguage);
      recognitionSession += 1;
      processedFinalResults.clear();
      lastFinalFingerprint = '';
      lastFinalAt = 0;
      recentFinals.length = 0;
      clearTimeout(translationDebounceTimer);
      translationDebounceTimer = null;
      pendingTranslationText = '';
      pendingTranslationSession = 0;
      activeTranslationChain = Promise.resolve();
      isRecording = true;
      shouldRestart = true;
      isStarting = true;
      clearTimeout(silenceTimer);
      setRecordingUI(true);
      setStatus('starting', 'Starting mic…');
      if (interimText) interimText.textContent = 'Microphone is connecting…';
      try {
        rec.lang = selectedLanguage;
        rec.start();
      } catch (error) {
        isStarting = false;
        isRecording = false;
        shouldRestart = false;
        finishRecordingUi('Ready');
        showToast('Voice engine is busy. Please tap again.', 'error');
      }
    }

    function stopRecording(reason = 'Ready') {
      clearTimeout(silenceTimer);
      shouldRestart = false;
      isRecording = false;
      recognitionSession += 1;
      // Keep the pending translation alive for its 1.5s debounce window even
      // when the user stops recording. A new recording session clears it.
      if (currentMode === 'translation' && pendingTranslationText.trim()) {
        pendingTranslationSession = recognitionSession;
      }
      setRecordingUI(false);
      setStatus('processing', 'Finishing…');
      try { recognition?.stop(); } catch (_) { /* already stopped */ }
      window.setTimeout(() => {
        if (!isRecording) setStatus('idle', reason);
        if (interimText) interimText.textContent = reason === 'Auto-stopped' ? 'Speech captured. Tap the microphone to continue.' : 'আপনার কথা বলা শুরু হলে এখানে লাইভ প্রিভিউ দেখা যাবে…';
      }, 220);
    }

    if (recordBtn) recordBtn.addEventListener('click', () => isRecording ? stopRecording('Ready') : startRecording());

    if (langSelector) langSelector.addEventListener('change', (event) => {
      selectedLanguage = event.target.value;
      localStorage.setItem(STORAGE.lang, selectedLanguage);
      if (langPill) langPill.textContent = event.target.selectedOptions[0]?.text.split('—')[0].trim() || 'বাংলা';
      if (isRecording) {
        stopRecording('Language changed');
        showToast('Language changed. Tap the microphone to start again.', 'info');
      }
    });

    function setMode(mode) {
      currentMode = mode === 'translation' ? 'translation' : 'typing';
      localStorage.setItem(STORAGE.mode, currentMode);
      const typing = currentMode === 'typing';
      btnModeTyping?.classList.toggle('is-active', typing);
      btnModeTranslation?.classList.toggle('is-active', !typing);
      btnModeTyping?.setAttribute('aria-pressed', String(typing));
      btnModeTranslation?.setAttribute('aria-pressed', String(!typing));
      if (modePill) modePill.textContent = typing ? 'Voice Typing' : 'Live Translation';
      if (editorSubtitle) editorSubtitle.textContent = typing ? 'Your polished voice workspace' : 'Live bilingual translation workspace';
      if (isRecording) stopRecording('Mode changed');
      showToast(typing ? 'Voice Typing enabled' : 'Live Translation enabled');
    }
    btnModeTyping?.addEventListener('click', () => setMode('typing'));
    btnModeTranslation?.addEventListener('click', () => setMode('translation'));
    setMode(currentMode);

    function copyText() {
      const text = editor?.value?.trim() || '';
      if (!text) { showToast('কপি করার মতো কোনো টেক্সট নেই।', 'info'); return; }
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard')).catch(() => fallbackCopy(text));
      } else fallbackCopy(text);
    }

    function fallbackCopy(text) {
      const helper = document.createElement('textarea');
      helper.value = text; helper.style.position = 'fixed'; helper.style.opacity = '0';
      document.body.appendChild(helper); helper.focus(); helper.select();
      try { document.execCommand('copy'); showToast('Copied to clipboard'); }
      catch (_) { showToast('Copy failed. Please select and copy manually.', 'error'); }
      helper.remove();
    }
    btnCopy?.addEventListener('click', copyText);

    btnTts?.addEventListener('click', () => {
      const text = editor?.value?.trim() || '';
      if (!text) { showToast('পড়ার জন্য কোনো টেক্সট নেই।', 'info'); return; }
      if (!('speechSynthesis' in window)) { showToast('Text-to-speech is not available in this browser.', 'error'); return; }
      window.speechSynthesis.cancel();
      const selected = langSelector?.value || DEFAULT_LANG;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selected;
      const voice = getMatchingVoice(selected);
      if (voice) utterance.voice = voice;
      else if (selected.toLowerCase().startsWith('bn')) showToast('এই ডিভাইসে Bengali voice পাওয়া যায়নি; text পড়া সম্ভব হলে browser-এর default voice ব্যবহার হবে।', 'info');
      utterance.rate = selected.toLowerCase().startsWith('bn') ? 0.96 : 1;
      utterance.pitch = 1;
      utterance.onstart = () => showToast('Reading aloud…');
      utterance.onend = () => showToast('Reading complete');
      utterance.onerror = () => showToast('Text-to-speech failed.', 'error');
      window.speechSynthesis.speak(utterance);
    });

    btnDownload?.addEventListener('click', () => {
      const text = editor?.value || '';
      if (!text.trim()) { showToast('ডাউনলোড করার জন্য কোনো টেক্সট নেই।', 'info'); return; }
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'BakSutra-Transcript.txt'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 800);
      showToast('Text file saved');
    });

    function loadDocxLibrary() {
      if (window.docx) return Promise.resolve(window.docx);
      if (docxPromise) return docxPromise;
      docxPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = DOCX_URL; script.async = true;
        script.onload = () => window.docx ? resolve(window.docx) : reject(new Error('DOCX library did not initialize.'));
        script.onerror = () => reject(new Error('Could not load the Word export library.'));
        document.head.appendChild(script);
      });
      return docxPromise;
    }

    function loadHtml2PdfLibrary() {
      if (window.html2pdf) return Promise.resolve(window.html2pdf);
      if (html2pdfPromise) return html2pdfPromise;
      html2pdfPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = HTML2PDF_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => window.html2pdf ? resolve(window.html2pdf) : reject(new Error('PDF library did not initialize.'));
        script.onerror = () => reject(new Error('Could not load the PDF export library. Connect to the internet once and try again.'));
        document.head.appendChild(script);
      });
      return html2pdfPromise;
    }

    btnPdf?.addEventListener('click', async () => {
      const text = editor?.value || '';
      if (!text.trim()) { showToast('PDF তৈরির জন্য কোনো টেক্সট নেই।', 'info'); return; }
      btnPdf.disabled = true;
      let exportNode = null;
      try {
        const html2pdf = await loadHtml2PdfLibrary();
        exportNode = document.createElement('article');
        exportNode.setAttribute('aria-hidden', 'true');
        exportNode.style.position = 'fixed';
        exportNode.style.left = '-100000px';
        exportNode.style.top = '0';
        exportNode.style.width = '794px';
        exportNode.style.boxSizing = 'border-box';
        exportNode.style.padding = '42px';
        exportNode.style.background = '#ffffff';
        exportNode.style.color = '#111827';
        exportNode.style.fontFamily = 'Hind Siliguri, Plus Jakarta Sans, sans-serif';
        exportNode.style.fontSize = '16px';
        exportNode.style.lineHeight = '1.75';
        exportNode.style.whiteSpace = 'pre-wrap';
        exportNode.style.overflowWrap = 'anywhere';
        const title = document.createElement('h1');
        title.textContent = 'BakSutra Transcript';
        title.style.margin = '0 0 24px';
        title.style.fontSize = '24px';
        title.style.lineHeight = '1.2';
        title.style.fontWeight = '800';
        const body = document.createElement('div');
        body.textContent = text;
        exportNode.append(title, body);
        document.body.appendChild(exportNode);
        await html2pdf().set({
          margin: [12, 12, 14, 12],
          filename: 'BakSutra-Transcript.pdf',
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
        }).from(exportNode).save();
        showToast('PDF document created');
      } catch (error) {
        console.error(error);
        showToast(error.message || 'PDF export failed.', 'error');
      } finally {
        exportNode?.remove();
        btnPdf.disabled = false;
      }
    });

    btnShare?.addEventListener('click', async () => {
      const text = editor?.value?.trim() || '';
      if (!text) { showToast('শেয়ার করার জন্য কোনো টেক্সট নেই।', 'info'); return; }
      if (!navigator.share) {
        await copyText();
        showToast('Native sharing is not available here. Text copied instead.', 'info');
        return;
      }
      try {
        await navigator.share({ title: 'BakSutra Transcript', text });
        showToast('Shared successfully');
      } catch (error) {
        if (error?.name !== 'AbortError') showToast('Share failed. Please try again.', 'error');
      }
    });

    btnDocx?.addEventListener('click', async () => {
      const text = editor?.value || '';
      if (!text.trim()) { showToast('Word ফাইল তৈরির জন্য কোনো টেক্সট নেই।', 'info'); return; }
      btnDocx.disabled = true;
      try {
        const { Document, Packer, Paragraph, TextRun } = await loadDocxLibrary();
        const doc = new Document({ sections: [{ properties: {}, children: text.split('\n').map(line => new Paragraph({ children: [new TextRun({ text: line, size: 24, font: 'Noto Sans Bengali' })], spacing: { after: 120 } })) }] });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'BakSutra-Document.docx'; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 800);
        showToast('Word document created');
      } catch (error) {
        console.error(error);
        showToast(error.message || 'Word export failed.', 'error');
      } finally { btnDocx.disabled = false; }
    });

    btnAiCheck?.addEventListener('click', () => {
      const text = editor?.value?.trim() || '';
      if (!text) { showToast('AI Polish করার জন্য কোনো টেক্সট নেই।', 'info'); return; }
      const prompt = `নিচের লেখাটি সম্পাদনা করুন। মূল অর্থ অপরিবর্তিত রাখুন, বানান ও ব্যাকরণ ঠিক করুন, প্রাকৃতিক বাংলা/ইংরেজি ভঙ্গি বজায় রাখুন, প্রয়োজনমতো বিরামচিহ্ন যোগ করুন এবং শেষে সংক্ষেপে কী কী পরিবর্তন করেছেন তা জানান.\n\n--- TEXT ---\n${text}`;
      const openGemini = () => window.open('https://gemini.google.com/', '_blank', 'noopener,noreferrer');
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(prompt).then(() => { showToast('AI prompt copied'); openGemini(); }).catch(() => { fallbackCopy(prompt); openGemini(); });
      } else { fallbackCopy(prompt); openGemini(); }
    });

    btnUndo?.addEventListener('click', () => {
      if (!lastClearedText || !editor) { showToast('Nothing to undo.', 'info'); return; }
      editor.value = lastClearedText;
      lastClearedText = '';
      updateUndoAvailability();
      updateMetrics();
      saveText(true);
      editor.focus();
      showToast('Last cleared text restored');
    });

    btnClear?.addEventListener('click', () => {
      const text = editor?.value || '';
      if (!text.trim()) { showToast('Already empty', 'info'); return; }
      lastClearedText = text;
      editor.value = '';
      updateUndoAvailability();
      updateMetrics();
      saveText(true);
      showToast('Text cleared. Use Undo to restore it.', 'info');
    });

    editor?.addEventListener('input', () => {
      lastClearedText = '';
      updateUndoAvailability();
      updateMetrics();
      saveText();
    });
    editor?.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !editor.value && lastClearedText) {
        event.preventDefault();
        editor.value = lastClearedText;
        lastClearedText = '';
        updateUndoAvailability();
        updateMetrics();
        saveText(true);
        showToast('Last clear undone');
      }
    });

    function openModal() {
      if (!infoModal) return;
      lastModalFocus = document.activeElement;
      infoModal.classList.add('is-open'); infoModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      modalClose?.focus();
    }
    function closeModal() {
      if (!infoModal) return;
      infoModal.classList.remove('is-open'); infoModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      lastModalFocus?.focus?.();
    }
    btnInfo?.addEventListener('click', openModal);
    modalClose?.addEventListener('click', closeModal);
    modalOk?.addEventListener('click', closeModal);
    infoModal?.addEventListener('click', (event) => { if (event.target === infoModal) closeModal(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && infoModal?.classList.contains('is-open')) closeModal();
    });

    window.addEventListener('beforeunload', () => {
      saveText(true);
      try { recognition?.abort(); } catch (_) { /* noop */ }
      try { window.speechSynthesis?.cancel(); } catch (_) { /* noop */ }
    });

    // Re-apply persisted state in case another feature mutates body classes later.
    const observer = new MutationObserver(() => {
      const savedTheme = localStorage.getItem(STORAGE.theme) === 'light' ? 'light' : 'dark';
      const expected = savedTheme === 'dark';
      if (document.body.classList.contains('dark-theme') !== expected) {
        applyTheme(savedTheme, false);
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
})();
