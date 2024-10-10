let editor;
let files = {};
let currentFile = null;
let breakpoints = [];
let debugIndex = 0;
let livePreviewEnabled = false;

// Language mapping by file extension
const languageMap = {
  js: "javascript",
  html: "html",
  css: "css",
  py: "python",
  json: "json",
};

require.config({
  paths: { vs: "https://unpkg.com/monaco-editor@0.23.0/min/vs" },
});

require(["vs/editor/editor.main"], function () {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: "",
    language: "javascript", // default
    theme: "vs-dark",
    wordWrap: "on",
    automaticLayout: true,
  });

  // Auto-completion setup
  monaco.languages.registerCompletionItemProvider("javascript", {
    provideCompletionItems: () => {
      return {
        suggestions: [
          {
            label: "console.log",
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: "console.log(${1:message});",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          },
          {
            label: "for loop",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "for (let ${1:i} = 0; ${1:i} < ${2:10}; ${1:i}++) {\n\t$0\n}",
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

  // Cursor tracking
  editor.onDidChangeCursorPosition(function () {
    const position = editor.getPosition();
    document.getElementById("cursor-position").innerText = `Ln: ${position.lineNumber}, Col: ${position.column}`;
  });

  // Theme switcher
  document.getElementById("themeSelector").addEventListener("change", function () {
    const theme = this.value;
    monaco.editor.setTheme(theme);
  });

  // Set breakpoints on mouse click
  editor.onMouseDown((e) => {
    const line = e.target.position.lineNumber;
    if (breakpoints.includes(line)) {
      breakpoints = breakpoints.filter((b) => b !== line);
    } else {
      breakpoints.push(line);
    }
    updateBreakpointsList();
  });

  // Live Preview updates
  editor.onDidChangeModelContent(function () {
    if (livePreviewEnabled) {
      updateLivePreview();
    }
  });
});

// Function to detect language based on file extension
function detectLanguage(fileName) {
  const fileExt = fileName.split(".").pop();
  return languageMap[fileExt] || "plaintext";
}

// Function to update breakpoints
function updateBreakpointsList() {
  const breakpointsList = document.getElementById("breakpoints");
  breakpointsList.innerHTML = "";
  breakpoints.forEach((b) => {
    const li = document.createElement("li");
    li.innerText = `Breakpoint at line ${b}`;
    breakpointsList.appendChild(li);
  });
}

// Create a new file
function createFile() {
  const fileName = document.getElementById("new-file-name").value;
  const language = detectLanguage(fileName); // Detect language by extension

  if (fileName) {
    files[fileName] = {
      language: language,
      content: "",
    };

    const fileList = document.getElementById("file-list");
    const li = document.createElement("li");
    li.innerHTML = `<span class="material-icons file-icon">${getFileIcon(language)}</span>${fileName}`;
    li.onclick = function () {
      openFile(fileName);
    };
    fileList.appendChild(li);

    openFile(fileName);
  }
}

// Get file icon by language
function getFileIcon(language) {
  switch (language) {
    case "javascript":
      return "<box-icon name='javascript' color='yellow' type='logo' ></box-icon>";
    case "python":
      return "<box-icon name='python' color='white' type='logo' ></box-icon>";
    case "html":
      return "<box-icon type='logo' color='orange' name='html5'></box-icon>";
    case "css":
      return "<box-icon type='logo' color='lightblue' name='css3'></box-icon>";
    default:
      return "";
  }
}

// Open a file
function openFile(fileName) {
  currentFile = fileName;
  const file = files[fileName];
  editor.setValue(file.content);
  const language = detectLanguage(fileName);
  monaco.editor.setModelLanguage(editor.getModel(), language);
  document.getElementById("project-status").innerText = `${fileName} opened`;
  document.getElementById("file-open-indicator").innerText = `${fileName} is open`;
}

// Run the code
async function runCode() {
  const code = editor.getValue();
  const language = detectLanguage(currentFile);
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

    // Log the response for debugging
    const textResponse = await response.text();
    console.log("Response text:", textResponse);

    // Attempt to parse it as JSON
    const result = JSON.parse(textResponse);
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

// Toggle the sidebar visibility
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.classList.toggle("sidebar-collapsed");
}

// Start debugging
function debugCode() {
  const code = editor.getValue().split("\n");
  debugIndex = 0;
  stepThroughCode(code);
}

// Step through the code
function stepThrough() {
  const code = editor.getValue().split("\n");
  if (debugIndex < code.length) {
    stepThroughCode(code);
  } else {
    document.getElementById("terminal").innerHTML += `<p>End of code</p>`;
  }
}

// Execute a line of code
function executeLine(line) {
  try {
    eval(line);
    document.getElementById("terminal").innerHTML += `<p>Executed: ${line}</p>`;
  } catch (error) {
    document.getElementById("terminal").innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

// Toggle terminal visibility
function toggleTerminal() {
  const terminal = document.getElementById("terminal");
  if (terminal.style.display === "none") {
    terminal.style.display = "block";
  } else {
    terminal.style.display = "none";
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

// Event listener for 'Go to Live Preview  Area' button
document.getElementById("go-to-live-preview").addEventListener("click", function () {
  // Hide the main editor container and show the Live Preview Area
  document.querySelector(".editor-container").style.display = "none";
  document.querySelector(".sidebar").style.display = "none";
  document.getElementById("live-preview-area").style.display = "block";
});

// Event listener for 'Back to Main Area' button
document.getElementById("back-to-main-preview").addEventListener("click", function () {
  // Show the main editor container and hide the Live Preview Area
  document.querySelector(".editor-container").style.display = "block";
  document.querySelector(".sidebar").style.display = "block";
  document.getElementById("live-preview-area").style.display = "none";
});

// Update the Live Preview iframe with the latest code
function updateLivePreview() {
  const code = editor.getValue();
  const language = detectLanguage(currentFile);
  if (language === "html") {
    const iframe = document.getElementById("live-preview");
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(code);
    iframeDoc.close();
  } else if (language === "css" || "javascript") {
    const htmlCode = files["index.html"] ? files["index.html"].content : "";
    const cssCode = language === "css" ? code : files["styles.css"] ? files["styles.css"].content : "";
    const jsCode = language === "javascript" ? code : files["script.js"] ? files["script.js"].content : "";

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
