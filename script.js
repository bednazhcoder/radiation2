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
    if(e.key === "Escape") { closeSettings(); closeLightbox(); closeMapFullscreen(); }
  });

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

  function getHausColor(v){ return v<0.15?"#16a34a":v<0.25?"#d97706":"#dc2626"; }
  function getHausBadge(v){
    if(v<0.15) return '<span class="badge badge-green">niedrig</span>';
    if(v<0.25) return '<span class="badge badge-orange">mittel</span>';
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
        <td>${escapeHtml(formatDate(d.date))}</td>
        <td style="font-weight:600;color:${getHausColor(d.value)}">${formatVal(d.value)}</td>
        <td>${getHausBadge(d.value)}</td>
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
  const BASE_URL=window.location.origin;

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

  function getColor(v){ return v<0.15?"green":v<0.25?"orange":"red"; }
  function getBadge(v){
    if(v<0.15) return '<span class="badge badge-green">niedrig</span>';
    if(v<0.25) return '<span class="badge badge-orange">mittel</span>';
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

  function updateDashboard(){ updateStats(); renderTable(); createCharts(); initMap(); }

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
        <td><b>${escapeHtml(m.location)}</b></td>
        <td>${escapeHtml(m.date)}</td>
        <td>${escapeHtml(m.altitude)} m</td>
        <td style="color:${getColor(m.value)};font-weight:bold">${formatVal(m.value)}</td>
        <td>${getBadge(m.value)}</td>
        <td>
          <button class="toggle-vis-btn ${hidden ? "btn-hidden" : "btn-visible"}" onclick="toggleVisibility('${m.id}')" title="${hidden ? "Einblenden" : "Ausblenden"}">
            ${hidden ? "👁 ein" : "👁 aus"}
          </button>
        </td>`;
      if(isAdmin){
        const td=document.createElement("td"); td.className="action-btns";
        const eb=document.createElement("button"); eb.className="edit-btn"; eb.innerText="Bearbeiten"; eb.onclick=()=>startEdit(m);
        const db=document.createElement("button"); db.className="delete-btn"; db.innerText="Löschen"; db.onclick=()=>deleteMeasurement(m.id);
        td.appendChild(eb); td.appendChild(db); tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
  }

  function sortTable(col){
    sortDir=sortCol===col?sortDir*-1:1; sortCol=col;
    document.querySelectorAll("thead th[data-col]").forEach(th=>{
      const icon=th.querySelector(".sort-icon");
      if(th.dataset.col===col){th.classList.add("active");icon.textContent=sortDir===1?"↑":"↓";}
      else{th.classList.remove("active");icon.textContent="⇅";}
    });
    renderTable();
  }

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
        plugins:{legend:{display:false}},
        scales:{
          y:{beginAtZero:true,title:{display:true,text:unitLabel(),color:textColor},ticks:{color:textColor},grid:{color:gridColor}},
          x:{ticks:{color:textColor},grid:{color:gridColor}}
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
    const lowThresh  = convertValue(0.15);
    const highThresh = convertValue(0.25);
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
            ticks: { color: textColor, maxRotation: 60, autoSkip: false, font: { size: 10 } },
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
  function getCategory(v){ return v<0.15?"green":v<0.25?"orange":"red"; }

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

  function setMapMode(mode){
    mapMode = mode;
    ["points","bundeslaender","heatmap"].forEach(m=>{
      const btn = document.getElementById("btn-mode-"+m);
      if(btn) btn.classList.toggle("active", mode===m);
    });
    document.getElementById("mapFilter").style.display = mode==="points" ? "flex" : "none";
    document.getElementById("mapLegend").style.display  = mode==="bundeslaender" ? "flex" : "none";
    document.getElementById("mapStatus").textContent = "";
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
      const marker=L.circleMarker([lat,lon],{radius:10,fillColor:getColor(m.value),color:"#000",weight:1,fillOpacity:0.85})
        .bindPopup(`<b>${escapeHtml(m.location)}</b><br>Datum: ${escapeHtml(m.date)}<br>Höhe: ${escapeHtml(m.altitude)} m<br>Strahlung: ${formatVal(m.value)}`);
      mapMarkers.push({marker,category});
      if(filterActive[category]) marker.addTo(map);
    });
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
    if(map){map.remove();map=null;} mapMarkers=[]; choroplethLayer=null;
    map=L.map("map",{center:[47.6,14.5],zoom:7});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);

    if(mapMode==="bundeslaender"){
      renderChoropleth();
    } else if(mapMode==="heatmap"){
      renderHeatmap();
    } else {
      renderPointMarkers();
    }
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
    document.getElementById("adminPanel").style.display="none";
    document.getElementById("hausAdminBlock").style.display="none";
    document.getElementById("hausLockHint").style.display="block";
    document.getElementById("loginStatus").innerText="";
    const logoutBtn=document.getElementById("logoutBtn");
    if(logoutBtn) logoutBtn.style.display="none";
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
    document.getElementById("adminPanel").scrollIntoView({behavior:"smooth"});
  }
  function cancelEdit(){
    editId=null;
    ["location","date","altitude","value","lat","lon"].forEach(id=>document.getElementById(id).value="");
  }
  async function saveMeasurement(){
    if(!isAdmin){ alert("Nur Admins können Messungen speichern."); return; }
    const data={location:document.getElementById("location").value,date:document.getElementById("date").value,altitude:Number(document.getElementById("altitude").value),value:Number(document.getElementById("value").value),lat:Number(document.getElementById("lat").value),lon:Number(document.getElementById("lon").value)};
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
