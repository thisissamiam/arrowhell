// Put this in worker.js
self.onmessage = function(e){
  const code = e.data;
  try{
    const result = interpret(code);
    self.postMessage({ type: "result", result });
  } catch(err){
    self.postMessage({ type: "error", message: err.message });
  }
};

function interpret(code){
  const vars = new Map();

  const symbols = [
    "!", "@", "#", "$", "%", "^", "&", "*", "(", ")",
    "-", "_", "=", "+", "[", "]", "{", "}", ";", ":",
    "'", "\"", ",", "<", ">", ".", "/", "?", "\\", "|", "`", "~"
  ];

  function runBlock(codeSlice, baseOffset){
    const parts = [];
    let idx = 0;

    while(idx < codeSlice.length){
      const ch = codeSlice[idx];

      if(/\s/.test(ch)){ idx++; continue; }

      if(ch === ">"){
        let arrows = 0;
        while(idx < codeSlice.length && codeSlice[idx] === ">"){ arrows++; idx++; }

        if(idx < codeSlice.length && codeSlice[idx] === "["){
          idx++;
          const bodyStart = idx;
          let depth = 1;
          while(idx < codeSlice.length && depth > 0){
            if(codeSlice[idx] === "[") depth++;
            else if(codeSlice[idx] === "]") depth--;
            idx++;
          }
          const bodyEnd = idx - 1;
          const body = codeSlice.substring(bodyStart, bodyEnd);
          const sub = runBlock(body, baseOffset + bodyStart).join("");
          for(let j = 0; j < arrows; j++) parts.push(sub);
        }

        else if(idx < codeSlice.length && codeSlice[idx] === "."){
          let dots = 0;
          const dotsStart = idx;
          while(idx < codeSlice.length && codeSlice[idx] === "."){ dots++; idx++; }

          if(dots === 1) parts.push(String.fromCharCode(96 + arrows));
          else if(dots === 2) parts.push(String.fromCharCode(64 + arrows));
          else if(dots === 3) parts.push(String(arrows));
          else if(dots === 4) parts.push(symbols[(arrows - 1) % symbols.length]);
          else {
            const absolutePos = baseOffset + dotsStart;
            throw new Error(`Too many dots (${dots}) starting at index ${absolutePos}. Maximum allowed per print is 4.`);
          }
        }

        else if(idx + 1 < codeSlice.length && codeSlice[idx] === "-" && codeSlice[idx + 1] === ">"){
          idx += 2;
          parts.push(String(vars.get(arrows) || 0));
        }

        else if(idx + 2 < codeSlice.length && codeSlice[idx] === "-" && codeSlice[idx + 1] === "=" && codeSlice[idx + 2] === ">"){
          idx += 3;
          let value = 0;
          while(idx < codeSlice.length && codeSlice[idx] === "."){ value++; idx++; }
          vars.set(arrows, value);
        }

        else { idx++; }
      } else { idx++; }
    }

    return parts;
  }

  return runBlock(code, 0).join("");
}
