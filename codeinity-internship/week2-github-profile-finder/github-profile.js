const usernameInput = document.getElementById('usernameInput');
const searchBtn = document.getElementById('searchBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const errorMsg = document.getElementById('errorMsg');
const errorText = document.getElementById('errorText');
const searchBox = document.getElementById('searchBox');
const profileCard = document.getElementById('profileCard');
const skeletonCard = document.getElementById('skeletonCard');
const rateLimitMsg = document.getElementById('rateLimitMsg');

const recentSearches = document.getElementById('recentSearches');
const chipsContainer = document.getElementById('chipsContainer');
const clearHistory = document.getElementById('clearHistory');

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

const avatar = document.getElementById('avatar');
const profileName = document.getElementById('profileName');
const profileLogin = document.getElementById('profileLogin');
const loginText = document.getElementById('loginText');
const profileBio = document.getElementById('profileBio');
const profileLocation = document.getElementById('profileLocation');
const profileBlog = document.getElementById('profileBlog');
const profileTwitter = document.getElementById('profileTwitter');
const profileJoined = document.getElementById('profileJoined');
const statRepos = document.getElementById('statRepos');
const statFollowers = document.getElementById('statFollowers');
const statFollowing = document.getElementById('statFollowing');
const statGists = document.getElementById('statGists');
const viewProfileBtn = document.getElementById('viewProfileBtn');
const locationItem = document.getElementById('locationItem');
const blogItem = document.getElementById('blogItem');
const twitterItem = document.getElementById('twitterItem');
const copyBtn = document.getElementById('copyBtn');
const copyIcon = document.getElementById('copyIcon');
const reposSection = document.getElementById('reposSection');
const reposGrid = document.getElementById('reposGrid');

const LANG_COLORS = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'C': '#555555',
    'C#': '#178600',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'Swift': '#F05138',
    'Kotlin': '#A97BFF',
    'Dart': '#00B4AB',
    'Vue': '#41b883',
    'Shell': '#89e051',
    'Jupyter Notebook': '#DA5B0B',
    'R': '#198CE7',
    'Scala': '#c22d40',
    'Lua': '#000080',
};

const MAX_RECENT = 5;
const RECENT_KEY = 'github_finder_recent';
const THEME_KEY = 'github_finder_theme';
(function init() {
    usernameInput.focus();
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(savedTheme);
    renderRecentSearches();
})();

searchBtn.addEventListener('click', handleSearch);

usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
});

usernameInput.addEventListener('input', () => {
    hideError();
    hideRateLimit();
    searchBox.classList.remove('error-shake');
});

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
});

clearHistory.addEventListener('click', () => {
    localStorage.removeItem(RECENT_KEY);
    renderRecentSearches();
});

copyBtn.addEventListener('click', () => {
    const username = loginText.textContent.replace('@', '');
    if (!username || username === 'username') return;

    navigator.clipboard.writeText(username).then(() => {
        // Show success state
        copyBtn.classList.add('copied');
        copyIcon.className = 'fa-solid fa-check';

        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyIcon.className = 'fa-regular fa-copy';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const temp = document.createElement('input');
        temp.value = username;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
    });
});

async function handleSearch() {
    const username = usernameInput.value.trim();

    if (!username) {
        showError('Please enter a GitHub username.');
        shakeSearchBox();
        return;
    }

    setLoading(true);
    hideError();
    hideRateLimit();
    hideCard();
    showSkeleton();

    try {
        // Fetch user profile and repos in parallel
        const [profileRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${username}`),
            fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6`)
        ]);

        // Handle rate limit (403) for profile request
        if (profileRes.status === 403) {
            throw new Error('RATE_LIMIT');
        }

        // Handle user not found (404)
        if (profileRes.status === 404) {
            throw new Error(`No GitHub user found with the username "${username}".`);
        }

        if (!profileRes.ok) {
            throw new Error(`GitHub API error: ${profileRes.status} ${profileRes.statusText}`);
        }

        const profileData = await profileRes.json();
        const reposData = reposRes.ok ? await reposRes.json() : [];

        // Save to recent searches
        saveRecentSearch(username);
        renderRecentSearches();

        // Render everything
        renderProfile(profileData);
        renderTopRepos(reposData);

    } catch (err) {
        if (err.message === 'RATE_LIMIT') {
            showRateLimit();
        } else {
            showError(err.message);
        }
        shakeSearchBox();
    } finally {
        setLoading(false);
        hideSkeleton();
    }
}

// ─── Render Profile ───────────────────────────────────────────
function renderProfile(data) {
    avatar.src = data.avatar_url || '';
    avatar.alt = `${data.login}'s GitHub avatar`;

    profileName.textContent = data.name || data.login;

    loginText.textContent = `@${data.login}`;
    profileLogin.href = data.html_url;

    profileBio.textContent = data.bio || '';
    profileBio.style.display = data.bio ? 'block' : 'none';

    // Location
    if (data.location) {
        profileLocation.textContent = data.location;
        locationItem.classList.remove('hidden');
    } else {
        locationItem.classList.add('hidden');
    }

    // Blog
    if (data.blog) {
        const blogUrl = data.blog.startsWith('http') ? data.blog : `https://${data.blog}`;
        profileBlog.textContent = data.blog.replace(/^https?:\/\//, '');
        profileBlog.href = blogUrl;
        blogItem.classList.remove('hidden');
    } else {
        blogItem.classList.add('hidden');
    }

    // Twitter / X
    if (data.twitter_username) {
        profileTwitter.textContent = `@${data.twitter_username}`;
        twitterItem.classList.remove('hidden');
    } else {
        twitterItem.classList.add('hidden');
    }

    // Join date
    const joinedDate = new Date(data.created_at);
    profileJoined.textContent = `Joined ${joinedDate.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    })}`;

    // Animated stats
    animateCounter(statRepos, data.public_repos || 0);
    animateCounter(statFollowers, data.followers || 0);
    animateCounter(statFollowing, data.following || 0);
    animateCounter(statGists, data.public_gists || 0);

    viewProfileBtn.href = data.html_url;

    showCard();
}

// ─── Render Top Repositories ──────────────────────────────────
function renderTopRepos(repos) {
    if (!repos || repos.length === 0) {
        reposSection.style.display = 'none';
        return;
    }

    // Filter out forks, sort by stars, take top 3
    const topRepos = repos
        .filter(r => !r.fork)
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 3);

    if (topRepos.length === 0) {
        reposSection.style.display = 'none';
        return;
    }

    reposSection.style.display = 'flex';
    reposGrid.innerHTML = '';

    topRepos.forEach((repo, index) => {
        const card = document.createElement('a');
        card.className = 'repo-card';
        card.href = repo.html_url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.style.animationDelay = `${index * 0.07}s`;
        card.style.animation = 'cardEntrance 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both';

        const langColor = LANG_COLORS[repo.language] || '#8b949e';

        card.innerHTML = `
            <div class="repo-name">
                <i class="fa-regular fa-bookmark"></i>
                ${escapeHtml(repo.name)}
            </div>
            <p class="repo-desc">${escapeHtml(repo.description || 'No description available.')}</p>
            <div class="repo-footer">
                <div class="repo-stats">
                    <span class="repo-stat">
                        <i class="fa-regular fa-star"></i> ${formatNumber(repo.stargazers_count)}
                    </span>
                    <span class="repo-stat">
                        <i class="fa-solid fa-code-fork"></i> ${formatNumber(repo.forks_count)}
                    </span>
                </div>
                ${repo.language ? `
                <div class="repo-lang">
                    <span class="lang-dot" style="background:${langColor}"></span>
                    ${escapeHtml(repo.language)}
                </div>` : ''}
            </div>
        `;

        reposGrid.appendChild(card);
    });
}

// ─── Recent Searches ──────────────────────────────────────────
function saveRecentSearch(username) {
    let recent = getRecentSearches();
    // Remove if already exists (move to front)
    recent = recent.filter(u => u.toLowerCase() !== username.toLowerCase());
    recent.unshift(username);
    // Keep only last MAX_RECENT
    recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

function getRecentSearches() {
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch {
        return [];
    }
}

function renderRecentSearches() {
    const recent = getRecentSearches();
    if (recent.length === 0) {
        recentSearches.classList.remove('visible');
        return;
    }

    chipsContainer.innerHTML = '';
    recent.forEach(username => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = username;
        chip.addEventListener('click', () => {
            usernameInput.value = username;
            handleSearch();
        });
        chipsContainer.appendChild(chip);
    });

    recentSearches.classList.add('visible');
}

// ─── Theme Toggle ─────────────────────────────────────────────
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    if (theme === 'dark') {
        themeIcon.className = 'fa-solid fa-moon';
        themeToggle.title = 'Switch to light mode';
    } else {
        themeIcon.className = 'fa-solid fa-sun';
        themeToggle.title = 'Switch to dark mode';
    }
}

// ─── Animated Number Counter ──────────────────────────────────
function animateCounter(element, target) {
    const duration = 900;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(target * eased).toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ─── UI State Helpers ─────────────────────────────────────────
function setLoading(isLoading) {
    searchBtn.disabled = isLoading;
    if (isLoading) {
        btnText.style.display = 'none';
        btnSpinner.classList.add('visible');
    } else {
        btnText.style.display = 'inline';
        btnSpinner.classList.remove('visible');
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMsg.classList.add('visible');
}

function hideError() {
    errorMsg.classList.remove('visible');
}

function showRateLimit() {
    rateLimitMsg.classList.add('visible');
}

function hideRateLimit() {
    rateLimitMsg.classList.remove('visible');
}

function showCard() {
    profileCard.classList.add('visible');
}

function hideCard() {
    profileCard.classList.remove('visible');
}

function showSkeleton() {
    skeletonCard.classList.add('visible');
}

function hideSkeleton() {
    skeletonCard.classList.remove('visible');
}

function shakeSearchBox() {
    searchBox.classList.remove('error-shake');
    void searchBox.offsetWidth; // reflow to re-trigger animation
    searchBox.classList.add('error-shake');
}

// ─── Utility Helpers ─────────────────────────────────────────
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}
