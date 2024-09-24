let editor;
      let files = {};

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
                    monaco.languages.CompletionItemInsertTextRule
                      .InsertAsSnippet,
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

        editor.onDidChangeCursorPosition(function () {
          var position = editor.getPosition();
          document.getElementById(
            "cursor-position"
          ).innerText = `Ln: ${position.lineNumber}, Col: ${position.column}`;
        });

        document
          .getElementById("themeSelector")
          .addEventListener("change", function () {
            var theme = this.value;
            monaco.editor.setTheme(theme);
          });
      });

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
            return "python_s"; // Custom icon for Python
          case "html":
            return "html";
          default:
            return "";
        }
      }

      function openFile(fileName) {
        const file = files[fileName];
        editor.setValue(file.content);
        monaco.editor.setModelLanguage(editor.getModel(), file.language);
        document.getElementById(
          "project-status"
        ).innerText = `${fileName} opened`;
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

      function saveFile(fileName) {
        const file = files[fileName];
        file.content = editor.getValue();
        document.getElementById(
          "project-status"
        ).innerText = `${fileName} saved`;
      }