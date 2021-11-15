const Types = [
  ["Bug", "Dragon", "Electric", "Fighting", "Fire", "Flying", "Ghost", "Grass", "Ground", "Ice", "Normal", "Poison", "Psychic", "Rock", "Water"],
  ["Bug", "Dark", "Dragon", "Electric", "Fighting", "Fire", "Flying", "Ghost", "Grass", "Ground", "Ice", "Normal", "Poison", "Psychic", "Rock", "Steel", "Water"],
  ["Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting", "Fire", "Flying", "Ghost", "Grass", "Ground", "Ice", "Normal", "Poison", "Psychic", "Rock", "Steel", "Water"],
]
let typeIndex = 1;

// Setup events and initialize tracker board

window.addEventListener("load", () => {
  let generationSelect = document.getElementById("generationSelect");
  typeIndex = generationSelect.selectedIndex;
  const mainDiv = document.getElementById("main");
  fillBoard(mainDiv);

  mainDiv.addEventListener("click", (ev) => { modifyMarkBy(ev.target, 1); ev.preventDefault(); });
  mainDiv.addEventListener("contextmenu", (ev) => { modifyMarkBy(ev.target, -1); ev.preventDefault(); });
  mainDiv.addEventListener("mouseleave", unHighlight(mainDiv));
  
  generationSelect.addEventListener("change", selectGeneration);

  document.getElementById("uploadLogButton").addEventListener("click", uploadLog);
  document.getElementById("verifyLogButton").addEventListener("click", verifyLog);

  document.getElementById("toggleCSVButton").addEventListener("click", toggleConfirmationCSV);
  document.getElementById("saveCSVButton").addEventListener("click", saveConfirmationCSV);
});

//#region Utility Functions

function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function clearChildren(element) {
  while (element.children.length > 0) element.removeChild(element.firstChild);
}

function clampValue(min, max, value) {
  return Math.min(max, Math.max(min, value));
}

// javascript nonsense...
function isString(x) {
  return (typeof x == 'string') || (x instanceof String);
}

//#endregion Utility Functions
//#region Tracker board setup

function fillBoard(div) {
  clearChildren(div);
  div.append(htmlToElement(`<div class="top-of-type-table-blank"><span>0</span></div>`));
  div.append(...Types[typeIndex].map(type => htmlToElement(`<div class="type-table-header"><img title="${type}" src="types/Icon_${type}.webp" /></div>`)));
  div.append(...Types[typeIndex].flatMap(type => [
    htmlToElement(`<div class="type-table-header"><img title="${type}" src="types/Icon_${type}.webp"/></div>`),
    ...Types[typeIndex].map(_ => htmlToElement(`<div class="type-table-blank" data-mark="0"></div>`))]
  ));
  [...div.children].forEach((el, idx) => {
    el.addEventListener("mouseenter", highlight(div, idx));
  })

  document.body.style.setProperty("--columns", Types[typeIndex].length + 1);

  updateData();

  div.children[0].addEventListener("click", toggleCountingDirection);
}

function selectGeneration(ev) {
  const main = document.getElementById("main");
  if ([...main.children].some((element) => element.dataset.mark && element.dataset.mark != 0) && !confirm("You have data in the tracker. Adding or removing a type will reset all tracked data.\nDo you want to continue and reset all data?")) {
    ev.target.selectedIndex = typeIndex;
    return;
  }
  typeIndex = ev.target.selectedIndex;
  fillBoard(main);
}

//#endregion Tracker board setup
//#region Highlighting

function highlight(div, idx) {
  return () => {
    const colCount = Types[typeIndex].length + 1;
    const col = idx % colCount;
    const row = Math.floor(idx / colCount);
    [...div.children].forEach((el, jdx) => {
      const colj = jdx % colCount;
      const rowj = Math.floor(jdx / colCount);
      const sameCol = col != 0 && colj == col;
      const sameRow = row != 0 && rowj == row;
      el.classList.remove("highlighted", "highlighted-row", "highlighted-column");
      if (!(sameCol && sameRow)) {
        if (sameCol) {
          el.classList.add("highlighted", "highlighted-column");
        } else if (sameRow) {
          el.classList.add("highlighted", "highlighted-row");
        }
      }
    })
  }
}

function unHighlight(div) {
  return () => {
    [...div.children].forEach((el) => {
      el.classList.remove("highlighted");
    })
  }
}

//#endregion Highlighting
//#region Counting and CSV bookkeeping

function getTypeChartConfirmationCSV() {
  let csv = UnknownValueCSVStr + "," + Types[typeIndex].map(x => x.toUpperCase().substring(0, 3)).join(",") + "\n";
  const tableElements = [...document.getElementById("main").children];
  for (let idx = 0; idx < Types[typeIndex].length; ++idx) {
    const type = Types[typeIndex][idx];
    const rowLen = Types[typeIndex].length + 1;
    csv += type + ",";
    csv += tableElements.slice((idx + 1) * rowLen + 1, (idx + 2) * rowLen).map(x => mapMarkingToCsvValue(x.dataset.mark || 0)).join(",") + "\n";
  }
  return csv;
}

let countRemaining = false;

function updateCount() {
  const output = document.getElementById("main").children[0];
  const typeTableElements = [...document.getElementsByClassName("type-table-blank")];
  const marked = typeTableElements.filter(x => Object.values(EffectivenessMarks).includes(Number.parseInt(x.dataset.mark) || 0)).length;
  const remaining = typeTableElements.length - marked;
  output.innerHTML = "<span>" + (countRemaining ? "-" + remaining : "" + marked) + "</span>";
}

function toggleCountingDirection() {
  countRemaining = !countRemaining;
  updateCount();
}

function updateData() {
  updateCount();
  document.getElementById("outputTxt").value = getTypeChartConfirmationCSV();
}

//#endregion Counting and CSV bookkeeping
//#region Marking

const MARK_MIN = -2, MARK_MAX = 3;

const EffectivenessMarks = {
  NotVeryEffective: -1,
  Normal: 1,
  SuperEffective: 2,
  NoEffect: -2
}

const AuxillaryMarks = {
  Blank: 0,
  Note: 3
}

const MarkingImages = new Map([
  [EffectivenessMarks.NotVeryEffective, "effectiveness/NotVeryEffective.png"],
  [EffectivenessMarks.Normal, "effectiveness/Normal.png"],
  [EffectivenessMarks.SuperEffective, "effectiveness/SuperEffective.png"],
  [EffectivenessMarks.NoEffect, "effectiveness/NoEffect.png"]
]);

function setMarking(target, mark) {
  if (isString(mark)) mark = Number.parseInt(mark) || 0;
  mark = clampValue(MARK_MIN, MARK_MAX, mark);
  target.dataset.mark = mark;
  clearChildren(target);
  target.append(htmlToElement(`<img src="${MarkingImages.get(mark) || ""}" />`));
  updateData();
}

function modifyMarkBy(target, diff) {
  if (target.classList.contains("type-table-blank")) {
    setMarking(target, (Number.parseInt(target.dataset.mark) || 0) + diff);
  }
}

//#endregion Marking
//#region Mark mapping

const UnknownValueCSVStr = "_";

const _Mapping = [
  [EffectivenessMarks.NotVeryEffective, "0.5"],
  [EffectivenessMarks.Normal, "1.0"],
  [EffectivenessMarks.SuperEffective, "2.0"],
  [EffectivenessMarks.NoEffect, "0.0"],
];

const _MappingRev = _Mapping.flatMap(([x, y]) => [[y, x], [y.replace(".0", ""), x]]);

const MarkMappingTo = new Map(_Mapping);

const MarkMappingFrom = new Map(_MappingRev);

function mapMarkingToCsvValue(mark) {
  if (isString(mark)) mark = Number.parseInt(mark) || 0;
  return MarkMappingTo.get(mark) || UnknownValueCSVStr;
}

function mapCsvValueToMarking(csvValue) {
  return MarkMappingFrom.get(csvValue) || null;
}

//#endregion Mark mapping
//#region Output Confirmation CSV

function toggleConfirmationCSV({ target }) {
  const outputTextField = document.getElementById("outputTxt");
  outputTextField.classList.toggle("hidden");
  if (target.value.startsWith("Display")) {
    target.value = "Hide Confirmation CSV";
  } else {
    target.value = "Display Confirmation CSV";
  }
}

function saveConfirmationCSV() {
  const a = document.createElement("a");
  const file = new Blob([getTypeChartConfirmationCSV()], { type: "text/csv" });

  a.href = URL.createObjectURL(file);
  a.download = "PokeTypeChart.csv";
  a.click();

  URL.revokeObjectURL(a.href);
}

//#endregion Output Confirmation CSV
//#region Input Confirmation CSV

function checkFile() {
  const randoLogFile = document.getElementById("randoLogFile");
  if (randoLogFile.files.length === 0) {
    alert("No file selected.");
    return false;
  }
  else {
    const file = randoLogFile.files[0];
    if (file.type && !(file.type === "application/vnd.ms-excel" || file.type === "text/plain" || file.type === "text/csv")) {
      alert("File must be a CSV.");
      return false;
    }
    return file;
  }
}

function uploadLog() {
  if ([...document.getElementById("main").children].some((element) => element.dataset.mark && element.dataset.mark != 0) && !confirm("You have data in the tracker. Uploading a CSV will replace all tracked data.\nDo you want to continue and replace all data?")) {
    return;
  }

  var file = checkFile();
  if (file === false)
    return;

  var reader = new FileReader();
  reader.addEventListener("load", uploadCSV);
  reader.readAsText(file);
}

function verifyLog() {
  var file = checkFile();
  if (file === false)
    return;

  var reader = new FileReader();
  reader.addEventListener("load", verifyCSV);
  reader.readAsText(file);
}

// ref: http://stackoverflow.com/a/1293163/2343
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray(strData, strDelimiter) {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ",");

  // Create a regular expression to parse the CSV values.
  const objPattern = new RegExp(
    (
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );


  // Create an array to hold our data. Give the array
  // a default empty first row.
  const arrData = [[]];

  // Create an array to hold our individual pattern
  // matching groups.
  let arrMatches = null;


  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec(strData)) {

    // Get the delimiter that was found.
    const strMatchedDelimiter = arrMatches[1];

    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (
      strMatchedDelimiter.length &&
      strMatchedDelimiter !== strDelimiter
    ) {

      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push([]);

    }

    let strMatchedValue;

    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {

      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      strMatchedValue = arrMatches[2].replace(
        new RegExp("\"\"", "g"),
        "\""
      );

    } else {

      // We found a non-quoted value.
      strMatchedValue = arrMatches[3];

    }


    // Now that we have our value string, let's add
    // it to the data array.
    arrData[arrData.length - 1].push(strMatchedValue);
  }

  // Return the parsed data.
  return arrData;
}

function errorNumberOfTypesDontMatch(n) {
  alert(`Input CSV has ${n} types while the tracker has ${Types[typeIndex].length} types.\nMake sure you have the correct generation selected.`);
}

function uploadCSV(ev) {
  const csv = ev.target.result;
  const csvArray = CSVToArray(csv);
  const main = document.getElementById("main");
  const headerRow = csvArray[0];
  if (headerRow.length != Types[typeIndex].length + 1) {
    errorNumberOfTypesDontMatch(headerRow.length - 1);
    return;
  }
  for (let i = 1; i < csvArray.length; i++) {
    const row = csvArray[i];
    for (let j = 1; j < row.length; j++) {
      const cell = main.children[i * (Types[typeIndex].length + 1) + j];
      let marking = mapCsvValueToMarking(csvArray[i][j]);
      if (marking === null) {
        marking = 0;
        console.error(`Read unexpected value of ${csvArray[i][j]} from the csv.`);
      }
      setMarking(cell, marking);
    }
  }
}

function verifyCSV(ev) {
  const csv = ev.target.result;
  const csvArray = CSVToArray(csv);
  const main = document.getElementById("main");
  const headerRow = csvArray[0];
  if (headerRow.length != Types[typeIndex].length + 1) {
    errorNumberOfTypesDontMatch();
    return;
  }
  if ([...main.children].some((element) => element.dataset.mark && Object.values(AuxillaryMarks).includes(Number.parseInt(element.dataset.mark)))) {
    alert("Tracking incomplete. Unable to verify.");
    return;
  }
  for (let i = 1; i < csvArray.length; i++) {
    const row = csvArray[i];
    for (var j = 1; j < row.length; j++) {
      const cell = main.children[i * (Types[typeIndex].length + 1) + j];
      let marking = mapCsvValueToMarking(csvArray[i][j]);
      if (marking === null) {
        alert("Unexpected value in CSV - Verification failed.");
        console.error(`Read unexpected value of ${csvArray[i][j]} from the csv.`);
        return;
      }
      if (marking != cell.dataset.mark) {
        console.log("No match at " + i + "," + j);
        console.log("File: " + marking);
        console.log("Board: " + cell.dataset.mark);
        alert("NO MATCH. Try again.");
        return;
      }
    }
  }
  alert("IT MATCHES. Congratulations.");
}

//#endregion Input Confirmation CSV