/**
 * SmartExpense - Client Side Application Logic
 * Interaksi dengan Python FastAPI Backend via Fetch API
 */

document.addEventListener('DOMContentLoaded', () => {
    // State Application
    const state = {
        transactions: [],
        summary: null,
        filterType: 'all',
        filterCategory: 'all',
        searchQuery: '',
        editingId: null
    };

    // DOM Elements
    const elements = {
        // Summary Metrics
        totalBalance: document.getElementById('totalBalance'),
        totalIncome: document.getElementById('totalIncome'),
        totalExpense: document.getElementById('totalExpense'),
        healthBadge: document.getElementById('healthBadge'),
        budgetProgressBar: document.getElementById('budgetProgressBar'),
        budgetRatioText: document.getElementById('budgetRatioText'),
        transactionCountBadge: document.getElementById('transactionCountBadge'),
        categoriesList: document.getElementById('categoriesList'),

        // Controls
        searchInput: document.getElementById('searchInput'),
        btnClearSearch: document.getElementById('btnClearSearch'),
        categoryFilter: document.getElementById('categoryFilter'),
        typePills: document.querySelectorAll('.type-pills .pill'),

        // List Container
        transactionsList: document.getElementById('transactionsList'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        emptyState: document.getElementById('emptyState'),

        // Modal Form
        transactionModal: document.getElementById('transactionModal'),
        modalTitle: document.getElementById('modalTitle'),
        transactionForm: document.getElementById('transactionForm'),
        btnOpenModal: document.getElementById('btnOpenModal'),
        btnCloseModal: document.getElementById('btnCloseModal'),
        btnCancelModal: document.getElementById('btnCancelModal'),

        // Form Inputs
        txId: document.getElementById('txId'),
        txTitle: document.getElementById('txTitle'),
        txAmount: document.getElementById('txAmount'),
        txType: document.getElementById('txType'),
        txCategory: document.getElementById('txCategory'),
        txDate: document.getElementById('txDate'),
        txNotes: document.getElementById('txNotes'),

        // Toast Container
        toastContainer: document.getElementById('toastContainer')
    };

    // Set Default Form Date to Today (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    elements.txDate.value = today;

    // --- UTILITY FUNCTIONS ---

    // Format IDR Currency
    function formatIDR(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    }

    // Format Date (DD MMM YYYY)
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    }

    // Category Metadata Helper (Icon & Styles)
    function getCategoryMeta(category, type) {
        const catMap = {
            'Gaji': { icon: 'briefcase', bgClass: 'icon-emerald' },
            'Freelance': { icon: 'code', bgClass: 'icon-indigo' },
            'Belanja': { icon: 'shopping-bag', bgClass: 'icon-rose' },
            'Makanan': { icon: 'utensils', bgClass: 'icon-rose' },
            'Tagihan': { icon: 'receipt', bgClass: 'icon-amber' },
            'Investasi': { icon: 'trending-up', bgClass: 'icon-emerald' },
            'Hiburan': { icon: 'film', bgClass: 'icon-indigo' },
            'Lain-lain': { icon: 'file-text', bgClass: 'icon-indigo' }
        };

        if (catMap[category]) return catMap[category];
        return type === 'income' 
            ? { icon: 'arrow-down-left', bgClass: 'icon-emerald' }
            : { icon: 'arrow-up-right', bgClass: 'icon-rose' };
    }

    // Toast Notification
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
            <span>${message}</span>
        `;
        elements.toastContainer.appendChild(toast);
        lucide.createIcons({ targets: [toast] });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // --- API CALLS ---

    // Load Summary & Financial Health
    async function loadSummary() {
        try {
            const response = await fetch('/api/summary');
            if (!response.ok) throw new Error('Gagal mengambil ringkasan data');
            const data = await response.json();
            state.summary = data;

            // Render Metrics
            elements.totalBalance.textContent = formatIDR(data.balance);
            elements.totalIncome.textContent = formatIDR(data.total_income);
            elements.totalExpense.textContent = formatIDR(data.total_expense);
            elements.transactionCountBadge.textContent = `${data.total_transactions} Transaksi`;

            // Calculate Expense Ratio
            const totalIncome = data.total_income || 1;
            const ratio = Math.min(Math.round((data.total_expense / totalIncome) * 100), 100);
            
            elements.budgetProgressBar.style.width = `${ratio}%`;
            elements.budgetRatioText.textContent = `${ratio}% Terpakai`;

            // Financial Health Badge Logic
            if (data.balance >= 0 && ratio <= 70) {
                elements.healthBadge.className = 'badge badge-success';
                elements.healthBadge.innerHTML = '<i data-lucide="trending-up"></i> Kondisi Sehat';
            } else if (data.balance >= 0 && ratio > 70) {
                elements.healthBadge.className = 'badge badge-warning';
                elements.healthBadge.innerHTML = '<i data-lucide="alert-triangle"></i> Waspada Pengeluaran';
            } else {
                elements.healthBadge.className = 'badge badge-danger';
                elements.healthBadge.innerHTML = '<i data-lucide="alert-circle"></i> Defisit Saldo';
            }

            // Render Sidebar Category Breakdown
            renderCategories(data.categories, data.total_expense || 1);
            lucide.createIcons();

        } catch (error) {
            console.error('Error fetching summary:', error);
            showToast('Gagal memuat statistik keuangan', 'error');
        }
    }

    // Load Transactions List
    async function loadTransactions() {
        elements.loadingSpinner.classList.remove('hidden');
        elements.emptyState.classList.add('hidden');
        elements.transactionsList.innerHTML = '';

        try {
            const params = new URLSearchParams();
            if (state.filterType !== 'all') params.append('type', state.filterType);
            if (state.filterCategory !== 'all') params.append('category', state.filterCategory);
            if (state.searchQuery.trim() !== '') params.append('search', state.searchQuery.trim());

            const url = `/api/transactions?${params.toString()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Gagal memuat transaksi');

            const transactions = await response.json();
            state.transactions = transactions;

            elements.loadingSpinner.classList.add('hidden');

            if (transactions.length === 0) {
                elements.emptyState.classList.remove('hidden');
            } else {
                renderTransactions(transactions);
            }

        } catch (error) {
            console.error('Error fetching transactions:', error);
            elements.loadingSpinner.classList.add('hidden');
            showToast('Gagal terhubung ke API backend', 'error');
        }
    }

    // --- RENDER DOM ---

    function renderTransactions(items) {
        elements.transactionsList.innerHTML = items.map(tx => {
            const meta = getCategoryMeta(tx.category, tx.type);
            const isIncome = tx.type === 'income';
            const amountPrefix = isIncome ? '+' : '-';
            const amountClass = isIncome ? 'text-emerald' : 'text-rose';

            return `
                <div class="tx-item" data-id="${tx.id}">
                    <div class="tx-left">
                        <div class="tx-icon-bg ${meta.bgClass}">
                            <i data-lucide="${meta.icon}"></i>
                        </div>
                        <div class="tx-details">
                            <h4>${escapeHtml(tx.title)}</h4>
                            <div class="tx-meta">
                                <span class="category-tag">${escapeHtml(tx.category)}</span>
                                <span>•</span>
                                <span>${formatDate(tx.date)}</span>
                                ${tx.notes ? `<span>•</span> <span>${escapeHtml(tx.notes)}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="tx-right">
                        <div class="tx-amount ${amountClass}">
                            ${amountPrefix} ${formatIDR(tx.amount)}
                        </div>
                        <div class="tx-actions">
                            <button class="btn-icon btn-edit" data-id="${tx.id}" title="Edit Transaksi">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button class="btn-icon btn-danger btn-delete" data-id="${tx.id}" title="Hapus Transaksi">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();

        // Attach action listeners
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => handleEdit(e.currentTarget.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => handleDelete(e.currentTarget.dataset.id));
        });
    }

    function renderCategories(categories, totalExpense) {
        if (!categories || categories.length === 0) {
            elements.categoriesList.innerHTML = '<p class="text-muted" style="font-size:0.8rem;">Belum ada rincian data</p>';
            return;
        }

        elements.categoriesList.innerHTML = categories.map(cat => {
            const pct = totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0;
            return `
                <div class="cat-item">
                    <div class="cat-info">
                        <span class="cat-name">${escapeHtml(cat.category)}</span>
                        <span class="cat-val">${formatIDR(cat.total)}</span>
                    </div>
                    <div class="cat-bar-bg">
                        <div class="cat-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, match => {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[match];
        });
    }

    // --- MODAL & FORM HANDLERS ---

    function openModal(isEdit = false) {
        if (!isEdit) {
            elements.modalTitle.textContent = 'Tambah Transaksi Baru';
            elements.transactionForm.reset();
            elements.txId.value = '';
            elements.txDate.value = today;
            state.editingId = null;
        } else {
            elements.modalTitle.textContent = 'Edit Transaksi';
        }
        elements.transactionModal.classList.remove('hidden');
    }

    function closeModal() {
        elements.transactionModal.classList.add('hidden');
        elements.transactionForm.reset();
        state.editingId = null;
    }

    async function handleEdit(id) {
        try {
            const response = await fetch(`/api/transactions/${id}`);
            if (!response.ok) throw new Error('Data tidak ditemukan');
            const tx = await response.json();

            state.editingId = tx.id;
            elements.txId.value = tx.id;
            elements.txTitle.value = tx.title;
            elements.txAmount.value = tx.amount;
            elements.txType.value = tx.type;
            elements.txCategory.value = tx.category;
            elements.txDate.value = tx.date;
            elements.txNotes.value = tx.notes || '';

            openModal(true);
        } catch (err) {
            showToast('Gagal memuat data transaksi untuk diedit', 'error');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

        try {
            const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Gagal menghapus transaksi');

            showToast('Transaksi berhasil dihapus', 'success');
            loadSummary();
            loadTransactions();
        } catch (err) {
            showToast('Gagal menghapus transaksi', 'error');
        }
    }

    elements.transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            title: elements.txTitle.value.trim(),
            amount: parseFloat(elements.txAmount.value),
            type: elements.txType.value,
            category: elements.txCategory.value,
            date: elements.txDate.value,
            notes: elements.txNotes.value.trim() || null
        };

        const isEdit = Boolean(state.editingId);
        const url = isEdit ? `/api/transactions/${state.editingId}` : '/api/transactions';
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Terjadi kesalahan saat menyimpan');
            }

            showToast(isEdit ? 'Transaksi berhasil diperbarui!' : 'Transaksi baru berhasil ditambahkan!', 'success');
            closeModal();
            loadSummary();
            loadTransactions();

        } catch (err) {
            console.error('Submit error:', err);
            showToast(`Gagal menyimpan: ${err.message}`, 'error');
        }
    });

    // --- EVENT LISTENERS ---

    elements.btnOpenModal.addEventListener('click', () => openModal(false));
    elements.btnCloseModal.addEventListener('click', closeModal);
    elements.btnCancelModal.addEventListener('click', closeModal);

    // Close Modal on backdrop click
    elements.transactionModal.addEventListener('click', (e) => {
        if (e.target === elements.transactionModal) closeModal();
    });

    // Type Pills Filter Listener
    elements.typePills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            elements.typePills.forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');

            state.filterType = e.currentTarget.dataset.type;
            loadTransactions();
        });
    });

    // Category Selector Listener
    elements.categoryFilter.addEventListener('change', (e) => {
        state.filterCategory = e.target.value;
        loadTransactions();
    });

    // Search Input Listener with Debounce
    let searchTimeout = null;
    elements.searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.trim() !== '') {
            elements.btnClearSearch.classList.remove('hidden');
        } else {
            elements.btnClearSearch.classList.add('hidden');
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchQuery = val;
            loadTransactions();
        }, 300);
    });

    elements.btnClearSearch.addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.btnClearSearch.classList.add('hidden');
        state.searchQuery = '';
        loadTransactions();
    });

    // Initial Load
    loadSummary();
    loadTransactions();
});
