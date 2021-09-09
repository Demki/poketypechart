const Types = [
  "Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting", "Fire", "Flying", "Ghost", "Normal", "Poison", "Psychic", "Rock", "Steel", "Water"
]

const COLORS_MAX = 3;
const COLORS_MIN = -2;

window.addEventListener("load", () => {
  const mainDiv = document.getElementById("main");
  fillBoard(mainDiv);

  mainDiv.addEventListener("click", (ev) => { mark(1)(ev); ev.preventDefault(); });
  mainDiv.addEventListener("contextmenu", (ev) => { mark(-1)(ev); ev.preventDefault(); });

  [...mainDiv.children].forEach((el, idx) => {
    el.addEventListener("mouseenter", highlight(mainDiv, idx));
  })
  mainDiv.addEventListener("mouseleave", unHighlight(mainDiv));
});

function highlight(div, idx) {
  return () =>
  {
    const colCount = Types.length + 1;
    const col = idx % colCount;
    const row = Math.floor(idx / colCount);
    [...div.children].forEach((el, jdx) => {
      const colj = jdx % colCount;
      const rowj = Math.floor(jdx / colCount);
      if(colj == col || rowj == row) {
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

function mark(d) {
  return ({ target }) => {
    if (target.classList.contains("type-table-blank")) {
      const marking = Math.min(COLORS_MAX, Math.max(COLORS_MIN, (Number.parseInt(target.dataset.mark) | 0) + d));
      target.dataset.mark = marking;
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
  div.append(htmlToElement(`<div class="top-of-type-table-blank"></div>`));
  div.append(...Types.map(type => htmlToElement(`<div class="type-table-header"><img src="types/Icon_${type}.webp"/></div>`)));
  div.append(...Types.flatMap(type => [
    htmlToElement(`<div class="type-table-header"><img src="types/Icon_${type}.webp"/></div>`),
    ...Types.map(_ => htmlToElement(`<div class="type-table-blank"></div>`))]
  ));

  document.body.style.setProperty("--columns", Types.length + 1);
}