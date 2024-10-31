let editor;
let files = {};
let currentFile = null;
let breakpoints = [];
let debugIndex = 0;
let livePreviewEnabled = false;
let autosaveInterval;
let terminalInputMode = false;
let inputCallback = null;


const languageMap = {
  js: "javascript",
  html: "html",
  css: "css",
  py: "python",
  json: "json",
};

// Monaco Editor Setup
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
          {
            
          }
        ],
      };
    },
  });


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

  // Set up autosave (every 30 seconds)
  autosaveInterval = setInterval(() => {
    if (currentFile) {
      saveFile(currentFile);
      document.getElementById("project-status").innerText = `${currentFile} autosaved at ${new Date().toLocaleTimeString()}`;
    }
  }, 30000); 
});


function detectLanguage(fileName) {
  const fileExt = fileName.split(".").pop();
  return languageMap[fileExt] || "plaintext";
}


function updateBreakpointsList() {
  const breakpointsList = document.getElementById("breakpoints");
  breakpointsList.innerHTML = "";
  breakpoints.forEach((b) => {
    const li = document.createElement("li");
    li.innerText = `Breakpoint at line ${b}`;
    breakpointsList.appendChild(li);
  });
}


function createFile() {
  const fileName = document.getElementById("new-file-name").value;
  const language = detectLanguage(fileName); 
  if (fileName) {
    files[fileName] = {
      language: language,
      content: "",
    };

    const fileList = document.getElementById("file-list");
    const li = document.createElement("li");
    li.innerHTML = `<span class="material-icons file-icon">${getFileIcon(language)}</span>${fileName} <button class="delete-btn" onclick="deleteFile('${fileName}')">Delete</button>`;
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
      return "<box-icon name='javascript' color='yellow' type='logo'></box-icon>";
    case "python":
      return "<box-icon name='python' color='white' type='logo'></box-icon>";
    case "html":
      return "<box-icon type='logo' color='orange' name='html5'></box-icon>";
    case "css":
      return "<box-icon type='logo' color='lightblue' name='css3'></box-icon>";
    default:
      return "";
  }
}


function openFile(fileName) {
  currentFile = fileName;
  const file = files[fileName];
  editor.setValue(file.content);
  const language = detectLanguage(fileName);
  monaco.editor.setModelLanguage(editor.getModel(), language);
  document.getElementById("project-status").innerText = `${fileName} opened`;
  document.getElementById("file-open-indicator").innerText = `${fileName} is open`;
}


function deleteFile(fileName) {
  if (confirm(`Are you sure you want to delete ${fileName}?`)) {
    delete files[fileName];
    document.getElementById("file-list").innerHTML = "";
    Object.keys(files).forEach((file) => {
      createFileElement(file); 
    });
    if (currentFile === fileName) { 
      editor.setValue(""); 
      document.getElementById("file-open-indicator").innerText = "No file opened";
    }
  }
}

// Helper to recreate file list
function createFileElement(fileName) {
  const language = detectLanguage(fileName);
  const fileList = document.getElementById("file-list");
  const li = document.createElement("li");
  li.innerHTML = `<span class="material-icons file-icon">${getFileIcon(language)}</span>${fileName} <button class="delete-btn" onclick="deleteFile('${fileName}')">Delete</button>`;
  li.onclick = function () {
    openFile(fileName);
  };
  fileList.appendChild(li);
}

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

    const result = await response.json();
    const formattedOutput = result.output.replace(/\n/g, "<br>");
    terminal.innerHTML += `<p>${formattedOutput}</p>`;
  } catch (error) {
    terminal.innerHTML += `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

// Handle terminal command input
document.getElementById("terminal-input").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    const userCommand = e.target.value.trim();
    e.target.value = ""; 

    handleTerminalCommand(userCommand);
  }
});

// Process terminal commands like 'clear', 'npm install', etc.
async function handleTerminalCommand(command) {
  const terminal = document.getElementById("terminal");

  if (command === "clear") {
    terminal.innerHTML = ""; // Clear terminal
  } else if (command.startsWith("npm install")) {
    terminal.innerHTML += `<p>Installing dependencies...</p>`;
    await mockInstallDependencies();
  } else if (command.startsWith("input")) {
    const inputPrompt = command.match(/input\s+"([^"]+)"/)[1];
    await handleInput(inputPrompt);
  } else {
    terminal.innerHTML += `<p>Unknown command: ${command}</p>`;
  }
}

async function mockInstallDependencies() {
  const terminal = document.getElementById("terminal");
  return new Promise((resolve) => {
    setTimeout(() => {
      terminal.innerHTML += `<p>Dependencies installed successfully!</p>`;
      resolve();
    }, 2000); 
  });
}

async function handleInput(promptText) {
  const terminal = document.getElementById("terminal");

  return new Promise((resolve) => {
    const userInput = prompt(promptText);
    terminal.innerHTML += `<p>User input: ${userInput}</p>`;
    resolve(userInput);
  });
}
