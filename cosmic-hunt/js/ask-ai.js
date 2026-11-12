(() => {
  const D = document,
    $ = s => D.querySelector(s),
    esc = s =>
      String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const KB = [
    [
      /tycho/,
      'Tycho is a young crater on the Moon, about 85 km wide and roughly 108 million years old. Its bright rays spread across much of the near side.'
    ],
    [
      /planet x|find|win|hunt|how.*play|clue/,
      'Open the Exoplanet Atlas, turn on Infrared Vision, then click the glowing hidden sources. Each scan shows a spectrum peak. Planet X peaks at exactly 3.3 µm; the decoys peak elsewhere.'
    ],
    [
      /spherex|infrared|ir /,
      'SPHEREx is NASA’s infrared space telescope, launched in 2025. It maps the whole sky in 102 infrared colors (0.75 to 5 µm).'
    ],
    [
      /sagittarius|m87|black hole|event horizon|accretion/,
      'Black holes mode: Sagittarius A* is about 4.3 million Suns (imaged 2022); M87* is about 6.5 billion Suns (imaged 2019). The event horizon is the point of no return, and the glowing disk is hot gas spiraling in.'
    ],
    [
      /wormhole|time travel/,
      'Wormholes are theoretical tunnels through spacetime from general relativity. None has been observed, and keeping one open would need exotic matter. This mode is an artistic simulation.'
    ],
    [
      /supernova|explod/,
      'A supernova is the explosion of a massive star (over about 8 Suns) when its iron core collapses. It leaves a neutron star or black hole plus an expanding nebula, like the Crab Nebula (1054).'
    ],
    [
      /pulsar|neutron/,
      'A neutron star is the collapsed core of a massive star: about 1.4 Suns in a ~20 km ball. A pulsar spins and sweeps radio beams like a lighthouse. The Crab pulsar spins about 30 times per second.'
    ],
    [
      /asteroid|impact|chicxulub|dinosaur/,
      'A 10 km asteroid like the Chicxulub impactor releases tens of millions of megatons of energy. Use the intensity slider in Asteroid Impact mode to compare sizes.'
    ],
    [
      /dark nebula|black cloud|dust|barnard|horsehead|coalsack/,
      'Dark nebulae are cold (~10 K) clouds of gas and dust that block visible light. Infrared passes through, so telescopes like SPHEREx can see stars hiding inside.'
    ],
    [
      /iss|space station/,
      'The International Space Station orbits about 420 km up and circles Earth every ~93 minutes.'
    ],
    [
      /hubble/,
      'Hubble has imaged the universe from orbit, about 540 km up, since 1990.'
    ],
    [
      /satellite|gps|geostat/,
      'GPS satellites orbit about 20,200 km up (one lap in ~12 hours). Geostationary satellites sit 35,786 km up and stay above one spot on Earth.'
    ],
    [
      /milky way|galaxy|galaxies|andromeda/,
      'The Milky Way is a barred spiral about 100,000 light-years wide with a ~4 million Sun black hole at its center. Andromeda (M31) is 2.5 million light-years away and heading toward us.'
    ],
    [
      /moon/,
      'The Moon is about 384,400 km from Earth and 3,475 km wide. Here it is drawn much closer than in reality.'
    ],
    [
      /mars/,
      'Mars is 6,792 km wide with an average temperature of about −65 °C. It has two moons.'
    ],
    [
      /earth/,
      'Earth is 12,756 km wide and the only world we know with life. Open Earth and Satellites in the Views menu to see satellites orbit.'
    ],
    [
      /control|zoom|rotate|move|reset|pause/,
      'Drag to rotate, scroll or pinch to zoom, click objects for info. Use the round arrow button to reset the view and the Views button to switch between scenes and the six deep space modes.'
    ]
  ];

  function local(q) {
    q = q.toLowerCase();

    const d = DATA.find(p =>
      q.includes(p.name.toLowerCase()) || q.includes(p.id.replace(/-/g, ' '))
    );

    if (d && d.id !== 'planet-x') {
      const x = d.details;
      return `${d.name} is a ${d.type}. ${x.description} Distance: ${x.distance}. Mass: ${x.mass}. Radius: ${x.radius}. One year: ${x.orbitalPeriod}.`;
    }

    const k = KB.find(e => e[0].test(q));
    return k
      ? k[1]
      : 'I only know the topics in this game without an API key: the planets, Planet X, SPHEREx, the 6 deep space modes, Earth, satellites, Moon, Mars and galaxies. Paste an Anthropic API key below to ask me anything.';
  }

  const b = D.createElement('button');
  b.id = 'aib';
  b.className = 'hud';
  b.textContent = 'ASK AI';
  D.body.appendChild(b);

  const p = D.createElement('div');
  p.id = 'aip';
  p.className = 'hud';
  p.hidden = true;
  p.innerHTML =
    '<div id="ail"><div class="a">Hi! Ask me about planets, black holes, satellites or how to find Planet X.</div></div><div class="air"><input id="aiq" placeholder="Type your question…"><button id="aig">Ask</button></div><div class="air"><input id="aik" type="password" placeholder="Optional: Anthropic API key (kept only in this browser)"><button id="aiks">Save</button></div>';
  D.body.appendChild(p);

  ['keydown', 'keyup', 'keypress'].forEach(k =>
    p.addEventListener(k, e => e.stopPropagation())
  );

  let key = '',
    H = [];

  try {
    key = localStorage.getItem('ai_key') || '';
  } catch (e) {}

  $('#aik').value = key;

  const add = (c, t) => {
    const l = $('#ail'),
      d = D.createElement('div');

    d.className = c;
    d.innerHTML = esc(t);
    l.appendChild(d);
    l.scrollTop = l.scrollHeight;
    return d;
  };

  async function ask() {
    const i = $('#aiq'),
      q = i.value.trim();

    if (!q) return;

    i.value = '';
    add('u', q);

    if (!key) {
      add('a', local(q));
      return;
    }

    const w = add('a', '…');
    H.push({ role: 'user', content: q });

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-5-5',
          max_tokens: 400,
          system:
            'You are a friendly space guide inside the game Cosmic Hunt: Find Planet X (NASA SPHEREx theme). Answer briefly and accurately for students. Say when something is uncertain.',
          messages: H.slice(-8)
        })
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.error && j.error.message || r.status);

      const t = j.content.map(c => c.text || '').join('');
      H.push({ role: 'assistant', content: t });
      w.textContent = t;
    } catch (e) {
      H.pop();
      w.textContent =
        'AI error: ' + e.message + '. Using built-in answer: ' + local(q);
    }
  }

  b.onclick = () => p.hidden = !p.hidden;
  $('#aig').onclick = ask;
  $('#aiq').onkeydown = e => {
    if (e.key === 'Enter') ask();
  };

  $('#aiks').onclick = () => {
    key = $('#aik').value.trim();

    try {
      localStorage.setItem('ai_key', key);
    } catch (e) {}

    add('a', key
      ? 'API key saved. Now I answer any question.'
      : 'Key removed. Using built-in answers.');
  };
})();