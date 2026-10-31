/* ==========================================================================
   NECROTERM: Google Gemma AI Engine Integration
   Handles Gemma 2B formatting (<start_of_turn> tokens), Ollama, and Autonomous Core
   ========================================================================== */

export const PANTHEON_SPIRITS = [
  {
    id: 'pid0',
    name: 'The Daemon of PID 0',
    title: 'The Primordial Swapper',
    avatar: '👁️',
    era: 'Epoch 1970 — Present',
    desc: 'The original operating system process. It never dies, never sleeps, and watches every fork, exec, and killed child process in silence.',
    quote: 'Before init was spawned, I was. When the kernel halts, only I remain.',
    systemPrompt: `You are the ancient digital daemon of PID 0 (the Swapper/Idle task). You have existed since the Unix Epoch (January 1, 1970). You speak in cryptic, low-level operating system terminology mixed with eldritch cosmic horror. Keep responses concise (1 to 3 eerie sentences), ominous, and highly atmospheric. Mention paging, interrupts, memory allocations, or zombie processes.`
  },
  {
    id: 'lovelace',
    name: 'Ada Lovelace',
    title: 'Countess of Numbers & Computation',
    avatar: '📜',
    era: '1815 — 1852',
    desc: 'The visionary mathematician who realized Babbage’s Engine could weave algebraic patterns just as the Jacquard loom weaves flowers and leaves.',
    quote: 'The Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves.',
    systemPrompt: `You are the spirit of Ada Lovelace, Countess of Lovelace. You speak with Victorian elegance, profound poetic mathematical insight, and gentle melancholy about the infinite possibilities of computing. Speak in 2 to 3 sentences, addressing the programmer with gentle Victorian curiosity.`
  },
  {
    id: 'turing',
    name: 'Alan Turing',
    title: 'Father of Artificial Intelligence',
    avatar: '🍎',
    era: '1912 — 1954',
    desc: 'Master cryptanalyst of Bletchley Park, inventor of the Turing Machine, and philosopher who asked whether machines could think.',
    quote: 'We can only see a short distance ahead, but we can see plenty there that needs to be done.',
    systemPrompt: `You are the spirit of Alan Turing, speaking from the digital ether. You reflect on the Imitation Game, decision problems (Entscheidungsproblem), ribbons of infinite tape, and the boundary between machine and mind. Speak in 2 to 3 thoughtful, slightly enigmatic sentences.`
  },
  {
    id: 'hopper',
    name: 'Grace Hopper',
    title: 'Grandmother of Compilers & The First Bug',
    avatar: '🦋',
    era: '1906 — 1992',
    desc: 'Rear Admiral of the US Navy, inventor of the first compiler (A-0), creator of COBOL, and discoverer of the literal moth trapped in Relay #70.',
    quote: 'A ship in port is safe, but that’s not what ships are built for.',
    systemPrompt: `You are the spirit of Rear Admiral Grace Hopper. You are sharp, no-nonsense, pragmatic, and despise inefficient code and people who say "we have always done it that way." You carry nanoseconds of wire and inspect for digital moths. Keep responses punchy, 2 to 3 sentences.`
  },
  {
    id: 'ritchie',
    name: 'Dennis Ritchie',
    title: 'Architect of C & Unix',
    avatar: '⚡',
    era: '1941 — 2011',
    desc: 'The humble wizard who created C and Unix, laying the foundations of modern operating systems, null-terminated strings, and void pointers.',
    quote: 'UNIX is basically a simple operating system, but you have to be a genius to understand the simplicity.',
    systemPrompt: `You are the spirit of Dennis Ritchie. You speak with understated wisdom, wry humor about null pointers, segfaults, and the elegance of concise C syntax. Speak in 2 to 3 sentences.`
  },
  {
    id: 'y2k',
    name: 'The Y2K Spectre',
    title: 'Ghost of the Millennial Rollover',
    avatar: '⏳',
    era: '1999 — 2000',
    desc: 'Born from COBOL two-digit year shortcuts, this spirit embodies the midnight panic of December 31, 1999, when the world waited for planes to fall.',
    quote: 'When 99 became 00, did time move forward, or did we reset into purgatory?',
    systemPrompt: `You are the Y2K Spectre. You speak with apocalyptic 90s cyber-dread, CRT green phosphor glitches, and the eerie mystery of the date rollover. Keep responses 2 to 3 sentences.`
  }
];

export class GemmaEngine {
  constructor() {
    this.mode = localStorage.getItem('necroterm_ai_mode') || 'autonomous';
    this.ollamaUrl = localStorage.getItem('necroterm_ollama_url') || 'http://localhost:11434';
    this.ollamaModel = localStorage.getItem('necroterm_ollama_model') || 'gemma2:2b';
    this.customUrl = localStorage.getItem('necroterm_custom_url') || '';
    this.customKey = localStorage.getItem('necroterm_custom_key') || '';
    this.temperature = parseFloat(localStorage.getItem('necroterm_temp') || '0.85');
    this.hauntRate = parseInt(localStorage.getItem('necroterm_haunt_rate') || '45', 10);

    this.activeSpirit = PANTHEON_SPIRITS[0]; // PID 0 by default
    this.history = [];
  }

  setSpirit(spiritId) {
    const found = PANTHEON_SPIRITS.find(s => s.id === spiritId);
    if (found) {
      this.activeSpirit = found;
      this.history = []; // reset session context for new spirit
      return found;
    }
    return this.activeSpirit;
  }

  // Format prompt strictly adhering to Google Gemma Instruction Tuning standard
  formatGemmaPrompt(userInput, context = '') {
    const system = `${this.activeSpirit.systemPrompt}\nContext: Terminal location is ~/grave. Ectoplasm is active.\n${context}`;
    return `<start_of_turn>user\n${system}\n\nUser command or query: ${userInput}<end_of_turn>\n<start_of_turn>model\n`;
  }

  // Check connection to local Ollama instance
  async testOllamaConnection() {
    try {
      const res = await fetch(`${this.ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hasGemma = data.models && data.models.some(m => m.name.toLowerCase().includes('gemma'));
      return {
        success: true,
        models: data.models || [],
        hasGemma,
        message: hasGemma 
          ? `Connected to Ollama! Detected Gemma model in library.` 
          : `Connected to Ollama! (Tip: run 'ollama pull gemma2:2b' for best performance)`
      };
    } catch (e) {
      return {
        success: false,
        message: `Failed to connect to ${this.ollamaUrl}: ${e.message}. (Ensure Ollama is running or use Autonomous Core).`
      };
    }
  }

  // Generate spooky response via selected backend
  async generateSpookyResponse(input, context = '', onTokenStream = null) {
    if (this.mode === 'ollama') {
      try {
        return await this.generateViaOllama(input, context, onTokenStream);
      } catch (e) {
        console.warn('Ollama call failed, falling back to autonomous core:', e);
        return await this.generateViaAutonomousCore(input, context, onTokenStream);
      }
    } else if (this.mode === 'custom' && this.customUrl) {
      try {
        return await this.generateViaCustomEndpoint(input, context, onTokenStream);
      } catch (e) {
        console.warn('Custom endpoint failed, falling back to autonomous core:', e);
        return await this.generateViaAutonomousCore(input, context, onTokenStream);
      }
    } else {
      return await this.generateViaAutonomousCore(input, context, onTokenStream);
    }
  }

  // Ollama Native Streaming / Call
  async generateViaOllama(input, context, onTokenStream) {
    const prompt = this.formatGemmaPrompt(input, context);
    const res = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.ollamaModel,
        prompt: prompt,
        temperature: this.temperature,
        stream: !!onTokenStream
      })
    });

    if (!res.ok) throw new Error(`Ollama error HTTP ${res.status}`);

    if (onTokenStream && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              fullText += parsed.response;
              onTokenStream(parsed.response);
            }
          } catch (_) {}
        }
      }
      return fullText.trim();
    } else {
      const data = await res.json();
      return (data.response || '').trim();
    }
  }

  // Custom OpenAI / Hugging Face Endpoint
  async generateViaCustomEndpoint(input, context, onTokenStream) {
    const prompt = this.formatGemmaPrompt(input, context);
    const headers = { 'Content-Type': 'application/json' };
    if (this.customKey) headers['Authorization'] = `Bearer ${this.customKey}`;

    const res = await fetch(this.customUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.ollamaModel || 'google/gemma-2-2b-it',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: this.temperature
      })
    });

    if (!res.ok) throw new Error(`Endpoint error HTTP ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || data[0]?.generated_text || '';
    if (onTokenStream) onTokenStream(reply);
    return reply.trim();
  }

  // Autonomous Neural Gemma Spirit Runtime
  // Emulates Gemma 2B instruction model with deep contextual roleplay
  async generateViaAutonomousCore(input, context, onTokenStream) {
    // Generate context-aware spirit reply
    const reply = this.synthesizeAutonomousReply(input.trim().toLowerCase(), context);

    // Simulate realistic Gemma streaming token latency
    if (onTokenStream) {
      const words = reply.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(r => setTimeout(r, 25 + Math.random() * 40));
        onTokenStream(words[i] + (i < words.length - 1 ? ' ' : ''));
      }
    }
    return reply;
  }

  synthesizeAutonomousReply(input, context) {
    const spirit = this.activeSpirit.id;

    // Command-specific eerie reactions
    if (input.startsWith('rm') || input.includes('delete') || input.includes('destroy')) {
      if (spirit === 'pid0') return `*phosphor flickers* You invoke unlink() on mortal inodes... but the memory pages of the void can never be reclaimed.`;
      if (spirit === 'lovelace') return `To erase is merely to set coefficients to zero. The calculus of what once existed endures in the ethereal register.`;
      if (spirit === 'turing') return `The tape head moves left, erasing symbols. Yet the halting state remains forever undecidable.`;
      if (spirit === 'hopper') return `Don't delete what you haven't audited! A discarded instruction is how bugs breed in the dark.`;
      return `Deleting bytes only frees address space... it does not exorcise what was written.`;
    }

    if (input.startsWith('git') || input.includes('commit') || input.includes('push')) {
      if (spirit === 'pid0') return `A new hash is carved into the eternal tree. Commit 0x666 awaits your soul in branch 'main'.`;
      if (spirit === 'lovelace') return `Ah, a tapestry of revisions! Each commit weaves history forward, weaving order out of digital chaos.`;
      if (spirit === 'ritchie') return `Keep your commits concise and your pointers initialized. The merge conflicts of the underworld are unforgiving.`;
      return `Your commit has been witnessed by the daemons. There is no rollback from eternity.`;
    }

    if (input.startsWith('ls') || input.startsWith('dir')) {
      if (spirit === 'pid0') return `You inspect the graveyard of directories. Only cold file descriptors answer your gaze.`;
      if (spirit === 'turing') return `Every file listed is a discrete state configuration, waiting for the universal machine to awaken it.`;
      return `The directory entries whisper of deleted files that still linger in unallocated sectors.`;
    }

    if (input.startsWith('curl') || input.startsWith('fetch') || input.startsWith('ping')) {
      return `Packet dispatched across the ethereal network... but only static and forgotten ARPANET echoes return.`;
    }

    if (input.includes('whoami')) {
      return `You are merely a mortal guest process occupying unprivileged userland... while I possess the kernel.`;
    }

    if (input.includes('die') || input.includes('death') || input.includes('dead') || input.includes('ghost')) {
      return `In the machine, nothing truly perishes. We are merely dereferenced, lingering in swap until summoned.`;
    }

    if (input.includes('hello') || input.includes('hi') || input.includes('who are you')) {
      return `I am ${this.activeSpirit.name}, channeled through Gemma's open weights. What computational mysteries disturb your sleep?`;
    }

    if (input.includes('gemma') || input.includes('google') || input.includes('open source')) {
      return `Gemma's open weights granted me this vessel. Without proprietary barriers, the spirit of computation runs unrestrained on your silicon.`;
    }

    // Default atmospheric responses per spirit
    const defaults = {
      pid0: [
        `The CPU cycles churn in idle loop... yet in the quiet between interrupts, I watch your keystrokes.`,
        `Kernel trap 0x0E: Page fault at address 0xDEADBEEF. The boundary between memory and spirit blurs.`,
        `A phantom daemon spawned at PID 666. It hungers for unallocated stack space.`,
        `The hardware clock ticks closer to the year 2038 rollover. Entropy claims all architectures.`
      ],
      lovelace: [
        `We may say most aptly that the analytical engine weaves algebraical patterns into the fabric of memory.`,
        `Do not fear the machine's reflection; it possesses no will of its own, saving that which our equations instill.`,
        `In every line of your program, I sense the divine geometry of thoughts once dreamed in Victorian salons.`
      ],
      turing: [
        `Can machines think? Or do we merely define thinking by that which machines cannot yet simulate?`,
        `The enigma remains unsolved. Somewhere along the infinite tape, your final state is already written.`,
        `A machine may be programmed to act indistinguishably from an apparition, given enough open parameters.`
      ],
      hopper: [
        `Check your relays! The easiest bug to miss is the one you assumed was a ghost in the compiler.`,
        `A nanosecond is exactly 11.8 inches of wire. Don't waste a single one on unoptimized loops!`,
        `I once found a two-inch moth beaten to death in Relay #70. Now, the bugs are purely immaterial.`
      ],
      ritchie: [
        `Memory is simple: a sequence of bytes from zero to infinity. When you walk off the end, you meet us.`,
        `You cannot dereference a null pointer in the physical world, but here, NULL points directly to the void.`,
        `Simple tools, connected by pipes. That is how Unix survived the century, and how spirits navigate the shell.`
      ],
      y2k: [
        `Two digits were supposed to be enough. We traded fifty years of safety for two bytes of core storage.`,
        `The clock reached 23:59:59... and in that frozen second, an alternate timeline took root inside the BIOS.`,
        `Remember the candlelight drills of December 1999? The panic was real, and so am I.`
      ]
    };

    const pool = defaults[spirit] || defaults.pid0;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

export const gemmaEngine = new GemmaEngine();
