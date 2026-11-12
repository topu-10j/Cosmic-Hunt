/* Ultimate Edition: 6 deep-space modes. Own renderer/scene/camera per mode, built on entry and disposed on exit. */
(() => {
  const T = THREE,
    D = document,
    $ = s => D.querySelector(s),
    PI = Math.PI,
    rnd = Math.random,
    V = (x, y, z) => new T.Vector3(x, y, z),
    cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const E = (t, c, h, p) => {
    const e = D.createElement(t);
    if (c) e.className = c;
    if (h != null) e.innerHTML = h;
    (p || D.body).appendChild(e);
    return e;
  };
  const KEEP = new WeakSet([GT]);
  const cv = E('canvas'),
    ov = E('div'),
    fd = E('div'),
    bt = E('div', 'uxb'),
    bb = E('div', 'uxb'),
    pn = E('div', 'hud');
  cv.id = 'uxc';
  ov.id = 'uxo';
  fd.id = 'uxf';
  bt.id = 'uxt';
  bb.id = 'uxb';
  pn.id = 'uxp';
  pn.innerHTML = '<h3 id="uxh"></h3><small id="uxg"></small><div id="uxk"></div><div id="uxs"></div><div><button class="uxbtn" id="uxpa">PAUSE</button><button class="uxbtn" id="uxrc">RESET CAMERA</button><button class="uxbtn" id="uxx">BACK TO ATLAS</button></div><div id="uxi"></div><p id="uxn"></p>';
  [cv, ov, fd, bt, bb, pn].forEach(e => e.hidden = true);
  let R, M = null, raf = 0, paused = false, cur = -1, busy = 0, last = 0, clock = 0;
  const cam = new T.PerspectiveCamera(50, 1, .05, 3000),
    rc = new T.Raycaster(),
    mv = new T.Vector2(),
    tmp = V(0, 0, 0),
    C = { a: 0, e: 0, d: 10, ta: 0, te: 0, td: 10, mn: 2, mx: 50 };
  const PK = (o, i, a) => {
    o.userData.info = i;
    a.push(o);
    return o;
  },
    setS = h => $('#uxs').innerHTML = h;
  const SP = (c, s, o, nb) => {
    const p = new T.Sprite(new T.SpriteMaterial({
      map: GT,
      color: c,
      blending: nb ? T.NormalBlending : T.AdditiveBlending,
      transparent: true,
      opacity: o,
      depthWrite: false
    }));
    p.scale.set(s, s, 1);
    return p;
  };
  const SF = (n, r) => {
    const p = new Float32Array(n * 3),
      c = new Float32Array(n * 3),
      k = new T.Color(),
      g = new T.BufferGeometry(),
      pal = ['#fff', '#b9c4ff', '#ffe9c8', '#ff9a6a'];
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, a = rnd() * PI * 2, s = Math.sqrt(1 - u * u);
      p.set([r * s * Math.cos(a), r * u, r * s * Math.sin(a)], i * 3);
      k.set(pal[rnd() * 4 | 0]).multiplyScalar(.35 + rnd() * .65);
      c.set([k.r, k.g, k.b], i * 3);
    }
    g.setAttribute('position', new T.BufferAttribute(p, 3));
    g.setAttribute('color', new T.BufferAttribute(c, 3));
    return g;
  };
  const stars = (n, r, sz) => new T.Points(
    SF(n, r),
    new T.PointsMaterial({
      size: sz || 1.6,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      depthWrite: false
    })
  );
  const free = o => o.traverse(c => {
    if (c.geometry && !c.isSprite) c.geometry.dispose();
    const m = c.material;
    (Array.isArray(m) ? m : m ? [m] : []).forEach(m => {
      for (const k in m) {
        const v = m[k];
        if (v && v.isTexture && !KEEP.has(v)) v.dispose();
      }
      m.dispose();
    });
  });
  const flash = (c, ms) => {
    fd.hidden = false;
    fd.style.transition = 'none';
    fd.style.background = c;
    fd.style.opacity = .9;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fd.style.transition = 'opacity ' + ms + 'ms';
      fd.style.opacity = 0;
    }));
  };
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
    vis = o => {
      for (; o; o = o.parent) if (!o.visible) return 0;
      return 1;
    };
  const info = a => {
    a = typeof a === 'function' ? a() : a;
    $('#uxi').innerHTML = `<h4>${a[0]}</h4><small>${a[1]}</small><p>${a[2]}</p>`;
  };
  const ui = L => {
    const k = $('#uxk');
    k.innerHTML = '';
    L.forEach(o => {
      if (o.r) {
        const l = E('label', '', null, k), sp = E('span', '', null, l), i = E('input', '', null, l);
        i.type = 'range';
        i.min = o.r[0];
        i.max = o.r[1];
        i.step = o.r[2];
        i.value = o.v;
        const u = () => sp.textContent = o.l + ': ' + o.f(+i.value);
        i.oninput = u;
        u();
      } else {
        const b = E('button', 'uxbtn g' + (o.g || '') + (o.on ? ' on' : ''), o.l, k);
        b.onclick = () => {
          if (o.g) {
            k.querySelectorAll('.g' + o.g).forEach(x => x.classList.remove('on'));
            b.classList.add('on');
          }
          if (o.tg) b.classList.toggle('on');
          o.f(b.classList.contains('on'));
        };
      }
    });
  };
  const VS = 'varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    VU = 'varying vec2 u;void main(){u=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const SM = (u, v, f, o) => new T.ShaderMaterial(Object.assign(
    {
      uniforms: u,
      vertexShader: v,
      fragmentShader: f,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      side: T.DoubleSide
    },
    o || {}
  ));

  /* 1. BLACK HOLES: lengths in Schwarzschild radii; point-lens approximation of lensing, not full ray tracing */
  function bh() {
    const sc = new T.Scene(),
      g = new T.Group(),
      pick = [],
      U = { uL: { value: V(0, 0, 1) }, uTE: { value: .2 } },
      DU = {
        t: { value: 0 },
        uC: { value: V(0, 0, 1) },
        c: { value: new T.Color('#ff8a3a') },
        sp: { value: 1 }
      },
      JU = { t: DU.t, a: { value: .1 } };
    let lens = 1;
    sc.add(new T.Points(
      SF(5000, 400),
      new T.ShaderMaterial({
        uniforms: U,
        transparent: true,
        depthWrite: false,
        vertexShader: 'uniform vec3 uL;uniform float uTE;attribute vec3 color;varying vec3 vc;void main(){vc=color;vec3 o=(modelMatrix*vec4(position,1.)).xyz-cameraPosition;float l=length(o);vec3 d=o/l;float cs=clamp(dot(d,uL),-1.,1.),b=acos(cs);vec3 pe=normalize(d-uL*cs+vec3(1e-5));float th=.5*(b+sqrt(b*b+4.*uTE*uTE));th=mix(th,b,smoothstep(1.,2.2,b));d=uL*cos(th)+pe*sin(th);gl_Position=projectionMatrix*viewMatrix*vec4(cameraPosition+d*l,1.);gl_PointSize=2.;}',
        fragmentShader: 'varying vec3 vc;void main(){gl_FragColor=vec4(vc,1.);}'
      })
    ));
    const disk = PK(
      new T.Mesh(
        new T.RingGeometry(3, 13, 160, 1),
        SM(
          DU,
          VS,
          'uniform float t,sp;uniform vec3 uC,c;varying vec2 p;void main(){float r=length(p),a=atan(p.y,p.x),k=(r-3.)/10.;float w=sp*3.*pow(r/3.,-1.5);float s=.55+.45*sin(a*5.+log(r)*14.-t*w)*sin(a*3.-log(r)*7.+t*w*.6);float dop=dot(vec2(-sin(a),cos(a)),normalize(uC.xy+vec2(1e-4)))*inversesqrt(r/3.)*.9;float br=pow(max(1.+dop*.9,.05),3.)*pow(max(1.-k,0.),2.2)*(.55+.9*s);vec3 col=mix(vec3(1.,.93,.78),c,smoothstep(0.,.55,k));gl_FragColor=vec4(col*br*1.6,smoothstep(0.,.04,k)*(1.-smoothstep(.8,1.,k)));}'
        )
      ),
      [
        'Accretion disk',
        'Hot gas spiraling inward',
        'Friction heats the gas to millions of degrees. For a non-spinning hole the innermost stable orbit is 3 Schwarzschild radii. One side looks brighter because gas moving toward us is beamed (relativistic Doppler effect).'
      ],
      pick
    );
    disk.rotation.x = -PI / 2;
    const jg = new T.CylinderGeometry(2.4, .5, 44, 24, 1, true).translate(0, 22, 0),
      jm = SM(
        JU,
        VU,
        'uniform float t,a;varying vec2 u;void main(){float f=pow(1.-u.y,1.4)*(.65+.35*sin(u.y*28.-t*7.));gl_FragColor=vec4(vec3(.45,.65,1.)*f,f*a*.6);}'
      ),
      j1 = new T.Mesh(jg, jm),
      j2 = new T.Mesh(jg, jm);
    j2.rotation.z = PI;
    const JI = [
      'Relativistic jets',
      'Plasma at nearly light speed',
      'Twisted magnetic fields launch matter along the spin axis. The jet of M87* stretches thousands of light-years. No strong jet is confirmed for Sagittarius A*, so it is drawn faint (artistic).'
    ];
    PK(j1, JI, pick);
    PK(j2, JI, pick);
    g.add(disk, j1, j2, SP('#ff9a50', 16, .3), SP('#fff', 5, .2));
    g.rotation.set(.15, 0, .3);
    const hl = new T.Mesh(
      new T.RingGeometry(2.1, 5.5, 96, 1),
      SM(
        DU,
        VS,
        'uniform vec3 c;varying vec2 p;void main(){float r=length(p),g=exp(-pow((r-2.62)/.07,2.))*1.8+exp(-pow((r-2.95)/.6,2.))*.45*step(2.6,r);gl_FragColor=vec4(mix(vec3(1.,.85,.6),c,.35),clamp(g,0.,1.));}'
      )
    );
    const hp = PK(
      new T.Mesh(
        new T.RingGeometry(2.3, 3, 48, 1),
        new T.MeshBasicMaterial({ visible: false, side: T.DoubleSide })
      ),
      [
        'Photon ring and shadow',
        'Light bent around the hole',
        'Light can orbit at 1.5 Schwarzschild radii. Lensing makes the dark shadow look about 2.6 radii wide (5.2 across), the size the Event Horizon Telescope measures.'
      ],
      pick
    );
    const hz = PK(
      new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshBasicMaterial({ color: 0 })),
      [
        'Event horizon',
        'Point of no return',
        'The boundary where escape speed reaches the speed of light, at radius 2GM/c² (Schwarzschild radius, non-spinning case). Nothing inside can send a signal out.'
      ],
      pick
    );
    sc.add(g, hl, hp, hz);
    const TG = {
      sgr: {
        c: '#ffa04a',
        sp: 1.5,
        j: .1,
        s: '1 unit = 1 Schwarzschild radius ≈ 12.7 million km',
        i: [
          'Sagittarius A*',
          'Milky Way’s central black hole',
          'About 4.3 million Suns, roughly 26,000 light-years away. Schwarzschild radius ≈ 12.7 million km (0.08 AU). The Event Horizon Telescope published its image in 2022.'
        ]
      },
      m87: {
        c: '#ff7a2b',
        sp: .6,
        j: 1,
        s: '1 unit = 1 Schwarzschild radius ≈ 19 billion km (~130 AU)',
        i: [
          'Messier 87*',
          'Black hole in galaxy M87',
          'About 6.5 billion Suns, roughly 55 million light-years away. The first black hole ever imaged (EHT, 2019). Its jet extends thousands of light-years.'
        ]
      }
    };
    const set = k => {
      const t = TG[k];
      DU.c.value.set(t.c);
      DU.sp.value = t.sp;
      JU.a.value = t.j;
      setS(t.s);
      info(t.i);
    };
    set('sgr');
    return {
      sc,
      pick,
      ui: [
        { l: 'SAGITTARIUS A*', g: 1, on: 1, f: () => set('sgr') },
        { l: 'M87*', g: 1, f: () => set('m87') },
        { l: 'LENSING', tg: 1, on: 1, f: o => lens = o },
        { l: 'JETS', tg: 1, on: 1, f: o => j1.visible = j2.visible = o }
      ],
      tick(dt, t) {
        DU.t.value = t;
        hl.quaternion.copy(cam.quaternion);
        hp.quaternion.copy(cam.quaternion);
        U.uL.value.copy(cam.position).negate().normalize();
        U.uTE.value = lens ? 3.4 / cam.position.length() : 0;
        disk.worldToLocal(tmp.copy(cam.position));
        DU.uC.value.copy(tmp).normalize();
      }
    };
  }

  /* 2. WORMHOLE: artistic. Wormholes are theoretical solutions of general relativity, none observed */
  function wh() {
    const sc = new T.Scene(),
      pick = [],
      U = { t: { value: 0 }, w: { value: 1 } },
      rad = z => Math.sqrt(9 + z * z * .5),
      pr = [];
    let tr = 0, fl = 0, boost = 0;
    for (let i = -48; i <= 48; i++) pr.push(new T.Vector2(rad(i), i));
    const tun = PK(
      new T.Mesh(
        new T.LatheGeometry(pr, 72),
        SM(
          U,
          VU,
          'uniform float t,w;varying vec2 u;void main(){float a=u.x*6.2832,l=u.y,th=1.-abs(l-.5)*2.;float s=.5+.5*sin(l*70.-t*w*3.+sin(a*3.+t*.5)*2.),q=.5+.5*sin(a*8.+l*22.-t*w*1.5);vec3 c=mix(vec3(.1,.25,1.),vec3(.95,.2,.9),q);c=mix(c,vec3(.3,1.,1.),pow(s,5.));float g=pow(th,2.4)*1.5+.1;gl_FragColor=vec4(c,clamp(g*(.4+s*.6),0.,1.));}'
        )
      ),
      [
        'Spacetime tunnel',
        'Artistic Einstein–Rosen / Morris–Thorne style bridge',
        'A wormhole would link two regions of spacetime. Keeping one open needs exotic matter with negative energy density. No wormhole has ever been observed.'
      ],
      pick
    );
    tun.rotation.x = PI / 2;
    const th = PK(
      new T.Mesh(new T.SphereGeometry(3.4, 16, 12), new T.MeshBasicMaterial({ visible: false })),
      [
        'Throat',
        'Narrowest point',
        'In the simplest models the throat is the narrowest part, where space is most strongly curved. Here the tunnel narrows to 3 units, shaped by r = √(b² + z²) (stretched).'
      ],
      pick
    );
    const flow = (n, col, sz, sp, rf) => {
      const p = new Float32Array(n * 3), d = [], g = new T.BufferGeometry();
      for (let i = 0; i < n; i++) d.push({
        z: (rnd() - .5) * 96,
        a: rnd() * 7,
        r: rf * (.15 + .8 * rnd()),
        s: sp * (.6 + rnd() * .8)
      });
      g.setAttribute('position', new T.BufferAttribute(p, 3));
      const o = new T.Points(
        g,
        new T.PointsMaterial({
          color: col,
          size: sz,
          map: GT,
          blending: T.AdditiveBlending,
          transparent: true,
          depthWrite: false
        })
      );
      o.frustumCulled = false;
      o.u = (dt, w) => {
        d.forEach((q, i) => {
          q.z -= q.s * dt * w;
          if (q.z < -48) q.z += 96;
          q.a += dt * w * 2.7 / (rad(q.z) * .5 + 1);
          const r = rad(q.z) * q.r;
          p[i * 3] = Math.cos(q.a) * r;
          p[i * 3 + 1] = Math.sin(q.a) * r;
          p[i * 3 + 2] = q.z;
        });
        g.attributes.position.needsUpdate = true;
      };
      o.u(0, 0);
      return o;
    };
    const f1 = flow(700, '#cfe0ff', .8, 10, .98),
      f2 = flow(260, '#ff5ae8', 1.6, 16, .55),
      f3 = flow(200, '#4af0ff', 1.4, 12, .7);
    sc.add(tun, th, f1, f2, f3, stars(1500, 300));
    return {
      sc,
      pick,
      ui: [
        {
          l: 'TIME-TRAVEL FLIGHT',
          f: () => {
            if (!tr) {
              tr = .001;
              fl = 0;
            }
          }
        },
        { l: 'HYPERSPEED', tg: 1, f: o => boost = o ? 3 : 0 }
      ],
      cam(dt, t) {
        if (!tr) return 0;
        tr += dt / 10;
        if (tr >= 1) {
          tr = 0;
          flash('#000', 700);
          cam.fov = 55;
          cam.updateProjectionMatrix();
          setS('');
          return 0;
        }
        const e = ease(tr);
        cam.position.set(0, 0, 46 - 92 * e);
        cam.lookAt(0, 0, -80);
        cam.rotateZ(t * .4);
        const f = 55 + 45 * Math.sin(PI * e);
        cam.fov = f;
        cam.updateProjectionMatrix();
        if (!fl && tr > .48) {
          fl = 1;
          flash('#cfe8ff', 1200);
        }
        setS(`Time displacement: −${Math.round(e*57)} years (artistic)`);
        return 1;
      },
      tick(dt, t) {
        const w = 1 + boost + (tr > 0 ? 7 * Math.sin(PI * tr) : 0);
        U.t.value = t;
        U.w.value = w;
        f1.u(dt, w);
        f2.u(dt, w);
        f3.u(dt, w);
      }
    };
  }

  /* 3. SUPERNOVA: core-collapse (Type II). Timing is compressed */
  function sn() {
    const sc = new T.Scene(),
      pick = [],
      ex = new T.Group(),
      sun = mk('sun'),
      c0 = new T.Color('#ff5a2a'),
      c1 = new T.Color('#ffe2a8'),
      N = 2200,
      SU = { o: { value: 1 } };
    let ph = 0, pt = 0, pr = 0;
    KEEP.add(sun);
    const star = PK(
      new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshBasicMaterial({ map: sun, color: c0.clone() })),
      [
        'Massive star',
        'Core-collapse supernova progenitor',
        'Stars above about 8 Suns build onion-like shells (hydrogen, helium, carbon, oxygen, silicon) around an iron core. Iron cannot release energy by fusion, so the core collapses in under a second.'
      ],
      pick
    );
    const glow = SP('#ff7a3a', 10, .6),
      core = SP('#fff', 3, 0),
      shock = new T.Mesh(
        new T.SphereGeometry(1, 48, 32),
        SM(
          SU,
          'varying vec3 n,v;void main(){n=normalize(normalMatrix*normal);vec4 m=modelViewMatrix*vec4(position,1.);v=normalize(-m.xyz);gl_Position=projectionMatrix*m;}',
          'uniform float o;varying vec3 n,v;void main(){float f=pow(1.-abs(dot(n,v)),2.5);gl_FragColor=vec4(vec3(.6,.8,1.)*f*1.6+vec3(.3,.1,.05),f*o);}'
        )
      );
    const dp = new Float32Array(N * 3),
      dv = new Float32Array(N * 3),
      dc = new Float32Array(N * 3),
      dg = new T.BufferGeometry();
    dg.setAttribute('position', new T.BufferAttribute(dp, 3));
    dg.setAttribute('color', new T.BufferAttribute(dc, 3));
    const deb = new T.Points(
      dg,
      new T.PointsMaterial({
        size: .5,
        map: GT,
        vertexColors: true,
        blending: T.AdditiveBlending,
        transparent: true,
        depthWrite: false
      })
    );
    deb.frustumCulled = false;
    const neb = ['#ff4a2a', '#ff9a3a', '#7a5cff', '#3a8cff', '#ff3a8a', '#ffd070', '#4affd0'].map(c => {
      const s = SP(c, 1, 0);
      s.userData.k = .6 + rnd() * .7;
      s.userData.o = V(rnd() - .5, rnd() - .5, rnd() - .5).multiplyScalar(14);
      return s;
    });
    const rem = PK(
      new T.Mesh(new T.SphereGeometry(.14, 16, 12), new T.MeshBasicMaterial({ color: '#cfe6ff' })),
      [
        'Neutron star remnant',
        '~1.4 Suns in a ~20 km ball',
        'Protons and electrons are crushed into neutrons. It may spin as a pulsar; the Crab Nebula (supernova of 1054) hides one. Neutrinos carry away about 99% of the energy.'
      ],
      pick
    ),
      rg = SP('#9fd0ff', 2.2, .9);
    ex.add(shock, deb, rem, rg, ...neb);
    ex.visible = false;
    sc.add(star, glow, core, ex, stars(2500, 400));
    const reset = () => {
      ph = pt = pr = 0;
      star.visible = glow.visible = true;
      ex.visible = false;
      star.scale.setScalar(1);
      star.position.set(0, 0, 0);
      star.material.color.copy(c0);
      core.material.opacity = 0;
      setS('');
    },
      boom = () => {
        star.visible = glow.visible = false;
        ex.visible = true;
        flash('#fff', 1500);
        C.td = Math.max(C.td, 55);
        for (let i = 0; i < N; i++) {
          const d = V(rnd() - .5, rnd() - .5, rnd() - .5).normalize().multiplyScalar(3 + rnd() * 16),
            k = rnd() < .5 ? [1, .6, .3] : [.5, .7, 1];
          dv.set([d.x, d.y, d.z], i * 3);
          dp.set([0, 0, 0], i * 3);
          dc.set(k, i * 3);
        }
      };
    return {
      sc,
      pick,
      ui: [
        {
          l: 'TRIGGER SUPERNOVA',
          f: () => {
            if (!ph) {
              ph = 1;
              pt = 0;
            }
          }
        },
        { l: 'RESET STAR', f: reset }
      ],
      tick(dt, t) {
        if (ph === 0) {
          pr = Math.min(1, pr + dt / 24);
          star.scale.setScalar(1 + .35 * pr + .03 * pr * Math.sin(t * (2 + pr * 20)));
          star.material.color.lerpColors(c0, c1, pr);
          glow.scale.setScalar(10 + 9 * pr);
          if (pr > .95) star.position.set(rnd() - .5, rnd() - .5, rnd() - .5).multiplyScalar(.06);
          setS(`Core-collapse countdown: ${Math.round(pr*100)}%`);
          return;
        }
        pt += dt;
        if (ph === 1) {
          const q = Math.min(1, pt / .9);
          star.scale.setScalar(Math.max(.12, 1.35 * (1 - q * q)));
          core.material.opacity = q;
          core.scale.setScalar(2 + q * 8);
          setS('Iron core collapsing…');
          if (pt > .9) {
            ph = 2;
            pt = 0;
            boom();
          }
          return;
        }
        shock.scale.setScalar(2 + 70 * (1 - Math.exp(-pt / 5)));
        SU.o.value = Math.max(0, 1 - pt / 12);
        core.material.opacity = Math.max(0, 1 - pt / 1.5);
        core.scale.setScalar(12 + pt * 20);
        for (let i = 0; i < N * 3; i++) {
          dp[i] += dv[i] * dt;
          dv[i] *= 1 - .15 * dt;
        }
        dg.attributes.position.needsUpdate = true;
        deb.material.opacity = Math.max(.5, 1 - pt / 40);
        neb.forEach(s => {
          const g = 1 - Math.exp(-pt / 7);
          s.scale.setScalar((6 + 36 * g) * s.userData.k);
          s.position.copy(s.userData.o).multiplyScalar(.3 + g);
          s.material.opacity = Math.min(.45, pt / 6 * .45);
        });
        setS(pt < 6 ? 'Shockwave sweeping outward (thousands of km/s)' : 'Remnant: neutron star inside an expanding nebula');
      }
    };
  }

  /* 4. NEUTRON STAR / PULSAR: sizes and spin display scaled */
  function ns() {
    const sc = new T.Scene(),
      pick = [],
      rot = new T.Group(),
      mag = new T.Group(),
      BU = { t: { value: 0 }, i: { value: .6 } },
      q = new T.Quaternion(),
      bd = V(0, 1, 0),
      cd = V(0, 0, 0);
    let w = 6, n = 0, hi = 0, ls = '';
    const star = PK(
      new T.Mesh(new T.SphereGeometry(1, 40, 28), new T.MeshBasicMaterial({ color: '#cfe6ff' })),
      [
        'Neutron star',
        '~1.4 Suns in a ~20 km ball',
        'Density is around 4×10¹⁷ kg/m³, so a teaspoon would weigh billions of tons. It is the collapsed core of a massive star. Here 1 unit ≈ 12 km.'
      ],
      pick
    ),
      gl = SP('#7fb8ff', 9, .6),
      pp = [];
    [2.2, 3.2, 4.6].forEach(L => {
      for (let f = 0; f < 8; f++) {
        const ph = f / 8 * 2 * PI, t0 = Math.asin(1 / Math.sqrt(L));
        let pv = null;
        for (let i = 0; i <= 40; i++) {
          const th = t0 + (PI - 2 * t0) * i / 40,
            r = L * Math.sin(th)**2,
            c = [r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)];
          if (pv) pp.push(...pv, ...c);
          pv = c;
        }
      }
    });
    const lg = new T.BufferGeometry();
    lg.setAttribute('position', new T.Float32BufferAttribute(pp, 3));
    const lines = PK(
      new T.LineSegments(
        lg,
        new T.LineBasicMaterial({
          color: '#5aa8ff',
          transparent: true,
          opacity: .55,
          blending: T.AdditiveBlending,
          depthWrite: false
        })
      ),
      [
        'Magnetic field lines',
        'Dipole field, up to ~10¹² gauss',
        'Typical pulsars have 10⁸–10¹² gauss fields; magnetars reach ~10¹⁵. The magnetic axis is tilted from the spin axis, which is what makes the lighthouse effect.'
      ],
      pick
    );
    const bg = new T.CylinderGeometry(3, .2, 22, 32, 1, true).translate(0, 11.8, 0),
      bm = SM(
        BU,
        VU,
        'uniform float t,i;varying vec2 u;void main(){float f=pow(1.-u.y,1.2)*i*(.7+.3*sin(u.y*40.-t*10.));gl_FragColor=vec4(vec3(.5,.75,1.)*f,f*.7);}'
      ),
      b1 = new T.Mesh(bg, bm),
      b2 = new T.Mesh(bg, bm);
    b2.rotation.z = PI;
    const BI = [
      'Twin energy beams',
      'Radiation from the magnetic poles',
      'Beams sweep space like a lighthouse. We see a pulse each time one points at Earth. The Crab pulsar spins ~30 times per second; the fastest known (PSR J1748−2446ad) spins 716 times per second.'
    ];
    PK(b1, BI, pick);
    PK(b2, BI, pick);
    mag.add(lines, b1, b2);
    mag.rotation.z = .6;
    rot.add(mag);
    sc.add(rot, star, gl, stars(2500, 400));
    return {
      sc,
      pick,
      ui: [
        {
          r: [1, 20, .5],
          v: 6,
          l: 'Spin (slowed for display)',
          f: v => {
            w = v;
            return (v / (2 * PI)).toFixed(2) + ' Hz';
          }
        },
        { l: 'FIELD LINES', tg: 1, on: 1, f: o => lines.visible = o },
        { l: 'BEAMS', tg: 1, on: 1, f: o => b1.visible = b2.visible = o }
      ],
      tick(dt, t) {
        rot.rotation.y += w * dt;
        BU.t.value = t;
        mag.getWorldQuaternion(q);
        bd.set(0, 1, 0).applyQuaternion(q);
        cd.copy(cam.position).normalize();
        const f = Math.pow(Math.abs(bd.dot(cd)), 14);
        BU.i.value = .5 + f * 1.6;
        gl.material.opacity = .45 + f * .55;
        gl.scale.setScalar(9 + f * 9);
        if (f > .5 && !hi) {
          hi = 1;
          n++;
        } else if (f < .3) hi = 0;
        const s = `Pulses seen: ${n}`;
        if (s !== ls) {
          ls = s;
          setS(s);
        }
      }
    };
  }

  /* 5. ASTEROID IMPACT: visuals are artistic; energy numbers assume 20 km/s and 3000 kg/m³ */
  function ai() {
    const sc = new T.Scene(),
      pick = [],
      ex = new T.Group(),
      RP = 5,
      earth = mk('earth'),
      DM = [50, 200, 1000, 3000, 10000],
      ag = new T.IcosahedronGeometry(1, 2),
      A = [],
      N = 700,
      dp = new Float32Array(N * 3),
      dv = new Float32Array(N * 3),
      dg = new T.BufferGeometry(),
      ip = V(0, 0, 0),
      p0 = V(0, 0, 0),
      nn = V(0, 0, 0);
    KEEP.add(earth);
    let st = 0, tt = 0, ft = 0, lv = 3, sel = null;
    const pa = ag.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i),
        y = pa.getY(i),
        z = pa.getZ(i),
        s = 1 + .22 * Math.sin(x * 3.1 + y * 2.3) * Math.cos(z * 2.7 + x * 1.3) + .08 * Math.sin(y * 7 + z * 5);
      pa.setXYZ(i, x * s, y * s, z * s);
    }
    const pl = new T.Mesh(
      new T.SphereGeometry(RP, 64, 48),
      new T.MeshStandardMaterial({ map: earth, roughness: .9 })
    ),
      sd = new T.DirectionalLight(0xffffff, 2);
    sd.position.set(30, 14, 20);
    sc.add(
      pl,
      new T.Mesh(
        new T.SphereGeometry(RP * 1.06, 48, 36),
        new T.MeshBasicMaterial({
          color: 0x4a90ff,
          transparent: true,
          opacity: .14,
          side: T.BackSide,
          blending: T.AdditiveBlending,
          depthWrite: false
        })
      ),
      new T.AmbientLight(0x445577, .7),
      sd,
      stars(2500, 400),
      ex
    );
    const NM = [
      [
        'Bennu',
        'Carbonaceous near-Earth asteroid, about 490 m wide. NASA’s OSIRIS-REx returned a sample in 2023.'
      ],
      [
        'Apophis',
        'About 340 m wide. It will pass roughly 32,000 km from Earth’s surface on 13 April 2029, with no impact risk for at least a century.'
      ],
      [
        'Dimorphos',
        'Moonlet of asteroid Didymos. NASA’s DART hit it in 2022 and shortened its orbit by about 32 minutes.'
      ]
    ];
    for (let i = 0; i < 12; i++) {
      const m = new T.Mesh(
        ag,
        new T.MeshStandardMaterial({ color: '#8a7d70', roughness: 1, flatShading: true })
      ),
        sz = .3 + rnd() * .35,
        a = {
          m,
          r: 9 + rnd() * 7,
          a: rnd() * 6.28,
          s: (.05 + rnd() * .07) * (rnd() < .5 ? -1 : 1),
          y: (rnd() - .5) * 5
        };
      m.scale.set(sz, sz * (.7 + rnd() * .5), sz * (.8 + rnd() * .4));
      const nm = NM[i] || [
        'Near-Earth asteroid',
        'Artistic asteroid',
        'Rocky or metallic bodies left over from the Solar System’s formation. Select one, set a size, then launch it at Earth.'
      ];
      PK(m, [nm[0], 'Near-Earth asteroid', nm[1]], pick);
      m.userData.cb = () => sel = a;
      A.push(a);
      sc.add(m);
    }
    sel = A[0];
    dg.setAttribute('position', new T.BufferAttribute(dp, 3));
    const fl = SP('#ffe0a0', 1, 0),
      g2 = SP('#ff7a2a', 1, 0),
      pf = SP('#6a5a50', 1, 0, 1),
      ring = new T.Mesh(
        new T.RingGeometry(.9, 1, 64),
        new T.MeshBasicMaterial({
          color: '#ffb060',
          transparent: true,
          opacity: .9,
          blending: T.AdditiveBlending,
          side: T.DoubleSide,
          depthWrite: false
        })
      ),
      deb = new T.Points(
        dg,
        new T.PointsMaterial({
          color: '#ffb070',
          size: .18,
          map: GT,
          blending: T.AdditiveBlending,
          transparent: true,
          depthWrite: false
        })
      );
    deb.frustumCulled = false;
    ex.add(fl, g2, pf, ring, deb);
    ex.visible = false;
    const reset = () => {
      st = 0;
      ex.visible = false;
      A.forEach(a => {
        a.fly = 0;
        a.m.visible = true;
      });
      setS('');
    },
      launch = () => {
        if (st) return;
        reset();
        st = 1;
        tt = 0;
        nn.copy(cam.position).normalize().add(V(rnd() * .8 - .4, rnd() * .5 - .25, rnd() * .8 - .4)).normalize();
        ip.copy(nn).multiplyScalar(RP);
        p0.copy(nn).multiplyScalar(34).add(V(0, 1, 0).cross(nn).normalize().multiplyScalar(10));
        sel.fly = 1;
        sel.m.scale.setScalar(.25 + lv * .16);
      },
      hit = () => {
        flash('#ffd9a0', 900);
        ex.visible = true;
        sel.m.visible = false;
        ft = 0;
        const s = ip.clone().multiplyScalar(1.02);
        fl.position.copy(s);
        g2.position.copy(s);
        ring.position.copy(s);
        ring.lookAt(ip.clone().multiplyScalar(2));
        for (let i = 0; i < N; i++) {
          const d = V(rnd() - .5, rnd() - .5, rnd() - .5)
            .multiplyScalar(1.8)
            .add(nn)
            .normalize()
            .multiplyScalar((1.5 + rnd() * 4.5) * (.6 + lv * .25));
          dv.set([d.x, d.y, d.z], i * 3);
          dp.set([s.x, s.y, s.z], i * 3);
        }
      };
    return {
      sc,
      pick,
      ui: [
        { l: 'LAUNCH IMPACT', f: launch },
        { l: 'RESET', f: reset },
        {
          r: [1, 5, 1],
          v: 3,
          l: 'Impact intensity',
          f: v => {
            lv = v;
            const d = DM[v - 1], e = .5 * 3000 * PI / 6 * d**3 * 4e8 / 4.184e15;
            return `${d>=1000?d/1000+' km':d+' m'} asteroid ≈ ${e>=1e6?(e/1e6).toFixed(0)+' million':Math.round(e).toLocaleString()} Mt TNT`;
          }
        }
      ],
      tick(dt, t) {
        pl.rotation.y += dt * .03;
        A.forEach(a => {
          if (!a.fly) {
            a.a += a.s * dt;
            a.m.position.set(Math.cos(a.a) * a.r, a.y, Math.sin(a.a) * a.r);
          }
          a.m.rotation.x += dt * .3;
          a.m.rotation.y += dt * .2;
        });
        if (st === 1) {
          tt += dt / 3.4;
          sel.m.position.lerpVectors(p0, ip, Math.pow(Math.min(tt, 1), 1.8));
          setS('Asteroid inbound…');
          if (tt >= 1) {
            st = 2;
            hit();
          }
        }
        if (st === 2) {
          ft += dt;
          const k = 1 + lv * .6;
          fl.scale.setScalar((3 + lv * 2) * (1 + ft));
          fl.material.opacity = Math.max(0, 1 - ft / 1.2);
          g2.scale.setScalar(k * 2);
          g2.material.opacity = Math.max(0, .8 - ft / 14);
          ring.scale.setScalar(Math.min(3.5, .3 + ft * (1.2 + lv * .9)));
          ring.material.opacity = Math.max(0, .9 - ft / 7);
          pf.position.copy(ip).multiplyScalar(1 + ft * .03);
          pf.scale.setScalar(k * (1 + ft * .6));
          pf.material.opacity = Math.max(0, Math.min(.5, ft / 2) * (1 - ft / 14));
          for (let i = 0; i < N; i++) {
            const j = i * 3, r2 = dp[j]**2 + dp[j + 1]**2 + dp[j + 2]**2, r = Math.sqrt(r2);
            if (r < RP) {
              dv[j] = dv[j + 1] = dv[j + 2] = 0;
              dp[j] *= RP / r;
              dp[j + 1] *= RP / r;
              dp[j + 2] *= RP / r;
              continue;
            }
            const a = -60 * dt / (r2 * r);
            for (let c = 0; c < 3; c++) {
              dv[j + c] += dp[j + c] * a;
              dp[j + c] += dv[j + c] * dt;
            }
          }
          dg.attributes.position.needsUpdate = true;
          setS(ft < 14 ? 'Impact: shockwave, ejecta and fireball' : 'Aftermath');
        }
      }
    };
  }

  /* 6. DARK NEBULA: artistic composite. Infrared reveal ties to SPHEREx (0.75–5 µm) */
  function dn() {
    const sc = new T.Scene(),
      pick = [],
      G = new T.Group(),
      CS = [],
      PS = [],
      LG = [[V(-45, 20, 12), '#8a3cff'], [V(40, -18, -30), '#3c7cff'], [V(10, 34, 40), '#ff3a3a']].map(a => [
        a[0],
        new T.Color(a[1])
      ]),
      g3 = () => (rnd() + rnd() + rnd() - 1.5) * 1.6;
    let ir = 0, iv = 0, den = 1;
    const tx = [0, 1, 2].map(() => {
      const c = D.createElement('canvas');
      c.width = c.height = 128;
      const x = c.getContext('2d');
      for (let i = 0; i < 22; i++) {
        const px = 36 + rnd() * 56,
          py = 36 + rnd() * 56,
          r = 10 + rnd() * 26,
          g = x.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, 'rgba(255,255,255,.4)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 128, 128);
      }
      return new T.CanvasTexture(c);
    });
    const B = [
      [
        V(-28, 6, 0),
        [
          'Dark globule (Barnard 68-type)',
          'Dense cold cloud',
          'Barnard 68 is about 500 light-years away and roughly half a light-year wide. Its dust blocks visible light, but infrared passes through.'
        ]
      ],
      [
        V(24, -8, -10),
        [
          'Horsehead-type pillar (Barnard 33)',
          'Dark cloud against glowing gas',
          'The Horsehead Nebula in Orion, about 1,400 light-years away, is a dark cloud silhouetted against a bright emission nebula.'
        ]
      ],
      [
        V(2, 16, 16),
        [
          'Coalsack-type cloud',
          'Naked-eye dark nebula',
          'The Coalsack, about 600 light-years away in the southern sky, is the most prominent dark nebula visible to the naked eye.'
        ]
      ]
    ];
    B.forEach(([c, inf]) => {
      for (let i = 0; i < 55; i++) {
        const p = c.clone().add(V(g3() * 16, g3() * 11, g3() * 16)), col = new T.Color('#0b0713');
        LG.forEach(([lp, lc]) => col.lerp(lc, cl(1 - p.distanceTo(lp) / 55, 0, 1) * .4));
        const s = new T.Sprite(new T.SpriteMaterial({
          map: tx[i % 3],
          color: col,
          transparent: true,
          depthWrite: false,
          opacity: .34,
          rotation: rnd() * 6.28
        }));
        s.scale.set(26 + rnd() * 22, 26 + rnd() * 22, 1);
        s.position.copy(p);
        s.base = .34;
        CS.push(s);
        G.add(s);
      }
      const h = new T.Mesh(new T.SphereGeometry(5, 8, 6), new T.MeshBasicMaterial({ visible: false }));
      h.position.copy(c);
      G.add(h);
      PK(h, inf, pick);
      for (let i = 0; i < 24; i++) {
        const s = SP(['#ff4a2a', '#ff8a3a', '#ffd070'][i % 3], 3 + rnd() * 3, .9);
        s.position.copy(c.clone().add(V(g3() * 10, g3() * 7, g3() * 10)));
        s.b = s.scale.x;
        PS.push(s);
        G.add(s);
        PK(
          s,
          [
            'Embedded protostar',
            'A star being born',
            'Hidden from visible light by dust, it glows in infrared. This is exactly the kind of source NASA’s SPHEREx can detect.'
          ],
          pick
        );
      }
    });
    [
      ['#6a2cc8', 160, .35, V(-20, 10, -70)],
      ['#2c5cc8', 150, .3, V(40, -10, -80)],
      ['#c83c3c', 140, .22, V(0, 30, -75)]
    ].forEach(([c, s, o, p]) => {
      const e = SP(c, s, o);
      e.position.copy(p);
      G.add(e);
    });
    LG.forEach(([p, c]) => {
      const s = SP(c, 45, .28);
      s.position.copy(p);
      G.add(s);
    });
    const dp = new Float32Array(4500);
    for (let i = 0; i < 4500; i++) dp[i] = (rnd() - .5) * 140;
    const dg = new T.BufferGeometry();
    dg.setAttribute('position', new T.BufferAttribute(dp, 3));
    const dust = new T.Points(
      dg,
      new T.PointsMaterial({
        color: '#b8a0ff',
        size: .9,
        map: GT,
        blending: T.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: .5
      })
    ),
      fs = stars(3000, 500, 1.5);
    fs.renderOrder = -1;
    sc.add(fs, G, dust);
    setS('Visible light: dust hides the stars inside');
    return {
      sc,
      pick,
      ui: [
        {
          l: 'INFRARED REVEAL',
          tg: 1,
          f: o => {
            ir = o ? 1 : 0;
            setS(o ? 'Infrared: dust turns transparent, protostars appear' : 'Visible light: dust hides the stars inside');
          }
        },
        {
          r: [.1, .6, .05],
          v: .34,
          l: 'Cloud density',
          f: v => {
            den = v / .34;
            return v.toFixed(2);
          }
        }
      ],
      tick(dt, t) {
        iv += (ir - iv) * Math.min(1, .05 + dt * 3);
        G.rotation.y += dt * .006;
        dust.rotation.y += dt * .01;
        CS.forEach(s => s.material.opacity = s.base * den * (1 - .88 * iv));
        PS.forEach(s => s.scale.setScalar(s.b * (1 + iv * 1.2) * (1 + .08 * Math.sin(t * 2 + s.b * 9))));
      }
    };
  }

  const MODES = [
    {
      n: 'BLACK HOLES',
      g: 'SCIENCE-BASED · ARTISTIC RENDERING',
      c: [.6, .25, 22, 5, 90],
      b: bh,
      nt: 'Sizes in Schwarzschild radii (non-spinning). Lensing is a point-lens approximation, not full ray tracing. Colors are artistic.'
    },
    {
      n: 'WORMHOLES',
      g: 'ARTISTIC SIMULATION · THEORETICAL',
      c: [1.57, .1, 24, 2, 70, 55],
      b: wh,
      nt: 'Wormholes are mathematical solutions of general relativity. None has been observed, and the time-travel effect is purely illustrative.'
    },
    {
      n: 'SUPERNOVA',
      g: 'SCIENCE-BASED · TIME COMPRESSED',
      c: [.5, .3, 14, 5, 120],
      b: sn,
      nt: 'Based on core-collapse (Type II) supernovae. In reality collapse takes under a second and the remnant expands for thousands of years; here time is compressed.'
    },
    {
      n: 'NEUTRON STARS & PULSARS',
      g: 'SCIENCE-BASED · ARTISTIC SCALE',
      c: [.7, .35, 24, 6, 70],
      b: ns,
      nt: 'Spin is slowed for display. Beam width and field-line extent are exaggerated for visibility.'
    },
    {
      n: 'ASTEROID IMPACT',
      g: 'ARTISTIC SIMULATION · REAL ENERGY MATH',
      c: [.6, .3, 24, 9, 70],
      b: ai,
      nt: 'Visual effects are artistic. Energy = ½mv² for a stony body (3000 kg/m³) at 20 km/s. A ~10 km impactor is the Chicxulub class.'
    },
    {
      n: 'DARK NEBULA',
      g: 'ARTISTIC SIMULATION',
      c: [.2, .15, 110, 40, 200],
      b: dn,
      nt: 'Artistic composite, not to scale. Dark nebulae are cold (~10 K) gas and dust clouds that block visible light but become partly transparent in infrared.'
    }
  ];

  const vm = $('#vm');
  E('div', 'uxh', 'DEEP SPACE MODES', vm);
  MODES.forEach((m, i) => {
    const b = E('button', '', m.n, vm);
    b.dataset.u = i;
    b.onclick = () => enter(i);
  });
  const show = on => {
    [cv, ov, pn, bt, bb].forEach(e => e.hidden = !on);
    if (on) setTimeout(() => D.body.classList.add('uxon'), 50); else {
      D.body.classList.remove('uxon');
      fd.hidden = true;
    }
    window.__ux = on ? 1 : 0;
    $('#bar').hidden = on;
    $('#rp').hidden = on;
    $('#labels').style.visibility = on ? 'hidden' : '';
    $('#info').hidden = true;
    $('#vm').hidden = true;
    $('#tip').hidden = true;
  };
  const fit = () => {
    if (!R) return;
    R.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  };
  addEventListener('resize', fit);

  function enter(i) {
    if (busy) return;
    busy = 1;
    fd.hidden = false;
    fd.style.background = '#000';
    fd.style.transition = 'opacity .35s';
    fd.style.opacity = 1;
    setTimeout(
      () => {
        try {
          cancelAnimationFrame(raf);
          if (M) {
            free(M.sc);
            M = null;
          }
          if (!R) {
            R = new T.WebGLRenderer({ canvas: cv, antialias: true });
            R.setPixelRatio(Math.min(devicePixelRatio, 1.75));
          }
          const m = MODES[i];
          cur = i;
          paused = false;
          clock = 0;
          $('#uxpa').textContent = 'PAUSE';
          C.mn = m.c[3];
          C.mx = m.c[4];
          C.a = C.ta = m.c[0];
          C.e = C.te = m.c[1];
          C.td = m.c[2];
          C.d = m.c[2] * 2.4;
          cam.fov = m.c[5] || 50;
          cam.up.set(0, 1, 0);
          cam.updateProjectionMatrix();
          $('#uxh').textContent = m.n;
          $('#uxg').textContent = m.g;
          $('#uxn').textContent = m.nt;
          $('#uxi').innerHTML = '<p>Drag to rotate · scroll or pinch to zoom · click objects for details.</p>';
          setS('');
          M = m.b();
          ui(M.ui || []);
          vm.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.u == i));
          show(true);
          fit();
          last = performance.now();
          raf = requestAnimationFrame(frame);
        } catch (err) {
          console.error(err);
        }
        requestAnimationFrame(() => {
          fd.style.opacity = 0;
        });
        setTimeout(() => busy = 0, 400);
      },
      380
    );
  }

  function exit() {
    cancelAnimationFrame(raf);
    if (M) {
      free(M.sc);
      M = null;
    }
    cur = -1;
    show(false);
    vm.querySelectorAll('button').forEach(b => b.classList.remove('on'));
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    const rd = Math.min((t - last) / 1000, .1);
    last = t;
    const dt = paused ? 0 : rd;
    clock += dt;
    const k = 1 - Math.exp(-rd * 7);
    C.a += (C.ta - C.a) * k;
    C.e += (C.te - C.e) * k;
    C.d += (C.td - C.d) * k;
    if (!(M.cam && M.cam(rd, clock))) {
      cam.position.set(
        Math.cos(C.e) * Math.sin(C.a) * C.d,
        Math.sin(C.e) * C.d,
        Math.cos(C.e) * Math.cos(C.a) * C.d
      );
      cam.lookAt(0, 0, 0);
    }
    M.tick(dt, clock);
    R.render(M.sc, cam);
  }
  const camReset = () => {
    const c = MODES[cur].c;
    C.ta = c[0];
    C.te = c[1];
    C.td = c[2];
  };
  $('#uxpa').onclick = () => {
    paused = !paused;
    $('#uxpa').textContent = paused ? 'RESUME' : 'PAUSE';
  };
  $('#uxrc').onclick = camReset;
  $('#uxx').onclick = () => setView('atlas');
  $('#bre').addEventListener(
    'click',
    e => {
      if (M) {
        e.stopImmediatePropagation();
        camReset();
      }
    },
    true
  );
  const _sv = setView;
  setView = function (v) {
    if (M) exit();
    _sv(v);
  };

  /* input: rotate, zoom (wheel + pinch), select */
  const P = new Map();
  let mvd = 0, pd = 1;
  const pinch = () => {
    const a = [...P.values()];
    return a.length < 2 ? 1 : Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1;
  };
  cv.onpointerdown = e => {
    cv.setPointerCapture(e.pointerId);
    P.set(e.pointerId, [e.clientX, e.clientY]);
    mvd = 0;
    pd = pinch();
  };
  cv.onpointermove = e => {
    const p = P.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p[0], dy = e.clientY - p[1];
    p[0] = e.clientX;
    p[1] = e.clientY;
    mvd += Math.abs(dx) + Math.abs(dy);
    if (P.size === 2) {
      const n = pinch();
      C.td = cl(C.td * pd / n, C.mn, C.mx);
      pd = n;
    } else {
      C.ta -= dx * .006;
      C.te = cl(C.te + dy * .006, -1.45, 1.45);
    }
  };
  cv.onpointerup = cv.onpointercancel = e => {
    if (P.size === 1 && mvd < 6 && e.type === 'pointerup' && M) {
      mv.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1);
      rc.setFromCamera(mv, cam);
      const h = rc.intersectObjects(M.pick.filter(vis), false)[0];
      if (h) {
        info(h.object.userData.info);
        if (h.object.userData.cb) h.object.userData.cb();
      }
    }
    P.delete(e.pointerId);
  };
  cv.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      C.td = cl(C.td * (1 + e.deltaY * .0012), C.mn, C.mx);
    },
    { passive: false }
  );
})();
