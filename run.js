window.addEventListener("DOMContentLoaded", () => {

  let worker = null;

  const runBtn = document.getElementById('runBtn');
  const stopBtn = document.getElementById('stopBtn');
  const outputEl = document.getElementById('output');

  function clearWorker() {
    if (worker) {
      worker.terminate();
      worker = null;
    }
    runBtn.disabled = false;
  }

  window.runCode = function runCode(){
    try {
      clearWorker();
      outputEl.textContent = "";

      const code = document.getElementById("editor").value;
      if (!code.trim()) {
        outputEl.textContent = "No code to run.";
        return;
      }

      runBtn.disabled = true;

      worker = new Worker('worker.js');

      else if (data.type === 'output') {
        outputEl.textContent += data.data;
      }
        if (!data) return;

        if (data.type === 'result') {
          outputEl.textContent = String(data.result);
          clearWorker();
        } else if (data.type === 'error') {
          outputEl.textContent = "Error: " + data.message;
          clearWorker();
        } else if (data.type === 'input-request') {
          const value = prompt(data.prompt || "Input:");
          worker.postMessage({ type: 'input-response', id: data.id, value });
        } else if (typeof data === 'string') {
          outputEl.textContent = data;
          clearWorker();
        }
      };

      worker.onerror = function(ev){
        const msg = ev.message || "Worker error";
        outputEl.textContent = "Error: " + msg;
        clearWorker();
      };

      worker.postMessage(code);

    } catch (err) {
      outputEl.textContent = "Error: " + err.message;
      clearWorker();
    }
  };

  runBtn.addEventListener('click', window.runCode);

  stopBtn.addEventListener('click', () => {
    if(worker){
      worker.terminate();
      worker = null;
      outputEl.textContent = "Execution terminated.";
      runBtn.disabled = false;
    }
  });

});
