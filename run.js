function runCode(){
  const code = window.editor.value;
  try{
    const result = interpret(code);
    document.getElementById("output").textContent = result;
  } catch(e){
    console.error("Run error:", e);
    document.getElementById("output").textContent = "Error: " + e.message;
  }
}

function interpret(code){
  let i = 0;
  let vars = {};
  let output = "";

  function readArrows(){
    let count = 0;
    while(i < code.length && code[i] === ">"){
      count++;
      i++;
    }
    return count;
  }

  function readDots(){
    let count = 0;
    while(i < code.length && code[i] === "."){
      count++;
      i++;
    }
    return count;
  }

  function runBlock(){
    let result = "";

    while(i < code.length){
      // skip whitespace
      if(/\s/.test(code[i])){
        i++;
        continue;
      }

      // loop start
      if(code[i] === ">"){
        let arrows = readArrows();

        // LOOP
        if(i < code.length && code[i] === "["){
          i++; // skip [
          let bodyStart = i;

          let depth = 1;
          while(i < code.length && depth > 0){
            if(code[i] === "[") depth++;
            else if(code[i] === "]") depth--;
            i++;
          }

          let bodyEnd = i - 1;
          let body = code.slice(bodyStart, bodyEnd);

          for(let j=0;j<arrows;j++){
            result += interpret(body);
          }
        }

        // PRINT
        else if(i < code.length && code[i] === "."){
          let dots = readDots();

          if(dots === 1) result += String.fromCharCode(96 + arrows);
          else if(dots === 2) result += String.fromCharCode(64 + arrows);
          else if(dots === 3) result += String(arrows);
          else result += "?";
        }

        // VAR PRINT
        else if(i + 1 < code.length && code[i] === "-" && code[i+1] === ">"){
          i += 2;
          result += (vars[arrows] || 0);
        }
        
        // ASSIGN
        else if(i + 2 < code.length && code[i] === "-" && code[i+1] === "=" && code[i+2] === ">"){
          i += 3;
          let value = readDots();
          vars[arrows] = value;
        }
        else {
          // fallback
          i++;
        }
      } else {
        i++;
      }
    }

    return result;
  }

  return runBlock();
}
