/* === AI Gallery Frontend === */

(function () {
  'use strict';

  // State
  let currentPage = 1;
  let totalPages = 1;
  let activeTag = '';
  let sidebarOpen = false;
  let currentImageId = null;
  let searchTimeout = null;
  let userRole = 'guest';

  // DOM refs
  const grid = document.getElementById('galleryGrid');
  const emptyState = document.getElementById('emptyState');
  const pagination = document.getElementById('pagination');
  const pageInfo = document.getElementById('pageInfo');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const modal = document.getElementById('detailModal');
  const statsDisplay = document.getElementById('statsDisplay');

  // Filter refs
  const sortSelect = document.getElementById('sortSelect');
  const brandFilter = document.getElementById('brandFilter');
  const modelFilter = document.getElementById('modelFilter');
  const scoreMin = document.getElementById('scoreMin');
  const scoreMax = document.getElementById('scoreMax');
  const scoreRangeLabel = document.getElementById('scoreRangeLabel');
  const tagsList = document.getElementById('tagsList');
  const searchInput = document.getElementById('searchInput');

  // --- Init ---
  loadRole();
  loadFilters();
  loadImages();
  loadStats();

  // --- Event Listeners ---
  document.getElementById('toggleSidebar').addEventListener('click', () => {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle('open', sidebarOpen);
    mainContent.style.marginLeft = sidebarOpen ? 'var(--sidebar-width)' : '0';
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/';
  });

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.querySelector('.modal-overlay').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  sortSelect.addEventListener('change', () => { currentPage = 1; loadImages(); });
  brandFilter.addEventListener('change', () => { currentPage = 1; loadImages(); });
  modelFilter.addEventListener('change', () => { currentPage = 1; loadImages(); });

  scoreMin.addEventListener('input', updateScoreLabel);
  scoreMax.addEventListener('input', updateScoreLabel);
  scoreMin.addEventListener('change', () => { currentPage = 1; loadImages(); });
  scoreMax.addEventListener('change', () => { currentPage = 1; loadImages(); });

  searchInput && searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 1;
      loadImages();
    }, 300);
  });

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; loadImages(); }
  });
  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; loadImages(); }
  });

  document.getElementById('resetFilters').addEventListener('click', () => {
    sortSelect.value = 'newest';
    brandFilter.value = '';
    modelFilter.value = '';
    scoreMin.value = 0;
    scoreMax.value = 100;
    activeTag = '';
    if (searchInput) searchInput.value = '';
    updateScoreLabel();
    updateTagChips();
    currentPage = 1;
    loadImages();
  });

  document.getElementById('favBtn').addEventListener('click', async () => {
    if (!currentImageId) return;
    const res = await fetch(`/api/images/${currentImageId}/favorite`, { method: 'PATCH' });
    if (res.ok) {
      const data = await res.json();
      document.getElementById('favBtn').classList.toggle('active', !!data.favorite);
      loadImages();
    }
  });

  document.getElementById('scoreSlider').addEventListener('input', () => {
    const val = document.getElementById('scoreSlider').value;
    const el = document.getElementById('scoreValue');
    el.textContent = val;
    el.className = `score-value ${scoreClass(Number(val))}`;
  });

  document.getElementById('scoreSave').addEventListener('click', async () => {
    if (!currentImageId) return;
    const score = Number(document.getElementById('scoreSlider').value);
    const res = await fetch(`/api/images/${currentImageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score })
    });
    if (res.ok) {
      showToast('Bewertung gespeichert', scoreClass(score));
      loadImages();
      loadStats();
    }
  });

  document.getElementById('deleteBtn').addEventListener('click', async () => {
    if (!currentImageId) return;
    if (!confirm('Dieses Bild wirklich löschen?')) return;

    const res = await fetch(`/api/images/${currentImageId}`, { method: 'DELETE' });
    if (res.ok) {
      closeModal();
      loadImages();
      loadStats();
    }
  });

  // --- Functions ---

  function updateScoreLabel() {
    scoreRangeLabel.textContent = `${scoreMin.value} — ${scoreMax.value}`;
  }

  function buildQueryString() {
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('sort', sortSelect.value);
    params.set('limit', '50');

    if (brandFilter.value) params.set('brand', brandFilter.value);
    if (modelFilter.value) params.set('model', modelFilter.value);
    if (Number(scoreMin.value) > 0) params.set('score_min', scoreMin.value);
    if (Number(scoreMax.value) < 100) params.set('score_max', scoreMax.value);
    if (activeTag) params.set('tags', activeTag);
    if (searchInput && searchInput.value.trim()) params.set('search', searchInput.value.trim());

    return params.toString();
  }

  async function loadRole() {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      userRole = data.role;
      document.body.classList.toggle('is-guest', userRole === 'guest');
      // Show guest password to admin
      if (userRole === 'admin') {
        const gpRes = await fetch('/api/guest-password');
        const gpData = await gpRes.json();
        const el = document.getElementById('guestPwDisplay');
        if (el) el.textContent = `Gast: ${gpData.password}`;
      }
    } catch (e) {}
  }

  async function loadImages() {
    try {
      const res = await fetch(`/api/images?${buildQueryString()}`);
      const data = await res.json();

      totalPages = data.pages || 1;
      renderGrid(data.images);
      renderPagination(data.total);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
    }
  }

  function renderGrid(images) {
    if (!images || images.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'flex';
      pagination.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = images.map(img => `
      <div class="image-card${img.hidden ? ' is-hidden' : ''}" data-id="${img.id}">
        <div class="card-image-wrap">
          <img src="${img.thumb_path || img.image_path}" alt="${escapeHtml(img.prompt).substring(0, 60)}" loading="lazy">
          <div class="card-badges">
            ${img.brand ? `<span class="brand-badge">${escapeHtml(img.brand)}</span>` : '<span></span>'}
            <div class="card-badges-right">
              ${userRole === 'admin' ? `<button class="btn-hide${img.hidden ? ' active' : ''}" data-hide-id="${img.id}" title="Ausblenden">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>` : ''}
              ${userRole === 'admin' ? `<button class="btn-fav${img.favorite ? ' active' : ''}" data-fav-id="${img.id}" title="Favorit">&#9733;</button>` : ''}
            </div>
          </div>
        </div>
        <div class="card-body">
          <p class="card-prompt">${escapeHtml(img.prompt) || 'Kein Prompt'}</p>
        </div>
      </div>
    `).join('');

    // Hide toggle on card
    grid.querySelectorAll('.btn-hide').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.hideId);
        const res = await fetch(`/api/images/${id}/hidden`, { method: 'PATCH' });
        if (res.ok) loadImages();
      });
    });

    // Favorite toggle on card
    grid.querySelectorAll('.btn-fav').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.favId);
        const res = await fetch(`/api/images/${id}/favorite`, { method: 'PATCH' });
        if (res.ok) loadImages();
      });
    });

    // Click handler
    grid.querySelectorAll('.image-card').forEach(card => {
      card.addEventListener('click', () => {
        openDetail(Number(card.dataset.id));
      });
    });
  }

  function renderPagination(total) {
    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }
    pagination.style.display = 'flex';
    pageInfo.textContent = `Seite ${currentPage} von ${totalPages} (${total} Bilder)`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
  }

  async function openDetail(id) {
    try {
      const res = await fetch(`/api/images/${id}`);
      if (!res.ok) return;
      const img = await res.json();
      currentImageId = img.id;

      document.getElementById('detailImage').src = img.image_path;
      document.getElementById('detailBrand').textContent = img.brand || '—';
      document.getElementById('detailBrand').style.display = img.brand ? 'inline-block' : 'none';

      // Score slider
      const slider = document.getElementById('scoreSlider');
      const valueEl = document.getElementById('scoreValue');
      slider.value = img.score || 0;
      valueEl.textContent = img.score || 0;
      valueEl.className = `score-value ${scoreClass(img.score || 0)}`;

      const versionEl = document.getElementById('detailVersion');
      if (img.version) {
        versionEl.textContent = img.version;
        versionEl.style.display = 'inline-block';
      } else {
        versionEl.style.display = 'none';
      }

      document.getElementById('favBtn').classList.toggle('active', !!img.favorite);

      document.getElementById('detailPrompt').textContent = img.prompt || '—';
      document.getElementById('detailModel').textContent = img.model || '—';
      document.getElementById('detailNotes').textContent = img.notes || '—';
      document.getElementById('detailDate').textContent = formatDate(img.created_at);

      // Tags
      const tagsContainer = document.getElementById('detailTags');
      if (img.tags) {
        tagsContainer.innerHTML = img.tags.split(',').map(t => t.trim()).filter(Boolean)
          .map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('');
      } else {
        tagsContainer.innerHTML = '<span style="color:var(--text-dim)">—</span>';
      }

      // Genealogie
      const genSection = document.getElementById('genealogySection');
      const genContent = document.getElementById('genealogyContent');
      genContent.innerHTML = '';

      let hasGenealogy = false;

      if (img.parent) {
        hasGenealogy = true;
        genContent.innerHTML += `
          <div class="genealogy-label">Vorgänger</div>
          <div class="genealogy-item" data-id="${img.parent.id}">
            <img src="${img.parent.image_path}" alt="">
            <span>#${img.parent.id} ${img.parent.version || ''} — Score: ${img.parent.score || '—'}</span>
          </div>
        `;
      }

      if (img.children && img.children.length > 0) {
        hasGenealogy = true;
        genContent.innerHTML += `<div class="genealogy-label">Iterationen</div>`;
        img.children.forEach(child => {
          genContent.innerHTML += `
            <div class="genealogy-item" data-id="${child.id}">
              <img src="${child.image_path}" alt="">
              <span>#${child.id} ${child.version || ''} — Score: ${child.score || '—'}</span>
            </div>
          `;
        });
      }

      genSection.style.display = hasGenealogy ? 'block' : 'none';

      // Genealogy click handler
      genContent.querySelectorAll('.genealogy-item').forEach(item => {
        item.addEventListener('click', () => {
          openDetail(Number(item.dataset.id));
        });
      });

      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.error('Fehler beim Laden der Details:', err);
    }
  }

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentImageId = null;
  }

  async function loadFilters() {
    try {
      const res = await fetch('/api/filters');
      const data = await res.json();

      // Brands
      brandFilter.innerHTML = '<option value="">Alle</option>';
      data.brands.forEach(b => {
        brandFilter.innerHTML += `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`;
      });

      // Models
      modelFilter.innerHTML = '<option value="">Alle</option>';
      data.models.forEach(m => {
        modelFilter.innerHTML += `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`;
      });

      // Tags
      renderTagChips(data.tags);
    } catch (err) {
      console.error('Fehler beim Laden der Filter:', err);
    }
  }

  function renderTagChips(tags) {
    tagsList.innerHTML = '';
    if (!tags || tags.length === 0) {
      tagsList.innerHTML = '<span style="color:var(--text-dim);font-size:0.8rem;">Keine Tags vorhanden</span>';
      return;
    }
    tags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = `tag-chip${activeTag === tag ? ' active' : ''}`;
      chip.textContent = tag;
      chip.addEventListener('click', () => {
        activeTag = activeTag === tag ? '' : tag;
        updateTagChips();
        currentPage = 1;
        loadImages();
      });
      tagsList.appendChild(chip);
    });
  }

  function updateTagChips() {
    tagsList.querySelectorAll('.tag-chip').forEach(chip => {
      chip.classList.toggle('active', chip.textContent === activeTag);
    });
  }

  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      statsDisplay.textContent = `${data.total} Bilder | \u00D8 ${data.avgScore}`;
    } catch (err) {
      statsDisplay.textContent = '';
    }
  }

  // --- Helpers ---
  function scoreClass(score) {
    if (score > 70) return 'score-green';
    if (score > 40) return 'score-yellow';
    return 'score-red';
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(text, colorClass) {
    const toast = document.createElement('div');
    toast.className = `toast ${colorClass || ''}`;
    toast.textContent = text;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + 'Z');
      return d.toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

})();
