const canvas = document.getElementById("whiteboard");
const stickyNotesContainer = document.getElementById("stickyNotesContainer");
const ctx = canvas.getContext("2d");
let painting = false;
let color = "#000000";
let brushSize = 5;
let currentTool = "draw"; // 'draw', 'rectangle', 'text', 'eraser'
let startX, startY;
let selectedElement = null; // Store the selected element

// Start drawing
function startPosition(e) {
  painting = true;
  startX = e.clientX - canvas.offsetLeft;
  startY = e.clientY - canvas.offsetTop;
  if (currentTool === "rectangle" || currentTool === "text") {
    ctx.beginPath();
  }
}

// End drawing
function endPosition(e) {
  if (!painting) return;
  if (currentTool === "rectangle") {
    const rectWidth = e.clientX - canvas.offsetLeft - startX;
    const rectHeight = e.clientY - canvas.offsetTop - startY;
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.strokeRect(startX, startY, rectWidth, rectHeight);
  } else if (currentTool === "text") {
    const text = prompt("Enter your text:");
    if (text) {
      ctx.font = `${brushSize * 4}px Arial`;
      ctx.fillStyle = color;
      ctx.fillText(text, startX, startY);
    }
  }
  painting = false;
  ctx.beginPath(); // Begin a new path for the next stroke
  saveState();
}

// Draw on the canvas
function draw(e) {
  if (!painting) return;

  if (currentTool === "draw") {
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round"; // Rounded edges for smoother lines
    ctx.strokeStyle = color; // Set color to the current selected color

    // Get the current mouse position and draw a line
    ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
  } else if (currentTool === "eraser") {
    ctx.clearRect(
      e.clientX - canvas.offsetLeft,
      e.clientY - canvas.offsetTop,
      brushSize,
      brushSize
    );
  }
}

// Event listeners for mouse actions
canvas.addEventListener("mousedown", startPosition);
canvas.addEventListener("mouseup", endPosition);
canvas.addEventListener("mousemove", draw);

// Event listeners for color and brush size changes
document
  .getElementById("colorPicker")
  .addEventListener("input", (e) => (color = e.target.value));
document
  .getElementById("brushSize")
  .addEventListener("input", (e) => (brushSize = e.target.value));

// Tool Selection
document
  .getElementById("drawTool")
  .addEventListener("click", () => (currentTool = "draw"));
document
  .getElementById("eraserTool")
  .addEventListener("click", () => (currentTool = "eraser"));
document
  .getElementById("rectangleTool")
  .addEventListener("click", () => (currentTool = "rectangle"));
document
  .getElementById("textTool")
  .addEventListener("click", () => (currentTool = "text"));

// Add sticky notes
function addStickyNote() {
  const stickyNote = document.createElement("div");
  stickyNote.className = "sticky-note";
  stickyNote.contentEditable = true;
  stickyNote.innerText = "Double-click to edit...";
  stickyNote.style.position = "absolute";
  stickyNote.style.top = "100px";
  stickyNote.style.left = "100px";
  stickyNote.addEventListener("click", selectElement);
  stickyNotesContainer.appendChild(stickyNote);
  makeDraggable(stickyNote);
  saveState();
}

// Make elements draggable
function makeDraggable(element) {
  let offsetX, offsetY;

  element.addEventListener("mousedown", function (e) {
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  });

  function mouseMoveHandler(e) {
    element.style.left = `${e.clientX - offsetX}px`;
    element.style.top = `${e.clientY - offsetY}px`;
  }

  function mouseUpHandler() {
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", mouseUpHandler);
    saveState();
  }
}

// Handle file uploads
document
  .getElementById("fileUpload")
  .addEventListener("change", handleFileUpload);

function handleFileUpload(event) {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();

    if (file.type.startsWith("image/")) {
      reader.onload = function (e) {
        addImageToCanvas(e.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      reader.onload = function (e) {
        addPDFToCanvas(e.target.result);
      };
      reader.readAsArrayBuffer(file);
    }
  }
}

function addImageToCanvas(imageSrc) {
  const img = new Image();
  img.src = imageSrc;
  img.style.position = "absolute";
  img.style.top = "150px";
  img.style.left = "150px";
  img.className = "canvas-element";
  img.addEventListener("click", selectElement);
  stickyNotesContainer.appendChild(img);
  makeDraggable(img);
  saveState();
}

function addPDFToCanvas(pdfArrayBuffer) {
  const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const embed = document.createElement("embed");
  embed.src = pdfUrl;
  embed.type = "application/pdf";
  embed.className = "whiteboard-pdf canvas-element";
  embed.style.position = "absolute";
  embed.style.width = "200px";
  embed.style.height = "200px";
  embed.style.top = "150px";
  embed.style.left = "150px";
  embed.addEventListener("click", selectElement);

  stickyNotesContainer.appendChild(embed);
  makeResizable(embed);
  makeDraggable(embed);
  saveState();
}

// Make elements resizable
function makeResizable(element) {
  element.style.resize = "both";
  element.style.overflow = "auto";

  const closeButton = document.createElement("button");
  closeButton.innerText = "X";
  closeButton.className = "close-button";
  closeButton.addEventListener("click", () => {
    element.remove();
    saveState();
  });

  element.appendChild(closeButton);
}

// Select an element on click
function selectElement(e) {
  if (selectedElement) {
    selectedElement.style.border = ""; // Remove highlight from previously selected element
  }
  selectedElement = e.target;
  selectedElement.style.border = "2px dashed #FF0000"; // Highlight selected element
  document.getElementById("deleteButton").disabled = false; // Enable delete button
}

// Delete the selected element
function deleteSelectedElement() {
  if (selectedElement) {
    selectedElement.remove();
    selectedElement = null;
    document.getElementById("deleteButton").disabled = true;
    saveState();
  }
}

// Save the current state
function saveState() {
  const canvasData = canvas.toDataURL();
  const stickyNotesData = Array.from(stickyNotesContainer.children).map(
    (note) => {
      return {
        content: note.innerHTML,
        top: note.style.top,
        left: note.style.left,
        width: note.style.width,
        height: note.style.height,
      };
    }
  );

  localStorage.setItem("canvasData", canvasData);
  localStorage.setItem("stickyNotesData", JSON.stringify(stickyNotesData));
}

// Load saved state
function loadState() {
  const canvasData = localStorage.getItem("canvasData");
  const stickyNotesData = JSON.parse(localStorage.getItem("stickyNotesData"));

  if (canvasData) {
    const img = new Image();
    img.src = canvasData;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
  }

  if (stickyNotesData) {
    stickyNotesData.forEach((noteData) => {
      const stickyNote = document.createElement("div");
      stickyNote.className = "sticky-note";
      stickyNote.style.position = "absolute";
      stickyNote.style.top = noteData.top;
      stickyNote.style.left = noteData.left;
      stickyNote.style.width = noteData.width;
      stickyNote.style.height = noteData.height;
      stickyNote.innerHTML = noteData.content;
      stickyNote.addEventListener("click", selectElement);
      stickyNotesContainer.appendChild(stickyNote);
      makeDraggable(stickyNote);
      makeResizable(stickyNote);
    });
  }
}

// Clear the canvas and sticky notes
function clearWhiteboard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.querySelectorAll(".sticky-note").forEach((note) => note.remove());
  localStorage.removeItem("canvasData");
  localStorage.removeItem("stickyNotesData");
}

// Event listener for 'Go to Brainstorm Area' button
document.getElementById("start-draw").addEventListener("click", function () {
  // Hide the main editor container and show the Brainstorm Area
  document.querySelector(".editor-container").style.display = "none";
  document.querySelector(".sidebar").style.display = "none";
  document.getElementById("brainstorm-area").style.display = "block";
});

// Event listener for 'Back to Main Area' button
document.getElementById("back-to-main").addEventListener("click", function () {
  // Show the main editor container and hide the Brainstorm Area
  document.querySelector(".editor-container").style.display = "block";
  document.querySelector(".sidebar").style.display = "block";
  document.getElementById("brainstorm-area").style.display = "none";
});

// Event listeners
document
  .getElementById("addStickyNoteButton")
  .addEventListener("click", addStickyNote);
document
  .getElementById("clearButton")
  .addEventListener("click", clearWhiteboard);
document
  .getElementById("deleteButton")
  .addEventListener("click", deleteSelectedElement);

// Load the state when the page loads
window.onload = loadState;
