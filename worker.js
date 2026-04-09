// Worker-based ArrowHell interpreter.
// Receives: a string (the code) posted by main thread.
// Posts:
//  - { type: 'result', result }
//  - { type: 'error', message }
//  - { type: 'input-request', id, prompt }
// Expects input-response messages of shape:
//  { type: 'input-response', id, value }

let inputCounter = 0;
const pendingInputs = new Map();

// handle responses from main thread
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

    // otherwise data is the code string to interpret
    const code = typeof data === 'string' ? data : String(data || "");
    const result = await interpret(code);
    self.postMessage({ type: 'result', result });
  } catch (err) {
    // Send a useful error message back
    const msg = err && err.message ? err.message : String(err);
    self.postMessage({ type: 'error', message: msg });
  }
};

// ask main thread for input, return a promise that resolves when main replies
function requestInput(promptText) {
  const id = ++inputCounter;
  const p = new Promise(resolve => pendingInputs.set(id, resolve));
  self.postMessage({ type: 'input-request', id, prompt: promptText || "" });
  return p;
}

// async interpreter so it can await requestInput()
async function interpret(code) {
  const vars = new Map();

  const symbols = [
    "!", "@", "#", "$", "%", "^", "&", "*", "(", ")",
    "-", "_", "=", "+", "[", "]", "{", "}", ";", ":",
    "'", "\"", ",", "<", ">", ".", "/", "?", "\\", "|", "`", "~"
  ];

  async function runBlock(codeSlice, baseOffset){
    const parts = [];
    let idx = 0;

    while (idx < codeSlice.length) {
      const ch = codeSlice[idx];

      // skip whitespace
      if (/\s/.test(ch)) {
        idx++;
        continue;
      }

      if (ch === ">") {
        // read arrows
        let arrows = 0;
        while (idx < codeSlice.length && codeSlice[idx] === ">") { arrows++; idx++; }

        // LOOP
        if (idx < codeSlice.length && codeSlice[idx] === "[") {
          idx++; // skip '['
          const bodyStart = idx;
          let depth = 1;
          while (idx < codeSlice.length && depth > 0) {
            if (codeSlice[idx] === "[") depth++;
            else if (codeSlice[idx] === "]") depth--;
            idx++;
          }
          const bodyEnd = idx - 1;
          const body = codeSlice.substring(bodyStart, bodyEnd);

          const sub = await runBlock(body, baseOffset + bodyStart);
          const subJoined = sub.join("");
          for (let j = 0; j < arrows; j++) parts.push(subJoined);
        }

        // PRINT
        else if (idx < codeSlice.length && codeSlice[idx] === ".") {
          let dots = 0;
          const dotsStart = idx;
          while (idx < codeSlice.length && codeSlice[idx] === ".") { dots++; idx++; }

          if (dots === 1) {
            parts.push(String.fromCharCode(96 + arrows)); // lowercase
          } else if (dots === 2) {
            parts.push(String.fromCharCode(64 + arrows)); // uppercase
          } else if (dots === 3) {
            parts.push(String(arrows)); // numeric
          } else if (dots === 4) {
            const sym = symbols[(arrows - 1) % symbols.length];
            parts.push(sym);
          } else {
            const absolutePos = baseOffset + dotsStart;
            throw new Error(`Too many dots (${dots}) starting at index ${absolutePos}. Maximum allowed per print is 4.`);
          }
        }

        // VAR PRINT (->)
        else if (idx + 1 < codeSlice.length && codeSlice[idx] === "-" && codeSlice[idx + 1] === ">") {
          idx += 2;
          const v = vars.has(arrows) ? vars.get(arrows) : 0;
          parts.push(String(v));
        }

        // ASSIGN (-=>) or ASSIGN WITH INPUT (-=`<...>`)
        else if (idx + 2 < codeSlice.length && codeSlice[idx] === "-" && codeSlice[idx + 1] === "=" && codeSlice[idx + 2] === ">") {
          idx += 3;
          // classic assign using dots as value
          let value = 0;
          while (idx < codeSlice.length && codeSlice[idx] === ".") { value++; idx++; }
          vars.set(arrows, value);
        } else if (idx + 2 < codeSlice.length && codeSlice[idx] === "-" && codeSlice[idx + 1] === "`" && codeSlice[idx + 2] === "<") {
          // NEW: input-assign syntax: -=`<prompt>`
          // we've seen "-`<" here; read until '>'
          idx += 3; // move to first char of prompt (or immediately at '>' if empty)
          const promptStart = idx;
          while (idx < codeSlice.length && codeSlice[idx] !== ">") idx++;
          if (idx >= codeSlice.length) {
            throw new Error("Unterminated input prompt; expected '>' to close prompt.");
          }
          const promptText = codeSlice.substring(promptStart, idx);
          idx++; // skip '>'
          // request input from main thread and await it
          const userValue = await requestInput(promptText);
          // store numeric if possible, otherwise store string
          const num = Number(userValue);
          const stored = Number.isFinite(num) && String(userValue).trim() !== "" ? num : (userValue === null ? "" : String(userValue));
          vars.set(arrows, stored);
        }

        else {
          // unknown sequence, skip to avoid infinite loop
          idx++;
        }
      } else {
        idx++;
      }
    }

    return parts;
  }

  const outParts = await runBlock(code, 0);
  return outParts.join("");
}
