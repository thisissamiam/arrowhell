let worker = null;

function runCode(){
  if(worker) worker.terminate();
  worker = new Worker('worker.js');
  const code = window.editor.value;
  document.getElementById("output").textContent = "Running...";
  worker.onmessage = function(e){
    if(e.data.type === 'result'){
      document.getElementById("output").textContent = e.data.result;
    } else if(e.data.type === 'error'){
      document.getElementById("output").textContent = "Error: " + e.data.message;
    }
    worker.terminate();
    worker = null;
  };
  worker.onerror = function(err){
    document.getElementById("output").textContent = "Error: " + err.message;
    worker.terminate();
    worker = null;
  };
  worker.postMessage(code);
}

document.getElementById("stopBtn").addEventListener("click", () => {
  if(worker){
    worker.terminate();
    worker = null;
    document.getElementById("output").textContent = "Execution terminated.";
  }
});
