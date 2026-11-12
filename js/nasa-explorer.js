/* NASA Explorer: Earth / Mars / Moon globe using real NASA imagery (GIBS, Trek, Image Library, APOD).

   Anything that fails to load is shown as an error. Nothing here is simulated or invented. */
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
  const FACTS = { // NASA Planetary Fact Sheet (static reference values)
    earth: {
      n: 'Earth',
      d: '12,756 km',
      m: '5.97 x 10^24 kg',
      g: '9.8 m/s²',
      day: '23.9 h',
      t: '15 °C',
      mo: '1'
    },
    mars: {
      n: 'Mars',
      d: '6,792 km',
      m: '0.642 x 10^24 kg',
      g: '3.7 m/s²',
      day: '24.6 h',
      t: '-65 °C',
      mo: '2'
    },
    moon: {
      n: 'Moon',
      d: '3,475 km',
      m: '0.073 x 10^24 kg',
      g: '1.6 m/s²',
      day: '655.7 h',
      t: '-20 °C',
      mo: '0'
    }
  };
  const FACT_URL = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/';
  const TREK = {
    mars: [
      'Mars Trek · Viking MDIM 2.1 color mosaic',
      'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm'
    ],
    moon: [
      'Moon Trek · LRO WAC global mosaic',
      'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm'
    ]
  };
  const GIBS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&CRS=EPSG:4326&STYLES=';
  const wms = (layer, bb, w, h, date, fmt) =>
    `${GIBS}&LAYERS=${layer}&BBOX=${bb}&WIDTH=${w}&HEIGHT=${h}&FORMAT=${fmt || 'image/jpeg'}${date ? '&TIME=' + date : ''}${fmt ? '&TRANSPARENT=TRUE' : ''}`;
  const iso = off => new Date(Date.now() - off * 864e5).toISOString().slice(0, 10);
  const S = {
    body: 'earth',
    date: '',
    ir: false,
    sel: null,
    tab: 'explore',
    up: false
  };
  const store = k => {
    try {
      return JSON.parse(localStorage.getItem(k) || '[]');
    } catch {
      return [];
    }
  };
  const save = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v.slice(0, 50)));
    } catch {}
  };
  const $ = s => document.querySelector(s);
  const img = u =>
    new Promise((ok, no) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => ok(i);
      i.onerror = () => no(new Error('image failed'));
      i.src = u;
    });
  // Works two ways: with server.js (private keys, AI summaries) or straight from the browser to NASA.
  let SERVER = false;
  const detect = async () => {
    try {
      SERVER = (await fetch('/api/ping')).ok;
    } catch {
      SERVER = false;
    }
  };
  const prox = u => SERVER ? '/api/proxy?u=' + encodeURIComponent(u) : u;
  const getJ = async u => {
    let r;
    try {
      r = await fetch(u);
    } catch {
      throw new Error('Cannot reach NASA from this page. Open the downloaded HTML file on your own computer with internet');
    }
    if (!r.ok) throw new Error('NASA returned ' + r.status);
    return r.json();
  };
  const nasaSearch = async (q, type, keep) => {
    const all = (await getJ(
      'https://images-api.nasa.gov/search?media_type=' + type + '&q=' + encodeURIComponent(q)
    )).collection.items;
    return (keep ? all.filter(keep) : all).slice(0, 5);
  };

  // Planet photo searches: aim at real science imagery and drop events/people (e.g. "Mars Celebration" parades).
  const BODYQ = {
    Earth: 'Earth from space satellite',
    Mars: 'Mars surface rover orbiter',
    Moon: 'Moon lunar surface Apollo LRO'
  };
  const BAD = /celebrat|festival|parade|costume|party|birthday|contest|student|children|kids|\bfair\b|crowd|visit|ceremony|award|day event|banquet|speaker|interview|portrait/i;

  const bodyKeep = n => {
    const g = new RegExp('\\b' + n + '\\b', 'i');
    return i => {
      const d = i.data[0] || {},
        t = (d.title || '') + ' ' + (d.description || '') + ' ' + (d.keywords || []).join(' ');

      return g.test(t) &&
        !BAD.test((d.title || '') + ' ' + (d.description || '').slice(0, 200)) &&
        i.links &&
        i.links[0];
    };
  };

  const rec = d => ({
    id: d.nasa_id,
    title: d.title,
    date: d.date_created,
    desc: (d.description || '').slice(0, 500),
    url: 'https://images.nasa.gov/details/' + encodeURIComponent(d.nasa_id)
  });

  async function direct(path, o) {
    const p = new URL(path, 'http://x'), q = p.searchParams.get('q') || '';
    if (p.pathname === '/api/images' || p.pathname === '/api/ask') {
      const b = o && o.body ? JSON.parse(o.body) : null;
      const body = !b && BODYQ[q] ? q : null;
      const src = (await nasaSearch(
        body ? BODYQ[body] : (b ? b.body + ' ' + b.q : q),
        'image',
        body ? bodyKeep(body) : null
      )).map(i => ({
        ...rec(i.data[0]),
        thumb: i.links && i.links[0].href
      }));
      return b
        ? {
          answer: src.length
            ? 'No AI summary (server.js is not running). These NASA records matched your question:'
            : 'No NASA Image Library record matched this question, so it cannot be answered from NASA data.',
          sources: src
        }
        : src;
    }
    if (p.pathname === '/api/audio') {
      const out = [];
      for (const i of await nasaSearch(q, 'audio')) {
        try {
          const f = await getJ(i.href), u = f.find(x => /\.(mp3|m4a)$/i.test(x)) || f.find(x => /\.wav$/i.test(x));
          if (u) out.push({ ...rec(i.data[0]), file: encodeURI(u).replace('http://', 'https://') });
        } catch {}
      }
      return out;
    }
    if (p.pathname === '/api/apod') return getJ('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
    throw new Error('unknown request');
  }

  const api = async (u, o) => {
    if (!SERVER) return direct(u, o);
    const r = await fetch(u, o);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'request failed (' + r.status + ')');
    return j;
  };

  // ---- UI shell ----
  const btn = document.createElement('button');
  btn.id = 'nxb';
  btn.className = 'hud';
  btn.textContent = 'NASA EXPLORER';
  document.body.appendChild(btn);
  const box = document.createElement('div');
  box.id = 'nx';
  box.hidden = true;
  box.innerHTML = `<canvas id="nxc"></canvas>

  <div class="nxp" id="nxl"><div class="row" id="nxbody"></div>

    <label class="src">Imagery date (Earth, optional)<input type="date" id="nxd" max="${iso(1)}"></label>

    <div class="row"><input id="nxlat" placeholder="lat" inputmode="decimal"><input id="nxlon" placeholder="lon" inputmode="decimal"><button id="nxgo">Go</button></div>

    <button id="nxir">Infrared Scanner: OFF</button><div id="nxs"></div><button id="nxx">Back to game</button></div>

  <div class="nxp" id="nxr"><div id="nxt"></div><div id="nxv"></div></div>`;
  document.body.appendChild(box);
  ['keydown', 'keyup', 'keypress'].forEach(k => box.addEventListener(k, ev => ev.stopPropagation()));
  const TABS = {
    explore: 'Explore',
    ask: 'Ask NASA',
    logs: 'Logs',
    compare: 'Compare',
    mission: 'Mission',
    sound: 'Sounds'
  };
  $('#nxt').innerHTML = Object.entries(TABS).map(([k, v]) => `<button data-t="${k}">${v}</button>`).join('');
  $('#nxbody').innerHTML = Object.keys(FACTS).map(k => `<button data-b="${k}">${FACTS[k].n}</button>`).join('');
  const status = (html) => $('#nxs').innerHTML = html;

  // ---- 3D globe ----
  let R,
    SC,
    C,
    globe,
    mark,
    az = 1.57,
    el = .3,
    dist = 3.2,
    tAz = az,
    tEl = el,
    tD = dist;

  function initGL() {
    if (S.up) return;
    S.up = true;
    R = new THREE.WebGLRenderer({ canvas: $('#nxc'), antialias: true });
    R.setPixelRatio(Math.min(devicePixelRatio, 2));
    SC = new THREE.Scene();
    C = new THREE.PerspectiveCamera(45, 1, .01, 100);
    SC.add(new THREE.AmbientLight(0x667799, .55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(5, 2, 4);
    SC.add(sun);
    globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 96),
      new THREE.MeshStandardMaterial({ color: 0x555a66, roughness: .95 })
    );
    SC.add(globe);
    mark = new THREE.Mesh(new THREE.SphereGeometry(.012, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff7a2b }));
    mark.visible = false;
    SC.add(mark);
    const p = new Float32Array(6000);
    for (let i = 0; i < 6000; i += 3) {
      const u = Math.random() * 2 - 1,
        t = Math.random() * 6.283,
        s = Math.sqrt(1 - u * u),
        r = 40;
      p.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    SC.add(new THREE.Points(g, new THREE.PointsMaterial({ size: .08, color: 0xcfdcff })));
    const cv = $('#nxc');
    let down = null;
    cv.onpointerdown = e => {
      down = { x: e.clientX, y: e.clientY, m: false };
      cv.setPointerCapture(e.pointerId);
    };
    cv.onpointermove = e => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (Math.hypot(dx, dy) > 3) down.m = true;
      down.x = e.clientX;
      down.y = e.clientY;
      const k = .005 * dist / 3;
      tAz -= dx * k;
      tEl = Math.max(-1.4, Math.min(1.4, tEl + dy * k));
      az = tAz;
      el = tEl;
    };
    cv.onpointerup = e => {
      if (down && !down.m) pick(e);
      down = null;
    };
    cv.onwheel = e => {
      e.preventDefault();
      tD = Math.max(1.15, Math.min(8, tD * (1 + Math.sign(e.deltaY) * .1)));
    };
    addEventListener('resize', fit);
    fit();
    loop();
  }

  const fit = () => {
    if (!S.up) return;
    R.setSize(innerWidth, innerHeight, false);
    C.aspect = innerWidth / innerHeight;
    C.updateProjectionMatrix();
  };

  function loop() {
    requestAnimationFrame(loop);
    if (box.hidden) return;
    let d = tAz - az;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    az += d * .08;
    el += (tEl - el) * .08;
    dist += (tD - dist) * .08;
    C.position.set(dist * Math.cos(el) * Math.sin(az), dist * Math.sin(el), dist * Math.cos(el) * Math.cos(az));
    C.lookAt(0, 0, 0);
    R.render(SC, C);
  }

  const toVec = (lat, lon) => {
    const a = lat * Math.PI / 180, o = lon * Math.PI / 180;
    return new THREE.Vector3(Math.cos(a) * Math.cos(o), Math.sin(a), -Math.cos(a) * Math.sin(o));
  };

  function flyTo(lat, lon) {
    tEl = lat * Math.PI / 180;
    tAz = lon * Math.PI / 180 + Math.PI / 2;
    tD = Math.min(tD, 1.8);
    mark.position.copy(toVec(lat, lon).multiplyScalar(1.006));
    mark.visible = true;
  }

  function pick(e) {
    const m = new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1),
      rc = new THREE.Raycaster();
    rc.setFromCamera(m, C);
    const h = rc.intersectObject(globe)[0];
    if (!h) return;
    select(+(h.uv.y * 180 - 90).toFixed(3), +(h.uv.x * 360 - 180).toFixed(3), true);
  }

  function select(lat, lon, noFly) {
    S.sel = {
      lat,
      lon,
      body: S.body,
      at: new Date().toISOString()
    };
    if (!noFly) flyTo(lat, lon);
    else {
      mark.position.copy(toVec(lat, lon).multiplyScalar(1.006));
      mark.visible = true;
    }
    const l = store('nx_log');
    l.unshift({ ...S.sel, date: S.date });
    save('nx_log', l);
    setTab('explore');
  }

  // ---- real NASA textures ----
  async function stitch(base, z) {
    const cols = 2 ** (z + 1), rows = 2 ** z, c = document.createElement('canvas');
    c.width = cols * 256;
    c.height = rows * 256;
    const x = c.getContext('2d');
    let ok = 0;
    await Promise.all([...Array(rows * cols)].map((_, k) => {
      const r = k / cols | 0, q = k % cols;
      return img(prox(`${base}/${z}/${r}/${q}.jpg`)).then(i => {
        x.drawImage(i, q * 256, r * 256);
        ok++;
      }).catch(() => {});
    }));
    if (!ok) throw new Error('no tiles returned by NASA Trek');
    return c;
  }

  async function loadBody() {
    initGL();
    const b = S.body;
    mark.visible = false;
    globe.material.map = null;
    globe.material.color.set(0x555a66);
    globe.material.needsUpdate = true;
    status('Loading real NASA imagery…');
    let cv, label;
    try {
      if (b === 'earth') {
        const layer = S.date ? 'MODIS_Terra_CorrectedReflectance_TrueColor' : 'BlueMarble_ShadedRelief_Bathymetry';
        cv = document.createElement('canvas');
        cv.width = 2048;
        cv.height = 1024;
        const x = cv.getContext('2d');
        x.drawImage(await img(prox(wms(layer, '-90,-180,90,180', 2048, 1024, S.date))), 0, 0, 2048, 1024);
        label = 'NASA GIBS · ' + layer + (S.date ? ' · ' + S.date : ' · static mosaic');
        if (S.ir) {
          const d = S.date || iso(3);
          x.globalAlpha = .85;
          x.drawImage(
            await img(prox(wms('MODIS_Terra_Land_Surface_Temp_Day', '-90,-180,90,180', 2048, 1024, d, 'image/png'))),
            0,
            0,
            2048,
            1024
          );
          label += ' + MODIS Land Surface Temperature ' + d;
        }
      } else {
        cv = await stitch(TREK[b][1], 2);
        label = 'NASA ' + TREK[b][0];
      }
      const t = new THREE.CanvasTexture(cv);
      t.anisotropy = 8;
      globe.material.map = t;
      globe.material.color.set(0xffffff);
      globe.material.needsUpdate = true;
      status(`<span class="real">REAL NASA DATA</span><br>${esc(label)}`);
    } catch (e) {
      status(`<span class="bad">No imagery loaded</span><br>${esc(e.message)}. Check your internet connection. This only works from the downloaded file on your own computer, not inside the Claude preview. The grey sphere is a plain placeholder, not data.`);
    }
    $('#nxir').disabled = b !== 'earth';
    $('#nxir').title = b === 'earth' ? '' : 'No NASA thermal layer is wired up for this body';
    document.querySelectorAll('[data-b]').forEach(x => x.classList.toggle('on', x.dataset.b === b));
    if (!document.activeElement || !document.activeElement.closest('#nxv')) setTab(S.tab);
  }

  // ---- tabs ----
  const view = html => $('#nxv').innerHTML = html;
  const srcList = a =>
    a.map((s, i) => `<div>[${i + 1}] <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> <span class="src">${esc((s.date || '').slice(0, 10))} · NASA Image Library</span>${s.thumb ? `<img src="${esc(s.thumb)}" alt="${esc(s.title)}" loading="lazy">` : ''}</div>`).join('');

  function setTab(t) {
    S.tab = t;
    document.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x.dataset.t === t));
    ({
      explore: tExplore,
      ask: tAsk,
      logs: tLogs,
      compare: tCompare,
      mission: tMission,
      sound: tSound
    })[t]();
  }

  function tExplore() {
    const f = FACTS[S.body], s = S.sel && S.sel.body === S.body ? S.sel : null;
    let h = `<h4>${f.n.toUpperCase()}</h4><table><tr><td>Diameter</td><td>${f.d}</td></tr><tr><td>Mass</td><td>${f.m}</td></tr><tr><td>Gravity</td><td>${f.g}</td></tr><tr><td>Day length</td><td>${f.day}</td></tr><tr><td>Mean temp</td><td>${f.t}</td></tr></table><div class="src">Source: <a href="${FACT_URL}" target="_blank" rel="noopener">NASA Planetary Fact Sheet</a></div>`;
    h += `<h4>SELECTED LOCATION</h4>` + (s
      ? `<div>Lat ${s.lat}°, Lon ${s.lon}° <span class="src">(from your click; planetocentric on the loaded map)</span></div><div id="nxc2"></div>`
      : '<div class="src">Click the globe or enter lat/lon.</div>');
    h += `<h4>NASA IMAGE LIBRARY</h4><button id="nxim">Load NASA images of ${f.n}</button><div id="nxgal"></div>`;
    view(h);
    if (s && S.body === 'earth') {
      const la = s.lat,
        lo = s.lon,
        bb = `${Math.max(-90, la - 2)},${Math.max(-180, lo - 3)},${Math.min(90, la + 2)},${Math.min(180, lo + 3)}`,
        d = S.date || '';
      const u = wms(
        d ? 'MODIS_Terra_CorrectedReflectance_TrueColor' : 'BlueMarble_ShadedRelief_Bathymetry',
        bb,
        600,
        400,
        d
      );
      $('#nxc2').innerHTML = `<img src="${esc(prox(u))}" alt="NASA GIBS imagery near ${la}, ${lo}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'bad',textContent:'Imagery for this spot failed to load'}))"><div class="src">NASA GIBS ${d ? 'MODIS Terra true color, ' + esc(d) : 'Blue Marble static mosaic'} · <a href="https://worldview.earthdata.nasa.gov/" target="_blank" rel="noopener">Open NASA Worldview</a></div>`;
    }
    $('#nxim').onclick = async () => {
      $('#nxgal').textContent = 'Loading…';
      try {
        const a = await api('/api/images?q=' + encodeURIComponent(f.n));
        $('#nxgal').innerHTML = a.length ? srcList(a) : 'No records returned.';
      } catch (e) {
        $('#nxgal').innerHTML = `<span class="bad">${esc(e.message)}</span>`;
      }
    };
  }

  function tAsk() {
    view(`<h4>ASK NASA DATA</h4><div class="src">Answers use only NASA Image Library records found for your question${S.sel ? ` (context: ${FACTS[S.body].n} ${S.sel.lat}, ${S.sel.lon})` : ` (context: ${FACTS[S.body].n})`}. If the records do not contain the answer, it will say so.</div><div class="row"><input id="nxq" placeholder="e.g. What is Tycho crater?"><button id="nxsend" style="flex:0">Ask</button></div><div id="nxa"></div>`);
    const go = async () => {
      const q = $('#nxq').value.trim();
      if (!q) return;
      $('#nxa').textContent = 'Searching NASA records…';
      try {
        const r = await api(
          '/api/ask',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q,
              body: FACTS[S.body].n,
              lat: S.sel && S.sel.lat,
              lon: S.sel && S.sel.lon
            })
          }
        );
        $('#nxa').innerHTML = `<p>${esc(r.answer).replace(/\n/g, '<br>')}</p><h4>SOURCES</h4>${srcList(r.sources)}`;
        const h = store('nx_hist');
        h.unshift({
          q,
          body: S.body,
          at: new Date().toISOString(),
          a: r.answer.slice(0, 300),
          n: r.sources.length
        });
        save('nx_hist', h);
      } catch (e) {
        $('#nxa').innerHTML = `<span class="bad">${esc(e.message)}</span>`;
      }
    };
    $('#nxsend').onclick = go;
    $('#nxq').onkeydown = e => e.key === 'Enter' && go();
  }

  function tLogs() {
    const l = store('nx_log'), h = store('nx_hist');
    view(`<h4>DISCOVERY LOG</h4>${l.map(x => `<div>${FACTS[x.body].n} ${x.lat}°, ${x.lon}° <span class="src">${esc(x.at.slice(0, 16).replace('T', ' '))}${x.date ? ' · imagery ' + esc(x.date) : ''}</span></div>`).join('') || '<div class="src">No locations yet.</div>'}

      <h4>RESEARCH HISTORY</h4>${h.map(x => `<div><b>${esc(x.q)}</b> <span class="src">${FACTS[x.body].n} · ${esc(x.at.slice(0, 16).replace('T', ' '))} · ${x.n} sources</span></div>`).join('') || '<div class="src">No questions yet.</div>'}

      <p class="src">Saved only in this browser.</p><button id="nxclr">Clear logs</button>`);
    $('#nxclr').onclick = () => {
      localStorage.removeItem('nx_log');
      localStorage.removeItem('nx_hist');
      tLogs();
    };
  }

  function tCompare() {
    const k = Object.keys(FACTS),
      row = (l, p) => `<tr><td>${l}</td>${k.map(b => `<td>${FACTS[b][p]}</td>`).join('')}</tr>`;
    view(`<h4>PLANET COMPARISON</h4><table><tr><th></th>${k.map(b => `<th>${FACTS[b].n}</th>`).join('')}</tr>${row('Diameter', 'd')}${row('Mass', 'm')}${row('Gravity', 'g')}${row('Day', 'day')}${row('Mean temp', 't')}${row('Moons', 'mo')}</table><div class="src">Source: <a href="${FACT_URL}" target="_blank" rel="noopener">NASA Planetary Fact Sheet</a></div>`);
  }

  async function tMission() {
    view('<h4>MISSION CONTROL</h4>Loading NASA Astronomy Picture of the Day…');
    try {
      const a = await api('/api/apod');
      view(`<h4>MISSION CONTROL · APOD</h4><b>${esc(a.title)}</b> <span class="src">${esc(a.date)}${a.copyright ? ' · © ' + esc(a.copyright) : ''}</span>${a.media_type === 'image' ? `<img src="${esc(a.url)}" alt="${esc(a.title)}">` : `<div><a href="${esc(a.url)}" target="_blank" rel="noopener">Open media</a></div>`}<p>${esc((a.explanation || '').slice(0, 700))}…</p><div class="src">Source: <a href="https://apod.nasa.gov/apod/" target="_blank" rel="noopener">NASA APOD</a></div>`);
    } catch (e) {
      view(`<h4>MISSION CONTROL</h4><span class="bad">${esc(e.message)}</span>`);
    }
  }

  const SQ = { earth: 'Earth sounds', mars: 'Mars Perseverance sounds', moon: 'Apollo moon audio' };

  function tSound() {
    view(`<h4>NASA AUDIO</h4><div class="src">Real recordings from the NASA Image Library. Some are radio or plasma data converted to sound; the description says which.</div><div class="row"><input id="nxsq" value="${esc(SQ[S.body])}"><button id="nxsgo" style="flex:0">Search</button></div><div id="nxsl"></div>`);
    const go = async () => {
      const L = $('#nxsl');
      L.textContent = 'Searching NASA audio…';
      try {
        const a = await api('/api/audio?q=' + encodeURIComponent($('#nxsq').value));
        L.innerHTML = a.length
          ? a.map(x => `<h4>${esc(x.title)}</h4><div class="src">${esc((x.date || '').slice(0, 10))} · <a href="${esc(x.url)}" target="_blank" rel="noopener">NASA record</a></div><audio controls preload="none" src="${esc(x.file)}" style="width:100%"></audio><div class="src">${esc(x.desc)}</div>`).join('')
          : 'NASA returned no audio for this search.';
        L.querySelectorAll('audio').forEach(p => p.onplay = () => L.querySelectorAll('audio').forEach(o => o !== p && o.pause()));
      } catch (e) {
        L.innerHTML = `<span class="bad">${esc(e.message)}</span>`;
      }
    };
    $('#nxsgo').onclick = go;
    $('#nxsq').onkeydown = e => e.key === 'Enter' && go();
    go();
  }

  // ---- wiring ----
  btn.onclick = async () => {
    box.hidden = false;
    if (!S.up) {
      await detect();
      $('#nxd').value = '';
      loadBody();
    }
    fit();
  };
  $('#nxx').onclick = () => box.hidden = true;
  $('#nxbody').onclick = e => {
    const b = e.target.dataset.b;
    if (b && b !== S.body) {
      S.body = b;
      S.ir = false;
      $('#nxir').textContent = 'Infrared Scanner: OFF';
      loadBody();
    }
  };
  $('#nxt').onclick = e => e.target.dataset.t && setTab(e.target.dataset.t);
  $('#nxd').onchange = e => {
    S.date = e.target.value;
    if (S.body === 'earth') loadBody();
  };
  $('#nxir').onclick = () => {
    S.ir = !S.ir;
    $('#nxir').textContent = 'Infrared Scanner: ' + (S.ir ? 'ON' : 'OFF');
    loadBody();
  };
  $('#nxgo').onclick = () => {
    const la = parseFloat($('#nxlat').value), lo = parseFloat($('#nxlon').value);
    if (!(la >= -90 && la <= 90 && lo >= -180 && lo <= 180))
      return status('<span class="bad">Enter lat -90..90 and lon -180..180</span>');
    select(la, lo);
  };
})();
