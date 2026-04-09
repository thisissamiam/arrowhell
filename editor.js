window.addEventListener("DOMContentLoaded", () => {

  const editorEl = document.getElementById("editor");
  const lineNumbers = document.getElementById("lineNumbers");

  window.editor = editorEl;

  editorEl.value = ">>>[>.]";

  function updateLines(){
    const lines = editorEl.value.split("\n").length;

    let html = "";
    for(let i = 1; i <= Math.min(lines, 50000); i++){
      html += `<div>${i}</div>`;
    }

    lineNumbers.innerHTML = html;
  }

  editorEl.addEventListener("keydown", (e) => {

    if(e.key === "Tab"){
      e.preventDefault();

      const start = editorEl.selectionStart;
      editorEl.value =
        editorEl.value.substring(0, start) +
        "  " +
        editorEl.value.substring(editorEl.selectionEnd);

      editorEl.selectionStart = editorEl.selectionEnd = start + 2;
    }

    if(e.key === "Enter" && e.ctrlKey){
      e.preventDefault();
      if (window.runCode) window.runCode();
    }
  });

  editorEl.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editorEl.scrollTop;
  });

  editorEl.addEventListener("input", updateLines);

  updateLines();

});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch(err => console.log("SW failed:", err));
  });
}
