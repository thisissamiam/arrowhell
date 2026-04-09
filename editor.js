const editorEl = document.getElementById("editor");
const lineNumbers = document.getElementById("lineNumbers");

// expose globally so run.js can use it
window.editor = editorEl;

editorEl.value = ">>>[>.]";

// line numbers
function updateLines(){
  const count = editorEl.value.split("\n").length;
  lineNumbers.innerHTML = Array.from({length:count},(_,i)=>i+1).join("<br>");
}

// tab support
editorEl.addEventListener("keydown", (e)=>{
  if(e.key === "Tab"){
    e.preventDefault();
    const start = editorEl.selectionStart;
    editorEl.value =
      editorEl.value.substring(0,start) +
      "  " +
      editorEl.value.substring(editorEl.selectionEnd);
    editorEl.selectionStart = editorEl.selectionEnd = start + 2;
  }

  // 🚀 CTRL + ENTER TO RUN
  if(e.key === "Enter" && e.ctrlKey){
    e.preventDefault();
    runCode();
  }
});

// scroll sync
editorEl.addEventListener("scroll", ()=>{
  lineNumbers.scrollTop = editorEl.scrollTop;
});

editorEl.addEventListener("input", updateLines);

updateLines();
