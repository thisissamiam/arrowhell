let inputCounter = 0;
const pendingInputs = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

self.onmessage = async function(e){
  try {
    const data = e.data;

    if (data && data.type === 'input-response') {
      const resolver = pendingInputs.get(data.id);
      if (resolver) {
        resolver(data.value);
        pendingInputs.delete(data.id);
      }
      return;
    }

    const code = typeof data === 'string' ? data : String(data || "");
    await interpret(code);

    self.postMessage({ type: 'done' });

  } catch (err) {
    const msg = err?.message || String(err);
    self.postMessage({ type: 'error', message: msg });
  }
};

function requestInput(promptText) {
  const id = ++inputCounter;
  const p = new Promise(resolve => pendingInputs.set(id, resolve));
  self.postMessage({ type: 'input-request', id, prompt: promptText || "" });
  return p;
}

// 🔥 dynamic wait parser
function parseWait(code, startIdx) {
  let idx = startIdx + 1;
  let multiplier = 1;
  let arrows = 0;

  while (idx < code.length) {
    const ch = code[idx];

    if (ch === "+") multiplier *= 10;
    else if (ch === "-") multiplier *= 0.1;
    else if (ch === ">") arrows++;
    else break;

    idx++;
  }

  if (arrows === 0) return null;

  return {
    time: arrows * multiplier * 1000,
    length: idx - startIdx
  };
}

// --- interpreter ---
async function interpret(code) {
  const vars = new Map();

  const symbols = [
    "!", "@", "#", "$", "%", "^", "&", "*", "(", ")",
    "-", "_", "=", "+", "[", "]", "{", "}", ";", ":",
    "'", "\"", ",", "<", ">", ".", "/", "?", "\\", "|", "`", "~"
  ];

  async function runBlock(codeSlice, baseOffset){
    let idx = 0;

    while (idx < codeSlice.length) {

      // 🔥 WAIT
      if (codeSlice[idx] === "#") {
        const wait = parseWait(codeSlice, idx);
        if (wait) {
          await sleep(wait.time);
          idx += wait.length;
          continue;
        }
      }

      const ch = codeSlice[idx];

      if (/\s/.test(ch)) {
        idx++;
        continue;
      }

      if (ch === ">") {
        let arrows = 0;
        while (idx < codeSlice.length && codeSlice[idx] === ">") {
          arrows++;
          idx++;
        }

        // LOOP (REAL-TIME)
        if (idx < codeSlice.length && codeSlice[idx] === "[") {
          idx++;
          const bodyStart = idx;
          let depth = 1;

          while (idx < codeSlice.length && depth > 0) {
            if (codeSlice[idx] === "[") depth++;
            else if (codeSlice[idx] === "]") depth--;
            idx++;
          }

          const bodyEnd = idx - 1;
          const body = codeSlice.substring(bodyStart, bodyEnd);

          for (let j = 0; j < arrows; j++) {
            await runBlock(body, baseOffset + bodyStart);
          }
        }

        // PRINT (STREAMED)
        else if (idx < codeSlice.length && codeSlice[idx] === ".") {
          let dots = 0;
          while (idx < codeSlice.length && codeSlice[idx] === ".") {
            dots++;
            idx++;
          }

          let out = "";

          if (dots === 1) out = String.fromCharCode(96 + arrows);
          else if (dots === 2) out = String.fromCharCode(64 + arrows);
          else if (dots === 3) out = String(arrows);
          else if (dots === 4) {
            out = symbols[(arrows - 1) % symbols.length];
          } else {
            throw new Error(`Too many dots at index ${baseOffset}`);
          }

          // 🔥 STREAM OUTPUT
          self.postMessage({ type: "output", data: out });
        }

        // VAR PRINT (STREAMED)
        else if (
          idx + 1 < codeSlice.length &&
          codeSlice[idx] === "-" &&
          codeSlice[idx + 1] === ">"
        ) {
          idx += 2;
          const v = vars.has(arrows) ? vars.get(arrows) : 0;
          self.postMessage({ type: "output", data: String(v) });
        }

        else {
          idx++;
        }
      } else {
        idx++;
      }
    }
  }

  await runBlock(code, 0);
}
