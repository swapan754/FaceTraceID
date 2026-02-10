const apiBase = localStorage.getItem('facetrace_api') || 'http://localhost:8000';
const scanForm = document.getElementById('scanForm');
const verifyForm = document.getElementById('verifyForm');
const verifyResult = document.getElementById('verifyResult');
const resultsNode = document.getElementById('results');
const filterNode = document.getElementById('platformFilter');
const historyBtn = document.getElementById('loadHistory');
const historyNode = document.getElementById('history');

let latestMatches = [];

function renderMatches() {
  const filter = filterNode.value;
  const filtered = filter === 'all' ? latestMatches : latestMatches.filter((m) => m.platform === filter);

  resultsNode.innerHTML = '';
  if (!filtered.length) {
    resultsNode.innerHTML = '<p class="muted">No matches yet.</p>';
    return;
  }

  for (const m of filtered) {
    const card = document.createElement('article');
    card.className = 'match-card';
    card.innerHTML = `
      <div class="match-head">
        <img class="logo" src="${m.platform_logo}" alt="${m.platform}" />
        <strong>${m.platform}</strong>
      </div>
      <img class="profile-preview" src="${m.profile_image}" alt="${m.username}" />
      <p><strong>@${m.username}</strong></p>
      <p>Match confidence: <strong>${m.confidence}%</strong></p>
      <a href="${m.profile_url}" target="_blank" rel="noreferrer">View Profile</a>
    `;
    resultsNode.appendChild(card);
  }
}

function rebuildFilter(matches) {
  const platforms = [...new Set(matches.map((m) => m.platform))];
  filterNode.innerHTML = '<option value="all">All</option>';
  for (const p of platforms) {
    const option = document.createElement('option');
    option.value = p;
    option.textContent = p;
    filterNode.appendChild(option);
  }
}

scanForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(scanForm);
  const userId = formData.get('user_id') || 'guest';

  try {
    const res = await fetch(`${apiBase}/api/v1/scan`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Scan failed');

    localStorage.setItem('facetrace_user', userId);
    latestMatches = data.matches;
    rebuildFilter(latestMatches);
    renderMatches();
  } catch (err) {
    alert(err.message);
  }
});

verifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(verifyForm);
  const userId = formData.get('user_id') || 'guest';

  try {
    const res = await fetch(`${apiBase}/api/v1/verify`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Verification failed');

    localStorage.setItem('facetrace_user', userId);
    verifyResult.innerHTML = `<p><strong>${data.result}</strong> (${data.confidence}%)</p>`;
  } catch (err) {
    alert(err.message);
  }
});

filterNode.addEventListener('change', renderMatches);

historyBtn.addEventListener('click', async () => {
  const userId = localStorage.getItem('facetrace_user') || 'guest';
  const res = await fetch(`${apiBase}/api/v1/history/${userId}`);
  const items = await res.json();

  historyNode.innerHTML = '';
  if (!items.length) {
    historyNode.innerHTML = '<li class="muted">No history for this user.</li>';
    return;
  }
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = `${item.action.toUpperCase()}: ${item.summary}`;
    historyNode.appendChild(li);
  }
});

renderMatches();
