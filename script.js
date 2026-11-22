// ════════════════════════════════════════════════════════
  //  ⚙️ EINSTELLUNGEN
  // ════════════════════════════════════════════════════════

  // Settings aus localStorage laden
  let darkMode  = localStorage.getItem("darkMode")  === "true";
  let unit      = localStorage.getItem("unit")      || "uSv";

  // Einheiten-Konfiguration
  const UNITS = {
    uSv:  { factor: 1,        label: "µSv/h",    decimals: 3 },
    mSv:  { factor: 8.76,     label: "mSv/Jahr", decimals: 2 },  // × 8760 h/Jahr ÷ 1000
    mrem: { factor: 100,      label: "mrem/h",   decimals: 1 },
  };

  function convertValue(uSvH) {
    return uSvH * UNITS[unit].factor;
  }
  function formatVal(uSvH) {
    const v = convertValue(uSvH);
    return v.toFixed(UNITS[unit].decimals) + " " + UNITS[unit].label;
  }
  function unitLabel() { return UNITS[unit].label; }

  // ── Farbschwellen (immer in µSv/h gespeichert, anpassbar in den Einstellungen) ──
  const DEFAULT_THRESH = { low: 0.15, high: 0.25 };
  let THRESH = loadThresholds();

  function loadThresholds() {
    try {
      const t = JSON.parse(localStorage.getItem("thresholds") || "null");
      if (t && isFinite(t.low) && isFinite(t.high) && t.low > 0 && t.high > t.low) {
        return { low: Number(t.low), high: Number(t.high) };
      }
    } catch (e) {}
    return { ...DEFAULT_THRESH };
  }

  function fmtThresh(v) { return String(parseFloat(v.toFixed(3))); }

  // Beschriftung der Karten-Filter-Buttons aktualisieren
  function updateFilterLabels() {
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    const lo = fmtThresh(THRESH.low), hi = fmtThresh(THRESH.high);
    set("lbl-green",  "Niedrig < " + lo);
    set("lbl-orange", "Mittel " + lo + "–" + hi);
    set("lbl-red",    "Hoch > " + hi);
  }

  function initThresholdUI() {
    const lo = document.getElementById("threshLow");
    const hi = document.getElementById("threshHigh");
    if (lo) lo.value = fmtThresh(THRESH.low);
    if (hi) hi.value = fmtThresh(THRESH.high);
    const err = document.getElementById("threshError");
    if (err) err.textContent = "";
    updateFilterLabels();
  }

  function onThresholdChange() {
    const lo = parseFloat(document.getElementById("threshLow").value);
    const hi = parseFloat(document.getElementById("threshHigh").value);
    const err = document.getElementById("threshError");
    if (!(lo > 0) || !(hi > 0)) { err.textContent = "Bitte positive Zahlen eingeben."; return; }
    if (hi <= lo)               { err.textContent = "Der obere Wert muss größer als der untere sein."; return; }
    err.textContent = "";
    THRESH = { low: lo, high: hi };
    localStorage.setItem("thresholds", JSON.stringify(THRESH));
    updateFilterLabels();
    updateDashboard();
    renderHaus();
  }

  function resetThresholds() {
    THRESH = { ...DEFAULT_THRESH };
    localStorage.removeItem("thresholds");
    initThresholdUI();
    updateDashboard();
    renderHaus();
  }

  // Dark Mode anwenden
  function applyDark() {
    document.body.classList.toggle("dark", darkMode);
    const toggle = document.getElementById("darkToggle");
    if(toggle) toggle.classList.toggle("on", darkMode);
    // Chart.js Farben
    Chart.defaults.color        = darkMode ? "#94a3b8" : "#666";
    Chart.defaults.borderColor  = darkMode ? "#2d3748" : "#e5e7eb";
  }

  function toggleDark() {
    darkMode = !darkMode;
    localStorage.setItem("darkMode", darkMode);
    applyDark();
    updateDashboard();
    renderHaus();
  }

  function setUnit(u) {
    unit = u;
    localStorage.setItem("unit", u);
    document.querySelectorAll(".unit-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("btn-" + u).classList.add("active");
    // Spaltentitel aktualisieren
    document.getElementById("valueColHeader").innerHTML = `Strahlung (${unitLabel()}) <span class="sort-icon">⇅</span>`;
    if(document.getElementById("hausValCol"))
      document.getElementById("hausValCol").textContent = `Strahlung (${unitLabel()})`;
    updateDashboard();
    renderHaus();
  }

  // Settings Panel öffnen/schließen
  function toggleSettings() {
    document.getElementById("settingsPanel").classList.toggle("open");
    document.getElementById("settingsOverlay").classList.toggle("open");
    const btn = document.getElementById("settingsBtn");
    btn.style.transform = document.getElementById("settingsPanel").classList.contains("open")
      ? "rotate(90deg)" : "";
  }
  function closeSettings() {
    document.getElementById("settingsPanel").classList.remove("open");
    document.getElementById("settingsOverlay").classList.remove("open");
    document.getElementById("settingsBtn").style.transform = "";
  }
  // ESC schließt auch Settings
  document.addEventListener("keydown", e => {
    if(e.key === "Escape") { closeSettings(); closeLightbox(); closeMapFullscreen(); closeAnyCardFullscreen(); }
  });

  initThresholdUI();

  // ════════════════════════════════════════════════════════
  //  📸 FOTOS
  // ════════════════════════════════════════════════════════
  const FOTOS = [
    { src:"photos/1.jpg",  caption:"Messung im Waldviertel",     ort:"Arbesbach, Niederösterreich" },
    { src:"photos/2.jpg",  caption:"Messung auf dem Schneeberg", ort:"Niederösterreich, 2076 m" },
    { src:"photos/3.jpg",  caption:"Messung im Wienerwald",      ort:"Wien-Umgebung" },
    { src:"photos/8.jpg",  caption:"Messung in Amstetten",       ort:"Amstetten, Niederösterreich" },
    { src:"photos/9.jpg",  caption:"St. Pölten Hauptplatz",           ort:"St. Pölten, Niederösterreich" },
    { src:"photos/12.jpg",  caption:"Melk",       ort:"Melk, Niederösterreich" }, 
    { src:"photos/14.jpg",  caption:"Innsbruck",       ort:"Innsbruck, Tirol" }, 
    {src:"photos/15.jpg",  caption:"Selzthal",       ort:"Selzthal, Steiermark" },
    { src:"photos/19.jpg",  caption:"Graz, Uhrturm",       ort:"Graz, Steiermark" },
    { src:"photos/21.jpg",  caption:"Linz",       ort:"Linz, Oberösterreich" }, 
    { src:"photos/17.jpg",  caption:"Gmunden",       ort:"Gmunden, Oberösterreich" },
    { src:"photos/18.jpg",  caption:"Bruck an der Mur",       ort:"Bruck an der Mur, Steiermark" },
    { src:"photos/23.jpg",  caption:"Steyr",       ort:"Steyr, Oberösterreich" },
    { src:"photos/24.jpg",  caption:"Stillenstein",       ort:"Stillenstein, Oberösterreich" },
    { src:"photos/26.jpg",  caption:"Arlbergpass",       ort:"Arlbergpass, Tirol" },
    { src:"photos/27.jpg",  caption:"Burgruine Ehrenberg",       ort:"Burgruine Ehrenberg, Tirol" },
    { src:"photos/28.jpg",  caption:"AKW Zwentendorf",       ort:"Zwentendorf, Niederösterreich" },
    { src:"photos/33.jpg",  caption:"NHM Wien, radioaktive Mineralien",       ort:"Wien, 1.Bezirk" },
    { src:"photos/31.jpg",  caption:"NHM Wien, radioaktive Mineralien",       ort:"Wien, 1.Bezirk" },
    { src:"photos/34.jpg",  caption:"Neusiedler See",       ort:"Neusiedel am See, Burgenland" },
    { src:"photos/35.jpg",  caption:"Arbesbach",       ort:"Arbesbach, Niederösterreich" },
    { src:"photos/37.jpg",  caption:"Salzburg",       ort:"Salzburg, Salzburg" },
    { src:"photos/38.jpg",  caption:"Salzburg",       ort:"Salzburg, Salzburg" },
    { src:"photos/39.jpg",  caption:"Salzburg",       ort:"Salzburg, Salzburg" },
    { src:"photos/40.jpg",  caption:"Weyer",       ort:"Weyer, Oberösterreich" },
    { src:"photos/41.jpg",  caption:"Dürnstein",       ort:"Dürnstein, Niederösterreich" },
    { src:"photos/42.jpg",  caption:"Dürnstein",       ort:"Dürnstein, Niederösterreich" },
    { src:"photos/43.jpg",  caption:"Wien",       ort:"Wien, 1.Bezirk" },





    // { src:"photos/4.jpg", caption:"...", ort:"..." },
  ];

  function renderGallery(){
    const grid = document.getElementById("galleryGrid");
    grid.innerHTML = "";
    if(!FOTOS.length){
      grid.innerHTML='<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">📷 Noch keine Fotos.</p>';
      return;
    }
    FOTOS.forEach((foto,idx)=>{
      const item=document.createElement("div"); item.className="gallery-item";
      item.innerHTML=`
        <div class="img-wrap" onclick="openLightbox(${idx})">
          <img src="${escapeHtml(foto.src)}" alt="${escapeHtml(foto.caption)}"
               onerror="this.src='';this.closest('.img-wrap').style.background='var(--haus-bg)';this.style.display='none';">
        </div>
        <div class="gallery-caption">
          ${escapeHtml(foto.caption)}
          ${foto.ort?`<div class="ort">📍 ${escapeHtml(foto.ort)}</div>`:""}
        </div>`;
      grid.appendChild(item);
    });
  }

  function openLightbox(idx){
    const f=FOTOS[idx];
    document.getElementById("lbImg").src=f.src;
    document.getElementById("lbCaption").textContent=f.caption;
    document.getElementById("lbOrt").textContent=f.ort?"📍 "+f.ort:"";
    document.getElementById("lightbox").classList.add("open");
  }
  function closeLightbox(){
    document.getElementById("lightbox").classList.remove("open");
    document.getElementById("lbImg").src="";
  }
  document.getElementById("lightbox").addEventListener("click",function(e){ if(e.target===this) closeLightbox(); });

  // ════════════════════════════════════════════════════════
  //  🏠 HAUS-VERLAUF
  // ════════════════════════════════════════════════════════
  let hausDaten = [];
  let hausChart = null;

  async function loadHausDaten(){
    try{
      const res = await fetch(BASE_URL+"/haus-measurements");
      if(!res.ok) throw new Error("HTTP "+res.status);
      hausDaten = await res.json();
      hausDaten.sort((a,b)=>a.date.localeCompare(b.date));
    }catch(e){
      console.error("Haus-Daten laden fehlgeschlagen:", e);
      hausDaten = [];
    }
    renderHaus();
  }

  async function addHausMeasurement(){
    if(!isAdmin){ alert("Nur Admins können Haus-Messungen hinzufügen."); return; }
    const date  = document.getElementById("hausDate").value;
    const value = parseFloat(document.getElementById("hausValue").value);
    if(!date)                    { alert("Bitte ein Datum wählen."); return; }
    if(isNaN(value)||value <= 0) { alert("Bitte einen gültigen Wert eingeben."); return; }

    // Prüfen ob Datum schon existiert
    if(hausDaten.find(d=>d.date===date)){
      if(!confirm("Für dieses Datum existiert bereits ein Eintrag. Überschreiben?")) return;
      // Alten Eintrag zuerst löschen
      try{
        const delRes = await fetch(BASE_URL+"/haus-measurements/"+date, {method:"DELETE", headers:authHeaders()});
        if(delRes.status===401||delRes.status===403){ alert("Sitzung abgelaufen. Bitte erneut einloggen."); logout(); return; }
      }catch(e){ alert("Fehler beim Überschreiben: "+e.message); return; }
    }

    try{
      const res = await fetch(BASE_URL+"/haus-measurements", {
        method:"POST",
        headers:{"Content-Type":"application/json", ...authHeaders()},
        body: JSON.stringify({date, value})
      });
      if(res.status===401||res.status===403){ alert("Sitzung abgelaufen. Bitte erneut einloggen."); logout(); return; }
      if(!res.ok) throw new Error("HTTP "+res.status);
      document.getElementById("hausDate").value="";
      document.getElementById("hausValue").value="";
      await loadHausDaten();
    }catch(e){ alert("Fehler beim Speichern: "+e.message); }
  }

  async function deleteHausMeasurement(date){
    // Nur Admins dürfen löschen — der Button wird Nicht-Admins in renderHaus()
    // gar nicht erst angezeigt, diese Prüfung ist eine zusätzliche Absicherung.
    if(!isAdmin){ alert("Nur Admins können Haus-Messungen löschen."); return; }
    if(!confirm("Eintrag vom "+formatDate(date)+" löschen?")) return;
    try{
      const res = await fetch(BASE_URL+"/haus-measurements/"+date, {method:"DELETE", headers:authHeaders()});
      if(res.status===401||res.status===403){ alert("Sitzung abgelaufen. Bitte erneut einloggen."); logout(); return; }
      if(!res.ok) throw new Error("HTTP "+res.status);
      await loadHausDaten();
    }catch(e){ alert("Fehler beim Löschen: "+e.message); }
  }

  function formatDate(iso){
    if(!iso) return "";
    const [y,m,d]=iso.split("-"); return d+"."+m+"."+y;
  }

  function getHausColor(v){ return v<THRESH.low?"#16a34a":v<THRESH.high?"#d97706":"#dc2626"; }
  function getHausBadge(v){
    if(v<THRESH.low) return '<span class="badge badge-green">niedrig</span>';
    if(v<THRESH.high) return '<span class="badge badge-orange">mittel</span>';
    return '<span class="badge badge-red">hoch</span>';
  }

  function renderHaus(){
    const labels = hausDaten.map(d=>formatDate(d.date));
    const rawVals= hausDaten.map(d=>d.value);
    const dispVals=rawVals.map(v=>convertValue(v));
    const ptColors=rawVals.map(v=>getHausColor(v));

    if(hausChart) hausChart.destroy();

    const textColor = darkMode ? "#94a3b8" : "#666";

    hausChart=new Chart(document.getElementById("hausChart"),{
      type:"line",
      data:{
        labels,
        datasets:[{
          label:"Strahlung zuhause",
          data:dispVals,
          borderColor:"#1e3a8a",
          backgroundColor:"rgba(30,58,138,0.08)",
          pointBackgroundColor:ptColors,
          pointBorderColor:ptColors,
          pointRadius:6, pointHoverRadius:9,
          fill:true, tension:0.35
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{
            callbacks:{
              label: ctx => ctx.parsed.y.toFixed(UNITS[unit].decimals) + " " + unitLabel()
            }
          }
        },
        scales:{
          x:{ title:{display:true,text:"Datum (wöchentlich)",color:textColor}, ticks:{maxRotation:45,color:textColor}, grid:{color: darkMode?"#2d3748":"#e5e7eb"} },
          y:{ title:{display:true,text:unitLabel(),color:textColor}, ticks:{color:textColor, callback:v=>v.toFixed(UNITS[unit].decimals)}, grid:{color: darkMode?"#2d3748":"#e5e7eb"} }
        }
      }
    });

    // Spaltentitel
    if(document.getElementById("hausValCol"))
      document.getElementById("hausValCol").textContent = "Strahlung ("+unitLabel()+")";

    // Statistik
    if(rawVals.length>0){
      const min=Math.min(...rawVals), max=Math.max(...rawVals);
      const avg=rawVals.reduce((a,b)=>a+b,0)/rawVals.length;
      document.getElementById("hausMin").textContent=formatVal(min);
      document.getElementById("hausAvg").textContent=formatVal(avg);
      document.getElementById("hausMax").textContent=formatVal(max);
      if(rawVals.length>=2){
        const diff=rawVals[rawVals.length-1]-rawVals[rawVals.length-2];
        const el=document.getElementById("hausTrend");
        if(diff>0.005){el.textContent="↑ steigend";el.style.color="#dc2626";}
        else if(diff<-0.005){el.textContent="↓ sinkend";el.style.color="#16a34a";}
        else{el.textContent="→ stabil";el.style.color="#d97706";}
      } else { document.getElementById("hausTrend").textContent="—"; }
    } else {
      ["hausMin","hausAvg","hausMax","hausTrend"].forEach(id=>document.getElementById(id).textContent="—");
    }

    // Tabelle
    const tbody=document.getElementById("hausBody");
    tbody.innerHTML="";
    if(!hausDaten.length){
      tbody.innerHTML='<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px">Noch keine Einträge.</td></tr>';
      return;
    }
    [...hausDaten].reverse().forEach(d=>{
      const tr=document.createElement("tr");
      const safeDate = escapeHtml(d.date);
      tr.innerHTML=`
        <td data-label="Datum">${escapeHtml(formatDate(d.date))}</td>
        <td data-label="Strahlung" style="font-weight:600;color:${getHausColor(d.value)}">${formatVal(d.value)}</td>
        <td data-label="Status">${getHausBadge(d.value)}</td>
        <td>${isAdmin ? `<button class="delete-btn" style="font-size:12px;padding:3px 8px" onclick="deleteHausMeasurement('${safeDate}')">✕</button>` : ""}</td>`;
      tbody.appendChild(tr);
    });
  }

  // ════════════════════════════════════════════════════════
  //  MESSUNGEN & DASHBOARD
  // ════════════════════════════════════════════════════════
  let measurements=[], isAdmin=false, editId=null;
  let hiddenIds = new Set(JSON.parse(localStorage.getItem("hiddenIds") || "[]"));
  let barChart=null, scatterChart=null, histChart=null, map=null;
  let sortCol=null, sortDir=1;
  // Läuft die Seite lokal (localhost/127.0.0.1 oder direkt als Datei geöffnet)?
  // Dann automatisch den lokalen Server verwenden, sonst den Render-Server.
  // So funktioniert dieselbe Datei auf localhost UND auf Netlify — keine zwei Versionen mehr nötig.
  const IS_LOCAL = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  const BASE_URL = IS_LOCAL
    ? "http://localhost:3000"
    : "https://radback-0e7v.onrender.com";

  // ── Sicherheit: Admin-Token & HTML-Escaping ────────────
  // Das Admin-Token wird NUR im Speicher gehalten (nicht in localStorage),
  // damit es bei einem XSS-Angriff nicht dauerhaft auslesbar/gestohlen werden kann.
  let adminToken = null;

  function authHeaders(){
    return adminToken ? { "Authorization": "Bearer " + adminToken } : {};
  }

  // Verhindert XSS: wandelt Sonderzeichen in HTML-Entities um, bevor
  // Server-/Nutzerdaten per innerHTML in die Seite eingefügt werden.
  function escapeHtml(str){
    if(str===null || str===undefined) return "";
    return String(str)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#39;");
  }

  function saveHiddenIds(){ localStorage.setItem("hiddenIds", JSON.stringify([...hiddenIds])); }
  function visibleMeasurements(){ return measurements.filter(m => !hiddenIds.has(m.id)); }

  function toggleVisibility(id){
    if(hiddenIds.has(id)) hiddenIds.delete(id);
    else hiddenIds.add(id);
    saveHiddenIds();
    updateDashboard();
  }

  function getColor(v){ return v<THRESH.low?"green":v<THRESH.high?"orange":"red"; }
  function getBadge(v){
    if(v<THRESH.low) return '<span class="badge badge-green">niedrig</span>';
    if(v<THRESH.high) return '<span class="badge badge-orange">mittel</span>';
    return '<span class="badge badge-red">hoch</span>';
  }

  async function loadMeasurements(){
    try{
      const res=await fetch(BASE_URL+"/measurements");
      measurements=await res.json();
      // Sicherstellen dass jede Messung eine id hat (ältere Einträge haben keine)
      measurements = measurements.map((m, i) => ({
        ...m,
        id: m.id || `legacy-${m.location}-${m.date}-${i}`
      }));
      updateDashboard();
    }catch(e){console.error("Fehler:",e);}
  }


  // ── Untergrund (Geologie) ──────────────────────────────
  const GEO = {
    granit:     { label:"Granit & Gneis (Böhmische Masse)", short:"Granit / Gneis", color:"#be185d",
                  desc:"Enthält mehr natürliches Uran, Thorium und Kalium-40. Deshalb liegen die Werte hier meist am höchsten." },
    kristallin: { label:"Kristallin & Schiefer (Zentralalpen)", short:"Zentralalpen", color:"#7c3aed",
                  desc:"Gneise und Schiefer der Alpen. Mittlere Werte; in großer Höhe kommt mehr kosmische Strahlung dazu, Schnee schirmt den Boden ab." },
    flysch:     { label:"Flysch (Sandstein & Mergel)", short:"Flysch", color:"#0891b2",
                  desc:"Sandsteine und Mergel am Alpennordrand, etwa im Wienerwald. Meist mittlere Werte." },
    sediment:   { label:"Sedimente (Molasse, Becken, Schotter)", short:"Sedimente", color:"#a16207",
                  desc:"Lockere Ablagerungen in Becken und Tälern. Der Wert hängt davon ab, aus welchem Gestein das Material stammt." },
    kalk:       { label:"Kalk & Dolomit (Kalkalpen u. a.)", short:"Kalk / Dolomit", color:"#2563eb",
                  desc:"Karbonatgesteine enthalten wenig Uran und Thorium. Deshalb liegen die Werte meist am niedrigsten." },
    unbekannt:  { label:"Unbekannt", short:"Unbekannt", color:"#64748b", desc:"Noch kein Untergrund zugeordnet." }
  };
  // Eigenes Feld der Messung hat Vorrang, sonst die Zuordnung aus geology-data.js
  function geoOf(m){
    const fb = (window.GEOLOGY_BY_ID || {})[m.id] || {};
    const key = GEO[m.geology] ? m.geology : (GEO[fb.g] ? fb.g : "unbekannt");
    const own = !!GEO[m.geology];
    return { key, info:GEO[key], conf: own ? "hoch" : (fb.c || "hoch"), note: own ? "" : (fb.n || "") };
  }
  function geoChip(m){
    const g = geoOf(m);
    const warn = g.conf === "mittel" ? ' <span title="Grenzlage, Zuordnung unsicher">⚠</span>' : "";
    const tip = (g.note ? g.note : g.info.label).replace(/"/g,"&quot;");
    return `<span class="geo-chip" style="--gc:${g.info.color}" title="${tip}"><i></i>${g.info.short}${warn}</span>`;
  }
  const geoFilterActive = {};
  let geoMarkers = [];
  let geoChart = null;

  function createGeoChart(){
    const canvas = document.getElementById("geoChart");
    if(!canvas) return;
    if(geoChart){ geoChart.destroy(); geoChart = null; }
    const groups = {};
    visibleMeasurements().forEach(m => { const k = geoOf(m).key; (groups[k] = groups[k] || []).push(m); });
    const mean = a => a.reduce((s,m)=>s+m.value,0)/a.length;
    const keys = Object.keys(groups).sort((a,b)=>mean(groups[a])-mean(groups[b]));
    renderGeoStats(keys, groups, mean);
    if(!keys.length) return;

    const textColor = darkMode ? "#94a3b8" : "#666";
    const gridColor = darkMode ? "#2d3748" : "#e5e7eb";
    const dec = UNITS[unit].decimals;
    const datasets = keys.map((k,i) => ({
      label: GEO[k].short, type:"scatter",
      data: groups[k].map((m,j) => ({ x: i + (((j*37)%100)/100 - 0.5)*0.55, y: convertValue(m.value), m })),
      backgroundColor: GEO[k].color + "b3", borderColor: GEO[k].color, pointRadius: 6, pointHoverRadius: 9
    }));
    datasets.push({
      label:"Mittelwert", type:"scatter",
      data: keys.map((k,i)=>({ x:i, y:convertValue(mean(groups[k])) })),
      pointStyle:"line", pointRadius:26, pointHoverRadius:26, borderWidth:4,
      borderColor: darkMode ? "#f1f5f9" : "#111827"
    });
    geoChart = new Chart(canvas, {
      data:{ datasets },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{ display:false },
          tooltip:{ callbacks:{ label: ctx => ctx.raw.m
            ? ctx.raw.m.location + ": " + formatVal(ctx.raw.m.value)
            : "Mittelwert: " + ctx.parsed.y.toFixed(dec) + " " + unitLabel() } }
        },
        scales:{
          x:{ type:"linear", min:-0.6, max:keys.length-0.4, grid:{display:false},
              ticks:{ stepSize:1, color:textColor, font:{size:chartTickFont()},
                callback: v => (Number.isInteger(v) && keys[v]) ? [GEO[keys[v]].short, "n = " + groups[keys[v]].length] : "" } },
          y:{ title:{display:true, text:unitLabel(), color:textColor}, grid:{color:gridColor}, ticks:{color:textColor}, beginAtZero:false }
        }
      }
    });
  }

  function renderGeoStats(keys, groups, mean){
    const grid = document.getElementById("geoStats");
    const ins  = document.getElementById("geoInsight");
    if(!grid) return;
    if(!keys.length){ grid.innerHTML = ""; if(ins) ins.textContent = ""; return; }
    grid.innerHTML = keys.map(k => {
      const arr = groups[k], vals = arr.map(m=>m.value);
      const unsure = arr.filter(m => geoOf(m).conf === "mittel").length;
      return `<div class="geo-card" style="--gc:${GEO[k].color}">
        <div class="geo-card-title">${GEO[k].label}</div>
        <div class="geo-card-val">Ø ${formatVal(mean(arr))}</div>
        <div class="geo-card-range">${formatVal(Math.min(...vals))} – ${formatVal(Math.max(...vals))} · ${arr.length} Messungen${unsure ? " · " + unsure + " ⚠" : ""}</div>
        <div class="geo-card-desc">${GEO[k].desc}</div>
      </div>`;
    }).join("");
    if(ins){
      const good = keys.filter(k => k !== "unbekannt" && groups[k].length >= 3);
      if(good.length >= 2){
        const lo = good[0], hi = good[good.length-1];
        const f = mean(groups[hi]) / mean(groups[lo]);
        ins.innerHTML = `<b>${GEO[hi].short}</b> liegt im Schnitt bei ${formatVal(mean(groups[hi]))}, das ist das <b>${f.toFixed(1).replace(".",",")}-Fache</b> von <b>${GEO[lo].short}</b> (${formatVal(mean(groups[lo]))}).`;
      } else ins.textContent = "";
    }
  }

  function renderGeoLegend(){
    const el = document.getElementById("mapLegend");
    const counts = {};
    visibleMeasurements().forEach(m => { const k = geoOf(m).key; counts[k] = (counts[k]||0) + 1; });
    const keys = Object.keys(GEO).filter(k => counts[k]);
    el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;width:100%;">
      <span style="font-weight:700;color:var(--text-dim);font-size:12px;">Untergrund (anklicken zum Ein-/Ausblenden):</span>
      ${keys.map(k => `<button class="geo-legend-btn ${geoFilterActive[k]===false ? "off" : ""}" style="--gc:${GEO[k].color}" onclick="toggleGeoFilter('${k}')"><i></i>${GEO[k].short} (${counts[k]})</button>`).join("")}
      <span style="font-size:11px;color:var(--text-muted);">Gestrichelter Rand = Zuordnung unsicher (Grenzlage)</span>
    </div>`;
  }
  function toggleGeoFilter(k){
    geoFilterActive[k] = (geoFilterActive[k] === false);
    renderGeoLegend();
    geoMarkers.forEach(({marker,key}) => { if(geoFilterActive[key] === false) marker.remove(); else marker.addTo(map); });
  }
  function renderGeologyMarkers(){
    geoMarkers = [];
    visibleMeasurements().forEach(m => {
      const lat = Number(m.lat), lon = Number(m.lon);
      if(isNaN(lat) || isNaN(lon)) return;
      const g = geoOf(m);
      const marker = L.circleMarker([lat,lon], {
        radius:10, fillColor:g.info.color, color:"#000", weight: g.conf==="mittel" ? 2 : 1,
        dashArray: g.conf==="mittel" ? "3 3" : null, fillOpacity:0.85, bubblingMouseEvents:false
      }).bindPopup(`<b>${escapeHtml(m.location)}</b><br>Untergrund: ${g.info.label}${g.conf==="mittel" ? " ⚠" : ""}`
        + (g.note ? `<br><span style="font-size:12px">${escapeHtml(g.note)}</span>` : "")
        + `<br>Strahlung: ${formatVal(m.value)}<br>Höhe: ${escapeHtml(m.altitude)} m`);
      geoMarkers.push({marker, key:g.key});
      if(geoFilterActive[g.key] !== false) marker.addTo(map);
    });
    renderGeoLegend();
  }

  function updateDashboard(){ updateStats(); renderTable(); createCharts(); createGeoChart(); initMap(); }

  function updateStats(){
    const vis = visibleMeasurements();
    if(!vis.length){
      document.getElementById("minValue").innerText="—";
      document.getElementById("maxValue").innerText="—";
      document.getElementById("avgValue").innerText="—";
      return;
    }
    const vals=vis.map(m=>m.value);
    document.getElementById("minValue").innerText=formatVal(Math.min(...vals));
    document.getElementById("maxValue").innerText=formatVal(Math.max(...vals));
    document.getElementById("avgValue").innerText=formatVal(vals.reduce((a,b)=>a+b,0)/vals.length);
  }

  function renderTable(){
    const tbody=document.getElementById("measurementBody");
    tbody.innerHTML="";
    document.getElementById("actionHeader").style.display=isAdmin?"":"none";
    document.getElementById("valueColHeader").innerHTML=`Strahlung (${unitLabel()}) <span class="sort-icon">⇅</span>`;
    let sorted=[...measurements];
    if(sortCol){
      sorted.sort((a,b)=>{
        let av=a[sortCol],bv=b[sortCol];
        if(typeof av==="string"){av=av.toLowerCase();bv=bv.toLowerCase();}
        return av<bv?-sortDir:av>bv?sortDir:0;
      });
    }
    sorted.forEach(m=>{
      const hidden = hiddenIds.has(m.id);
      const tr=document.createElement("tr");
      if(hidden) tr.classList.add("row-hidden");
      tr.innerHTML=`
        <td data-label="Ort"><b>${escapeHtml(m.location)}</b></td>
        <td data-label="Datum">${escapeHtml(m.date)}</td>
        <td data-label="Höhe">${escapeHtml(m.altitude)} m</td>
        <td data-label="Untergrund">${geoChip(m)}</td>
        <td data-label="Strahlung (${unitLabel()})" style="color:${getColor(m.value)};font-weight:bold">${formatVal(m.value)}</td>
        <td data-label="Status">${getBadge(m.value)}</td>
        <td data-label="Sichtbarkeit">
          <button class="toggle-vis-btn ${hidden ? "btn-hidden" : "btn-visible"}" onclick="toggleVisibility('${m.id}')" title="${hidden ? "Einblenden" : "Ausblenden"}">
            ${hidden ? "👁 ein" : "👁 aus"}
          </button>
        </td>`;
      if(isAdmin){
        const td=document.createElement("td"); td.className="action-btns"; td.setAttribute("data-label","Aktionen");
        const eb=document.createElement("button"); eb.className="edit-btn"; eb.innerText="Bearbeiten"; eb.onclick=()=>startEdit(m);
        const db=document.createElement("button"); db.className="delete-btn"; db.innerText="Löschen"; db.onclick=()=>deleteMeasurement(m.id);
        td.appendChild(eb); td.appendChild(db); tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
  }

  function applySort(col, dir){
    sortCol=col; sortDir=dir;
    document.querySelectorAll("thead th[data-col]").forEach(th=>{
      const icon=th.querySelector(".sort-icon");
      if(th.dataset.col===col){th.classList.add("active");icon.textContent=sortDir===1?"↑":"↓";}
      else{th.classList.remove("active");icon.textContent="⇅";}
    });
    renderTable();
  }
  function sortTable(col){
    applySort(col, sortCol===col?sortDir*-1:1);
  }
  // Für das mobile Sortier-Dropdown (ersetzt die anklickbaren Tabellen-Header)
  function mobileSortChange(value){
    if(!value) return;
    const idx = value.lastIndexOf("-");
    const col = value.slice(0,idx), dir = value.slice(idx+1);
    applySort(col, dir==="asc"?1:-1);
  }

  // Liefert eine an die Bildschirmbreite angepasste Tick-Schriftgröße für Diagramme.
  function chartTickFont(){ return window.innerWidth < 640 ? 10 : 12; }

  let _resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      if(barChart) barChart.resize();
      if(histChart) histChart.resize();
      if(scatterChart) scatterChart.resize();
      if(geoChart) geoChart.resize();
      if(hausChart) hausChart.resize();
      if(map) map.invalidateSize();
    }, 150);
  });

  function createCharts(){
    const measurements = visibleMeasurements();
    if(!measurements.length) return;
    const textColor = darkMode ? "#94a3b8" : "#666";
    const gridColor = darkMode ? "#2d3748" : "#e5e7eb";

    if(barChart) barChart.destroy();
    barChart=new Chart(document.getElementById("barChart"),{
      type:"bar",
      data:{
        labels:measurements.map(m=>m.location),
        datasets:[{
          label:"Strahlung",
          data:measurements.map(m=>convertValue(m.value)),
          backgroundColor:measurements.map(m=>getColor(m.value))
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{
          y:{beginAtZero:true,title:{display:true,text:unitLabel(),color:textColor},ticks:{color:textColor},grid:{color:gridColor}},
          x:{ticks:{color:textColor,maxRotation:60,minRotation:0,autoSkip:true,autoSkipPadding:8,font:{size:chartTickFont()}},grid:{color:gridColor}}
        }
      }
    });

    if(scatterChart) scatterChart.destroy();
    const pts=measurements.map(m=>({x:convertValue(m.value),y:m.altitude}));
    let n=pts.length,sx=0,sy=0,sxy=0,sx2=0;
    pts.forEach(p=>{sx+=p.x;sy+=p.y;sxy+=p.x*p.y;sx2+=p.x*p.x;});
    const sl=(n*sxy-sx*sy)/(n*sx2-sx*sx),ic=(sy-sl*sx)/n;
    const mnx=Math.min(...pts.map(p=>p.x)),mxx=Math.max(...pts.map(p=>p.x));
    scatterChart=new Chart(document.getElementById("scatterChart"),{
      type:"scatter",
      data:{datasets:[
        {label:"Messpunkte",data:pts,backgroundColor:"blue"},
        {label:"Regression",data:[{x:mnx,y:sl*mnx+ic},{x:mxx,y:sl*mxx+ic}],type:"line",borderColor:darkMode?"#94a3b8":"black",fill:false,tension:0}
      ]},
      options:{
        responsive:true, maintainAspectRatio:false,
        scales:{
          x:{type:"linear",title:{display:true,text:"Strahlung ("+unitLabel()+")",color:textColor},ticks:{color:textColor},grid:{color:gridColor}},
          y:{title:{display:true,text:"Höhe (m)",color:textColor},ticks:{color:textColor},grid:{color:gridColor}}
        }
      }
    });

    // ── Histogramm / Verteilungsdiagramm ─────────────────
    if(histChart) histChart.destroy();

    // Berechne Bins (gleichmäßige Intervalle über den Wertebereich)
    const allVals = measurements.map(m => convertValue(m.value));
    const histMin = Math.min(...allVals);
    const histMax = Math.max(...allVals);
    const BIN_COUNT = 16;
    const binSize = (histMax - histMin) / BIN_COUNT || 0.05;
    const bins = Array.from({length: BIN_COUNT}, (_, i) => ({
      from: histMin + i * binSize,
      to:   histMin + (i+1) * binSize,
      count: 0
    }));
    allVals.forEach(v => {
      let idx = Math.floor((v - histMin) / binSize);
      if(idx >= BIN_COUNT) idx = BIN_COUNT - 1;
      bins[idx].count++;
    });

    // Farbe je nach Bereich (grün/orange/rot basierend auf µSv/h Grenzwerten, umgerechnet)
    const lowThresh  = convertValue(THRESH.low);
    const highThresh = convertValue(THRESH.high);
    const binColors = bins.map(b => {
      const mid = (b.from + b.to) / 2;
      if(mid < lowThresh)  return "rgba(22,163,74,0.75)";
      if(mid < highThresh) return "rgba(217,119,6,0.75)";
      return "rgba(220,38,38,0.75)";
    });

    const histLabels = bins.map(b =>
      b.from.toFixed(UNITS[unit].decimals) + "–" + b.to.toFixed(UNITS[unit].decimals)
    );

    histChart = new Chart(document.getElementById("histChart"), {
      type: "bar",
      data: {
        labels: histLabels,
        datasets: [{
          label: "Anzahl Messungen",
          data: bins.map(b => b.count),
          backgroundColor: binColors,
          borderColor: binColors.map(c => c.replace("0.75","1")),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: ctx => "Bereich: " + ctx[0].label + " " + unitLabel(),
              label: ctx => ctx.parsed.y + " Messung(en)"
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: "Strahlung (" + unitLabel() + ")", color: textColor },
            ticks: { color: textColor, maxRotation: 60, minRotation: 0, autoSkip: true, autoSkipPadding: 6, font: { size: chartTickFont() } },
            grid: { color: gridColor }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Anzahl Messungen", color: textColor },
            ticks: { color: textColor, stepSize: 1 },
            grid: { color: gridColor }
          }
        }
      }
    });
    // Info-Kacheln unter dem Histogramm
    const low  = bins.filter(b=>(b.from+b.to)/2 < lowThresh).reduce((a,b)=>a+b.count,0);
    const mid  = bins.filter(b=>{const m=(b.from+b.to)/2; return m>=lowThresh&&m<highThresh;}).reduce((a,b)=>a+b.count,0);
    const high = bins.filter(b=>(b.from+b.to)/2 >= highThresh).reduce((a,b)=>a+b.count,0);
    const total = measurements.length;
    document.getElementById("histInfo").innerHTML = `
      <div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:10px 16px;color:#166534;flex:1;min-width:120px;text-align:center">
        <div style="font-size:20px;font-weight:bold">${low}</div>
        <div style="font-size:12px;margin-top:2px">Niedrig (${Math.round(low/total*100)}%)</div>
        <div style="font-size:11px;opacity:0.7">< ${lowThresh.toFixed(UNITS[unit].decimals)} ${unitLabel()}</div>
      </div>
      <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px 16px;color:#92400e;flex:1;min-width:120px;text-align:center">
        <div style="font-size:20px;font-weight:bold">${mid}</div>
        <div style="font-size:12px;margin-top:2px">Mittel (${Math.round(mid/total*100)}%)</div>
        <div style="font-size:11px;opacity:0.7">${lowThresh.toFixed(UNITS[unit].decimals)}–${highThresh.toFixed(UNITS[unit].decimals)} ${unitLabel()}</div>
      </div>
      <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px 16px;color:#991b1b;flex:1;min-width:120px;text-align:center">
        <div style="font-size:20px;font-weight:bold">${high}</div>
        <div style="font-size:12px;margin-top:2px">Hoch (${Math.round(high/total*100)}%)</div>
        <div style="font-size:11px;opacity:0.7">> ${highThresh.toFixed(UNITS[unit].decimals)} ${unitLabel()}</div>
      </div>
    `;
  }

  // ── Karte & Filter ─────────────────────────────────────
  const filterActive={green:true,orange:true,red:true};
  function getCategory(v){ return v<THRESH.low?"green":v<THRESH.high?"orange":"red"; }

  function toggleFilter(color){
    filterActive[color]=!filterActive[color];
    const btn=document.getElementById("btn-"+color);
    const cols={green:"#16a34a",orange:"#d97706",red:"#dc2626"};
    if(filterActive[color]){btn.style.background=cols[color];btn.style.borderColor=cols[color];btn.style.opacity="1";}
    else{btn.style.background="#e5e7eb";btn.style.borderColor="#d1d5db";btn.style.opacity="0.5";}
    updateMapMarkers();
  }
  function resetFilter(){
    ["green","orange","red"].forEach(c=>{
      filterActive[c]=true;
      const btn=document.getElementById("btn-"+c);
      const cols={green:"#16a34a",orange:"#d97706",red:"#dc2626"};
      btn.style.background=cols[c];btn.style.borderColor=cols[c];btn.style.opacity="1";
    });
    updateMapMarkers();
  }

  let mapMarkers=[];
  function updateMapMarkers(){
    mapMarkers.forEach(({marker,category})=>{
      if(filterActive[category]) marker.addTo(map); else marker.remove();
    });
  }

  // ── Karten-Modus (Einzelmessungen vs. Bundesländer-Durchschnitt) ──
  let mapMode = "points";          // "points" | "bundeslaender" | "heatmap"
  let austriaGeoJSON = null;       // wird einmalig geladen & zwischengespeichert
  let choroplethLayer = null;
  const AUSTRIA_GEOJSON_URL = "https://cdn.jsdelivr.net/gh/codeforgermany/click_that_hood@main/public/data/austria-states.geojson";

  // ── Geplante Messpunkte (Admin-Planungswerkzeug) ──────────
  // Blaue Punkte, die der Admin auf der Karte setzt, um zu sehen, wo noch
  // eine Messung fehlt. Wird nur lokal im Browser des Admins gespeichert.
  let plannedPoints = JSON.parse(localStorage.getItem("plannedPoints") || "[]"); // [{id,lat,lon,note}]
  let planningMode  = false;                                    // Klick-auf-Karte-Modus aktiv?
  let showPlanned   = localStorage.getItem("showPlanned") === "1"; // Sichtbarkeits-Toggle
  let plannedLayerGroup = null;

  function setMapMode(mode){
    mapMode = mode;
    if(mode!=="points" && planningMode) togglePlanningMode();
    ["points","bundeslaender","heatmap","geology"].forEach(m=>{
      const btn = document.getElementById("btn-mode-"+m);
      if(btn) btn.classList.toggle("active", mode===m);
    });
    document.getElementById("mapFilter").style.display = mode==="points" ? "flex" : "none";
    document.getElementById("mapLegend").style.display  = (mode==="bundeslaender" || mode==="geology") ? "flex" : "none";
    document.getElementById("mapStatus").textContent = "";
    updateAdminMapTools();
    initMap();
  }

  // ── Geometrie-Helfer: Punkt-in-Polygon (Ray-Casting) ──────
  function pointInRing(point, ring){
    const x=point[0], y=point[1];
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const xi=ring[i][0], yi=ring[i][1];
      const xj=ring[j][0], yj=ring[j][1];
      const intersect = ((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi);
      if(intersect) inside=!inside;
    }
    return inside;
  }
  function pointInPolygonCoords(point, polygonCoords){
    if(!pointInRing(point, polygonCoords[0])) return false;
    for(let k=1;k<polygonCoords.length;k++){
      if(pointInRing(point, polygonCoords[k])) return false; // liegt in einem Loch
    }
    return true;
  }
  function pointInFeature(point, feature){
    const geom=feature.geometry;
    if(!geom) return false;
    if(geom.type==="Polygon") return pointInPolygonCoords(point, geom.coordinates);
    if(geom.type==="MultiPolygon") return geom.coordinates.some(c=>pointInPolygonCoords(point,c));
    return false;
  }
  function findBundesland(lat, lon, geojson){
    const point=[lon,lat]; // GeoJSON-Reihenfolge: [lon, lat]
    return geojson.features.find(f=>pointInFeature(point, f)) || null;
  }

  async function loadAustriaGeoJSON(){
    if(austriaGeoJSON) return austriaGeoJSON;
    const res = await fetch(AUSTRIA_GEOJSON_URL);
    if(!res.ok) throw new Error("HTTP "+res.status);
    austriaGeoJSON = await res.json();
    return austriaGeoJSON;
  }

  // Berechnet pro Bundesland Durchschnitt (in µSv/h, roh) & Anzahl
  function computeBundeslandStats(geojson){
    const stats = {};
    visibleMeasurements().forEach(m=>{
      const lat=Number(m.lat), lon=Number(m.lon);
      if(isNaN(lat)||isNaN(lon)) return;
      const feature = findBundesland(lat, lon, geojson);
      if(!feature) return;
      const name = feature.properties.name;
      if(!stats[name]) stats[name]={sum:0,count:0};
      stats[name].sum += m.value;
      stats[name].count += 1;
    });
    const result={};
    Object.keys(stats).forEach(name=>{
      result[name] = { avg: stats[name].sum/stats[name].count, count: stats[name].count };
    });
    return result;
  }

  // Farbverlauf Dunkelgrün → Gelb
  const CHORO_STOPS = [
    {t:0.00, rgb:[20, 83, 45]},   // Dunkelgrün
    {t:0.33, rgb:[34,139, 34]},   // Waldgrün
    {t:0.66, rgb:[154,205, 50]},  // Gelbgrün
    {t:1.00, rgb:[250,204, 21]}   // Gelb
  ];
  function choroplethColor(value, minV, maxV){
    let t = (maxV===minV) ? 0 : (value-minV)/(maxV-minV);
    t = Math.max(0, Math.min(1, t));
    let a=CHORO_STOPS[0], b=CHORO_STOPS[CHORO_STOPS.length-1];
    for(let i=0;i<CHORO_STOPS.length-1;i++){
      if(t>=CHORO_STOPS[i].t && t<=CHORO_STOPS[i+1].t){ a=CHORO_STOPS[i]; b=CHORO_STOPS[i+1]; break; }
    }
    const span=(b.t-a.t)||1;
    const lt=(t-a.t)/span;
    const r=Math.round(a.rgb[0]+(b.rgb[0]-a.rgb[0])*lt);
    const g=Math.round(a.rgb[1]+(b.rgb[1]-a.rgb[1])*lt);
    const bl=Math.round(a.rgb[2]+(b.rgb[2]-a.rgb[2])*lt);
    return `rgb(${r},${g},${bl})`;
  }

  function renderChoroplethLegend(minV, maxV, hasData){
    const el = document.getElementById("mapLegend");
    if(!hasData){
      el.innerHTML = `<span>Keine Messdaten für eine Bundesländer-Auswertung vorhanden.</span>`;
      return;
    }
    const gradientCss = "linear-gradient(90deg, " + CHORO_STOPS.map(s=>`rgb(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]}) ${s.t*100}%`).join(", ") + ")";
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%;">
        <span style="font-weight:700;color:var(--text-dim);white-space:nowrap;font-size:12px;">Ø Strahlung pro Bundesland:</span>
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:220px;max-width:420px;">
          <span style="font-size:12px;font-weight:700;white-space:nowrap;">${formatVal(minV)}</span>
          <div class="legend-bar" style="flex:1;background:${gradientCss};"></div>
          <span style="font-size:12px;font-weight:700;white-space:nowrap;">${formatVal(maxV)}</span>
        </div>
        <div class="legend-empty" style="white-space:nowrap;"><span class="swatch"></span> keine Daten</div>
      </div>
    `;
  }

  async function renderChoropleth(){
    const statusEl = document.getElementById("mapStatus");
    try{
      statusEl.textContent = "Lade Bundesländer-Grenzen…";
      const geojson = await loadAustriaGeoJSON();
      statusEl.textContent = "";

      const stats = computeBundeslandStats(geojson);
      const avgs = Object.values(stats).map(s=>s.avg);
      const hasData = avgs.length>0;
      const minV = hasData ? Math.min(...avgs) : 0;
      const maxV = hasData ? Math.max(...avgs) : 0;

      if(choroplethLayer){ choroplethLayer.remove(); choroplethLayer=null; }
      const emptyFill = darkMode ? "#334155" : "#cbd5e1";
      const borderCol = darkMode ? "#0f1117" : "#ffffff";

      choroplethLayer = L.geoJSON(geojson, {
        style: feature=>{
          const stat = stats[feature.properties.name];
          if(!stat) return { fillColor:emptyFill, color:borderCol, weight:1, fillOpacity:0.6 };
          return { fillColor: choroplethColor(stat.avg, minV, maxV), color:borderCol, weight:1.5, fillOpacity:0.88 };
        },
        onEachFeature: (feature, layer)=>{
          const name = feature.properties.name;
          const stat = stats[name];
          const html = stat
            ? `<div class="bundesland-tooltip"><b>${name}</b><br>Ø Strahlung: ${formatVal(stat.avg)}<br>${stat.count} Messung(en)</div>`
            : `<div class="bundesland-tooltip"><b>${name}</b><br>Keine Messdaten</div>`;
          layer.bindPopup(html);
          layer.on("mouseover", ()=>layer.setStyle({weight:3}));
          layer.on("mouseout",  ()=>layer.setStyle({weight: stat?1.5:1}));
        }
      }).addTo(map);

      renderChoroplethLegend(minV, maxV, hasData);
      map.fitBounds(choroplethLayer.getBounds(), {padding:[10,10]});
    }catch(e){
      console.error("Bundesländer-Karte:", e);
      statusEl.textContent = "⚠️ Bundesländer-Grenzen konnten nicht geladen werden. Bitte Internetverbindung prüfen.";
    }
  }

  function renderPointMarkers(){
    mapMarkers=[];
    visibleMeasurements().forEach(m=>{
      const lat=Number(m.lat),lon=Number(m.lon);
      if(isNaN(lat)||isNaN(lon)) return;
      const category=getCategory(m.value);
      const marker=L.circleMarker([lat,lon],{radius:10,fillColor:getColor(m.value),color:"#000",weight:1,fillOpacity:0.85,bubblingMouseEvents:false})
        .bindPopup(`<b>${escapeHtml(m.location)}</b><br>Datum: ${escapeHtml(m.date)}<br>Höhe: ${escapeHtml(m.altitude)} m<br>Untergrund: ${geoOf(m).info.short}<br>Strahlung: ${formatVal(m.value)}`);
      mapMarkers.push({marker,category});
      if(filterActive[category]) marker.addTo(map);
    });
  }

  // ── Geplante Messpunkte: Speichern, Anzeigen, Umschalten ──
  function savePlannedPoints(){
    localStorage.setItem("plannedPoints", JSON.stringify(plannedPoints));
  }

  function renderPlannedLayer(){
    if(plannedLayerGroup){ plannedLayerGroup.remove(); plannedLayerGroup=null; }
    if(!map) return;
    plannedLayerGroup = L.layerGroup();
    plannedPoints.forEach(p=>{
      const marker = L.circleMarker([p.lat, p.lon], {
        radius:10, color:"#1d4ed8", weight:2,
        fillColor:"#3b82f6", fillOpacity:0.85,
        dashArray:"3,3", bubblingMouseEvents:false
      }).bindPopup(
        `<b>📍 Geplanter Messpunkt</b>${p.note ? "<br>"+escapeHtml(p.note) : ""}<br>
         <button onclick="removePlannedPoint('${p.id}')" class="delete-btn" style="margin-top:6px;font-size:12px;padding:4px 10px;">Entfernen</button>`
      );
      plannedLayerGroup.addLayer(marker);
    });
    if(showPlanned) plannedLayerGroup.addTo(map);
  }

  function addPlannedPoint(latlng){
    if(!isAdmin) return;
    const note = prompt("Notiz zum geplanten Messpunkt (optional):", "") || "";
    plannedPoints.push({
      id: Date.now()+"_"+Math.random().toString(36).slice(2,7),
      lat: latlng.lat, lon: latlng.lng, note
    });
    savePlannedPoints();
    renderPlannedLayer();
  }

  function removePlannedPoint(id){
    plannedPoints = plannedPoints.filter(p=>p.id!==id);
    savePlannedPoints();
    renderPlannedLayer();
  }

  function togglePlanningMode(){
    if(!isAdmin) return;
    planningMode = !planningMode;
    const btn = document.getElementById("btnPlanningMode");
    if(btn){
      btn.classList.toggle("active", planningMode);
      btn.innerHTML = planningMode ? "✅ Klicke auf die Karte…" : "📍 Punkt planen";
    }
    const mapEl = document.getElementById("map");
    if(mapEl) mapEl.style.cursor = planningMode ? "crosshair" : "";
    // Beim Aktivieren des Planungsmodus automatisch die geplanten Punkte einblenden,
    // damit man sofort sieht, was schon geplant ist.
    if(planningMode && !showPlanned) togglePlannedVisibility();
  }

  function togglePlannedVisibility(){
    showPlanned = !showPlanned;
    localStorage.setItem("showPlanned", showPlanned ? "1" : "0");
    const btn = document.getElementById("btnTogglePlanned");
    if(btn) btn.classList.toggle("active", showPlanned);
    renderPlannedLayer();
  }

  // Zeigt/versteckt die Admin-Planungswerkzeuge je nach Login-Status & Kartenmodus
  function updateAdminMapTools(){
    const tools = document.getElementById("adminMapTools");
    if(!tools) return;
    tools.style.display = (isAdmin && mapMode==="points") ? "flex" : "none";
    const btnPlan = document.getElementById("btnTogglePlanned");
    if(btnPlan) btnPlan.classList.toggle("active", showPlanned);
  }

  // ── Heatmap ──────────────────────────────────────────────
  function renderHeatmap(){
    const pts = visibleMeasurements()
      .filter(m=>!isNaN(Number(m.lat))&&!isNaN(Number(m.lon)))
      .map(m=>({lat:Number(m.lat), lon:Number(m.lon), value:m.value, location:m.location, date:m.date}));

    if(!pts.length){
      document.getElementById("mapStatus").textContent = "Keine Messdaten mit Koordinaten vorhanden.";
      return;
    }

    const vals = pts.map(p=>p.value);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);

    // Farbverlauf für Heatmap: blau (niedrig) → grün → gelb → rot (hoch)
    const HEAT_STOPS = [
      {t:0.00, rgb:[0,   0, 139]},  // dunkelblau
      {t:0.30, rgb:[0, 128, 255]},  // blau
      {t:0.50, rgb:[0, 200, 100]},  // türkisgrün
      {t:0.70, rgb:[255, 238,  0]}, // gelb
      {t:0.85, rgb:[255, 136,  0]}, // orange
      {t:1.00, rgb:[200,   0,  0]}  // rot
    ];
    function heatColor(v){
      let t = (maxV===minV) ? 0 : (v-minV)/(maxV-minV);
      t = Math.max(0,Math.min(1,t));
      let a=HEAT_STOPS[0], b=HEAT_STOPS[HEAT_STOPS.length-1];
      for(let i=0;i<HEAT_STOPS.length-1;i++){
        if(t>=HEAT_STOPS[i].t && t<=HEAT_STOPS[i+1].t){a=HEAT_STOPS[i];b=HEAT_STOPS[i+1];break;}
      }
      const span=(b.t-a.t)||1, lt=(t-a.t)/span;
      const r=Math.round(a.rgb[0]+(b.rgb[0]-a.rgb[0])*lt);
      const g=Math.round(a.rgb[1]+(b.rgb[1]-a.rgb[1])*lt);
      const bl=Math.round(a.rgb[2]+(b.rgb[2]-a.rgb[2])*lt);
      return `rgb(${r},${g},${bl})`;
    }

    // Jeden Messpunkt als farbigen Kreis (Radius = Wert-basiert) mit Glüh-Effekt
    pts.forEach(p=>{
      const t = (maxV===minV) ? 0.5 : (p.value-minV)/(maxV-minV);
      const radius = 18 + t * 28;  // 18–46 px je nach Wert
      const col = heatColor(p.value);

      // Äußerer Glüh-Kreis (halbtransparent)
      L.circleMarker([p.lat, p.lon], {
        radius: radius,
        fillColor: col,
        fillOpacity: 0.22,
        color: col,
        weight: 0
      }).addTo(map);

      // Innerer Kern (opak)
      L.circleMarker([p.lat, p.lon], {
        radius: radius * 0.45,
        fillColor: col,
        fillOpacity: 0.90,
        color: "rgba(0,0,0,0.35)",
        weight: 1
      }).bindPopup(
        `<b>${escapeHtml(p.location)}</b><br>Datum: ${escapeHtml(p.date)}<br>Strahlung: ${formatVal(p.value)}`
      ).addTo(map);
    });

    // Legende
    const legendEl = document.getElementById("mapLegend");
    legendEl.style.display = "flex";
    const heatGrad = "linear-gradient(90deg, " + HEAT_STOPS.map(s=>`rgb(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]}) ${s.t*100}%`).join(", ") + ")";
    legendEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;width:100%;">
        <span style="font-weight:700;color:var(--text-dim);white-space:nowrap;font-size:12px;">Strahlung (Wert):</span>
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:220px;max-width:420px;">
          <span style="font-size:12px;font-weight:700;white-space:nowrap;">${formatVal(minV)}</span>
          <div class="legend-bar" style="flex:1;background:${heatGrad};"></div>
          <span style="font-size:12px;font-weight:700;white-space:nowrap;">${formatVal(maxV)}</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);">Kreisgröße und Farbe zeigen den Messwert.</div>
      </div>
    `;
  }

  function initMap(){
    if(map){map.remove();map=null;} mapMarkers=[]; geoMarkers=[]; choroplethLayer=null;
    map=L.map("map",{center:[47.6,14.5],zoom:7});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);

    // Admin-Planungsmodus: Klick auf freie Kartenfläche setzt einen blauen Punkt.
    // (Bestehende Messpunkte haben bubblingMouseEvents:false und lösen dies daher nicht aus.)
    map.on("click", e => { if(isAdmin && planningMode) addPlannedPoint(e.latlng); });

    if(mapMode==="bundeslaender"){
      renderChoropleth();
    } else if(mapMode==="heatmap"){
      renderHeatmap();
    } else if(mapMode==="geology"){
      renderGeologyMarkers();
    } else {
      renderPointMarkers();
    }
    renderPlannedLayer();
    setTimeout(()=>map.invalidateSize(),200);
  }

  // ── Karte Vollbild (wie Google Maps) ───────────────────
  function toggleMapFullscreen(){
    const wrapper = document.getElementById("mapWrapper");
    const isFullscreen = wrapper.classList.toggle("map-fullscreen");
    document.body.classList.toggle("map-fullscreen-open", isFullscreen);
    // Leaflet muss nach einer Größenänderung des Containers neu berechnen,
    // sonst bleiben Kacheln grau/falsch zugeschnitten.
    setTimeout(()=>{ if(map) map.invalidateSize(); }, 250);
  }
  function closeMapFullscreen(){
    const wrapper = document.getElementById("mapWrapper");
    if(wrapper.classList.contains("map-fullscreen")) toggleMapFullscreen();
  }

  // ── Beliebige Karte (Statistik/Diagramm/Haus) Vollbild ─
  function toggleCardFullscreen(cardId){
    const card = document.getElementById(cardId);
    if(!card) return;
    const isFullscreen = card.classList.toggle("card-fullscreen");
    document.body.classList.toggle("card-fullscreen-open", isFullscreen);
    setTimeout(()=>{
      if(barChart) barChart.resize();
      if(histChart) histChart.resize();
      if(scatterChart) scatterChart.resize();
      if(geoChart) geoChart.resize();
      if(hausChart) hausChart.resize();
    }, 260);
  }
  function closeAnyCardFullscreen(){
    document.querySelectorAll(".card.card-fullscreen").forEach(c => toggleCardFullscreen(c.id));
  }

  // ── Login & CRUD ───────────────────────────────────────
  async function login(){
    const username=document.getElementById("username").value;
    const password=document.getElementById("password").value;
    try{
      const res=await fetch(BASE_URL+"/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});
      const result=await res.json();
      if(result.success){
        // Erwartet, dass der Server bei erfolgreichem Login ein Session-Token zurückgibt.
        // Dieses Token wird bei jeder Änderung (POST/PUT/DELETE) mitgeschickt, damit der
        // Server selbst prüfen kann, ob der Zugriff wirklich von einem Admin kommt.
        adminToken = result.token || null;
        isAdmin=true;
        document.getElementById("username").value="";
        document.getElementById("password").value="";
        document.getElementById("adminPanel").style.display="block";
        document.getElementById("loginStatus").innerText="Admin eingeloggt";
        document.getElementById("hausAdminBlock").style.display="block";
        document.getElementById("hausLockHint").style.display="none";
        const logoutBtn=document.getElementById("logoutBtn");
        if(logoutBtn) logoutBtn.style.display="inline-block";
        updateAdminMapTools();
        updateDashboard();
        renderHaus();
      } else {
        document.getElementById("loginStatus").innerText="Login fehlgeschlagen";
      }
    }catch(e){ document.getElementById("loginStatus").innerText="Server nicht erreichbar"; }
  }

  function logout(){
    isAdmin=false;
    adminToken=null;
    editId=null;
    planningMode=false;
    const mapEl = document.getElementById("map");
    if(mapEl) mapEl.style.cursor = "";
    document.getElementById("adminPanel").style.display="none";
    document.getElementById("hausAdminBlock").style.display="none";
    document.getElementById("hausLockHint").style.display="block";
    document.getElementById("loginStatus").innerText="";
    const logoutBtn=document.getElementById("logoutBtn");
    if(logoutBtn) logoutBtn.style.display="none";
    updateAdminMapTools();
    updateDashboard();
    renderHaus();
  }

  function startEdit(m){
    editId=m.id;
    document.getElementById("location").value=m.location;
    document.getElementById("date").value=m.date;
    document.getElementById("altitude").value=m.altitude;
    document.getElementById("value").value=m.value;
    document.getElementById("lat").value=m.lat;
    document.getElementById("lon").value=m.lon;
    const gk = geoOf(m).key; document.getElementById("geology").value = gk==="unbekannt" ? "" : gk;
    document.getElementById("adminPanel").scrollIntoView({behavior:"smooth"});
  }
  function cancelEdit(){
    editId=null;
    ["location","date","altitude","value","lat","lon","geology"].forEach(id=>document.getElementById(id).value="");
  }
  async function saveMeasurement(){
    if(!isAdmin){ alert("Nur Admins können Messungen speichern."); return; }
    const data={location:document.getElementById("location").value,date:document.getElementById("date").value,altitude:Number(document.getElementById("altitude").value),value:Number(document.getElementById("value").value),lat:Number(document.getElementById("lat").value),lon:Number(document.getElementById("lon").value),geology:document.getElementById("geology").value||undefined};
    try{
      let res;
      if(editId){
        res=await fetch(BASE_URL+"/measurements/"+editId,{method:"PUT",headers:{"Content-Type":"application/json",...authHeaders()},body:JSON.stringify(data)});
        editId=null;
      }else{
        res=await fetch(BASE_URL+"/measurements",{method:"POST",headers:{"Content-Type":"application/json",...authHeaders()},body:JSON.stringify(data)});
      }
      if(res.status===401||res.status===403){ alert("Sitzung abgelaufen. Bitte erneut einloggen."); logout(); return; }
      if(!res.ok) throw new Error("HTTP "+res.status);
      cancelEdit(); loadMeasurements();
    }catch(e){ alert("Fehler: "+e.message); }
  }
  async function deleteMeasurement(id){
    if(!isAdmin){ alert("Nur Admins können Messungen löschen."); return; }
    if(!confirm("Wirklich löschen?")) return;
    try{
      const res=await fetch(BASE_URL+"/measurements/"+id,{method:"DELETE",headers:authHeaders()});
      if(res.status===401||res.status===403){ alert("Sitzung abgelaufen. Bitte erneut einloggen."); logout(); return; }
      if(!res.ok) throw new Error("HTTP "+res.status);
      loadMeasurements();
    }
    catch(e){ alert("Fehler: "+e.message); }
  }

  // ── Start ──────────────────────────────────────────────
  // Gespeicherte Einstellungen anwenden
  applyDark();
  document.getElementById("btn-"+unit).classList.add("active");
  document.querySelectorAll(".unit-btn").forEach(b=>{
    if(b.id!=="btn-"+unit) b.classList.remove("active");
  });

  loadMeasurements();
  renderGallery();
  loadHausDaten();
  updateAdminMapTools();
