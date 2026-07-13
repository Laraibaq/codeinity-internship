
const BASE = 'https://jsonplaceholder.typicode.com';
const PER_PAGE = 20;

const META = {
    posts: { label: 'Posts', desc: 'All posts from JSONPlaceholder', icon: 'fa-file-lines', color: '#7c6ef5', chipClass: 'chip-purple' },
    comments: { label: 'Comments', desc: 'User comments on posts', icon: 'fa-comments', color: '#06b6d4', chipClass: 'chip-cyan' },
    albums: { label: 'Albums', desc: 'Photo album collections', icon: 'fa-layer-group', color: '#ec4899', chipClass: 'chip-pink' },
    photos: { label: 'Photos', desc: 'Photos from all albums', icon: 'fa-image', color: '#3b82f6', chipClass: 'chip-blue' },
    todos: { label: 'Todos', desc: 'Todo items with completion status', icon: 'fa-list-check', color: '#10b981', chipClass: 'chip-green' },
    users: { label: 'Users', desc: 'Registered user profiles', icon: 'fa-users', color: '#8b5cf6', chipClass: 'chip-violet' },
};

const state = {
    current: null,
    data: {},
    filtered: [],
    page: 1,
};

const $ = id => document.getElementById(id);
const homeView = $('homeView');
const dataView = $('dataView');
const cardCont = $('cardContainer');
const searchInput = $('searchInput');
const noResults = $('noResults');
const pagination = $('pagination');
const dataHeader = $('dataHeader');
const bcCurrent = $('bcCurrent');

async function fetchResource(key) {
    if (state.data[key]) return state.data[key];
    const res = await fetch(`${BASE}/${key}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.data[key] = data;
    return data;
}

function skPost() {
    return `<div class="skel">
        <div class="sk sk-h sk-sm"></div>
        <div class="sk sk-h sk-lg"></div>
        <div class="sk sk-p sk-md"></div>
        <div class="sk sk-p sk-lg"></div>
        <div class="sk sk-p sk-sm"></div>
    </div>`;
}

function skPhoto() {
    return `<div class="skel" style="padding:0; overflow:hidden;">
        <div class="sk sk-sq"></div>
        <div style="padding:14px; display:flex; flex-direction:column; gap:8px;">
            <div class="sk sk-h sk-lg"></div>
            <div class="sk sk-p sk-sm"></div>
        </div>
    </div>`;
}

function showSkeletons(resource) {
    const fn = resource === 'photos' ? skPhoto : skPost;
    cardCont.innerHTML = Array.from({ length: PER_PAGE }, fn).join('');
}

function renderPosts(items) {
    return items.map(p => `
        <article class="dcard dc-post">
            <div class="dcard-strip"></div>
            <span class="dc-id-badge">#${p.id}</span>
            <h3 class="dc-title">${p.title}</h3>
            <p class="dc-body">${p.body}</p>
            <div class="dc-footer">
                <i class="fa-solid fa-user"></i> User ${p.userId}
                &nbsp;·&nbsp;
                <i class="fa-solid fa-hashtag"></i> Post ${p.id}
            </div>
        </article>`).join('');
}

function renderComments(items) {
    return items.map(c => `
        <article class="dcard dc-comment">
            <div class="dcard-strip"></div>
            <div class="dc-email"><i class="fa-solid fa-envelope"></i> ${c.email}</div>
            <h3 class="dc-comment-name">${c.name}</h3>
            <p class="dc-quote">${c.body}</p>
            <div class="dc-footer" style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(0,0,0,0.06);">
                <i class="fa-solid fa-link"></i> Post #${c.postId} &nbsp;·&nbsp; Comment #${c.id}
            </div>
        </article>`).join('');
}

const albumEmoji = ['🎨', '📸', '🖼️', '🌅', '🎭', '🌄', '🏙️', '🌿', '🎞️', '🌌'];

function renderAlbums(items) {
    return items.map(a => `
        <article class="dcard dc-album">
            <div class="dcard-strip"></div>
            <span class="dc-album-icon">${albumEmoji[a.id % albumEmoji.length]}</span>
            <span class="dc-id-badge">#${a.id}</span>
            <h3 class="dc-title">${a.title}</h3>
            <div class="dc-footer" style="margin-top:10px; border-top:1px solid rgba(0,0,0,0.06); padding-top:10px;">
                <i class="fa-solid fa-user"></i> User ${a.userId}
                &nbsp;·&nbsp;
                <i class="fa-solid fa-layer-group"></i> Album #${a.id}
            </div>
        </article>`).join('');
}

function renderPhotos(items) {
    return items.map(p => `
        <article class="dcard dc-photo">
            <div class="dcard-strip"></div>
            <div class="dc-photo-img-wrap">
                <img src="${p.thumbnailUrl}" alt="${p.title}" loading="lazy"
                     onerror="this.parentNode.innerHTML='<div style=\'display:flex;align-items:center;justify-content:center;height:100%;font-size:2rem;color:#cbd5e1\'>📷</div>'">
            </div>
            <div class="dc-photo-body">
                <p class="dc-photo-title">${p.title}</p>
                <div class="dc-footer" style="border-top:none; padding-top:0; margin:0;">
                    <i class="fa-solid fa-layer-group"></i> Album ${p.albumId}
                    &nbsp;·&nbsp; #${p.id}
                </div>
            </div>
        </article>`).join('');
}

function renderTodos(items) {
    return items.map(t => `
        <article class="dcard dc-todo">
            <div class="dcard-strip"></div>
            <div class="dc-checkbox ${t.completed ? 'done' : 'pending'}">
                ${t.completed ? '<i class="fa-solid fa-check"></i>' : ''}
            </div>
            <div class="dc-todo-text ${t.completed ? 'done' : ''}">${t.title}</div>
            <div class="dc-todo-meta">
                <span class="dc-badge ${t.completed ? 'done' : 'pending'}">
                    ${t.completed ? 'Done' : 'Pending'}
                </span>
                <span style="font-size:0.7rem;color:#8b93b5;">#${t.id}</span>
            </div>
        </article>`).join('');
}

function renderUsers(items) {
    return items.map(u => {
        const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        return `
        <article class="dcard dc-user">
            <div class="dcard-strip"></div>
            <div class="dc-user-top">
                <div class="dc-avatar">${initials}</div>
                <div>
                    <div class="dc-user-name">${u.name}</div>
                    <div class="dc-user-handle">@${u.username}</div>
                </div>
            </div>
            <div class="dc-user-rows">
                <div class="dc-user-row"><i class="fa-solid fa-envelope"></i> ${u.email}</div>
                <div class="dc-user-row"><i class="fa-solid fa-phone"></i> ${u.phone}</div>
                <div class="dc-user-row"><i class="fa-solid fa-globe"></i> ${u.website}</div>
                <div class="dc-user-row"><i class="fa-solid fa-location-dot"></i> ${u.address.city}, ${u.address.street}</div>
                <div class="dc-user-row"><i class="fa-solid fa-building"></i> ${u.company.name}</div>
            </div>
        </article>`;
    }).join('');
}

const renderers = {
    posts: renderPosts, comments: renderComments, albums: renderAlbums,
    photos: renderPhotos, todos: renderTodos, users: renderUsers
};

function buildDataHeader(key, total, filtered) {
    const m = META[key];
    const stats = [{ val: total.toLocaleString(), lbl: 'Total' }, { val: filtered.toLocaleString(), lbl: 'Showing' }];

    if (key === 'todos') {
        const done = state.data.todos.filter(t => t.completed).length;
        const pending = total - done;
        stats.push({ val: done, lbl: 'Done' });
        stats.push({ val: pending, lbl: 'Pending' });
    }

    dataHeader.innerHTML = `
        <div class="dh-icon ${m.chipClass}" style="font-size:1.3rem;">
            <i class="fa-solid ${m.icon}"></i>
        </div>
        <div class="dh-info">
            <div class="dh-title">${m.label}</div>
            <div class="dh-sub">${m.desc}</div>
        </div>
        <div class="dh-stats">
            ${stats.map(s => `
                <div class="dh-stat">
                    <div class="dh-stat-val">${s.val}</div>
                    <div class="dh-stat-lbl">${s.lbl}</div>
                </div>`).join('')}
        </div>`;
}

function buildPagination(total) {
    const totalPages = Math.ceil(total / PER_PAGE);
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }

    const p = state.page;
    const s = (p - 1) * PER_PAGE + 1;
    const e = Math.min(p * PER_PAGE, total);

    const pages = new Set([1, totalPages]);
    for (let i = Math.max(1, p - 2); i <= Math.min(totalPages, p + 2); i++) pages.add(i);
    const sorted = [...pages].sort((a, b) => a - b);

    const btns = [];
    let last = null;
    for (const pg of sorted) {
        if (last !== null && pg - last > 1) btns.push('…');
        btns.push(pg);
        last = pg;
    }

    pagination.innerHTML = `
        <div class="pag-info">Showing <strong>${s}–${e}</strong> of <strong>${total.toLocaleString()}</strong></div>
        <div class="pag-btns">
            <button class="pag-btn" onclick="goPage(${p - 1})" ${p === 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            ${btns.map(pg => pg === '…'
        ? `<button class="pag-btn" disabled>…</button>`
        : `<button class="pag-btn ${pg === p ? 'active' : ''}" onclick="goPage(${pg})">${pg}</button>`
    ).join('')}
            <button class="pag-btn" onclick="goPage(${p + 1})" ${p === totalPages ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>`;
}

function goPage(page) {
    const total = Math.ceil(state.filtered.length / PER_PAGE);
    if (page < 1 || page > total) return;
    state.page = page;
    displayPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function displayPage() {
    const { filtered, page, current } = state;

    if (!filtered.length) {
        cardCont.innerHTML = '';
        noResults.classList.remove('hidden');
        pagination.innerHTML = '';
        buildDataHeader(current, state.data[current].length, 0);
        return;
    }

    noResults.classList.add('hidden');
    const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    cardCont.innerHTML = renderers[current](slice);
    cardCont.className = 'cards-grid';
    buildPagination(filtered.length);
    buildDataHeader(current, state.data[current].length, filtered.length);
}

function handleSearch() {
    const q = searchInput.value.toLowerCase().trim();
    state.filtered = q
        ? state.data[state.current].filter(item => JSON.stringify(item).toLowerCase().includes(q))
        : [...state.data[state.current]];
    state.page = 1;
    displayPage();
}

async function openResource(key) {
    state.current = key;
    state.page = 1;
    searchInput.value = '';

    homeView.classList.add('hidden');
    dataView.classList.remove('hidden');
    bcCurrent.textContent = META[key].label;

    showSkeletons(key);
    dataHeader.innerHTML = '';
    pagination.innerHTML = '';
    noResults.classList.add('hidden');

    try {
        const data = await fetchResource(key);
        state.filtered = [...data];
        displayPage();

        $(`rcc-${key}`).textContent = `${data.length} items`;

    } catch (err) {
        cardCont.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px; color:#ef4444;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:2.5rem; margin-bottom:14px; display:block;"></i>
                <p style="margin-bottom:6px;">Failed to load ${META[key].label}</p>
                <small style="color:#8b93b5;">${err.message}</small>
            </div>`;
    }
}

function showHome(e) {
    if (e) e.preventDefault();
    dataView.classList.add('hidden');
    homeView.classList.remove('hidden');
    searchInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function prefetchAll() {
    let totalItems = 0;
    for (const key of Object.keys(META)) {
        try {
            const data = await fetchResource(key);
            totalItems += data.length;

            const badge = $(`rcc-${key}`);
            if (badge) badge.textContent = `${data.length} items`;

        } catch (_) { }
    }
}

prefetchAll();