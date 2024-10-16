let editor;
let files = {};
let currentFile = null;
let breakpoints = [];
let debugIndex = 0;
let livePreviewEnabled = false;
let autosaveInterval;
let snippets = JSON.parse(localStorage.getItem('snippets')) || {}; // Load snippets from localStorage


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
  }, 30000); // Autosave every 30 seconds
  updateSnippetDropdown();

});

// Snippet Manager
function saveSnippet() {
  const snippetName = prompt("Enter a name for your snippet:");
  if (snippetName) {
    snippets[snippetName] = editor.getValue(); // Save current editor content as snippet
    localStorage.setItem('snippets', JSON.stringify(snippets)); // Store snippets in localStorage
    updateSnippetDropdown(); // Update the snippet dropdown
    alert(`Snippet "${snippetName}" saved!`);
  }
}

function insertSnippet() {
  const snippetDropdown = document.getElementById("snippetDropdown");
  const selectedSnippet = snippetDropdown.value;
  
  if (snippets[selectedSnippet]) {
    editor.setValue(editor.getValue() + '\n' + snippets[selectedSnippet]); // Insert snippet at the end
  }
}

function deleteSnippet() {
  const snippetDropdown = document.getElementById("snippetDropdown");
  const selectedSnippet = snippetDropdown.value;

  if (snippets[selectedSnippet]) {
    delete snippets[selectedSnippet]; // Remove from the snippets object
    localStorage.setItem('snippets', JSON.stringify(snippets)); // Update localStorage
    updateSnippetDropdown(); // Update the dropdown
    alert(`Snippet "${selectedSnippet}" deleted!`);
  }
}

// Update the snippet dropdown menu with current snippets
function updateSnippetDropdown() {
  const snippetDropdown = document.getElementById("snippetDropdown");
  snippetDropdown.innerHTML = "";

  for (let snippet in snippets) {
    const option = document.createElement("option");
    option.value = snippet;
    option.text = snippet;
    snippetDropdown.appendChild(option);
  }
}

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
    li.innerHTML = `<span class="material-icons file-icon">${getFileIcon(language)}</span>${fileName} <button class="delete-btn" onclick="deleteFile('${fileName}')">Delete</button>`;
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

// Delete a file
function deleteFile(fileName) {
  if (confirm(`Are you sure you want to delete ${fileName}?`)) {
    delete files[fileName]; // Remove file from memory
    document.getElementById("file-list").innerHTML = ""; // Clear the list
    Object.keys(files).forEach((file) => {
      createFileElement(file); // Recreate the file list
    });
    if (currentFile === fileName) {
      editor.setValue(""); // Clear editor if the open file is deleted
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

// Run the code
async function runCode() {
  const code = editor.getValue();
  const language = detectLanguage(currentFile);
  const terminal = document.getElementById("terminal");

  // Clear the terminal before running new code
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

    // Ensure line breaks are displayed correctly by converting \n to <br>
    const formattedOutput = result.output.replace(/\n/g, "<br>");
    terminal.innerHTML += `<p>${formattedOutput}</p>`;
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
document.getElementById("livePreviewButton").addEventListener("click", function () {
  window.location.href = "#live-preview";
});

// Update Live Preview area
function updateLivePreview() {
  const code = editor.getValue();
  const livePreviewIframe = document.getElementById("livePreviewIframe");
  const blob = new Blob([code], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  livePreviewIframe.src = url;
}

// Terminate script (for security or other purposes)
function terminateScript() {
  document.getElementById("terminal").innerHTML += `<p style="color: red;">Execution Terminated</p>`;
}
