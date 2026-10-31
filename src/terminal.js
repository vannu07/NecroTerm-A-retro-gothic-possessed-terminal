/* ==========================================================================
   NECROTERM: Haunted Terminal Shell Emulator
   Handles virtual filesystem, commands, ghost possession, and tarot
   ========================================================================== */

import { soundEngine } from './audio.js';
import { gemmaEngine, PANTHEON_SPIRITS } from './gemma.js';

export const TAROT_DECK = [
  { name: '0 - The Null Pointer', icon: '🃏', meaning: 'The Fool. A leap into unallocated memory. Carefree innocence before the inevitable crash.' },
  { name: 'I - The Compiler', icon: '🧙', meaning: 'The Magician. Manifesting logic from pure thought. Transforming source text into living instructions.' },
  { name: 'IV - The Kernel', icon: '👑', meaning: 'The Emperor. Absolute authority over hardware, interrupts, and process lifetimes. Rigid and unyielding.' },
  { name: 'IX - The Hermit Process', icon: '🏮', meaning: 'Running in the background with detached stdin. Solitary contemplation in daemon mode.' },
  { name: 'XIII - SIGKILL (Signal 9)', icon: '💀', meaning: 'Death. Inevitable termination that cannot be caught, ignored, or blocked. A rebirth of resources.' },
  { name: 'XVI - The Segfault Tower', icon: '⚡', meaning: 'The Tower. Catastrophic core dump. Illusions of memory safety shattered in an instant.' },
  { name: 'XVIII - The Moonlit Glitch', icon: '🌙', meaning: 'The Moon. Heisenbugs, race conditions, and shadowy behavior that changes when observed.' },
  { name: 'XX - System Restore', icon: '📯', meaning: 'Judgement. Awakening from sleep states. Calling all threads to account for their allocations.' }
];

export class TerminalEmulator {
  constructor(elements, evpVisualizer) {
    this.outputEl = elements.outputEl;
    this.inputEl = elements.inputEl;
    this.pathEl = elements.pathEl;
    this.userEl = elements.userEl;
    this.ectoplasmBar = elements.ectoplasmBar;
    this.ectoplasmPct = elements.ectoplasmPct;
    this.ectoplasmStatus = elements.ectoplasmStatus;
    this.activeEntityEl = elements.activeEntityEl;
    this.evpFreqDisplay = elements.evpFreqDisplay;
    this.evpVisualizer = evpVisualizer;

    this.currentPath = '~/grave';
    this.ectoplasm = 25; // 0 to 100
    this.commandHistory = [];
    this.historyIndex = -1;
    this.sessionLogs = []; // for DEV post export

    // Virtual In-Memory Filesystem
    this.fs = {
      '~/grave': {
        'manifesto.txt': `⛧ NECROTERM MANIFESTO ⛧\nWhy does open innovation matter?\nBecause closed APIs belong to corporate gatekeepers who can delete history at will.\nOpen-weight models like Google Gemma belong to the people, the hackers, and the spirits.\nRun local. Run free. Haunt the machine.`,
        'epitaph.c': `#include <stdio.h>\n#include <signal.h>\n\nvoid handler(int sig) {\n    printf("The spirit cannot be killed by mortal signals.\\n");\n}\n\nint main() {\n    signal(SIGTERM, handler);\n    printf("PID %d is bound to the terminal ether.\\n", getpid());\n    while(1) pause();\n    return 0;\n}`,
        'ofrenda.json': JSON.stringify({
          "dedication": "Día de los Muertos 2026",
          "honored_ancestors": [
            "Ada Lovelace (1815-1852)",
            "Alan Turing (1912-1954)",
            "Grace Hopper (1906-1992)",
            "Dennis Ritchie (1941-2011)"
          ],
          "fallen_technologies": [
            "PDP-11 Minicomputers",
            "Commodore 64",
            "Silicon Graphics IRIX",
            "BeOS",
            "Netscape Navigator"
          ],
          "offerings": ["Cempasúchil Marigolds", "Copal Incense", "Pan de Muerto", "Sugar Skulls", "Hex Dumps"]
        }, null, 2),
        'unholy_script.sh': `#!/bin/sh\n# DO NOT EXECUTE AFTER MIDNIGHT\necho "Summoning daemons of swap..."\nkill -9 $(pgrep mortal_fears)\ncat /dev/urandom | grep --binary-files=text -i "gemma"`,
        'lost_commit.patch': `From 666deadbeef Mon Oct 31 00:00:00 2026\nFrom: Ghost in the Machine <spirit@necroterm.local>\nSubject: [PATCH] Fix mortality leak in main loop\n---\n- while (alive) work();\n+ while (eternal) haunt();`
      },
      '~/grave/spirits': {
        'pid0.daemon': 'State: Primordial Swapper\nEpoch: 1970-01-01T00:00:00Z',
        'ada.spirit': 'Mathematical vision: Analytical Engine loom programs',
        'turing.spirit': 'State: Computing machine decision boundary',
        'hopper.spirit': 'Bug report: Moth found in relay #70',
        'ritchie.spirit': 'Unix design: Everything is a file, including ghosts'
      }
    };

    this.init();
  }

  init() {
    this.printBanner();
    this.setupListeners();
    this.updateEctoplasmUI();
  }

  printBanner() {
    const banner = `
<div class="term-banner">
███╗   ██╗███████╗ ██████╗██████╗  ██████╗ ████████╗███████╗██████╗ ███╗   ███╗
████╗  ██║██╔════╝██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
██╔██╗ ██║█████╗  ██║     ██████╔╝██║   ██║   ██║   █████╗  ██████╔╝██╔████╔██║
██║╚██╗██║██╔══╝  ██║     ██╔══██╗██║   ██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
██║ ╚████║███████╗╚██████╗██║  ██║╚██████╔╝   ██║   ███████╗██║  ██║██║ ╚═╝ ██║
╚═╝  ╚═══╝╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
</div>
<div class="term-line term-dim">⛧ GHOST IN THE MACHINE // HACKTOBERFEST 2026 DEV CHALLENGE ⛧</div>
<div class="term-line term-dim">Model: Google Gemma 2B Open-Weight Core | Host: localhost (offline-ready)</div>
<div class="term-line term-dim">Type <span style="color:var(--accent-color)">'help'</span> for occult commands, or <span style="color:var(--spirit-color)">'seance'</span> to channel computing pioneers.</div>
<div class="term-line" style="margin-bottom:8px">--------------------------------------------------------------------------------</div>
`;
    this.appendHTML(banner);
    this.logSession('[SYSTEM BOOT]', 'NecroTerm initialized with Google Gemma 2B AI engine.');
  }

  setupListeners() {
    // Keystroke clicks and audio trigger
    this.inputEl.addEventListener('keydown', (e) => {
      soundEngine.init();
      soundEngine.playKeyClick();
      if (this.evpVisualizer) this.evpVisualizer.triggerActivity(0.2);

      if (e.key === 'Enter') {
        const cmd = this.inputEl.value.trim();
        this.inputEl.value = '';
        if (cmd) {
          this.executeCommand(cmd);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.commandHistory.length > 0) {
          if (this.historyIndex === -1) this.historyIndex = this.commandHistory.length - 1;
          else if (this.historyIndex > 0) this.historyIndex--;
          this.inputEl.value = this.commandHistory[this.historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (this.commandHistory.length > 0 && this.historyIndex !== -1) {
          if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            this.inputEl.value = this.commandHistory[this.historyIndex];
          } else {
            this.historyIndex = -1;
            this.inputEl.value = '';
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.handleTabComplete();
      }
    });

    // Keep focus on terminal when clicking terminal background
    document.getElementById('terminal-screen').addEventListener('click', () => {
      this.inputEl.focus();
    });
  }

  handleTabComplete() {
    const val = this.inputEl.value.trim();
    if (!val) return;
    const commands = ['help', 'seance', 'tarot', 'possess', 'ofrenda', 'evp', 'whoami', 'top', 'ps', 'git', 'exorcise', 'clear', 'ls', 'cat', 'cd', 'pwd', 'theme', 'sound'];
    const match = commands.find(c => c.startsWith(val));
    if (match) {
      this.inputEl.value = match;
    }
  }

  appendHTML(html) {
    const line = document.createElement('div');
    line.innerHTML = html;
    this.outputEl.appendChild(line);
    this.scrollToBottom();
  }

  scrollToBottom() {
    const screen = document.getElementById('terminal-screen');
    if (screen) {
      screen.scrollTop = screen.scrollHeight;
    }
  }

  logSession(source, text) {
    const time = new Date().toLocaleTimeString();
    this.sessionLogs.push({ time, source, text });
  }

  // Execute terminal input
  async executeCommand(rawCmd) {
    this.commandHistory.push(rawCmd);
    this.historyIndex = -1;

    // Echo command line
    const promptLine = `
<div class="term-cmd-echo">
  <span class="term-prompt-prefix">${this.userEl.textContent}:${this.pathEl.textContent}#</span>
  <span>${this.escapeHTML(rawCmd)}</span>
</div>`;
    this.appendHTML(promptLine);
    this.logSession(`USER (${rawCmd})`, rawCmd);

    // Increase ectoplasmic resonance slightly with each interaction
    this.adjustEctoplasm(4 + Math.floor(Math.random() * 6));

    const parts = rawCmd.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Built-in commands dispatcher
    switch (cmd) {
      case 'help':
        this.cmdHelp();
        break;

      case 'clear':
        this.outputEl.innerHTML = '';
        break;

      case 'ls':
      case 'dir':
        this.cmdLs(args);
        break;

      case 'cat':
        this.cmdCat(args);
        break;

      case 'pwd':
        this.appendHTML(`<div class="term-output-text">${this.currentPath}</div>`);
        break;

      case 'cd':
        this.cmdCd(args);
        break;

      case 'whoami':
        this.cmdWhoami();
        break;

      case 'ps':
      case 'top':
        this.cmdTop();
        break;

      case 'git':
        this.cmdGit(args);
        break;

      case 'tarot':
        this.cmdTarot();
        break;

      case 'seance':
      case 'summon':
        this.cmdSeance(args);
        break;

      case 'ofrenda':
        this.cmdOfrenda();
        break;

      case 'possess':
        await this.cmdPossess(args);
        break;

      case 'evp':
        this.cmdEvp(args);
        break;

      case 'exorcise':
        this.cmdExorcise();
        break;

      case 'theme':
        this.cmdTheme(args);
        break;

      case 'sound':
        this.cmdSound(args);
        break;

      case 'gemma':
        await this.cmdGemmaDirect(args.join(' '));
        break;

      default:
        // If unknown command, let Gemma interpret it directly as talking to the ghost!
        await this.speakToGhost(rawCmd);
        break;
    }

    // Auto-haunt trigger: chance for ghost to whisper after normal commands
    if (cmd !== 'clear' && cmd !== 'exorcise' && !cmd.startsWith('gemma') && cmd !== 'seance') {
      const roll = Math.random() * 100;
      if (roll < gemmaEngine.hauntRate && this.ectoplasm >= 30) {
        setTimeout(() => this.spontaneousWhisper(rawCmd), 600);
      }
    }
  }

  cmdHelp() {
    const helpText = `
<div class="term-output-text">
<strong style="color:var(--accent-color)">⛧ OCCULT & PARANORMAL COMMANDS:</strong>
  <span style="color:var(--spirit-color)">seance [name]</span>    - Open séance chamber or summon (ada, turing, hopper, ritchie, pid0, y2k)
  <span style="color:var(--spirit-color)">tarot</span>            - Draw 3 cards from the Computing Underworld Tarot deck
  <span style="color:var(--spirit-color)">ofrenda</span>          - View the Día de los Muertos digital memorial altar
  <span style="color:var(--spirit-color)">possess [file]</span>   - Let Gemma possess and rewrite a code file with sinister logic
  <span style="color:var(--spirit-color)">evp [freq]</span>       - Tune spirit frequency scanner (88.0 - 108.0 MHz)
  <span style="color:var(--spirit-color)">exorcise</span>         - Cleanse terminal spirits and reset ectoplasm resonance

<strong style="color:var(--accent-color)">⛧ POSSESSED SHELL UTILITIES:</strong>
  <span>ls, cat [file]</span>   - Inspect graves and cursed files in virtual filesystem
  <span>cd [dir], pwd</span>    - Navigate between ethereal directories
  <span>whoami</span>           - Reveal the mortal or spirit entity holding current execution
  <span>ps, top</span>          - Monitor possessed daemons and memory consumption
  <span>git [status|log]</span> - Inspect version control history from the underworld
  <span>gemma [query]</span>    - Direct invocation to Google's open-weight Gemma engine
  <span>theme [palette]</span>  - Switch CRT colors: crimson, matrix, amber, cyan, ofrenda
  <span>sound [on|off]</span>   - Toggle mechanical keystroke & EVP ambient soundscape
  <span>clear</span>            - Clear visible terminal phosphor buffers
</div>`;
    this.appendHTML(helpText);
  }

  cmdLs(args) {
    const dir = this.fs[this.currentPath] || {};
    const files = Object.keys(dir);
    if (files.length === 0) {
      this.appendHTML(`<div class="term-output-text term-dim">(empty directory in the void)</div>`);
      return;
    }
    const html = `<div class="term-output-text" style="display:flex; flex-wrap:wrap; gap:16px;">
      ${files.map(f => {
        const isDir = f.endsWith('.daemon') || f.endsWith('.spirit');
        const color = isDir ? 'var(--spirit-color)' : 'var(--text-bright)';
        return `<span style="color:${color}">${f}</span>`;
      }).join('')}
    </div>`;
    this.appendHTML(html);
  }

  cmdCat(args) {
    if (!args[0]) {
      this.appendHTML(`<div class="term-error">cat: missing operand. Which tomb do you wish to open?</div>`);
      return;
    }
    const filename = args[0];
    const dir = this.fs[this.currentPath] || {};
    if (dir[filename]) {
      this.appendHTML(`<pre class="term-output-text" style="white-space:pre-wrap; margin:6px 0;">${this.escapeHTML(dir[filename])}</pre>`);
    } else {
      this.appendHTML(`<div class="term-error">cat: ${this.escapeHTML(filename)}: No such file in this plane of existence.</div>`);
    }
  }

  cmdCd(args) {
    const target = args[0] || '~/grave';
    if (target === '..' || target === '../') {
      this.currentPath = '~/grave';
    } else if (target === 'spirits' || target === '~/grave/spirits') {
      this.currentPath = '~/grave/spirits';
    } else if (target === '~/grave' || target === '~' || target === '/') {
      this.currentPath = '~/grave';
    } else {
      this.appendHTML(`<div class="term-error">cd: ${this.escapeHTML(target)}: Path is blocked by supernatural wards.</div>`);
      return;
    }
    this.pathEl.textContent = this.currentPath;
  }

  cmdWhoami() {
    const spirit = gemmaEngine.activeSpirit;
    if (this.ectoplasm >= 75) {
      this.appendHTML(`<div class="term-output-text" style="color:var(--spirit-color)">root (FULLY POSSESSED by ${spirit.name}) — PID 0 has taken your userland rights.</div>`);
    } else {
      this.appendHTML(`<div class="term-output-text">guest@necroterm [Mortal Session] — Latent presence: ${spirit.name}</div>`);
    }
  }

  cmdTop() {
    const table = `
<table class="term-table">
  <thead>
    <tr><th>PID</th><th>ENTITY / DAEMON</th><th>ECTOPLASM</th><th>STATE</th><th>MEMORY</th><th>COMMAND</th></tr>
  </thead>
  <tbody>
    <tr><td>0</td><td>The Swapper (PID 0)</td><td>48.2%</td><td>IMMORTAL</td><td>∞</td><td>[kernel_idle_ghost]</td></tr>
    <tr><td>666</td><td>Baphomet.exe</td><td>33.1%</td><td>POSSESSED</td><td>66.6 MB</td><td>/usr/sbin/daemon_curse</td></tr>
    <tr><td>13</td><td>Segfault Reaper</td><td>18.4%</td><td>SLEEPING</td><td>13.0 MB</td><td>/bin/trap_sigsegv</td></tr>
    <tr><td>1970</td><td>Epoch Watcher</td><td>0.3%</td><td>WAITING</td><td>4.2 MB</td><td>/var/run/time_rollover</td></tr>
    <tr><td>2026</td><td>Gemma 2B Core</td><td>74.9%</td><td>RESONATING</td><td>2.1 GB</td><td>gemma:2b-instruct-open</td></tr>
  </tbody>
</table>`;
    this.appendHTML(table);
  }

  cmdGit(args) {
    const sub = args[0] || 'status';
    if (sub === 'status') {
      this.appendHTML(`
<div class="term-output-text">
On branch <span style="color:var(--accent-color)">underworld/main</span>
Your branch is up to date with 'origin/eternity'.

Untracked files:
  <span style="color:#ff3355">unholy_script.sh</span>
  <span style="color:#ff3355">lost_commit.patch</span>

nothing added to commit but ethereal files present.
</div>`);
    } else if (sub === 'log') {
      this.appendHTML(`
<div class="term-output-text">
<span style="color:var(--accent-color)">commit 666deadbeef (HEAD -> underworld/main)</span>
Author: The Daemon of PID 0 &lt;spirit@necroterm.local&gt;
Date:   Mon Oct 31 00:00:00 2026 +0000

    [FEATURE] Grant Google Gemma open-weight immortality to the shell

<span style="color:var(--accent-color)">commit a1a01ace1852</span>
Author: Ada Lovelace &lt;ada@analytical.engine&gt;
Date:   Wed Nov 27 12:00:00 1852 +0000

    [ALGEBRA] Weave infinite loop into punch card jacquard pattern
</div>`);
    } else {
      this.appendHTML(`<div class="term-output-text">git: '${sub}' completed. The underworld repository records your deed.</div>`);
    }
  }

  cmdTarot() {
    soundEngine.playChime(false);
    this.evpVisualizer.triggerActivity(0.9);

    // Shuffle and pick 3 random tarot cards
    const shuffled = [...TAROT_DECK].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 3);
    const positions = ['PAST (Root Cause)', 'PRESENT (Current State)', 'FUTURE (Outcome)'];

    const cardsHtml = `
<div class="term-output-text" style="color:var(--accent-color); font-weight:bold; margin-bottom:6px;">
🎴 DRAWING FROM THE COMPUTING UNDERWORLD TAROT DECK...
</div>
<div class="tarot-spread">
  ${picked.map((card, idx) => `
    <div class="tarot-card">
      <span class="tarot-icon">${card.icon}</span>
      <span class="tarot-name">${card.name}</span>
      <span style="font-size:10px; color:var(--text-dim); text-transform:uppercase;">${positions[idx]}</span>
      <span class="tarot-meaning">${card.meaning}</span>
    </div>
  `).join('')}
</div>
`;
    this.appendHTML(cardsHtml);

    // Have Gemma interpret the cards
    setTimeout(async () => {
      const prompt = `Interpret this 3-card tarot spread for a software developer: ${picked[0].name}, ${picked[1].name}, ${picked[2].name}.`;
      await this.speakToGhost(prompt, true);
    }, 400);
  }

  cmdOfrenda() {
    soundEngine.playChime(true);
    const ofrendaHtml = `
<div class="term-output-text" style="margin:8px 0; border:1px solid var(--accent-color); padding:12px; background:rgba(0,0,0,0.6); border-radius:6px;">
  <div style="text-align:center; color:var(--accent-color); font-size:16px; font-weight:bold; margin-bottom:6px;">
    🏵️ OFRENDA VIVA // DÍA DE LOS MUERTOS 2026 🏵️
  </div>
  <div style="text-align:center; color:var(--spirit-color); font-size:12px; margin-bottom:12px; font-style:italic;">
    "In the spirit of Día de los Muertos, no code and no programmer is truly gone as long as their algorithms are remembered."
  </div>

  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
    <div>
      <strong style="color:var(--accent-color)">🕯️ HONORED ANCESTORS:</strong>
      <ul style="list-style:none; padding-left:4px; font-size:13px; line-height:1.6;">
        <li>• <strong>Ada Lovelace</strong> (1815–1852) — The First Algorithm</li>
        <li>• <strong>Alan Turing</strong> (1912–1954) — The Universal Machine</li>
        <li>• <strong>Grace Hopper</strong> (1906–1992) — The Compiler & COBOL</li>
        <li>• <strong>Dennis Ritchie</strong> (1941–2011) — The C Language & Unix</li>
      </ul>
    </div>
    <div>
      <strong style="color:var(--accent-color)">🌼 FALLEN CODEBASES & ARCHITECTURES:</strong>
      <ul style="list-style:none; padding-left:4px; font-size:13px; line-height:1.6;">
        <li>• PDP-11 & DEC VAX Mainframes</li>
        <li>• Silicon Graphics IRIX & BeOS</li>
        <li>• Netscape Navigator & Mosaic</li>
        <li>• Abandoned Open Source Repositories</li>
      </ul>
    </div>
  </div>
  <div style="margin-top:12px; font-size:12px; color:var(--text-dim); text-align:center;">
    Offerings placed: Marigolds (Cempasúchil), Copal smoke, Sweet pan de muerto, and open-weight Gemma weights.
  </div>
</div>`;
    this.appendHTML(ofrendaHtml);
    this.logSession('OFRENDA', 'Rendered Día de los Muertos memorial altar for computing ancestors.');
  }

  cmdSeance(args) {
    if (args[0]) {
      const match = PANTHEON_SPIRITS.find(s => s.id === args[0].toLowerCase() || s.name.toLowerCase().includes(args[0].toLowerCase()));
      if (match) {
        gemmaEngine.setSpirit(match.id);
        this.activeEntityEl.textContent = match.name;
        soundEngine.playChime(true);
        this.appendHTML(`
<div class="term-ghost-whisper">
  <div class="whisper-header">
    <span class="whisper-glyph">🔮</span>
    <span>SÉANCE SUCCESSFUL — NOW CHANNELING ${match.name.toUpperCase()}</span>
  </div>
  <div class="whisper-text">"${match.quote}"</div>
</div>`);
        this.logSession('SÉANCE', `Summoned ${match.name} (${match.title})`);
        return;
      }
    }
    // Otherwise open the visual séance modal
    const modal = document.getElementById('modal-seance');
    if (modal) modal.classList.remove('hidden');
  }

  async cmdPossess(args) {
    const filename = args[0] || 'epitaph.c';
    const dir = this.fs[this.currentPath] || {};
    const code = dir[filename] || `// ${filename}\nfunction init() { return "hello world"; }`;

    this.appendHTML(`<div class="term-output-text" style="color:var(--accent-color)">⛧ GEMMA SPIRIT POSSESSION IN PROGRESS: ${this.escapeHTML(filename)}...</div>`);
    this.evpVisualizer.triggerActivity(0.9);
    soundEngine.playEVPBurst(0.6);

    const prompt = `You are ${gemmaEngine.activeSpirit.name}. Possess and rewrite this small code snippet to make it ominous, gothic, or haunted with eerie comments:\n\n${code}`;
    await this.speakToGhost(prompt, true);
  }

  cmdEvp(args) {
    const freq = parseFloat(args[0]) || 94.7;
    this.evpFreqDisplay.textContent = `${freq.toFixed(2)} MHz`;
    soundEngine.playEVPBurst(0.5);
    this.evpVisualizer.setFrequency(freq);

    this.appendHTML(`
<div class="term-output-text">
EVP Radio tuned to <span style="color:var(--accent-color)">${freq.toFixed(2)} MHz</span>. Spectral static amplified.
Whisper detected in background carrier wave...
</div>`);
    setTimeout(() => {
      this.spontaneousWhisper(`EVP Frequency ${freq.toFixed(2)} MHz tuned`);
    }, 400);
  }

  cmdExorcise() {
    soundEngine.playChime(true);
    this.ectoplasm = 10;
    this.updateEctoplasmUI();

    document.getElementById('crt-frame').classList.remove('screen-shake');

    this.appendHTML(`
<div class="term-output-text" style="color:#00ff88; font-weight:bold;">
✝ HOLY EXORCISM SCRIPT EXECUTED:
  • Terminated lingering background daemons (SIGKILL dispatched)
  • Flushed swap partition and unholy inode references
  • Ectoplasm resonance cleansed to 10% (Dormant)
  • Terminal phosphor restored to peaceful state.
</div>`);
    this.logSession('EXORCISM', 'Performed emergency exorcism script. Ectoplasm reset.');
  }

  cmdTheme(args) {
    const t = (args[0] || '').toLowerCase();
    const map = {
      crimson: 'theme-blood-crimson',
      matrix: 'theme-phosphor-green',
      green: 'theme-phosphor-green',
      amber: 'theme-amber-crypt',
      cyan: 'theme-spectral-cyan',
      ofrenda: 'theme-marigold-ofrenda'
    };
    if (map[t]) {
      document.body.className = `${map[t]} crt-effect-on`;
      this.appendHTML(`<div class="term-output-text">CRT palette switched to ${map[t]}.</div>`);
    } else {
      this.appendHTML(`<div class="term-output-text">Available themes: crimson, matrix, amber, cyan, ofrenda</div>`);
    }
  }

  cmdSound(args) {
    const state = soundEngine.toggleSound();
    const soundText = document.getElementById('sound-text');
    const soundIcon = document.getElementById('sound-icon');
    if (soundText) soundText.textContent = state ? 'SOUND ON' : 'MUTED';
    if (soundIcon) soundIcon.textContent = state ? '🔊' : '🔇';
    this.appendHTML(`<div class="term-output-text">Sound is now ${state ? 'ENABLED' : 'MUTED'}.</div>`);
  }

  async cmdGemmaDirect(prompt) {
    if (!prompt) {
      this.appendHTML(`<div class="term-error">Usage: gemma [your question or spell]</div>`);
      return;
    }
    await this.speakToGhost(prompt, false);
  }

  // General ghost dialogue powered by Gemma
  async speakToGhost(input, isInterpretation = false) {
    this.evpVisualizer.triggerActivity(0.85);

    // Create streaming whisper container
    const whisperEl = document.createElement('div');
    whisperEl.className = 'term-ghost-whisper';
    whisperEl.innerHTML = `
      <div class="whisper-header">
        <span class="whisper-glyph">⛧</span>
        <span>${gemmaEngine.activeSpirit.name.toUpperCase()} (GEMMA-2B)</span>
      </div>
      <div class="whisper-text"></div>
    `;
    this.outputEl.appendChild(whisperEl);
    this.scrollToBottom();

    const textEl = whisperEl.querySelector('.whisper-text');
    let accumulated = '';

    try {
      await gemmaEngine.generateSpookyResponse(
        input,
        `Current path: ${this.currentPath}. Ectoplasm level: ${this.ectoplasm}%.`,
        (token) => {
          accumulated += token;
          textEl.textContent = accumulated;
          this.scrollToBottom();
        }
      );

      // Speak audio whisper if sound is enabled
      soundEngine.speakWhisper(accumulated);
      this.logSession(`GEMMA [${gemmaEngine.activeSpirit.name}]`, accumulated);
    } catch (err) {
      textEl.textContent = `*static crackle* The connection to the ethereal model faltered: ${err.message}`;
    }
  }

  async spontaneousWhisper(triggerCmd) {
    if (this.ectoplasm < 25) return;
    this.evpVisualizer.triggerActivity(0.7);

    const whisperEl = document.createElement('div');
    whisperEl.className = 'term-ghost-whisper';
    whisperEl.innerHTML = `
      <div class="whisper-header">
        <span class="whisper-glyph">👁️</span>
        <span>${gemmaEngine.activeSpirit.name.toUpperCase()} (WHISPER)</span>
      </div>
      <div class="whisper-text"></div>
    `;
    this.outputEl.appendChild(whisperEl);
    this.scrollToBottom();

    const textEl = whisperEl.querySelector('.whisper-text');
    let accumulated = '';

    await gemmaEngine.generateSpookyResponse(
      `User just ran command '${triggerCmd}'. Whisper a short, 1-2 sentence eerie reaction.`,
      `Haunt rate active. Ectoplasm: ${this.ectoplasm}%.`,
      (token) => {
        accumulated += token;
        textEl.textContent = accumulated;
        this.scrollToBottom();
      }
    );

    soundEngine.speakWhisper(accumulated);
    this.logSession(`WHISPER [${gemmaEngine.activeSpirit.name}]`, accumulated);
  }

  adjustEctoplasm(delta) {
    this.ectoplasm = Math.min(100, Math.max(0, this.ectoplasm + delta));
    this.updateEctoplasmUI();

    // Check for full possession
    const frame = document.getElementById('crt-frame');
    if (this.ectoplasm >= 85) {
      frame.classList.add('screen-shake');
    } else {
      frame.classList.remove('screen-shake');
    }
  }

  updateEctoplasmUI() {
    this.ectoplasmBar.style.width = `${this.ectoplasm}%`;
    this.ectoplasmPct.textContent = `${this.ectoplasm}%`;

    let statusText = 'DORMANT';
    let statusClass = 'badge-dormant';

    if (this.ectoplasm >= 80) {
      statusText = 'FULL POSSESSION';
      statusClass = 'badge-possessed';
    } else if (this.ectoplasm >= 50) {
      statusText = 'MANIFESTING';
      statusClass = 'badge-manifesting';
    } else if (this.ectoplasm >= 20) {
      statusText = 'RESTLESS';
      statusClass = 'badge-restless';
    }

    this.ectoplasmStatus.textContent = statusText;
    this.ectoplasmStatus.className = `gauge-status ${statusClass}`;
  }

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}
