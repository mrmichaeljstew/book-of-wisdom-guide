/* Book of Wisdom Study Guide — client-side app
 * Prefers window.SITE_DATA (data.js) for file://; else fetches data/*.json (GitHub Pages / http).
 */
(function () {
  "use strict";

  async function loadJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  }

  async function loadChapters(base) {
    try {
      return await loadJSON(base + "chapters.json");
    } catch (_) {
      const man = await loadJSON(base + "chapters_manifest.json");
      const packs = await Promise.all((man.packs || []).map((p) => loadJSON(base + p)));
      const chapters = packs.flatMap((p) => p.chapters || []);
      return {
        book_title: man.book_title,
        author: man.author,
        chapter_count_mapped: man.chapter_count_mapped || chapters.length,
        mapping_method: man.mapping_method,
        chapters,
      };
    }
  }

  async function loadVideos(base) {
    try {
      return await loadJSON(base + "videos.json");
    } catch (_) {
      const man = await loadJSON(base + "videos_manifest.json");
      const official = await loadJSON(base + man.official_file);
      const series = (await Promise.all((man.series_packs || []).map((p) => loadJSON(base + p)))).flat();
      return {
        generated_at: man.generated_at,
        timezone_note: man.timezone_note,
        series: man.series,
        official_channel_videos_sampled: official,
        series_parts: series,
        counts: man.counts || {
          official_sampled: official.length,
          series_parts: series.length,
          total_inventoried: official.length + series.length,
        },
      };
    }
  }

  async function loadSiteData() {
    if (window.SITE_DATA) return window.SITE_DATA;
    const base = "data/";
    const [channel, chapters, themes, videos] = await Promise.all([
      loadJSON(base + "channel.json"),
      loadChapters(base),
      loadJSON(base + "themes.json"),
      loadVideos(base),
    ]);
    return { channel, chapters, themes, videos };
  }

  let chapters, themes, channel, videosData, chapterByNum;

  function bindData(DATA) {
    chapters = DATA.chapters.chapters || [];
    themes = DATA.themes.themes || [];
    channel = DATA.channel || {};
    videosData = DATA.videos || {};
    chapterByNum = Object.fromEntries(chapters.map((c) => [c.number, c]));
  }

  const CLUSTER_LABELS = {
    sacred_oil_kundalini_anatomy: { name: "Sacred oil & anatomy", range: "1–12" },
    planes_chakras_self: { name: "Planes & chakras", range: "13–27" },
    know_thyself_ether: { name: "Know thyself & ether", range: "28–32" },
    cosmology_firmament_soul_trap: { name: "Cosmology & soul trap", range: "33–49" },
    saturn_celestial: { name: "Saturn & celestial", range: "50–61" },
    astrology_syncretism_hermetica: { name: "Astrology & syncretism", range: "62–72" },
    electromagnetism_energy_field: { name: "Electromagnetism", range: "73–88" },
    diet_life_death_sound: { name: "Diet, life/death, sound", range: "89–93" },
    christianity_mind_heart: { name: "Christianity & mind", range: "94–103" },
    freemasonry_symbolism_feminine: { name: "Masonry & symbolism", range: "104–112" },
    sexual_energy_laws_closing: { name: "Sexual energy & close", range: "113–119" },
  };

  const CLAIMS = [
    ["Mental universe / light", "Reality begins as mind and light; dense light appears as matter."],
    ["Planes", "Mental → Astral → Etheric → Physical. “As above, so below.”"],
    ["Christ Oil allegory", "A psychophysical fluid linked to pineal/pituitary; Jesus narrative read as inner alchemy."],
    ["Kundalini / serpent", "Same ascent as serpent fire; conservation of sexual energy fuels the rise."],
    ["Polarity", "Divine masculine & feminine must unite for spiritual rebirth."],
    ["Saturn / control", "Saturn/black cube/time framed as binding perception; soul-trap warning."],
    ["Electromagnetism", "Aura, brainwaves, thoughts as vibration; sacred geometry as visible math."],
    ["Astrotheology", "Christianity re-read as sun/zodiac drama."],
    ["Self-mastery praxis", "Diet, retention, meditation, mudras, symbol literacy, Hermetic laws."],
  ];

  const SYMBOLS = [
    { glyph: "🐍", name: "Serpent / Kundalini / S in SEX", blurb: "Rising creative/sexual energy coiled at the sacrum." },
    { glyph: "👁", name: "Pineal & pituitary (“milk and honey”)", blurb: "Charging/receiving the oil; third-eye gateway." },
    { glyph: "💧", name: "Christ Oil / sacred secretion", blurb: "Conserved life-force fluid of the allegory." },
    { glyph: "☉", name: "12 around 1", blurb: "Disciples, cranial nerves, zodiac around the sun/self." },
    { glyph: "🜏", name: "Baphomet / horns / “horny”", blurb: "Lower-mind animal instinct (in author’s lectures)." },
    { glyph: "⬛", name: "Black cube / Saturn", blurb: "Limitation, time, material bondage symbolism." },
    { glyph: "🜨", name: "Firmament / Meru / north", blurb: "Alternative cosmology axis." },
    { glyph: "✡", name: "Star of David", blurb: "Masculine/feminine polarity balance." },
    { glyph: "❀", name: "Flower of Life / Daisy of Death", blurb: "Generative vs destructive geometry." },
    { glyph: "∠", name: "Square & compass / pillars", blurb: "Freemasonic tools as consciousness tech." },
  ];

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function fmtDuration(sec) {
    if (!sec && sec !== 0) return "";
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }
  function fmtDate(iso) {
    if (!iso) return "";
    // dates are YYYY-MM-DD from YT metadata
    return iso + " (upload date)";
  }

  function allVideos() {
    const official = (videosData.official_channel_videos_sampled || []).map((v) => ({
      ...v,
      kind: "official",
      sortKey: v.upload_date || "",
    }));
    const series = (videosData.series_parts || []).map((v) => ({
      ...v,
      kind: "series",
      sortKey: String(v.part).padStart(3, "0"),
    }));
    return official.concat(series);
  }

  /* ---------- navigation ---------- */
  function showSection(id) {
    $all(".panel").forEach((p) => p.classList.toggle("active", p.id === id));
    $all(".main-nav a").forEach((a) => a.classList.toggle("active", a.dataset.section === id));
    const nav = $("#mainNav");
    nav.classList.remove("open");
    $("#navToggle").setAttribute("aria-expanded", "false");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $all(".main-nav a").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.dataset.section;
      history.replaceState(null, "", "#" + id);
      showSection(id);
    });
  });

  $("#navToggle").addEventListener("click", () => {
    const nav = $("#mainNav");
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    $("#navToggle").setAttribute("aria-expanded", String(open));
  });

  /* ---------- home ---------- */
  function renderHome() {
    const pagesTrue = allVideos().filter((v) => v.shows_book_pages).length;
    $("#statGrid").innerHTML = [
      ["119", "Chapters mapped"],
      [String(themes.length), "Theme hubs"],
      [String(allVideos().length), "Videos inventoried"],
      [String(pagesTrue), "Show book pages"],
    ].map(([n, l]) => `<div class="stat"><span class="num">${esc(n)}</span><span class="label">${esc(l)}</span></div>`).join("");

    $("#claimsList").innerHTML = CLAIMS.map(
      ([t, d]) => `<li><strong>${esc(t)}</strong> — ${esc(d)}</li>`
    ).join("");

    $("#clusterList").innerHTML = Object.entries(CLUSTER_LABELS)
      .map(([id, meta]) => {
        const count = chapters.filter((c) => c.cluster === id).length;
        return `<li data-cluster="${esc(id)}"><span class="cname">${esc(meta.name)}</span><span class="crange">${esc(meta.range)} · ${count}</span></li>`;
      })
      .join("");

    $all("#clusterList li").forEach((li) => {
      li.addEventListener("click", () => {
        showSection("chapters");
        history.replaceState(null, "", "#chapters");
        $("#clusterFilter").value = li.dataset.cluster;
        renderChapters();
      });
    });

    const books = (channel.books || []).map((b) => `<li><strong>${esc(b.title)}</strong> — ${esc((b.formats || []).join(", "))}</li>`).join("");
    const seed = channel.seed_video || {};
    $("#channelCard").innerHTML = `
      <h3>Author & channel</h3>
      <p class="meta"><strong>${esc(channel.author || "")}</strong> ·
        <a href="${esc(channel.channel_url || "#")}" target="_blank" rel="noopener">${esc(channel.channel_name || "")} (${esc(channel.handle || "")})</a>
        · ~${esc(String(channel.approx_subscribers || ""))} subscribers</p>
      <p class="meta">${esc(channel.focus || "")}</p>
      <ul class="claim-list">${books}</ul>
      <p class="meta">Official store:
        <a href="https://revivalofwisdom.com/" target="_blank" rel="noopener">revivalofwisdom.com</a>
        · Seed video: <a href="${esc(seed.url || "https://youtu.be/Gnf5ZGXl_g4")}" target="_blank" rel="noopener">${esc(seed.title || "Saving Your Seed")}</a>
      </p>
      <p class="meta">Fan page-walk series:
        <a href="${esc((channel.related_fan_series || {}).playlist || "#")}" target="_blank" rel="noopener">${esc((channel.related_fan_series || {}).name || "Positive Vortex")}</a>
        (${esc(String((channel.related_fan_series || {}).parts || 45))} parts)
      </p>`;
  }

  /* ---------- chapters ---------- */
  function populateClusterFilter() {
    const sel = $("#clusterFilter");
    Object.entries(CLUSTER_LABELS).forEach(([id, meta]) => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = meta.name;
      sel.appendChild(opt);
    });
  }

  function renderChapters() {
    const q = ($("#chapterSearch").value || "").trim().toLowerCase();
    const cluster = $("#clusterFilter").value;
    const conf = $("#confidenceFilter").value;

    const filtered = chapters.filter((c) => {
      if (cluster && c.cluster !== cluster) return false;
      if (conf && c.confidence !== conf) return false;
      if (!q) return true;
      const hay = [c.title, c.summary, c.cluster, c.illustrative_quote_or_label, String(c.number)]
        .join(" ").toLowerCase();
      return hay.includes(q);
    });

    $("#chapterMeta").textContent = `Showing ${filtered.length} of ${chapters.length} chapters`;

    $("#chapterList").innerHTML = filtered.map((c) => {
      const cl = CLUSTER_LABELS[c.cluster];
      return `
        <button type="button" class="chapter-item" data-num="${c.number}">
          <div class="top">
            <span class="ch-num">Ch. ${c.number}</span>
            <span class="ch-title">${esc(c.title)}</span>
            <span class="badge ${esc(c.confidence)}">${esc(c.confidence)}</span>
            <span class="badge">${esc(cl ? cl.name : c.cluster)}</span>
          </div>
          <p class="ch-summary">${esc(c.summary)}</p>
        </button>`;
    }).join("");

    $all(".chapter-item").forEach((btn) => {
      btn.addEventListener("click", () => openChapter(+btn.dataset.num));
    });
  }

  function openChapter(num) {
    const c = chapterByNum[num];
    if (!c) return;
    const cl = CLUSTER_LABELS[c.cluster];
    const links = (c.source_video_urls || [])
      .map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace("https://www.youtube.com/watch?v=", "YouTube · "))}</a>`)
      .join("");
    const quote = c.illustrative_quote_or_label
      ? `<p><em>${esc(c.illustrative_quote_or_label)}</em></p>` : "";

    $("#chapterModalBody").innerHTML = `
      <h3>Chapter ${c.number}: ${esc(c.title)}</h3>
      <p><span class="badge ${esc(c.confidence)}">${esc(c.confidence)} confidence</span>
         <span class="badge">${esc(cl ? cl.name : c.cluster)}</span></p>
      <p>${esc(c.summary)}</p>
      ${quote}
      <p class="meta" style="color:var(--muted);font-size:.85rem">Volume note: ${esc(c.volume || "")}</p>
      <div class="links">${links || "<span style='color:var(--muted)'>No linked videos</span>"}</div>
      <p style="margin-top:1rem;font-size:.85rem;color:var(--muted)">Summary only — not a reprint. Buy the book at
        <a href="https://revivalofwisdom.com/" target="_blank" rel="noopener">revivalofwisdom.com</a>.</p>`;
    $("#chapterModal").showModal();
  }

  /* ---------- themes ---------- */
  function renderThemes() {
    $("#themeGrid").innerHTML = themes.map((t) => `
      <button type="button" class="theme-card" data-id="${esc(t.id)}">
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.summary)}</p>
        <div class="count">${(t.related_chapters || []).length} related chapters</div>
      </button>`).join("");

    $all(".theme-card").forEach((btn) => {
      btn.addEventListener("click", () => openTheme(btn.dataset.id));
    });
  }

  function openTheme(id) {
    const t = themes.find((x) => x.id === id);
    if (!t) return;
    const chips = (t.related_chapters || []).map((n) => {
      const c = chapterByNum[n];
      const label = c ? `Ch. ${n}: ${c.title}` : `Ch. ${n}`;
      return `<button type="button" data-num="${n}">${esc(label)}</button>`;
    }).join("");

    $("#themeModalBody").innerHTML = `
      <h3>${esc(t.name)}</h3>
      <p>${esc(t.summary)}</p>
      <div class="related-ch">${chips}</div>`;
    $("#themeModal").showModal();

    $all("#themeModalBody .related-ch button").forEach((b) => {
      b.addEventListener("click", () => {
        $("#themeModal").close();
        showSection("chapters");
        history.replaceState(null, "", "#chapters");
        $("#chapterSearch").value = "";
        $("#clusterFilter").value = "";
        $("#confidenceFilter").value = "";
        renderChapters();
        openChapter(+b.dataset.num);
      });
    });
  }

  /* ---------- videos ---------- */
  function renderVideos() {
    const pagesOnly = $("#pagesOnly").checked;
    const src = $("#videoSource").value;
    const q = ($("#videoSearch").value || "").trim().toLowerCase();

    let list = allVideos();
    if (pagesOnly) list = list.filter((v) => v.shows_book_pages);
    if (src === "official") list = list.filter((v) => v.kind === "official");
    if (src === "series") list = list.filter((v) => v.kind === "series");
    if (q) {
      list = list.filter((v) => {
        const hay = [v.title, v.notes, v.channel, String(v.part || ""), (v.chapters_covered || []).join(" ")]
          .join(" ").toLowerCase();
        return hay.includes(q);
      });
    }

    // series by part asc, official by date desc-ish
    list = list.slice().sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "official" ? -1 : 1;
      if (a.kind === "series") return (a.part || 0) - (b.part || 0);
      return String(b.upload_date || "").localeCompare(String(a.upload_date || ""));
    });

    $("#videoMeta").textContent = `Showing ${list.length} video(s)` +
      (pagesOnly ? " with book pages on screen" : "");

    $("#videoList").innerHTML = list.map((v) => {
      const chips = [];
      if (v.shows_book_pages) chips.push(`<span class="chip pages">book pages</span>`);
      chips.push(`<span class="chip">${esc(v.kind === "official" ? "Official" : "Positive Vortex")}</span>`);
      if (v.part) chips.push(`<span class="chip">Part ${v.part}</span>`);
      if (v.duration_sec) chips.push(`<span class="chip">${esc(fmtDuration(v.duration_sec))}</span>`);
      if (v.upload_date) chips.push(`<span class="chip">${esc(v.upload_date)}</span>`);
      (v.chapters_covered || []).slice(0, 8).forEach((n) => {
        chips.push(`<span class="chip"><a href="#chapters" data-jump="${n}">Ch. ${n}</a></span>`);
      });
      if ((v.chapters_covered || []).length > 8) {
        chips.push(`<span class="chip">+${v.chapters_covered.length - 8} more</span>`);
      }

      return `
        <article class="video-item">
          <div class="top">
            <a class="title-link" href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.title)}</a>
          </div>
          ${v.notes ? `<p class="notes">${esc(v.notes)}</p>` : ""}
          <div class="chips">${chips.join("")}</div>
        </article>`;
    }).join("") || `<p class="result-meta">No videos match these filters.</p>`;

    $all("#videoList [data-jump]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const n = +a.dataset.jump;
        showSection("chapters");
        history.replaceState(null, "", "#chapters");
        openChapter(n);
      });
    });
  }

  /* ---------- symbols ---------- */
  function renderSymbols() {
    $("#symbolGrid").innerHTML = SYMBOLS.map((s) => `
      <article class="symbol-card">
        <div class="glyph" aria-hidden="true">${s.glyph}</div>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.blurb)}</p>
      </article>`).join("");
  }

  /* ---------- seed deep-dive ---------- */
  function renderSeed() {
    const seedVid = (videosData.official_channel_videos_sampled || [])
      .find((v) => v.id === "Gnf5ZGXl_g4") || channel.seed_video || {};
    const ch115 = chapterByNum[115];
    const ch116 = chapterByNum[116];
    const relatedThemes = themes.filter((t) =>
      (t.related_chapters || []).some((n) => n === 115 || n === 116)
    );

    $("#seedLayout").innerHTML = `
      <div class="card">
        <h3>Watch · Saving Your “Seed” Can Give You POWER</h3>
        <p style="color:var(--muted);font-size:.9rem;margin-top:0">
          Official Revival Of Wisdom ·
          <a href="https://youtu.be/Gnf5ZGXl_g4" target="_blank" rel="noopener">youtu.be/Gnf5ZGXl_g4</a>
          ${seedVid.duration_sec ? " · " + esc(fmtDuration(seedVid.duration_sec)) : ""}
          ${seedVid.upload_date ? " · uploaded " + esc(seedVid.upload_date) : ""}
        </p>
        <div class="embed-wrap" style="margin-top:1rem">
          <iframe
            src="https://www.youtube.com/embed/Gnf5ZGXl_g4"
            title="Saving Your Seed Can Give You POWER"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            loading="lazy"></iframe>
        </div>
        <p style="margin-top:1rem;color:var(--muted);font-size:.9rem">
          ${esc(seedVid.notes || "Author teaching on retention/sexual energy aligned with Book of Wisdom Ch. 115–116; book promoted via revivalofwisdom.com.")}
        </p>
      </div>
      <div>
        <article class="card" style="margin-bottom:1rem">
          <h3>Aligned chapters</h3>
          ${[ch115, ch116].filter(Boolean).map((c) => `
            <div style="margin-bottom:1rem">
              <button type="button" class="btn outline" style="margin-bottom:.4rem" data-open-ch="${c.number}">
                Ch. ${c.number}: ${esc(c.title)}
              </button>
              <p style="margin:0;color:var(--muted);font-size:.9rem">${esc(c.summary)}</p>
            </div>`).join("")}
          <p style="font-size:.85rem;color:var(--muted);margin:0">
            Study-guide paraphrases only. Full wording & art →
            <a href="https://revivalofwisdom.com/" target="_blank" rel="noopener">revivalofwisdom.com</a>
          </p>
        </article>
        <article class="card">
          <h3>Related themes</h3>
          <div class="related-ch">
            ${relatedThemes.map((t) =>
              `<button type="button" data-theme="${esc(t.id)}">${esc(t.name)}</button>`
            ).join("") || "<span style='color:var(--muted)'>See Sexual energy & Kundalini hubs</span>"}
          </div>
          <h3 style="margin-top:1.25rem">Key takeaways (from public lecture)</h3>
          <ul class="claim-list">
            <li>Creation framed as requiring sacrifice of lower impulses.</li>
            <li>Sexual fluids linked to vitality / DNA / astral force in the author’s teaching.</li>
            <li>Dopamine numbness vs higher-mind clarity.</li>
            <li>Sex as energy/consciousness exchange — conserve to “rise.”</li>
            <li>Book sold via official store for complete chapters & diagrams.</li>
          </ul>
        </article>
      </div>`;

    $all("#seedLayout [data-open-ch]").forEach((b) => {
      b.addEventListener("click", () => {
        showSection("chapters");
        history.replaceState(null, "", "#chapters");
        openChapter(+b.dataset.openCh);
      });
    });
    $all("#seedLayout [data-theme]").forEach((b) => {
      b.addEventListener("click", () => {
        showSection("themes");
        history.replaceState(null, "", "#themes");
        openTheme(b.dataset.theme);
      });
    });
  }

  /* ---------- wire filters ---------- */
  function wire() {
    populateClusterFilter();
    ["chapterSearch", "clusterFilter", "confidenceFilter"].forEach((id) => {
      $("#" + id).addEventListener("input", renderChapters);
      $("#" + id).addEventListener("change", renderChapters);
    });
    ["pagesOnly", "videoSource", "videoSearch"].forEach((id) => {
      const el = $("#" + id);
      el.addEventListener("input", renderVideos);
      el.addEventListener("change", renderVideos);
    });

    // hash routing
    const hash = (location.hash || "#home").slice(1);
    const known = ["home", "chapters", "themes", "videos", "symbols", "seed"];
    showSection(known.includes(hash) ? hash : "home");

    window.addEventListener("hashchange", () => {
      const h = (location.hash || "#home").slice(1);
      if (known.includes(h)) showSection(h);
    });
  }

  function boot(DATA) {
    bindData(DATA);
    renderHome();
    renderChapters();
    renderThemes();
    renderVideos();
    renderSymbols();
    renderSeed();
    wire();
  }

  loadSiteData()
    .then(boot)
    .catch((err) => {
      console.error(err);
      document.body.insertAdjacentHTML(
        "afterbegin",
        '<aside class="disclaimer"><p><strong>Could not load study data.</strong> Open via a local server or ensure data.js is present. ' +
          String(err).replace(/</g, "&lt;") + "</p></aside>"
      );
    });
})();
