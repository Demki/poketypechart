const Types = [
  "Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting", "Fire", "Flying", "Ghost", "Grass", "Ground", "Ice", "Normal", "Poison", "Psychic", "Rock", "Steel", "Water"
]

const fairyIndex = Types.indexOf("Fairy");

const COLORS_MAX = 3;
const COLORS_MIN = -2;

let countRemaining = false;

window.addEventListener("load", () => {
  const mainDiv = document.getElementById("main");
  fillBoard(mainDiv);

  mainDiv.addEventListener("click", (ev) => { mark(1)(ev); ev.preventDefault(); });
  mainDiv.addEventListener("contextmenu", (ev) => { mark(-1)(ev); ev.preventDefault(); });
  mainDiv.addEventListener("mouseleave", unHighlight(mainDiv));

  mainDiv.addEventListener("click", (ev) => { 
    if(ev.target.classList.contains("top-of-type-table-blank")) 
    {
      countRemaining = !countRemaining;
      updateCount();
    }
  });

  document.getElementById("fairyButton").addEventListener("click", toggleFairy);
  
  document.getElementById("uploadLogButton").addEventListener("click", uploadLog);
  document.getElementById("verifyLogButton").addEventListener("click", verifyLog);
  
  document.getElementById("outputTxt").value = "";
  document.getElementById("showCSVButton").addEventListener("click", showConfirmationCSV);
  document.getElementById("hideCSVButton").addEventListener("click", hideConfirmationCSV);
  document.getElementById("saveCSVButton").addEventListener("click", saveConfirmationCSV);
});

function toggleFairy()
{
  if(Types.includes("Fairy")) 
  {
    Types.splice(fairyIndex, 1);
    document.getElementById("fairyButton").value = "Add Fairy";
  }
  else {
    Types.splice(fairyIndex, 0, "Fairy");
    document.getElementById("fairyButton").value = "Remove Fairy";
  }
  fillBoard(document.getElementById("main"));
}

function checkFile()
{
  const randoLogFile = document.getElementById("randoLogFile");
  if (randoLogFile.files.length === 0)
  {
    alert("No file selected.");
    return false;
  }
  else
  {
    const file = randoLogFile.files[0];
    if (file.type && !(file.type === "application/vnd.ms-excel" || file.type === "text/plain" || file.type === "text/csv"))
    {
      alert("File must be a CSV.");
      return false;
    }
    return file;
  }
}

function uploadLog()
{
  var file = checkFile();
  if (file === false)
    return;

  var reader = new FileReader();
  reader.addEventListener("load", uploadCSV);
  reader.readAsText(file);
}

function verifyLog()
{
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
function CSVToArray( strData, strDelimiter ){
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
    while (arrMatches = objPattern.exec( strData )){

        // Get the delimiter that was found.
        const strMatchedDelimiter = arrMatches[ 1 ];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] );

        }

        let strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
                new RegExp( "\"\"", "g" ),
                "\""
                );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[ arrData.length - 1 ].push( strMatchedValue );
    }

    // Return the parsed data.
    return arrData;
}

function mapCSVMark(csvMark)
{
  switch(csvMark) {
    case "0.5":
      return -1;
    case "0":
    case "0.0":
      return 3;
    case "1":
    case "1.0":
      return 1;
    case "2":
    case "2.0":
      return 2;
    case "_":
      return 0;
    default:
      return null;
  }
}

function uploadCSV(ev)
{
  const csv = ev.target.result;
  const csvArray = CSVToArray(csv);
  const main = document.getElementById("main");
  const headerRow = csvArray[0];
  if (headerRow.length != Types.length + 1)
  {
    alert("Input CSV doesn't have the same number of types as tracker. Try adding or removing Fairy type.");
    return;
  }
  for (let i = 1; i < csvArray.length; i++)
  {
    const row = csvArray[i];
    for (let j = 1; j < row.length; j++)
    {
      const cell = main.children[i * (Types.length + 1) + j];
      let marking = mapCSVMark(csvArray[i][j]);
      if (marking === null)
      {
        marking = 0;
        console.error(`Read unexpected value of ${csvArray[i][j]} from the csv.`);
      }
      setMarking(cell, marking);
    }
  }
}

function verifyCSV(ev)
{
  const csv = ev.target.result;
  const csvArray = CSVToArray(csv);
  const main = document.getElementById("main");
  const headerRow = csvArray[0];
  if (headerRow.length != Types.length + 1)
  {
    alert("Input CSV doesn't have the same number of types as tracker. Try adding or removing Fairy type.");
    return;
  }
  if ([...main.children].some((element) => element.dataset.mark && element.dataset.mark == 0))
  {
    alert("Tracking incomplete. Unable to verify.");
    return;
  }
  for (let i = 1; i < csvArray.length; i++)
  {
    const row = csvArray[i];
    for (var j = 1; j < row.length; j++)
    {
      const cell = main.children[i * (Types.length + 1) + j];
      let marking = mapCSVMark(csvArray[i][j]);
      if (marking === null)
      {
        alert("Unexpected value in CSV - Verification failed.");
        console.error(`Read unexpected value of ${csvArray[i][j]} from the csv.`);
        return;
      }
      if (marking != cell.dataset.mark)
      {
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

function highlight(div, idx) {
  return () =>
  {
    const colCount = Types.length + 1;
    const col = idx % colCount;
    const row = Math.floor(idx / colCount);
    [...div.children].forEach((el, jdx) => {
      const colj = jdx % colCount;
      const rowj = Math.floor(jdx / colCount);
      if((col != 0 && colj == col) || (row !=0 && rowj == row)) {
        el.classList.add("highlighted");
      } else {
        el.classList.remove("highlighted");
      }
    })
  }
}

function unHighlight(div) {
  return () =>
  {
    [...div.children].forEach((el) => {
      el.classList.remove("highlighted");
    })
  }
}

function setMarking(target, marking) {
  target.dataset.mark = marking;
  while (target.children.length > 0) target.removeChild(target.firstChild);
  switch (marking)
  {
    case -1:
      target.append(htmlToElement(`<img src="NotVeryEffective.png" />`));
      break;
    case 3:
      target.append(htmlToElement(`<img src="NoEffect.png" />`));
      break;
    case 1:
      target.append(htmlToElement(`<img src="Normal.png" />`));
      break;
    case 2:
      target.append(htmlToElement(`<img src="SuperEffective.png" />`));
      break;
  }
  updateCount();
  document.getElementById("outputTxt").value = getTypeChartConfirmationCSV();
}

function updateCount() {
  const output = document.getElementById("main").children[0];
  const marked = [...document.getElementsByClassName("type-table-blank")].filter(x => [-1,1,2,3].includes(Number.parseInt(x.dataset.mark) || 0)).length;
  output.innerHTML = `<span>${countRemaining ? "-" + (document.getElementsByClassName("type-table-blank").length - marked) : marked}</span>`;
}

function mark(d) {
  return ({ target }) => {
    if (target.classList.contains("type-table-blank")) {
      const marking = Math.min(COLORS_MAX, Math.max(COLORS_MIN, (Number.parseInt(target.dataset.mark) || 0) + d));
      setMarking(target, marking);
    }
  }
}

function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

function clearBoard(div) {
  while (div.children.length > 0) div.removeChild(div.firstChild);
}

function fillBoard(div) {
  clearBoard(div);
  div.append(htmlToElement(`<div class="top-of-type-table-blank"><span>0</span></div>`));
  div.append(...Types.map(type => htmlToElement(`<div class="type-table-header"><img title="${type}" src="types/Icon_${type}.webp" /></div>`)));
  div.append(...Types.flatMap(type => [
    htmlToElement(`<div class="type-table-header"><img title="${type}" src="types/Icon_${type}.webp"/></div>`),
    ...Types.map(_ => htmlToElement(`<div class="type-table-blank" data-mark="0"></div>`))]
  ));
  [...div.children].forEach((el, idx) => {
    el.addEventListener("mouseenter", highlight(div, idx));
  })

  document.body.style.setProperty("--columns", Types.length + 1);
  updateCount();
  document.getElementById("outputTxt").value = getTypeChartConfirmationCSV();
}

function mapMarking(mark) {
  switch(mark) {
    case "1" : return "1.0";
    case "2" : return "2.0";
    case "3" : return "0.0";
    case "-1": return "0.5";
    default: return "_";
  }
}

function getTypeChartConfirmationCSV() {
  let csv = "_," + Types.map(x => x.toUpperCase().substring(0,3)).join(",") + "\n";
  Types.forEach( (x, idx) =>
    { csv += x+",";
      csv += [...document.getElementById("main").children].slice((idx+1)*(Types.length+1)+1, (idx+2)*(Types.length+1)).map(x => mapMarking(x.dataset.mark || 0)).join(",") + "\n" }
  )
  return csv;
}

function showConfirmationCSV() {
  const outputTextField = document.getElementById("outputTxt");
  outputTextField.classList.remove("hidden");
  outputTextField.value = getTypeChartConfirmationCSV();
  document.getElementById("hideCSVButton").classList.remove("hidden");
  document.getElementById("showCSVButton").classList.add("hidden");
}

function hideConfirmationCSV() {
  const outputTextField = document.getElementById("outputTxt");
  outputTextField.classList.add("hidden");
  document.getElementById("hideCSVButton").classList.add("hidden");
  document.getElementById("showCSVButton").classList.remove("hidden");
}

function saveConfirmationCSV() {
  const a = document.createElement("a");
  const file = new Blob([getTypeChartConfirmationCSV()], {type: "text/csv"});
  
  a.href = URL.createObjectURL(file);
  a.download = "PokeTypeChart.csv";
  a.click();
  
  URL.revokeObjectURL(a.href);
}