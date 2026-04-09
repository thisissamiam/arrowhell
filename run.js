function execute(ast, vars, out){
  for(const node of ast){
    if(node.type==="print"){
      if(node.dots===1) out.value+=String.fromCharCode(96+node.arrows);
      else if(node.dots===2) out.value+=String.fromCharCode(64+node.arrows);
      else if(node.dots===3) out.value+=String(node.arrows);
      else out.value+="?";
    }
    else if(node.type==="assign") vars[node.varIndex]=node.value;
    else if(node.type==="varPrint") out.value+=(vars[node.varIndex]||0);
    else if(node.type==="loop"){
      for(let i=0;i<node.count;i++) execute(node.body,vars,out);
    }
  }
}

function runCode(){
  const code = window.editor.value;

  try{
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(window.grammar));
    parser.feed(code);

    const ast = parser.results[0];

    let vars = {};
    let out = {value:""};

    execute(ast,vars,out);

    document.getElementById("output").textContent = out.value;
  }
  catch(e){
    document.getElementById("output").textContent = "Error";
  }
}
