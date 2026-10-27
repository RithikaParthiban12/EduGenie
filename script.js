const $ = (id) => document.getElementById(id);
const MODES = {
  explain: { n: "Explain", x: ["Simple analogy", "Step by step", "Deep dive"] },
  quiz: { n: "Quiz", x: ["5 questions", "8 questions", "10 questions"] },
  plan: { n: "Study plan", x: ["3 days", "1 week", "1 month"] },
  cards: { n: "Flashcards", x: ["8 cards", "12 cards"] },
};
let mode = "explain", busy = false;

Object.keys(MODES).forEach((k) => {
  const b = document.createElement("button");
  b.className = "tab"; b.id = "t_" + k; b.textContent = MODES[k].n;
  b.onclick = () => setMode(k);
  $("tabs").appendChild(b);
});
function setMode(k) {
  mode = k;
  Object.keys(MODES).forEach((m) => $("t_" + m).classList.toggle("on", m === k));
  $("extra").innerHTML = MODES[k].x.map((v) => `<option>${v}</option>`).join("");
  $("res").innerHTML = "";
}
setMode("explain");
["Black holes", "The French Revolution", "Python loops", "Supply and demand"].forEach((s) => {
  const c = document.createElement("span");
  c.className = "chip"; c.textContent = s;
  c.onclick = () => { $("topic").value = s; run(); };
  $("chips").appendChild(c);
});

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (s) => esc(s).replace(/^#+\s*(.+)$/gm, "<h3>$1</h3>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^\*\s/gm, "- ");

$("go").onclick = run;
$("topic").addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });

async function run() {
  const topic = $("topic").value.trim();
  if (!topic || busy) return;
  busy = true; $("go").disabled = true; $("go").textContent = "Thinking…";
  try {
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, topic, level: $("level").value, extra: $("extra").value }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || "Request failed");
    if (mode === "explain" || mode === "plan") $("res").innerHTML = `<div class="card out">${fmt(d.text)}</div>`;
    else if (mode === "quiz") quiz(d.data);
    else cards(d.data);
  } catch (e) {
    $("res").innerHTML = `<div class="card mu">Error: ${esc(e.message)}</div>`;
  }
  busy = false; $("go").disabled = false; $("go").textContent = "Ask EduGenie";
}

function quiz(qs) {
  let score = 0, done = 0;
  const box = $("res"); box.innerHTML = "";
  const sc = document.createElement("div");
  sc.className = "card mu"; sc.textContent = "Score: 0 / " + qs.length; box.appendChild(sc);
  qs.forEach((q, i) => {
    const c = document.createElement("div"); c.className = "card";
    c.innerHTML = `<b>${i + 1}. ${esc(q.q)}</b>`;
    const why = document.createElement("p");
    why.className = "mu"; why.style.display = "none"; why.textContent = q.why || "";
    q.options.forEach((o, j) => {
      const b = document.createElement("button");
      b.className = "opt"; b.textContent = o;
      b.onclick = () => {
        if (c.dataset.d) return;
        c.dataset.d = 1; done++;
        const ok = j === q.answer; if (ok) score++;
        b.classList.add(ok ? "ok" : "bad");
        if (!ok) c.querySelectorAll(".opt")[q.answer].classList.add("ok");
        why.style.display = "block";
        sc.textContent = "Score: " + score + " / " + qs.length + (done === qs.length ? " — all done! 🎉" : "");
      };
      c.appendChild(b);
    });
    c.appendChild(why); box.appendChild(c);
  });
}

function cards(cs) {
  let i = 0, flip = false;
  const draw = () => {
    $("res").innerHTML = `<div class="card"><p class="mu">Card ${i + 1} of ${cs.length} · tap to flip</p><div class="fc" id="fc">${esc(flip ? cs[i].back : cs[i].front)}</div><div class="row"><button class="opt" id="pv">← Previous</button><button class="opt" id="nx">Next →</button></div></div>`;
    $("fc").onclick = () => { flip = !flip; draw(); };
    $("pv").onclick = () => { i = (i - 1 + cs.length) % cs.length; flip = false; draw(); };
    $("nx").onclick = () => { i = (i + 1) % cs.length; flip = false; draw(); };
  };
  draw();
}
