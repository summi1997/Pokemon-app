const LIMIT = 20;
let offset = 0;

const grid = document.getElementById('grid');
const status = document.getElementById('status');
const pageInfo = document.getElementById('pageInfo');

// 🌀 Spinner control
function showSpinner() {
  document.getElementById('spinner').style.display = 'block';
}

function hideSpinner() {
  document.getElementById('spinner').style.display = 'none';
}

// 📦 Fetch Pokémon list
async function fetchList(offset = 0) {
  showSpinner();
  status.textContent = 'Loading list...';
  grid.innerHTML = '';

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${LIMIT}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to load list');

    const json = await res.json();

    const detailPromises = json.results.map(r =>
      fetch(r.url)
        .then(resp => (resp.ok ? resp.json() : null))
        .catch(() => null)
    );

    const details = (await Promise.all(detailPromises)).filter(Boolean);
    renderGrid(details);
    pageInfo.textContent = `Page ${Math.floor(offset / LIMIT) + 1}`;
    status.textContent = '';
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
  } finally {
    hideSpinner();
  }
}

// 🎨 Render Pokémon cards
function renderGrid(items) {
  if (!items.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#777">No Pokémon to show</div>';
    return;
  }

  grid.innerHTML = items
    .map(
      p => `
    <div class="card" data-name="${p.name}">
      <h3>${p.name.toUpperCase()}</h3>
      <img class="sprite" src="${p.sprites.front_default || ''}" alt="${p.name}">
      <div class="meta">Type: ${p.types.map(t => t.type.name).join(', ')}</div>
      <button data-name="${p.name}" class="detailBtn">Details</button>
    </div>
  `
    )
    .join('');

  document.querySelectorAll('.detailBtn').forEach(b => {
    b.onclick = e => openDetails(e.currentTarget.dataset.name);
  });
}

// 🔍 Show Pokémon details in modal
async function openDetails(name) {
  showSpinner();
  const modalRoot = document.getElementById('modalRoot');
  modalRoot.innerHTML = `
    <div class="modal"><div class="modal-inner">Loading...</div></div>
  `;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!res.ok) throw new Error('Not found');

    const p = await res.json();

    modalRoot.innerHTML = `
      <div class="modal" onclick="document.getElementById('modalRoot').innerHTML=''">
        <div class="modal-inner" onclick="event.stopPropagation()">
          <h2 style="margin-top:0">${p.name.toUpperCase()} <small style="font-size:12px;color:#666">#${p.id}</small></h2>
          <div style="display:flex;gap:12px;align-items:center">
            <img src="${p.sprites.front_default}" alt="${p.name}" style="width:120px;height:120px;image-rendering:pixelated">
            <div style="flex:1">
              <p><strong>Types:</strong> ${p.types.map(t => t.type.name).join(', ')}</p>
              <p><strong>Height:</strong> ${p.height} | <strong>Weight:</strong> ${p.weight}</p>
              <p><strong>Abilities:</strong> ${p.abilities.map(a => a.ability.name).join(', ')}</p>
            </div>
          </div>
          <h4>Stats</h4>
          <ul class="stats">
            ${p.stats.map(s => `<li>${s.stat.name}: ${s.base_stat}</li>`).join('')}
          </ul>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
            <button onclick="document.getElementById('modalRoot').innerHTML=''" class="ghost">Close</button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    modalRoot.innerHTML = `
      <div class="modal">
        <div class="modal-inner">
          Error: ${err.message}<br>
          <button onclick="document.getElementById('modalRoot').innerHTML=''">Close</button>
        </div>
      </div>
    `;
  } finally {
    hideSpinner();
  }
}

// 🔎 Search Pokémon
document.getElementById('btnSearch').onclick = async () => {
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (!q) {
    fetchList(offset);
    return;
  }

  showSpinner();
  status.textContent = 'Searching...';
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('Pokémon not found');
    const p = await res.json();
    renderGrid([p]);
    status.textContent = '';
    pageInfo.textContent = 'Search results';
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
    grid.innerHTML = '';
    pageInfo.textContent = '';
  } finally {
    hideSpinner();
  }
};

// 🔄 Reset search
document.getElementById('btnReset').onclick = () => {
  document.getElementById('search').value = '';
  offset = 0;
  fetchList(offset);
  pageInfo.textContent = '';
};

// ⏭️ Pagination
document.getElementById('next').onclick = () => {
  offset += LIMIT;
  fetchList(offset);
};

document.getElementById('prev').onclick = () => {
  offset = Math.max(0, offset - LIMIT);
  fetchList(offset);
};

document.getElementById('btnRefresh').onclick = () => fetchList(offset);

// 🚀 Initial load
fetchList(0);