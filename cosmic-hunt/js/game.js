const $=s=>document.querySelector(s),
rad=d=>d*Math.PI/180;
const dir=(az, el)=>new THREE.Vector3(-Math.sin(rad(az))*Math.cos(rad(el)), Math.sin(rad(el)), -Math.cos(rad(az))*Math.cos(rad(el)));
function glowTex() {
  const c=document.createElement('canvas');
  c.width=c.height=64;
  const x=c.getContext('2d'),
  g=x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(.3, 'rgba(255,255,255,.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle=g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const GT=glowTex();
/* ---------- procedural realistic textures ---------- */
function Hh(x, y, z) {
  const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;
  return n-Math.floor(n);
}
function vn(x, y, z) {
  const xi=Math.floor(x),
  yi=Math.floor(y),
  zi=Math.floor(z),
  xf=x-xi,
  yf=y-yi,
  zf=z-zi,
  u=xf*xf*(3-2*xf),
  v=yf*yf*(3-2*yf),
  w=zf*zf*(3-2*zf),
  l=(a, b, t)=>a+(b-a)*t;
  return l(l(l(Hh(xi, yi, zi), Hh(xi+1, yi, zi), u), l(Hh(xi, yi+1, zi), Hh(xi+1, yi+1, zi), u), v), l(l(Hh(xi, yi, zi+1), Hh(xi+1, yi, zi+1), u), l(Hh(xi, yi+1, zi+1), Hh(xi+1, yi+1, zi+1), u), v), w);
}
function fbm(x, y, z, o) {
  let s=0,
  a=.5;
  for(let i=0; i<o; i++) {
    s+=a*vn(x, y, z);
    x*=2.03;
    y*=2.03;
    z*=2.03;
    a*=.5;
  }
  return s;
}
const mx=(a, b, t)=> {
  t=t<0?0:t>1?1:t;
  return[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
} ;
const SH= {
  earth:(x, y, z, la)=> {
    const e=fbm(x*2.4+3, y*2.4, z*2.4, 5);
    let c;
    if(e<.5)c=mx([6, 26, 78], [30, 92, 150], (e-.35)/.15);
    else {
      const h=(e-.5)/.25;
      c=h<.35?mx([58, 108, 48], [112, 140, 70], h/.35):mx([122, 100, 70], [236, 236, 240], (h-.35)/.65);
    }
    c=mx(c, [255, 255, 255], (fbm(x*3+9, y*5, z*3, 5)-.5)*2.2);
    const p=Math.abs(la)-1.2;
    return p>0?mx(c, [245, 248, 255], p*8):c;
  } ,
  rust:(x, y, z)=> {
    const e=fbm(x*3+5, y*3, z*3, 5),
    r=fbm(x*9, y*9, z*9, 3);
    return mx(mx([48, 22, 14], [190, 115, 70], e*1.4-.2), [90, 40, 25], r-.5);
  } ,
  ice:(x, y, z)=> {
    const e=fbm(x*3, y*3, z*3+2, 5),
    r=Math.abs(fbm(x*6, y*6, z*6, 4)-.5);
    return mx(mx([140, 170, 200], [238, 246, 252], e*1.5-.2), [70, 100, 140], 1-r*14);
  } ,
  lava:(x, y, z)=> {
    const e=fbm(x*3, y*3, z*3+7, 5),
    r=Math.abs(fbm(x*5+1, y*5, z*5, 4)-.5);
    return mx(mx([14, 8, 8], [52, 32, 26], e*1.5), [255, 112, 12], 1-r*9);
  } ,
  gas:(x, y, z, la)=> {
    const w=fbm(x*2, y*6, z*2, 4),
    b=Math.sin(la*16+w*7)*.5+.5;
    return mx(mx([40, 22, 16], [118, 66, 40], b), [18, 9, 9], fbm(x*4, y*12, z*4, 3)-.3);
  } ,
  xx:(x, y, z)=>mx([18, 6, 40], [150, 60, 220], fbm(x*3, y*3, z*3+4, 5)*1.6-.3),
  sun:(x, y, z)=> {
    const e=fbm(x*4, y*4, z*4, 5),
    g=fbm(x*14, y*14, z*14, 2);
    return mx(mx([210, 60, 0], [255, 215, 90], e*1.8-.1), [150, 30, 0], (.5-g)*.8);
  }
} ;
const KIND=['rust', 'ice', 'earth', 'lava', 'gas', 'xx'],
TX= {
} ;
function texFor(i) {
  const u=DATA[i]&&DATA[i].texture;
  if(!u)return mk(KIND[i]);
  const k='img'+i;
  if(TX[k])return TX[k];
  const t=new THREE.TextureLoader().load(u);
  t.anisotropy=4;
  return TX[k]=t;
}
function mk(kind) {
  if(TX[kind])return TX[kind];
  const W=384,
  H=192,
  c=document.createElement('canvas');
  c.width=W;
  c.height=H;
  const x=c.getContext('2d'),
  im=x.createImageData(W, H),
  d=im.data;
  for(let j=0; j<H; j++) {
    const la=(.5-(j+.5)/H)*Math.PI,
    cl=Math.cos(la),
    sl=Math.sin(la);
    for(let i=0; i<W; i++) {
      const lo=(i+.5)/W*6.2832,
      r=SH[kind](cl*Math.cos(lo), sl, cl*Math.sin(lo), la),
      k=(j*W+i)*4;
      d[k]=r[0];
      d[k+1]=r[1];
      d[k+2]=r[2];
      d[k+3]=255;
    }
  }
  x.putImageData(im, 0, 0);
  const t=new THREE.CanvasTexture(c);
  t.anisotropy=4;
  return TX[kind]=t;
}
/*sky / orrery */
const cv=$('#sky'),
R=new THREE.WebGLRenderer( {
  canvas:cv, antialias:true
} );
R.setPixelRatio(Math.min(devicePixelRatio, 2));
R.setClearColor(0x02040c);
const S=new THREE.Scene(),
C=new THREE.PerspectiveCamera(55, 1, .1, 3000);
const G1=new THREE.Group(),
G2=new THREE.Group(),
G3=new THREE.Group(),
G4=new THREE.Group();
S.add(G1, G2, G3, G4);
G2.visible=G3.visible=G4.visible=false;
function fit() {
  R.setSize(innerWidth, innerHeight, false);
  C.aspect=innerWidth/innerHeight;
  C.updateProjectionMatrix();
}
addEventListener('resize', fit);
fit();
function pts(n, a, b, cols, size) {
  const g=new THREE.BufferGeometry(),
  p=new Float32Array(n*3),
  c=new Float32Array(n*3);
  for(let i=0; i<n; i++) {
    const u=Math.random()*2-1,
    t=Math.random()*6.2832,
    r=a+Math.random()*(b-a),
    s=Math.sqrt(1-u*u);
    p.set([r*s*Math.cos(t), r*u, r*s*Math.sin(t)], i*3);
    const k=new THREE.Color(cols[Math.floor(Math.random()*cols.length)]);
    c.set([k.r, k.g, k.b], i*3);
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial( {
    size, vertexColors:true, sizeAttenuation:false, transparent:true, opacity:.9
  } ));
}
const stars=pts(3000, 600, 1200, ['#ffffff', '#b9c4ff', '#9fb8ff', '#ffe9c8'], 1.6),
irStars=pts(260, 600, 1200, ['#ff5a1f', '#ff8c00', '#ff3b6b'], 2.6);
irStars.visible=false;
S.add(stars, irStars);
{
  const cp=[];
  for(let i=0; i<150; i++)cp.push(dir(Math.random()*360, Math.random()*140-70).multiplyScalar(900));
  const lp=[];
  cp.forEach((p, i)=> {
    let b=-1, bd=1e9; cp.forEach((q, j)=> {
      if(i!==j) {
        const d=p.distanceTo(q); if(d<bd) {
          bd=d; b=j;
        }
      }
    } ); if(bd<300&&Math.random()<.65)lp.push(p, cp[b]);
  } );
  S.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial( {
    color:0x4a7bd0, transparent:true, opacity:.3
  } )));
}
const grid=new THREE.GridHelper(400, 40, 0x2f6bdb, 0x2f6bdb);
grid.material.transparent=true;
grid.material.opacity=.14;
grid.position.y=-8;
G1.add(grid);
S.add(new THREE.AmbientLight(0x3a4a7a, .6));
G1.add(new THREE.PointLight(0xfff0d8, 2.4, 0, 0));
/* [kind index, orbit radius, size, phase] for DATA order; extras = hidden */
const ORB=[[20, 2.4, .5], [30, 2.6, 2.1], [42, 3.4, 4.0], [54, 2.6, 1.2], [70, 6, 3.3], [88, 3, 5.2]];
const objs=[];
let IR=false,
sim=0,
running=true,
rate=1,
started=false,
ready=false,
az=.6,
el=.55,
dist=150,
tgt=new THREE.Vector3(),
locking=null;
function addObj(o) {
  const r=o.r,
  mat=o.map?new THREE.MeshStandardMaterial( {
    map:o.map, roughness:.9
  } ):new THREE.MeshBasicMaterial( {
    color:o.col
  } );
  o.mat=mat;
  o.irMat=new THREE.MeshBasicMaterial( {
    color:o.irCol
  } );
  o.mesh=new THREE.Mesh(new THREE.SphereGeometry(o.size, 32, 24), mat);
  o.glow=new THREE.Sprite(new THREE.SpriteMaterial( {
    map:GT, color:o.col, blending:THREE.AdditiveBlending, transparent:true, opacity:.3, depthWrite:false
  } ));
  o.hit=new THREE.Mesh(new THREE.SphereGeometry(Math.max(o.size*2.2, 4), 8, 6), new THREE.MeshBasicMaterial( {
    visible:false
  } ));
  const pl=[];
  for(let i=0; i<=160; i++) {
    const a=i/160*6.2832;
    pl.push(new THREE.Vector3(Math.cos(a)*r, 0, Math.sin(a)*r*.93));
  }
  o.orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pl), new THREE.LineBasicMaterial( {
    color:o.hidden?0xff7a2b:0x58a6ff, transparent:true, opacity:o.hidden?.35:.4
  } ));
  o.w=.25*Math.pow(20/r, 1.5);
  o.lab=document.createElement('div');
  o.lab.className='lab';
  o.lab.textContent=o.hidden?(o.isX?'???':'Unknown source'):o.data.name;
  $('#labels').appendChild(o.lab);
  G1.add(o.mesh, o.glow, o.hit, o.orbit);
  objs.push(o);
}
function buildScene() {
  const sun=new THREE.Mesh(new THREE.SphereGeometry(7, 48, 32), new THREE.MeshBasicMaterial( {
    map:mk('sun')
  } ));
  G1.add(sun);
  [[34, 0xff9a3c, .55], [90, 0xff6a1a, .25]].forEach(([s, c, o])=> {
    const g=new THREE.Sprite(new THREE.SpriteMaterial( {
      map:GT, color:c, blending:THREE.AdditiveBlending, transparent:true, opacity:o, depthWrite:false
    } )); g.scale.set(s, s, 1); G1.add(g);
  } );
  DATA.forEach((d, i)=> {
    const p=ORB[i]; addObj( {
      data:d, r:p[0], size:p[1], ph:p[2], map:texFor(i), col:'#ffffff', irCol:d.infrared.colorCode, isX:d.id==='planet-x', hidden:d.id==='planet-x', peak:[1.4, 2.6, 3.0, 3.9, 4.4, 3.3][i]
    } );
  } );
  addObj( {
    decoy:true, hidden:true, r:36, size:1.8, ph:3.5, col:'#ff8c00', irCol:'#ff8c00', peak:2.1
  } );
  addObj( {
    decoy:true, hidden:true, r:62, size:1.8, ph:5.2, col:'#ff8c00', irCol:'#ff8c00', peak:4.6
  } );
  setIR(false);
}
function setIR(on) {
  IR=on;
  irStars.visible=on;
  stars.material.opacity=on?.35:.9;
  $('#ir').checked=on;
  $('#bir').classList.toggle('on', on);
  objs.forEach(o=> {
    if(o.hidden) {
      o.mesh.visible=o.glow.visible=o.orbit.visible=on; o.lab.style.display=on?'':'none'; o.mesh.material=o.irMat; o.glow.material.color.set(o.irCol);
    } else {
      o.mesh.material=on?o.irMat:o.mat; o.glow.material.color.set(on?o.irCol:'#ffffff');
    }
  } );
  $('#irs').textContent=on?'On. Hidden infrared sources glow.':'Off. Visible light only.';
}
/*input*/
let down=null,
drag=0;
cv.addEventListener('pointerdown', e=> {
  down= {
    x:e.clientX, y:e.clientY
  } ; drag=0; cv.setPointerCapture(e.pointerId);
} );
cv.addEventListener('pointermove', e=> {
  if(down) {
    if(!started||locking)return; az-=(e.clientX-down.x)*.005; el=Math.max(-1.3, Math.min(1.5, el+(e.clientY-down.y)*.005)); drag+=Math.abs(e.clientX-down.x)+Math.abs(e.clientY-down.y); down= {
      x:e.clientX, y:e.clientY
    } ; $('#tip').hidden=true; return;
  }
  if(!started)return; const h=hit(e), t=$('#tip'); if(h) {
    t.hidden=false; t.textContent=h.view?h.name:(h.hidden?'Unknown infrared source':h.data.name); t.style.left=e.clientX+14+'px'; t.style.top=e.clientY+10+'px'; cv.style.cursor='pointer';
  } else {
    t.hidden=true; cv.style.cursor='';
  }
} );
cv.addEventListener('pointerup', e=> {
  const w=down; down=null; if(!w)return; if(!started) {
    if(ready)startTap(); return;
  }
  if(drag<6)pick(e);
} );
cv.addEventListener('wheel', e=> {
  if(!started||locking)return; e.preventDefault(); dist=Math.max(VR[view][0], Math.min(VR[view][1], dist*(1+e.deltaY*.001)));
} , {
  passive:false
} );
const RC=new THREE.Raycaster(),
mv=new THREE.Vector2();
function hit(e) {
  mv.set(e.clientX/innerWidth*2-1, -(e.clientY/innerHeight)*2+1);
  RC.setFromCamera(mv, C);
  const live=view==='atlas'?objs.filter(o=>o.mesh.visible).concat(EX.filter(o=>o.view==='atlas')):EX.filter(o=>o.view===view),
  h=RC.intersectObjects(live.map(o=>o.hit))[0];
  return h?live.find(o=>o.hit===h.object):null;
}
function log(t) {
  const l=$('#log');
  if(l.children.length===1&&l.textContent.startsWith('Nothing'))l.innerHTML='';
  const d=document.createElement('div');
  d.textContent=t;
  l.prepend(d);
}
function pick(e) {
  const h=hit(e);
  if(!h||locking)return;
  if(h.view) {
    showInfo(h);
    return;
  }
  if(h.isX) {
    log('Scan: peak at 3.3 µm. Match found!');
    drawSpec(3.3);
    running=false;
    locking= {
      f:0
    } ;
    return;
  }
  if(h.decoy) {
    log(`Scan: peak at ${h.peak} µm. Not a match.`);
    drawSpec(h.peak);
    return;
  }
  log(`Scanned ${h.data.name}: peak at ${h.peak} µm. A known planet.`);
  drawSpec(h.peak);
  openExplore(h.data);
}
function drawSpec(alt) {
  const c=$('#spec'),
  x=c.getContext('2d'),
  W=c.width,
  H=c.height,
  px=u=>20+(u-.75)/4.25*(W-30);
  x.clearRect(0, 0, W, H);
  x.strokeStyle='#16306e';
  x.fillStyle='#8ea6d6';
  x.font='11px sans-serif';
  for(let u=1; u<=5; u++) {
    x.beginPath();
    x.moveTo(px(u), 10);
    x.lineTo(px(u), H-22);
    x.stroke();
    x.fillText(u, px(u)-3, H-8);
  }
  x.fillText('µm', W-26, H-8);
  const cu=(pk, col, dash)=> {
    x.setLineDash(dash?[4, 4]:[]);
    x.strokeStyle=col;
    x.lineWidth=2;
    x.beginPath();
    for(let u=.75; u<=5; u+=.05) {
      const y=H-28-(H-50)*Math.exp(-Math.pow((u-pk)/.22, 2));
      u===.75?x.moveTo(px(u), y):x.lineTo(px(u), y);
    }
    x.stroke();
    x.setLineDash([]);
  } ;
  cu(3.3, '#b04cff');
  if(alt&&alt!==3.3)cu(alt, '#ff8c00', true);
}
drawSpec();
{
  const p=DATA.find(d=>d.id==='planet-x');
  if(p)$('#clues').innerHTML=p.clues.map(c=>'<li>'+c+'</li>').join('');
}
/*planet viewer with wedge cutaway*/
const MR=new THREE.WebGLRenderer( {
  canvas:$('#model'), antialias:true, alpha:true
} );
MR.setPixelRatio(Math.min(devicePixelRatio, 2));
const MS=new THREE.Scene(),
MC=new THREE.PerspectiveCamera(38, 1, .1, 50);
MC.position.set(0, 0, 4.6);
MS.add(new THREE.AmbientLight(0x6a78b8, .7));
const DL=new THREE.DirectionalLight(0xffffff, 1.5);
DL.position.set(3, 2, 4);
MS.add(DL);
const mglow=new THREE.Sprite(new THREE.SpriteMaterial( {
  map:GT, blending:THREE.AdditiveBlending, transparent:true, opacity:.35, depthWrite:false
} ));
mglow.scale.set(3.8, 3.8, 1);
mglow.position.z=-1.6;
MS.add(mglow);
function fitM() {
  const m=$('#model'),
  w=m.clientWidth,
  h=m.clientHeight;
  if(!w||!h)return;
  MR.setSize(w, h, false);
  MC.aspect=w/h;
  MC.updateProjectionMatrix();
}
new ResizeObserver(fitM).observe($('#model'));
let grp=null,
caps=[],
cur=null,
cut=false,
mdown=null;
const FR= {
  2:[.5, 1],
  3:[.35, .88, 1]
} ;
function build(cutaway) {
  if(grp)MS.remove(grp);
  grp=new THREE.Group();
  caps=[];
  cut=cutaway;
  const st=cur.structure,
  n=st.length,
  i0=DATA.indexOf(cur),
  map=texFor(i0);
  mglow.material.color.set(cur.infrared.colorCode);
  const f=/Jupiter|Gas/.test(cur.type)&&n===3?[.25, .72, 1]:FR[n];
  if(!cutaway||!f) {
    grp.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshStandardMaterial( {
      map, roughness:.9
    } )));
    grp.rotation.set(.3, 0, 0);
  } else {
    grp.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48, 0, Math.PI*1.5), new THREE.MeshStandardMaterial( {
      map, roughness:.9
    } )));
    st.forEach((l, i)=> {
      const a=i?f[i-1]:0, b=f[i], pair=[]; [[Math.PI/2, 0], [-Math.PI/2, Math.PI/2]].forEach(([ts, ry])=> {
        const m=new THREE.Mesh(new THREE.RingGeometry(a, b, 64, 1, ts, Math.PI), new THREE.MeshStandardMaterial( {
          color:l.color, side:THREE.DoubleSide, roughness:.7, emissive:l.color, emissiveIntensity:i===0?.45:.12
        } )); m.rotation.y=ry; grp.add(m); pair.push(m);
      } ); caps.push(pair);
    } );
    grp.rotation.set(.35, 2.356, 0);
  }
  MS.add(grp);
}
function setSel(i) {
  caps.forEach((p, j)=>p.forEach(m=> {
    m.material.emissiveIntensity=j===i?.9:(j===0?.45:.12);
  } ));
  document.querySelectorAll('#xb h5').forEach(h=>h.classList.toggle('on', +h.dataset.i===i));
  document.querySelectorAll('#xl div').forEach(h=>h.classList.toggle('on', +h.dataset.i===i));
}
function openExplore(p) {
  cur=p;
  $('#explore').hidden=false;
  $('#xn').textContent=p.name.toUpperCase();
  $('#xt').textContent=p.type.toUpperCase();
  setMode('structure');
  fitM();
}
function setMode(m) {
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on', b.dataset.m===m));
  build(m==='structure');
  const b=$('#xb'),
  L=$('#xl');
  if(m==='details') {
    L.innerHTML='';
    const d=cur.details,
    ir=cur.infrared,
    rows=[['Distance', 'distance'], ['Mass', 'mass'], ['Radius', 'radius'], ['Orbital period', 'orbitalPeriod'], ['Temperature', 'temperature'], ['Discovered', 'discoveryYear']];
    b.innerHTML='<h6>DETAILS</h6><table class="dt">'+rows.map(r=>`<tr><td>${r[0]}</td><td>${d[r[1]]}</td></tr>`).join('')+`<tr><td>Infrared heat</td><td><span class="badge" style="background:${ir.colorCode}">${ir.heatLevel}</span></td></tr></table><h5 style="cursor:default">ABOUT</h5><p>${d.description}</p><h5 style="cursor:default">CLUES</h5>${cur.clues.map(c=>'<p>• '+c+'</p>').join('')}`;
    return;
  }
  const st=cur.structure.map((l, i)=>[i, l]).reverse();
  b.innerHTML='<h6>STRUCTURE</h6>'+st.map(([i, l])=>`<h5 data-i="${i}">${l.layerName}</h5><p>${l.description}</p>`).join('');
  L.innerHTML=st.map(([i, l])=>`<div data-i="${i}">${l.layerName.toUpperCase()}<small>${l.description.split(/[,.]/)[0]}</small></div>`).join('');
  document.querySelectorAll('#xb h5,#xl div').forEach(x=>x.onclick=()=>setSel(+x.dataset.i));
  setSel(cur.structure.length-1);
}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>setMode(b.dataset.m));
$('#xc').onclick=()=> {
  $('#explore').hidden=true;
} ;
const mc=$('#model');
mc.addEventListener('pointerdown', e=> {
  mdown= {
    x:e.clientX, y:e.clientY
  } ; mc.setPointerCapture(e.pointerId);
} );
mc.addEventListener('pointermove', e=> {
  if(!mdown||!grp)return; grp.rotation.y+=(e.clientX-mdown.x)*.01; grp.rotation.x+=(e.clientY-mdown.y)*.01; mdown= {
    x:e.clientX, y:e.clientY
  } ;
} );
mc.addEventListener('pointerup', ()=>mdown=null);
/*catalog*/
function buildCat() {
  const COL=['#c9784a', '#bcd6ee', '#3f7fd0', '#d9551c', '#9a6a4a'];
  $('#grid').innerHTML=DATA.map((d, i)=>i<5?`<button class="tile" data-i="${i}"><i style="background:radial-gradient(circle at 32% 30%,#fff8,${COL[i]} 40%,#000 100%)"></i>${d.name}</button>`:`<button class="tile" disabled><i style="background:#111a3a;display:grid;place-items:center;font-size:20px">?</i>LOCKED</button>`).join('');
  document.querySelectorAll('.tile:not([disabled])').forEach(t=>t.onclick=()=> {
    $('#cat').hidden=true; openExplore(DATA[+t.dataset.i]);
  } );
}
$('#bcat').onclick=()=>$('#cat').hidden=false;
$('#ccl').onclick=()=>$('#cat').hidden=true;
/* ---------- audio & flow ---------- */
let ac,
master,
snd=true;
function startAudio() {
  if(ac)return;
  try {
    ac=new(window.AudioContext||window.webkitAudioContext)();
    master=ac.createGain();
    master.gain.value=.3;
    const lp=ac.createBiquadFilter();
    lp.type='lowpass';
    lp.frequency.value=1600;
    master.connect(lp);
    lp.connect(ac.destination);
    [55, 82.41, 110, 164.81, 220].forEach((f, i)=> {
      const o=ac.createOscillator(); o.type=i%2?'sine':'triangle'; o.frequency.value=f; const g=ac.createGain(); g.gain.value=.25; const l=ac.createOscillator(); l.frequency.value=.05+i*.03; const lg=ac.createGain(); lg.gain.value=.2; l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(master); o.start(); l.start();
    } );
  } catch(e) {
  }
}
$('#mute').onclick=()=> {
  snd=!snd;
  if(master)master.gain.value=snd?.3:0;
  $('#mute').textContent=snd?'Sound on':'Sound off';
} ;
function startTap() {
  startAudio();
  $('#mute').hidden=false;
  $('#story').hidden=false;
}
$('#splash').onclick=()=> {
  if(ready&&!started)startTap();
} ;
$('#begin').onclick=()=> {
  $('#story').hidden=true;
  $('#splash').hidden=true;
  $('#splash').style.display='none';
  $('#labels').style.display='';
  started=true;
  ['#tb', '#rp', '#bar'].forEach(s=>$(s).hidden=false);
  if(innerWidth<760)$('#rp').classList.add('shut');
} ;
$('#ir').onchange=e=>setIR(e.target.checked);
$('#bir').onclick=()=>setIR(!IR);
$('#bre').onclick=()=> {
  const c=VC[view];
  az=c[0];
  el=c[1];
  dist=c[2];
  tgt.set(0, 0, 0);
} ;
$('#rtab').onclick=()=>$('#rp').classList.toggle('shut');
$('#play').onclick=()=> {
  running=!running;
  $('#play').innerHTML=running?'&#10074;&#10074;':'&#9654;';
} ;
$('#spd').onclick=()=> {
  rate=rate===1?5:rate===5?20:1;
  $('#spd').textContent='x'+rate;
} ;
$('#again').onclick=()=>location.reload();
const T0=Date.now(),
MON=['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function fmt() {
  const d=new Date(T0+sim*864e5),
  p=n=>String(n).padStart(2, '0');
  return`${d.getFullYear()} ${MON[d.getMonth()]} ${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
/*more views: Earth + satellites, Milky Way, galaxies*/
let view='atlas';
const VR= {
  atlas:[30, 360],
  earth:[16, 180],
  mw:[60, 900],
  gal:[60, 700]
} ,
VC= {
  atlas:[.6, .55, 150],
  earth:[.6, .35, 34],
  mw:[.3, .8, 470],
  gal:[.5, .4, 420]
} ,
EX=[],
GALS=[],
SATS=[];
let EARTH;
const gs=()=>(Math.random()+Math.random()+Math.random()+Math.random()-2)/2,
XA=new THREE.Vector3(1, 0, 0),
tv=new THREE.Vector3();
function addEx(v, G, name, pos, r, info) {
  const hit=new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial( {
    visible:false
  } ));
  hit.position.copy(pos);
  G.add(hit);
  const lab=document.createElement('div');
  lab.className='lab';
  lab.textContent=name;
  $('#labels').appendChild(lab);
  const o= {
    view:v,
    name,
    hit,
    lab,
    info
  } ;
  EX.push(o);
  return o;
}
function gal(n, R, arms, c1, c2, thick) {
  const p=new Float32Array(n*3),
  c=new Float32Array(n*3),
  A=new THREE.Color(c1),
  B=new THREE.Color(c2),
  k=new THREE.Color();
  for(let i=0; i<n; i++) {
    let x,
    y,
    z,
    f;
    if(Math.random()<.22) {
      const r=R*.16*Math.abs(gs())+R*.02,
      u=Math.random()*2-1,
      t=Math.random()*6.2832,
      s=Math.sqrt(1-u*u);
      x=r*s*Math.cos(t);
      y=r*u*.7;
      z=r*s*Math.sin(t);
      f=0;
    } else {
      const r=R*Math.pow(Math.random(), .65),
      a=Math.floor(Math.random()*arms)*6.2832/arms+2.4*Math.log(1+r/(R*.12))+gs()*(.55-.3*r/R);
      x=r*Math.cos(a);
      z=r*Math.sin(a);
      y=gs()*R*thick*(1.3-r/R);
      f=r/R;
    }
    p.set([x, y, z], i*3);
    k.copy(A).lerp(B, Math.min(1, f+Math.random()*.15));
    c.set([k.r, k.g, k.b], i*3);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return new THREE.Points(g, new THREE.PointsMaterial( {
    size:Math.max(.9, R/110), vertexColors:true, transparent:true, opacity:.85, blending:THREE.AdditiveBlending, depthWrite:false
  } ));
}
function buildEarth() {
  EARTH=new THREE.Mesh(new THREE.SphereGeometry(10, 64, 48), new THREE.MeshStandardMaterial( {
    map:mk('earth'), roughness:.9
  } ));
  G2.add(EARTH);
  const dl=new THREE.DirectionalLight(0xffffff, 1.8);
  dl.position.set(60, 25, 40);
  G2.add(dl);
  const ag=new THREE.Sprite(new THREE.SpriteMaterial( {
    map:GT, color:0x3a7bff, blending:THREE.AdditiveBlending, transparent:true, opacity:.5, depthWrite:false
  } ));
  ag.scale.set(30, 30, 1);
  G2.add(ag);
  addEx('earth', G2, 'Earth', new THREE.Vector3(), 11, ['Earth', 'Home planet', 'The only world we know with life. Orbit heights here are exaggerated and time runs fast, so you can watch the satellites move.']);
  const D=[['International Space Station', 'Crewed laboratory, about 420 km up', 13.2, 51.6, .9, '#ffffff', .5, 'One lap around Earth takes about 93 minutes.'], ['Hubble Space Telescope', 'Space telescope, about 540 km up', 15, 28.5, .8, '#ffe08a', .5, 'Hubble has imaged the universe from orbit since 1990.'], ['SPHEREx', 'NASA infrared observatory, about 650 km up', 17, 97.7, .7, '#b04cff', .8, 'Launched in 2025. It circles Earth in a near-polar orbit and maps the whole sky in 102 infrared colors, the same data your hunt is based on.'], ['GPS satellite', 'Navigation, about 20,200 km up', 27, 55, .25, '#7fe3ff', .5, 'One lap takes roughly 12 hours.'], ['Geostationary satellite', 'Weather and communication, 35,786 km up', 40, 0, .12, '#ff9a9a', .5, 'It takes 24 hours per lap, so it hovers above one spot on Earth.'], ['Tiangong Space Station', 'Chinese crewed station, about 390 km up', 13, 41.5, .92, '#ffb36b', .45, 'Crewed continuously since 2022. One lap around Earth takes about 92 minutes.'], ['Starlink satellites', 'Internet constellation, about 550 km up', 14, 53, .88, '#9fe8ff', .18, 'Thousands of small satellites share orbits like this one to beam internet down to the ground.'], ['Landsat 9', 'Earth-observing satellite, about 705 km up', 16, 98.2, .78, '#7dff9a', .4, 'It photographs the whole planet every 16 days to track forests, farms and cities.']];
  D.forEach(d=> {
    const m=new THREE.Mesh(new THREE.BoxGeometry(d[6], d[6]*.5, d[6]*.5), new THREE.MeshBasicMaterial( {
      color:d[5]
    } )); m.add(new THREE.Mesh(new THREE.BoxGeometry(d[6]*.12, d[6]*.03, d[6]*2.4), new THREE.MeshBasicMaterial( {
      color:0x3a6cff
    } ))); const g=new THREE.Sprite(new THREE.SpriteMaterial( {
      map:GT, color:d[5], blending:THREE.AdditiveBlending, transparent:true, opacity:.6, depthWrite:false
    } )); g.scale.set(3.4, 3.4, 1); const pl=[]; for(let i=0; i<=128; i++) {
      const a=i/128*6.2832; pl.push(new THREE.Vector3(Math.cos(a)*d[2], 0, Math.sin(a)*d[2]).applyAxisAngle(XA, rad(d[3])));
    }
    G2.add(m, g, new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pl), new THREE.LineBasicMaterial( {
      color:0x58a6ff, transparent:true, opacity:.3
    } ))); SATS.push( {
      mesh:m, glow:g, r:d[2], inc:d[3], w:d[4], ph:Math.random()*6.28, ex:addEx('earth', G2, d[0], new THREE.Vector3(), 2.4, [d[0], d[1], d[7]])
    } );
  } );
  const mo=new THREE.Mesh(new THREE.SphereGeometry(2.7, 32, 24), new THREE.MeshStandardMaterial( {
    map:mk('rust'), color:0x999999, roughness:1
  } ));
  G2.add(mo);
  const pl=[];
  for(let i=0; i<=160; i++) {
    const a=i/160*6.2832;
    pl.push(new THREE.Vector3(Math.cos(a)*60, 0, Math.sin(a)*60).applyAxisAngle(XA, rad(5)));
  }
  G2.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pl), new THREE.LineBasicMaterial( {
    color:0x58a6ff, transparent:true, opacity:.3
  } )));
  SATS.push( {
    mesh:mo, r:60, inc:5, w:.04, ph:1, ex:addEx('earth', G2, 'Moon', new THREE.Vector3(), 4, ['Moon', 'Earth natural satellite', 'About 384,400 km away, roughly 30 Earth widths. Here it is drawn much closer than in reality.'])
  } );
}
function buildMW() {
  G3.add(gal(30000, 220, 4, '#ffd9a0', '#7fa8ff', .03));
  const sp=new THREE.Vector3(114*Math.cos(2.2), 0, 114*Math.sin(2.2)),
  s=new THREE.Sprite(new THREE.SpriteMaterial( {
    map:GT, color:0xffe08a, blending:THREE.AdditiveBlending, transparent:true, depthWrite:false
  } ));
  s.scale.set(20, 20, 1);
  s.position.copy(sp);
  G3.add(s);
  addEx('mw', G3, 'You are here: Solar System', sp, 9, ['You are here', 'Solar System', 'Our Sun sits about 26,000 light years from the galactic center. Every exoplanet in this game is in this same neighborhood of the Milky Way.']);
  addEx('mw', G3, 'Galactic center', new THREE.Vector3(), 14, ['Galactic center', 'Sagittarius A*', 'A supermassive black hole of about 4 million Suns sits at the middle of the Milky Way.']);
}
function buildGal() {
  const L=[['Milky Way', 'Barred spiral galaxy', 'Our home galaxy, roughly 100,000 light years across. You are inside it.', 0, 0, 0, 22, 4, '#ffd9a0', '#7fa8ff', .4], ['Large Magellanic Cloud', 'Dwarf galaxy', 'About 160,000 light years away. A small companion of the Milky Way, visible to the naked eye from the southern hemisphere.', -40, -35, 84, 6, 2, '#cfe0ff', '#9fb8ff', .2], ['Small Magellanic Cloud', 'Dwarf galaxy', 'About 200,000 light years away. Another companion of the Milky Way.', -55, -40, 91, 4, 2, '#cfe0ff', '#9fb8ff', .3], ['Andromeda Galaxy (M31)', 'Spiral galaxy', 'About 2.5 million light years away. The nearest large galaxy, and it is moving toward the Milky Way.', 60, 20, 168, 30, 3, '#ffd9a0', '#8fb0ff', 1.1], ['Triangulum Galaxy (M33)', 'Spiral galaxy', 'About 2.7 million light years away, a member of our Local Group of galaxies.', 80, 35, 172, 14, 2, '#fff0d0', '#8fb0ff', .5], ['Pinwheel Galaxy (M101)', 'Spiral galaxy', 'About 21 million light years away.', 150, 45, 232, 22, 2, '#ffe9c0', '#7fa0ff', .3], ['Whirlpool Galaxy (M51)', 'Spiral galaxy', 'About 23 million light years away. Its clear spiral arms made it famous.', 200, 30, 236, 18, 2, '#ffe9c0', '#7fa0ff', .6], ['Sombrero Galaxy (M104)', 'Spiral galaxy', 'About 29 million light years away, seen almost edge-on with a bright central bulge.', 250, 10, 244, 20, 3, '#fff0d8', '#d9c4a0', 1.45]];
  L.forEach(d=> {
    const p=gal(Math.round(3000+d[6]*500), d[6], d[7], d[8], d[9], d[6]<8?.15:.04); p.position.copy(dir(d[3], d[4]).multiplyScalar(d[5])); p.rotation.x=d[10]; G4.add(p); GALS.push(p); addEx('gal', G4, d[0], p.position, Math.max(d[6]*.9, 5), [d[0], d[1]+', distances compressed', d[2]]);
  } );
}
function showInfo(o) {
  const i=o.info;
  $('#info').hidden=false;
  $('#ih').textContent=i[0];
  $('#is').textContent=i[1];
  $('#ip').textContent=i[2];
}
function setView(v) {
  view=v;
  G1.visible=v==='atlas';
  G2.visible=v==='earth';
  G3.visible=v==='mw';
  G4.visible=v==='gal';
  const c=VC[v];
  az=c[0];
  el=c[1];
  dist=c[2];
  tgt.set(0, 0, 0);
  $('#info').hidden=true;
  $('#vm').hidden=true;
  document.querySelectorAll('#vm button').forEach(b=>b.classList.toggle('on', b.dataset.v===v));
  $('#rp').hidden=v!=='atlas'||!started;
}
$('#bvw').onclick=()=>$('#vm').hidden=!$('#vm').hidden;
document.querySelectorAll('#vm button').forEach(b=>b.onclick=()=>setView(b.dataset.v));
$('#ic').onclick=()=>$('#info').hidden=true;
function tickEx(dt, t) {
  if(view==='earth') {
    EARTH.rotation.y+=dt*.05*(running?rate:0);
    CLOUDS.rotation.y+=dt*.058*(running?rate:0);
    SATS.forEach(s=> {
      const a=s.ph+sim*s.w; tv.set(Math.cos(a)*s.r, 0, Math.sin(a)*s.r).applyAxisAngle(XA, rad(s.inc)); s.mesh.position.copy(tv); if(s.glow)s.glow.position.copy(tv); s.ex.hit.position.copy(tv);
    } );
  }
  if(view==='mw'&&running)G3.rotation.y+=dt*.02;
  if(view==='gal'&&running)GALS.forEach(g=>g.rotation.y+=dt*.05);
  EX.forEach(o=> {
    if(o.view!==view) {
      o.lab.style.display='none'; return;
    }
    o.hit.getWorldPosition(tv); tv.project(C); o.lab.style.display=tv.z<1?'':'none'; o.lab.style.transform=`translate(${(tv.x*.5+.5)*innerWidth}px,${(-tv.y*.5+.5)*innerHeight}px) translate(-50%,14px)`;
  } );
}
/*realism pass: clouds, atmosphere, Milky Way band, distant galaxies, nebulae*/
let CLOUDS;
function cloudTex() {
  const W=256,
  H=128,
  c=document.createElement('canvas');
  c.width=W;
  c.height=H;
  const x=c.getContext('2d'),
  im=x.createImageData(W, H),
  d=im.data;
  for(let j=0; j<H; j++)for(let i=0; i<W; i++) {
    const lo=i/W*6.2832,
    la=(j/H-.5)*3.1416,
    o=(j*W+i)*4,
    v=Math.max(0, fbm(Math.cos(la)*Math.cos(lo)*2.2+5, Math.sin(la)*2.2+5, Math.cos(la)*Math.sin(lo)*2.2+5, 5)-.46)*3.2;
    d[o]=d[o+1]=d[o+2]=255;
    d[o+3]=Math.min(255, v*255);
  }
  x.putImageData(im, 0, 0);
  return new THREE.CanvasTexture(c);
}
function neb(v, G, name, pos, col, s, info) {
  const sp=new THREE.Sprite(new THREE.SpriteMaterial( {
    map:GT, color:col, blending:THREE.AdditiveBlending, transparent:true, opacity:.75, depthWrite:false
  } ));
  sp.scale.set(s, s, 1);
  sp.position.copy(pos);
  G.add(sp);
  return addEx(v, G, name, pos, Math.max(s*.45, 5), info);
}
function buildExtra() {
  CLOUDS=new THREE.Mesh(new THREE.SphereGeometry(10.12, 48, 36), new THREE.MeshStandardMaterial( {
    map:cloudTex(), transparent:true, opacity:.6, depthWrite:false, roughness:1
  } ));
  G2.add(CLOUDS);
  G2.add(new THREE.Mesh(new THREE.SphereGeometry(10.7, 48, 36), new THREE.MeshBasicMaterial( {
    color:0x4a90ff, transparent:true, opacity:.12, side:THREE.BackSide, blending:THREE.AdditiveBlending, depthWrite:false
  } )));
  /* Milky Way band as seen from inside our galaxy */
  const n=14000,
  p=new Float32Array(n*3),
  c=new Float32Array(n*3),
  k=new THREE.Color();
  for(let i=0; i<n; i++) {
    const a=Math.random()*6.2832,
    h=gs()*gs()*260*(1+.8*Math.cos(a-1));
    p.set([1500*Math.cos(a), h, 1500*Math.sin(a)], i*3);
    k.set(Math.random()<.3?'#ffd9a0':'#cfdcff').multiplyScalar(.35+Math.random()*.5);
    c.set([k.r, k.g, k.b], i*3);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  const band=new THREE.Points(g, new THREE.PointsMaterial( {
    size:3, vertexColors:true, transparent:true, opacity:.7, blending:THREE.AdditiveBlending, depthWrite:false
  } ));
  band.rotation.set(.9, 0, .35);
  G1.add(band);
  /* distant galaxies in the main sky */
  [['Andromeda Galaxy (M31)', 'Spiral galaxy, 2.5 million light years away', 'The nearest large galaxy. Seen from Earth it is about six Moons wide, though too faint to see that in a photo. It is heading toward the Milky Way.', 40, 28, 60, 9000, '#ffd9a0', '#8fb0ff', 1.1], ['Large Magellanic Cloud', 'Dwarf galaxy, 160,000 light years away', 'A small companion of the Milky Way, visible to the naked eye from the southern hemisphere.', 250, -30, 70, 5000, '#cfe0ff', '#9fb8ff', .3], ['Whirlpool Galaxy (M51)', 'Spiral galaxy, 23 million light years away', 'Its clear spiral arms made it one of the most famous galaxies in the sky.', 140, 40, 22, 4000, '#ffe9c0', '#7fa0ff', .6]].forEach(d=> {
    const pos=dir(d[3], d[4]).multiplyScalar(1000), gl=gal(d[6], d[5], 2, d[7], d[8], .05); gl.position.copy(pos); gl.rotation.x=d[9]; gl.material.size=Math.max(2, d[5]/14); G1.add(gl); const sp=new THREE.Sprite(new THREE.SpriteMaterial( {
      map:GT, color:d[7], blending:THREE.AdditiveBlending, transparent:true, opacity:.35, depthWrite:false
    } )); sp.scale.set(d[5]*3, d[5]*3, 1); sp.position.copy(pos); G1.add(sp); addEx('atlas', G1, d[0], pos, d[5]*.8, [d[0], d[1], d[2]]);
  } );
  /* nebulae in the Milky Way view */
  const sun=new THREE.Vector3(114*Math.cos(2.2), 0, 114*Math.sin(2.2)),
  o=(x, z)=>sun.clone().add(new THREE.Vector3(x, 0, z));
  neb('mw', G3, 'Orion Nebula', o(-14, 8), 0xff7fb0, 16, ['Orion Nebula', 'Star-forming nebula, about 1,300 light years away', 'A glowing cloud where new stars are being born, close enough to see as a fuzzy star in Orion.']);
  neb('mw', G3, 'Crab Nebula', o(22, -12), 0x7fd0ff, 14, ['Crab Nebula', 'Supernova remnant, about 6,500 light years away', 'The remains of a star that exploded in 1054, recorded by astronomers on Earth.']);
  neb('mw', G3, 'Pillars of Creation', o(-30, -42), 0xffa05a, 16, ['Pillars of Creation', 'Eagle Nebula, about 6,500 light years away', 'Towers of gas and dust where stars form, made famous by Hubble and Webb.']);
  const bg=new THREE.Sprite(new THREE.SpriteMaterial( {
    map:GT, color:0xffd9a0, blending:THREE.AdditiveBlending, transparent:true, opacity:.5, depthWrite:false
  } ));
  bg.scale.set(90, 90, 1);
  G3.add(bg);
  /* more galaxy types */
  const m87=neb('gal', G4, 'Messier 87', dir(310, 25).multiplyScalar(330), 0xffe0b0, 26, ['Messier 87', 'Giant elliptical galaxy, about 53 million light years away', 'Home to the first black hole ever imaged, with a jet of particles shooting out of its center.']);
  G4.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([m87.hit.position, m87.hit.position.clone().add(dir(10, 35).multiplyScalar(22))]), new THREE.LineBasicMaterial( {
    color:0x7fb0ff
  } )));
  neb('gal', G4, 'Centaurus A', dir(200, -15).multiplyScalar(190), 0xffc08a, 20, ['Centaurus A', 'Active galaxy, about 13 million light years away', 'A galaxy crossed by a dark dust lane, with a supermassive black hole feeding at its center.']);
  neb('gal', G4, 'Quasar 3C 273', dir(100, 50).multiplyScalar(400), 0xbfe0ff, 16, ['Quasar 3C 273', 'Bright quasar, about 2.4 billion light years away', 'A black hole swallowing gas so fast that it outshines its entire galaxy. Distances here are compressed.']);
}
/* boot: build textures one by one with progress */
const jobs=[...KIND.map(k=>()=>mk(k)), ()=>mk('sun')];
let jd=0;
function step() {
  if(jd<jobs.length) {
    jobs[jd++]();
    $('#pf').style.width=jd/jobs.length*100+'%';
    setTimeout(step, 15);
  } else {
    buildScene();
    buildCat();
    buildEarth();
    buildMW();
    buildGal();
    buildExtra();
    ready=true;
    $('#splash').classList.add('go');
  }
}
setTimeout(step, 50);
/*loop*/
let last=0;
const v3=new THREE.Vector3();
function loop(t) {
  requestAnimationFrame(loop);
  const dt=Math.min((t-last)/1000, .1);
  last=t;
  if(ready) {
    if(running)sim+=dt*rate;
    objs.forEach(o=> {
      const a=o.ph+sim*o.w; o.mesh.position.set(Math.cos(a)*o.r, 0, Math.sin(a)*o.r*.93); o.glow.position.copy(o.mesh.position); o.hit.position.copy(o.mesh.position); o.mesh.rotation.y+=dt*.4; const k=o.size*(IR?7:4)*(IR&&o.hidden?1+.15*Math.sin(t*.004):1); o.glow.scale.set(k, k, 1); if(o.mesh.visible&&view==='atlas') {
        v3.copy(o.mesh.position).project(C); const vis=v3.z<1; o.lab.style.display=vis?'':'none'; o.lab.style.transform=`translate(${(v3.x*.5+.5)*innerWidth}px,${(-v3.y*.5+.5)*innerHeight}px) translate(-50%,${12+o.size*2}px)`;
      } else o.lab.style.display='none';
    } );
    if(!started)az+=dt*.06;
    tickEx(dt, t);
    if(locking) {
      const x=objs.find(o=>o.isX).mesh.position;
      tgt.lerp(x, .08);
      dist+=(36-dist)*.05;
      locking.f++;
      if(locking.f===55)$('#lock').classList.add('on');
      if(locking.f===150)$('#win').hidden=false;
    }
    C.position.set(tgt.x+dist*Math.cos(el)*Math.sin(az), tgt.y+dist*Math.sin(el), tgt.z+dist*Math.cos(el)*Math.cos(az));
    C.lookAt(tgt);
    $('#date').textContent=fmt();
    if(!window.__ux)R.render(S, C);
  }
  if(!$('#explore').hidden&&grp) {
    if(!mdown&&!cut)grp.rotation.y+=.004;
    MR.render(MS, MC);
  }
}
requestAnimationFrame(loop);
/*sound effects (synthesized live with Web Audio, not recordings)*/
function tone(f, d, type, vol, slide) {
  if(!ac||!snd)return;
  const t=ac.currentTime,
  o=ac.createOscillator(),
  g=ac.createGain();
  o.type=type||'sine';
  o.frequency.setValueAtTime(f, t);
  if(slide)o.frequency.exponentialRampToValueAtTime(slide, t+d);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol||.2, t+.01);
  g.gain.exponentialRampToValueAtTime(.0001, t+d);
  o.connect(g);
  g.connect(ac.destination);
  o.start(t);
  o.stop(t+d+.05);
}
const SFX= {
  click:()=>tone(880, .08, 'sine', .12, 1320),
  scan:()=> {
    tone(1200, .5, 'sine', .15, 600);
    setTimeout(()=>tone(1800, .25, 'sine', .07, 900), 120);
  } ,
  lock:()=>[523, 659, 784, 1047].forEach((f, i)=>setTimeout(()=>tone(f, .6, 'triangle', .18), i*140)),
  whoosh:()=>tone(180, .6, 'sawtooth', .06, 40)
} ;
document.addEventListener('click', e=> {
  if(e.target.closest('button'))SFX.click();
} , true);
const _log=log;
log=function(t) {
  _log(t);
  SFX.scan();
} ;
const _setView=setView;
setView=function(v) {
  _setView(v);
  SFX.whoosh();
} ;
new MutationObserver(()=> {
  if($('#lock').classList.contains('on'))SFX.lock();
} ).observe($('#lock'), {
  attributes:true, attributeFilter:['class']
} );
/*kid-friendly sound pack (synthesized live; speech uses the browser's built-in voice)*/
const PENT=[523.25, 587.33, 659.25, 783.99, 880, 1046.5];
const pent=()=>PENT[Math.floor(Math.random()*PENT.length)];
function noise(d, vol, f0, f1) {
  if(!ac||!snd)return;
  const n=Math.floor(ac.sampleRate*d),
  b=ac.createBuffer(1, n, ac.sampleRate),
  a=b.getChannelData(0);
  for(let i=0; i<n; i++)a[i]=Math.random()*2-1;
  const s=ac.createBufferSource(),
  fl=ac.createBiquadFilter(),
  g=ac.createGain(),
  t=ac.currentTime;
  s.buffer=b;
  fl.type='bandpass';
  fl.frequency.setValueAtTime(f0, t);
  fl.frequency.exponentialRampToValueAtTime(f1, t+d);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(.0001, t+d);
  s.connect(fl);
  fl.connect(g);
  g.connect(ac.destination);
  s.start(t);
}
function speak(t) {
  if(!snd||!window.speechSynthesis)return;
  try {
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.rate=.95;
    u.pitch=1.25;
    speechSynthesis.speak(u);
  } catch(e) {
  }
}
const arp=(notes, gap, type, vol)=>notes.forEach((f, i)=>setTimeout(()=>tone(f, .5, type||'triangle', vol||.16), i*gap));
Object.assign(SFX, {
  click:()=>tone(pent(), .18, 'triangle', .14), scan:()=> {
    tone(400, .6, 'sine', .12, 1600); arp([1319, 1568, 2093], 110, 'sine', .08);
  } , lock:()=>arp([523, 659, 784, 1047, 1319, 1568], 120), whoosh:()=>noise(.7, .25, 300, 3000), start:()=> {
    noise(1.4, .3, 120, 2400); arp([262, 330, 392, 523, 659, 784, 1047], 140); setTimeout(()=>speak('Welcome, space explorer! Let us find Planet X!'), 900);
  } , win:()=> {
    arp([523, 659, 784, 1047, 784, 1047, 1319, 1568], 130, 'triangle', .2); setTimeout(()=>speak('Hooray! You found Planet X! Great job!'), 1100);
  }
} );
/* gentle music-box loop with random twinkles */
let mi=0,
mt=null;
const MEL=[0, 2, 4, 2, 5, 4, 2, 0, 1, 3, 5, 3, 4, 2, 1, 0];
function startMusic() {
  if(mt)return;
  mt=setInterval(()=> {
    if(!ac||!snd||document.hidden)return; const f=PENT[MEL[mi%MEL.length]]/2; tone(f, .9, 'sine', .12); if(mi%2===0)tone(f*2, .4, 'triangle', .06); if(Math.random()<.35)setTimeout(()=>tone(pent()*2, .3, 'sine', .05), 220); mi++;
  } , 480);
}
const _startTap=startTap;
startTap=function() {
  _startTap();
  if(ac&&ac.resume)ac.resume();
  SFX.start();
  startMusic();
} ;
new MutationObserver(()=> {
  if(!$('#win').hidden)SFX.win();
} ).observe($('#win'), {
  attributes:true, attributeFilter:['hidden']
} );
$('#mute').addEventListener('click', ()=> {
  if(!snd&&window.speechSynthesis)speechSynthesis.cancel();
} );
