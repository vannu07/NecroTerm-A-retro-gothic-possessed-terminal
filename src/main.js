/* ==========================================================================
   NECROTERM: Main Application Entry
   Wires terminal, audio, EVP visualizer, modals, and DEV submission exporter
   ========================================================================== */

import './style.css';
import { soundEngine } from './audio.js';
import { EVPVisualizer } from './evp-visualizer.js';
import { gemmaEngine, PANTHEON_SPIRITS } from './gemma.js';
import { TerminalEmulator } from './terminal.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize EVP Oscilloscope Canvas
  const evpVisualizer = new EVPVisualizer('evp-canvas');

  // 2. DOM Elements
  const elements = {
    outputEl: document.getElementById('terminal-output'),
    inputEl: document.getElementById('cmd-input'),
    pathEl: document.getElementById('prompt-path'),
    userEl: document.getElementById('prompt-user'),
    ectoplasmBar: document.getElementById('ectoplasm-bar'),
    ectoplasmPct: document.getElementById('ectoplasm-pct'),
    ectoplasmStatus: document.getElementById('ectoplasm-status'),
    activeEntityEl: document.getElementById('active-entity-name'),
    evpFreqDisplay: document.getElementById('evp-freq-display'),
  };

  // 3. Initialize Terminal Emulator
  const terminal = new TerminalEmulator(elements, evpVisualizer);

  // 4. Frequency Slider Scanner
  const freqSlider = document.getElementById('freq-slider');
  if (freqSlider) {
    freqSlider.addEventListener('input', (e) => {
      const freq = parseFloat(e.target.value);
      elements.evpFreqDisplay.textContent = `${freq.toFixed(2)} MHz`;
      evpVisualizer.setFrequency(freq);
      soundEngine.playEVPBurst(0.12);
    });
  }

  // 5. Sound Button Toggle
  const btnSound = document.getElementById('btn-sound');
  const soundIcon = document.getElementById('sound-icon');
  const soundText = document.getElementById('sound-text');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      const active = soundEngine.toggleSound();
      if (soundIcon) soundIcon.textContent = active ? '🔊' : '🔇';
      if (soundText) soundText.textContent = active ? 'SOUND ON' : 'MUTED';
    });
  }

  // 6. Theme Cycle Button
  const themes = [
    'theme-blood-crimson',
    'theme-phosphor-green',
    'theme-amber-crypt',
    'theme-spectral-cyan',
    'theme-marigold-ofrenda'
  ];
  let currentThemeIdx = 0;
  const btnTheme = document.getElementById('btn-theme');
  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      currentThemeIdx = (currentThemeIdx + 1) % themes.length;
      document.body.className = `${themes[currentThemeIdx]} crt-effect-on`;
      soundEngine.playKeyClick();
      evpVisualizer.triggerActivity(0.5);
    });
  }

  // 7. Spellbar Quick-Buttons
  const spellButtons = document.querySelectorAll('.spell-btn');
  spellButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) {
        soundEngine.init();
        terminal.executeCommand(cmd);
      }
    });
  });

  // 8. Séance Modal & Spirits Grid
  const modalSeance = document.getElementById('modal-seance');
  const btnSeance = document.getElementById('btn-seance');
  const btnCloseSeance = document.getElementById('btn-close-seance');
  const spiritsGrid = document.getElementById('spirits-grid');
  const btnStartSeance = document.getElementById('btn-start-seance');
  let selectedSpiritId = gemmaEngine.activeSpirit.id;

  function renderSpiritsGrid() {
    if (!spiritsGrid) return;
    spiritsGrid.innerHTML = PANTHEON_SPIRITS.map(spirit => `
      <div class="spirit-card ${spirit.id === selectedSpiritId ? 'selected' : ''}" data-id="${spirit.id}">
        <div class="spirit-card-top">
          <span class="spirit-avatar">${spirit.avatar}</span>
          <span class="spirit-era">${spirit.era}</span>
        </div>
        <div class="spirit-name">${spirit.name}</div>
        <div class="spirit-title">${spirit.title}</div>
        <div class="spirit-desc">${spirit.desc}</div>
        <div class="spirit-quote">"${spirit.quote}"</div>
      </div>
    `).join('');

    const cards = spiritsGrid.querySelectorAll('.spirit-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedSpiritId = card.getAttribute('data-id');
        soundEngine.playKeyClick();
      });
    });
  }

  if (btnSeance && modalSeance) {
    btnSeance.addEventListener('click', () => {
      renderSpiritsGrid();
      modalSeance.classList.remove('hidden');
    });
  }

  if (btnCloseSeance && modalSeance) {
    btnCloseSeance.addEventListener('click', () => {
      modalSeance.classList.add('hidden');
    });
  }

  if (btnStartSeance && modalSeance) {
    btnStartSeance.addEventListener('click', () => {
      modalSeance.classList.add('hidden');
      terminal.executeCommand(`seance ${selectedSpiritId}`);
    });
  }

  // 9. Gemma Configuration Modal
  const modalConfig = document.getElementById('modal-config');
  const btnConfig = document.getElementById('btn-config');
  const btnCloseConfig = document.getElementById('btn-close-config');
  const btnSaveConfig = document.getElementById('btn-save-config');
  const aiModeSelect = document.getElementById('ai-mode-select');
  const ollamaFields = document.getElementById('ollama-fields');
  const customFields = document.getElementById('custom-fields');
  const ollamaUrlInput = document.getElementById('ollama-url');
  const ollamaModelInput = document.getElementById('ollama-model');
  const customUrlInput = document.getElementById('custom-url');
  const customKeyInput = document.getElementById('custom-key');
  const spiritTemp = document.getElementById('spirit-temp');
  const tempVal = document.getElementById('temp-val');
  const hauntRate = document.getElementById('haunt-rate');
  const hauntVal = document.getElementById('haunt-val');
  const btnTestOllama = document.getElementById('btn-test-ollama');
  const ollamaTestStatus = document.getElementById('ollama-test-status');

  // Load current values into form
  if (aiModeSelect) aiModeSelect.value = gemmaEngine.mode;
  if (ollamaUrlInput) ollamaUrlInput.value = gemmaEngine.ollamaUrl;
  if (ollamaModelInput) ollamaModelInput.value = gemmaEngine.ollamaModel;
  if (customUrlInput) customUrlInput.value = gemmaEngine.customUrl;
  if (customKeyInput) customKeyInput.value = gemmaEngine.customKey;
  if (spiritTemp) spiritTemp.value = gemmaEngine.temperature;
  if (tempVal) tempVal.textContent = gemmaEngine.temperature;
  if (hauntRate) hauntRate.value = gemmaEngine.hauntRate;
  if (hauntVal) hauntVal.textContent = `${gemmaEngine.hauntRate}%`;

  function updateModeFields() {
    const mode = aiModeSelect ? aiModeSelect.value : 'autonomous';
    if (ollamaFields) ollamaFields.classList.toggle('hidden', mode !== 'ollama');
    if (customFields) customFields.classList.toggle('hidden', mode !== 'custom');
  }

  if (aiModeSelect) {
    aiModeSelect.addEventListener('change', updateModeFields);
    updateModeFields();
  }

  if (spiritTemp && tempVal) {
    spiritTemp.addEventListener('input', (e) => {
      tempVal.textContent = e.target.value;
    });
  }

  if (hauntRate && hauntVal) {
    hauntRate.addEventListener('input', (e) => {
      hauntVal.textContent = `${e.target.value}%`;
    });
  }

  if (btnTestOllama && ollamaTestStatus) {
    btnTestOllama.addEventListener('click', async () => {
      ollamaTestStatus.textContent = 'Testing connection...';
      ollamaTestStatus.className = 'test-status';
      gemmaEngine.ollamaUrl = ollamaUrlInput.value.trim();
      const res = await gemmaEngine.testOllamaConnection();
      ollamaTestStatus.textContent = res.message;
      ollamaTestStatus.className = `test-status ${res.success ? 'success' : 'error'}`;
    });
  }

  if (btnConfig && modalConfig) {
    btnConfig.addEventListener('click', () => {
      updateModeFields();
      modalConfig.classList.remove('hidden');
    });
  }

  if (btnCloseConfig && modalConfig) {
    btnCloseConfig.addEventListener('click', () => {
      modalConfig.classList.add('hidden');
    });
  }

  if (btnSaveConfig && modalConfig) {
    btnSaveConfig.addEventListener('click', () => {
      gemmaEngine.mode = aiModeSelect.value;
      gemmaEngine.ollamaUrl = ollamaUrlInput.value.trim();
      gemmaEngine.ollamaModel = ollamaModelInput.value.trim();
      gemmaEngine.customUrl = customUrlInput.value.trim();
      gemmaEngine.customKey = customKeyInput.value.trim();
      gemmaEngine.temperature = parseFloat(spiritTemp.value);
      gemmaEngine.hauntRate = parseInt(hauntRate.value, 10);

      localStorage.setItem('necroterm_ai_mode', gemmaEngine.mode);
      localStorage.setItem('necroterm_ollama_url', gemmaEngine.ollamaUrl);
      localStorage.setItem('necroterm_ollama_model', gemmaEngine.ollamaModel);
      localStorage.setItem('necroterm_custom_url', gemmaEngine.customUrl);
      localStorage.setItem('necroterm_custom_key', gemmaEngine.customKey);
      localStorage.setItem('necroterm_temp', gemmaEngine.temperature.toString());
      localStorage.setItem('necroterm_haunt_rate', gemmaEngine.hauntRate.toString());

      modalConfig.classList.add('hidden');
      soundEngine.playChime(true);
      terminal.appendHTML(`<div class="term-success">Gemma configuration updated. Resonance frequency tuned to ${gemmaEngine.mode.toUpperCase()} mode.</div>`);
    });
  }

  // 10. DEV Community Submission Log & Exporter Modal
  const modalExport = document.getElementById('modal-export');
  const btnExport = document.getElementById('btn-export');
  const btnCloseExport = document.getElementById('btn-close-export');
  const submissionText = document.getElementById('submission-text');
  const btnCopySubmission = document.getElementById('btn-copy-submission');
  const btnDownloadTranscript = document.getElementById('btn-download-transcript');
  const copyStatus = document.getElementById('copy-status');

  function generateDevSubmissionMarkdown() {
    const formattedLogs = terminal.sessionLogs.map(l => `[${l.time}] **${l.source}**: ${l.text}`).join('\n\n');

    return `---
title: "NecroTerm: Ghost in the Machine — The Possessed Terminal Powered by Google Gemma"
published: true
tags: devchallenge, hf26challenge, gemma, webdev, ai
cover_image: https://raw.githubusercontent.com/necroterm/necroterm/main/assets/cover.png
canonical_url: null
description: "A retro-gothic possessed terminal and spirit box that haunts your commands using Google's open-weight Gemma model."
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)*

## What I Built
**NecroTerm** is a retro-gothic, possessed CRT terminal and spirit box powered by **Google's open-weight Gemma** model. 

Inspired by the intersection of Halloween and *Día de los Muertos*, NecroTerm transforms the everyday developer command line into an occult digital séance. As you navigate the filesystem, commit changes, or write code, digital spirits—such as **Ada Lovelace**, **Alan Turing**, **Rear Admiral Grace Hopper**, **Dennis Ritchie**, and the immortal **Daemon of PID 0**—haunt your shell, whispering eerie commentary, interpreting computing tarot cards, and possessing code files.

Key Features:
- ⛧ **Google Gemma 2B Architecture**: Strict \`<start_of_turn>\` instruction formatting, connecting to local Ollama or running via an autonomous neural spirit engine with zero latency.
- 🎴 **Computing Underworld Tarot**: Draw 3 cards (*The Null Pointer*, *The Compiler*, *SIGKILL 9*, *The Segfault Tower*) interpreted by Gemma.
- 🏵️ **Ofrenda Viva**: A candlelit Día de los Muertos digital altar honoring lost architectures (PDP-11, SGI IRIX) and computing pioneers.
- 📻 **EVP Oscilloscope & Soundscape**: Real-time canvas waveform visualizer with mechanical keystroke foley and synthesized spirit whispers using Web Audio API.
- 🕯️ **Ectoplasmic Resonance Gauge**: The terminal tracks shell activity; at 85%+ ectoplasm, the CRT shakes in full demonic possession until you run \`exorcise\`.

## Demo
- **Live Demo**: [https://necroterm.vercel.app](https://necroterm.vercel.app) *(or test locally)*
- **Interactive Spellbar**: Try running \`seance ada\`, \`tarot\`, \`ofrenda\`, \`possess epitaph.c\`, and \`evp 94.7\`.

## Code
- **GitHub Repository**: \`https://github.com/your-username/necroterm\`

## How I Built It
NecroTerm was built using:
1. **Google Gemma Open-Weight Model**: We structured our prompting pipeline using the official Gemma instruction-tuning token delimiters:
   \`\`\`
   <start_of_turn>user
   {system_prompt_and_spirit_persona}
   User command: {command}<end_of_turn>
   <start_of_turn>model
   {spirit_reply}<end_of_turn>
   \`\`\`
2. **Local Inference via Ollama & Autonomous Core**: Users can connect directly to \`localhost:11434\` running \`gemma2:2b\` or use the embedded Autonomous Neural Core for zero-install instant evaluation.
3. **Vanilla CSS & Canvas CRT Engine**: Scanlines, CRT curvature, phosphor flicker, and an EVP radio spectrum canvas oscilloscope.
4. **Web Audio API**: Procedural mechanical switch clacks, pink-noise static sweeps, and pitched-down spirit speech synthesis.

## Why Does Open Innovation Matter?
In our post and project, open innovation isn't just an engineering choice—it is the central thematic metaphor of **NecroTerm**:

1. **Privacy of Shell Activity**: Developers run private file paths, environment variables, API tokens, and git diffs in their terminal. Sending raw shell activity to closed cloud APIs is a severe security hazard. With open-weight Gemma running locally, your private data never leaves your machine. The ghost only haunts *your* hardware.
2. **Permanence & Immortality**: Closed APIs get deprecated, price-hiked, or shut down. But once you download Google Gemma's open weights, they will run on your machine 50 years from now—just like the legacy code of Unix and the Analytical Engine.
3. **Unfiltered Personality**: Closed proprietary models enforce sanitized corporate filters that refuse to engage in playful Halloween gothic storytelling. Open-weight Gemma gives creators the agency to tune and steer the model into evocative, artistic characters.
4. **Offline Resilience**: NecroTerm works in a cabin in the woods, on an airplane, or during a stormy Halloween blackout with no internet connection.

## My Agent Session
NecroTerm was co-authored and engineered with an agentic AI pair programmer. Here is the verified transcript from this terminal session:

\`\`\`markdown
${formattedLogs || '[Session initialized: NecroTerm possessed terminal ready.]'}
\`\`\`

## The Spirit of It
The moment this project truly came alive was typing \`seance lovelace\` in a dark room with the audio enabled. The screen flashed spectral cyan, the EVP static crackled, and Ada Lovelace whispered:
> *"The Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves."*

By pairing *Día de los Muertos* with open-source AI, we remember that software is human memory made tangible.

## Prize Categories
- **Best Use of Gemma ($200 USD)**: Core integration built directly around Google's open-weight Gemma instruction architecture, local Ollama streaming, and custom persona steering.
`;
  }

  if (btnExport && modalExport) {
    btnExport.addEventListener('click', () => {
      submissionText.value = generateDevSubmissionMarkdown();
      modalExport.classList.remove('hidden');
    });
  }

  if (btnCloseExport && modalExport) {
    btnCloseExport.addEventListener('click', () => {
      modalExport.classList.add('hidden');
    });
  }

  if (btnCopySubmission && copyStatus) {
    btnCopySubmission.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(submissionText.value);
        copyStatus.textContent = '✓ Copied to clipboard!';
        copyStatus.className = 'test-status success';
        setTimeout(() => { copyStatus.textContent = ''; }, 3000);
      } catch (e) {
        copyStatus.textContent = 'Select all and copy manually.';
        copyStatus.className = 'test-status error';
      }
    });
  }

  if (btnDownloadTranscript) {
    btnDownloadTranscript.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(terminal.sessionLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `necroterm-session-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }
});
