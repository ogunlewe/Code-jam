let editor;
let files = {};
let currentFile = null;
let breakpoints = [];
let debugIndex = 0;
let livePreviewEnabled = false;

require.config({
  paths: { vs: "https://unpkg.com/monaco-editor@0.23.0/min/vs" },
});

require(["vs/editor/editor.main"], function () {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: "",
    language: "javascript",
    theme: "vs-dark",
    wordWrap: "on",
    automaticLayout: true,
  });

  // Add auto-completion
  monaco.languages.registerCompletionItemProvider("javascript", {
    provideCompletionItems: () => {
      return {
        suggestions: [
          {
            label: "console.log",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "console.log(${1:message});",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          },
          {
            label: "for loop",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "for (let ${1:i} = 0; ${1:i} < ${2:10}; ${1:i}++) {\n\t$0\n}",
          },
          {
            label: "if statement",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "if (${1:condition}) {\n\t$0\n}",
          },
        ],
      };
    },
  });

  // Cursor position tracking
  editor.onDidChangeCursorPosition(function () {
    var position = editor.getPosition();
    document.getElementById(
      "cursor-position"
    ).innerText = `Ln: ${position.lineNumber}, Col: ${position.column}`;
  });

  // Theme switcher
  document
    .getElementById("themeSelector")
    .addEventListener("change", function () {
      var theme = this.value;
      monaco.editor.setTheme(theme);
    });

  // Add click to set breakpoints
  editor.onMouseDown((e) => {
    const line = e.target.position.lineNumber;
    if (breakpoints.includes(line)) {
      breakpoints = breakpoints.filter((b) => b !== line);
    } else {
      breakpoints.push(line);
    }
    updateBreakpointsList();
  });

  // Live Preview update when code changes
  editor.onDidChangeModelContent(function () {
    if (livePreviewEnabled) {
      updateLivePreview();
    }
  });
});

// Function to update the breakpoints display
function updateBreakpointsList() {
  const breakpointsList = document.getElementById("breakpoints");
  breakpointsList.innerHTML = "";
  breakpoints.forEach((b) => {
    const li = document.createElement("li");
    li.innerText = `Breakpoint at line ${b}`;
    breakpointsList.appendChild(li);
  });
}

// Function to create a file
function createFile() {
  const fileName = document.getElementById("new-file-name").value;
  const language = document.getElementById("languageSelector").value;

  if (fileName) {
    files[fileName] = {
      language: language,
      content: "",
    };

    const fileList = document.getElementById("file-list");
    const li = document.createElement("li");
    li.innerHTML = `<span class="material-icons file-icon">${getFileIcon(
      language
    )}</span>${fileName}`;
    li.onclick = function () {
      openFile(fileName);
    };
    fileList.appendChild(li);

    openFile(fileName);
  }
}

function getFileIcon(language) {
  switch (language) {
    case "javascript":
      return "js";
    case "python":
      return "python_s";
    case "html":
      return "html";
    default:
      return "";
  }
}

function openFile(fileName) {
  currentFile = fileName;
  const file = files[fileName];
  editor.setValue(file.content);
  monaco.editor.setModelLanguage(editor.getModel(), file.language);
  document.getElementById("project-status").innerText = `${fileName} opened`;
  document.getElementById(
    "file-open-indicator"
  ).innerText = `${fileName} is open`;
}

async function runCode() {
  const code = editor.getValue();
  const language = document.getElementById("languageSelector").value;
  const terminal = document.getElementById("terminal");

  terminal.innerHTML += `<p>Running code...</p>`;

  try {
    const response = await fetch("/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: language,
        code: code,
      }),
    });

    const result = await response.json();
    terminal.innerHTML += `<p>${result.output}</p>`;
  } catch (error) {
    terminal.innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

// Save the file
function saveFile(fileName) {
  const file = files[fileName];
  file.content = editor.getValue();
  document.getElementById("project-status").innerText = `${fileName} saved`;
}

// Start debugging session
function debugCode() {
  const code = editor.getValue().split("\n");
  debugIndex = 0;
  stepThroughCode(code);
}

// Step through code
function stepThrough() {
  const code = editor.getValue().split("\n");
  if (debugIndex < code.length) {
    stepThroughCode(code);
  } else {
    document.getElementById("terminal").innerHTML += `<p>End of code</p>`;
  }
}

// Function to step through code and hit breakpoints
function stepThroughCode(code) {
  const line = debugIndex + 1; // Line numbers start at 1
  if (breakpoints.includes(line)) {
    document.getElementById(
      "terminal"
    ).innerHTML += `<p>Paused at line ${line}: ${code[debugIndex]}</p>`;
  } else {
    executeLine(code[debugIndex]);
    debugIndex++;
  }
}

// Execute a line of code (JavaScript)
function executeLine(line) {
  try {
    eval(line);
    document.getElementById("terminal").innerHTML += `<p>Executed: ${line}</p>`;
  } catch (error) {
    document.getElementById(
      "terminal"
    ).innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

// Toggle Live Preview
function toggleLivePreview() {
  livePreviewEnabled = !livePreviewEnabled;
  document.getElementById("livePreviewStatus").innerText = livePreviewEnabled
    ? "Live Preview ON"
    : "Live Preview OFF";
  if (livePreviewEnabled) {
    updateLivePreview();
  }
}

// Update the Live Preview iframe with the latest code
function updateLivePreview() {
  const code = editor.getValue();
  const language = document.getElementById("languageSelector").value;
  if (language === "html") {
    const iframe = document.getElementById("live-preview");
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(code);
    iframeDoc.close();
  } else if (language === "css" || language === "javascript") {
    const htmlCode = files["index.html"] ? files["index.html"].content : "";
    const cssCode =
      language === "css"
        ? code
        : files["styles.css"]
        ? files["styles.css"].content
        : "";
    const jsCode =
      language === "javascript"
        ? code
        : files["script.js"]
        ? files["script.js"].content
        : "";

    const fullCode = `
      <html>
      <head>
        <style>${cssCode}</style>
      </head>
      <body>
        ${htmlCode}
        <script>${jsCode}</script>
      </body>
      </html>
    `;
    const iframe = document.getElementById("live-preview");
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(fullCode);
    iframeDoc.close();
  }
}
