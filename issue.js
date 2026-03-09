// ---- State ----
let allIssues = [];
let currentTab = 'all';

// ---- API URLs ----
const ISSUES_API = 'https://phi-lab-server.vercel.app/api/v1/lab/issues';
const FETCH_ISSUE = (id) => `https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`;
const SEARCH_API = (q) => `https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${q}`;

// ---- Init ----


// ---- Fetch & Display All Issues ----
async function fetchAndDisplayIssues() {
    showLoading(true);
    try {
        const res = await fetch(ISSUES_API);
        const json = await res.json();
        if (json.status === 'success') {
            allIssues = json.data;
            renderIssues(allIssues);
        }
    } catch (err) {
        console.error('Failed to load issues:', err);
        showNoResults(true);
    }
    showLoading(false);
}
fetchAndDisplayIssues();
// ---- Search Issues ----
async function searchIssues() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        renderIssues(filterByTab(allIssues, currentTab));
        return;
    }
    showLoading(true);
    try {
        const res = await fetch(SEARCH_API(query));
        const json = await res.json();
        if (json.status === 'success') {
            renderIssues(json.data);
        } else {
            showNoResults(true);
        }
    } catch (err) {
        console.error('Search failed:', err);
        showNoResults(true);
    }
    showLoading(false);
}

// ---- Switch Tab ----
function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#4A00FF]', 'text-white', 'border-transparent');
        btn.classList.add('text-gray-600', 'hover:bg-gray-100', 'border-gray-200');
    });
    const activeBtn = document.getElementById(`tab-${tab}`);
    activeBtn.classList.add('bg-[#4A00FF]', 'text-white', 'border-transparent');
    activeBtn.classList.remove('text-gray-600', 'hover:bg-gray-100', 'border-gray-200');

    // Filter and render
    const filtered = filterByTab(allIssues, tab);
    renderIssues(filtered);
}

function filterByTab(issues, tab) {
    if (tab === 'all') return issues;
    return issues.filter(issue => issue.status === tab);
}

// ---- Render Issue Cards ----
function renderIssues(issues) {
    const grid = document.getElementById('issueGrid');
    const countEl = document.getElementById('issueCount');

    countEl.textContent = issues.length;

    if (issues.length === 0) {
        grid.classList.add('hidden');
        showNoResults(true);
        return;
    }

    showNoResults(false);
    grid.classList.remove('hidden');

    grid.innerHTML = issues.map(issue => {
        const isOpen = issue.status === 'open';
        const borderClass = isOpen ? 'border-t-4 border-t-green-500' : 'border-t-4 border-t-purple-600';
        const statusIcon = isOpen ? 'assets/Open-Status.png' : 'assets/Closed- Status .png';
        const priorityHtml = getPriorityBadge(issue.priority);
        const dateStr = formatDate(issue.createdAt);

        const labelsHtml = issue.labels.map(label =>
            `<span class="inline-block bg-gray-100 text-gray-500 text-[11px] font-semibold px-3 py-1 rounded-full border border-gray-200">${label}</span>`
        ).join('');

        return `
            <div class="issue-card bg-white rounded-xl shadow-sm border border-gray-100 ${borderClass} p-4 cursor-pointer"
                 onclick="openIssueModal(${issue.id})">
                <!-- Header Row -->
                <div class="flex items-center justify-between mb-3">
                    <img src="${statusIcon}" alt="${issue.status}" class="w-6 h-6">
                    ${priorityHtml}
                </div>
                <!-- Title -->
                <h3 class="font-bold text-gray-800 text-sm mb-1 line-clamp-2 leading-snug">${issue.title}</h3>
                <!-- Description -->
                <p class="text-gray-400 text-xs mb-3 line-clamp-2">${issue.description}</p>
                <!-- Labels -->
                <div class="flex flex-wrap gap-1.5 mb-3">
                    ${labelsHtml}
                </div>
                <!-- Footer -->
                <div class="text-gray-400 text-xs border-t pt-2 mt-auto">
                    #${issue.id} by ${issue.author}<br>${dateStr}
                </div>
            </div>
        `;
    }).join('');
}

// ---- Open Modal ----
async function openIssueModal(id) {
    const modal = document.getElementById('issueModal');
    const modalLoading = document.getElementById('modalLoading');
    const modalContent = document.getElementById('modalContent');

    modalLoading.classList.remove('hidden');
    modalContent.classList.add('hidden');
    modal.showModal();

    try {
        const res = await fetch(FETCH_ISSUE(id));
        const json = await res.json();

        if (json.status === 'success') {
            const issue = json.data;
            const isOpen = issue.status === 'open';

            document.getElementById('modalTitle').textContent = issue.title;

            // Status badge
            const statusEl = document.getElementById('modalStatus');
            statusEl.textContent = isOpen ? 'Opened' : 'Closed';
            statusEl.className = `badge text-white text-xs px-3 py-1 ${isOpen ? 'bg-green-500' : 'bg-purple-600'}`;

            // Author & Date
            document.getElementById('modalAuthor').textContent = `Opened by ${issue.author}`;
            document.getElementById('modalDate').textContent = formatDate(issue.createdAt);

            // Labels
            const labelsContainer = document.getElementById('modalLabels');
            labelsContainer.innerHTML = issue.labels.map(label =>
                `<span class="inline-block bg-gray-100 text-gray-500 text-[11px] font-semibold px-3 py-1 rounded-full border border-gray-200">${label}</span>`
            ).join('');

            // Description
            document.getElementById('modalDescription').textContent = issue.description;

            // Assignee
            document.getElementById('modalAssignee').textContent = issue.assignee || 'Unassigned';

            // Priority
            const priorityEl = document.getElementById('modalPriority');
            priorityEl.textContent = issue.priority;
            priorityEl.className = `badge text-white text-xs px-3 py-1 ${getPriorityClass(issue.priority)}`;
        }
    } catch (err) {
        console.error('Failed to load issue:', err);
    }

    modalLoading.classList.add('hidden');
    modalContent.classList.remove('hidden');
}

// ---- Helpers ----
function getPriorityClass(priority) {
    switch (priority) {
        case 'high': return 'bg-red-400';
        case 'medium': return 'bg-orange-400';
        case 'low': return 'bg-gray-400';
        default: return 'bg-gray-400';
    }
}

function getPriorityBadge(priority) {
    switch (priority) {
        case 'high':
            return `<span class="inline-block bg-red-500 text-white text-[11px] font-bold uppercase px-3.5 py-1 rounded-full">${priority}</span>`;
        case 'medium':
            return `<span class="inline-block bg-amber-200 text-amber-700 text-[11px] font-bold uppercase px-3.5 py-1 rounded-full">${priority}</span>`;
        case 'low':
            return `<span class="inline-block bg-gray-100 text-gray-500 text-[11px] font-bold uppercase px-3.5 py-1 rounded-full border border-gray-300">${priority}</span>`;
        default:
            return `<span class="inline-block bg-gray-100 text-gray-500 text-[11px] font-bold uppercase px-3.5 py-1 rounded-full border border-gray-300">${priority}</span>`;
    }
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const grid = document.getElementById('issueGrid');
    if (show) {
        spinner.classList.remove('hidden');
        grid.classList.add('hidden');
        showNoResults(false);
    } else {
        spinner.classList.add('hidden');
    }
}

function showNoResults(show) {
    const el = document.getElementById('noResults');
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
}
