// Sales data management
let sales = JSON.parse(localStorage.getItem('mojacart_sales')) || [];
let charts = {};

// Product price map (unit prices)
const productPrices = {
  'printed': 170,
  'printed socks': 170,
  'girly': 120,
  'girl': 120,
  'formal': 140,
  'cactus jack': 150,
  'nike long': 140,
  'nike ankle': 120,
  'nike anke': 120,
  'nike half': 140,
  'trekking': 200,
  'emoji': 140
};

// Helper: get unit price by product name (case-insensitive)
function getUnitPrice(productName) {
  if (!productName) return null;
  const key = productName.trim().toLowerCase();
  return productPrices.hasOwnProperty(key) ? productPrices[key] : null;
}

// Update total for add form
function updateAddFormTotal() {
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const qty = parseInt(document.getElementById('quantity').value) || 1;
  const total = amount * qty;
  document.getElementById('total').value = total.toFixed(2);
}

// When product selected in add form, set unit price (amount) if we know it, then update total
function updateAddFormPriceFromProduct() {
  const prod = document.getElementById('product').value;
  const unit = getUnitPrice(prod);
  if (unit !== null) {
    document.getElementById('amount').value = unit.toFixed(2);
  }
  updateAddFormTotal();
}

// Update total for edit modal
function updateEditFormTotal() {
  const amount = parseFloat(document.getElementById('edit-amount').value) || 0;
  const qty = parseInt(document.getElementById('edit-quantity').value) || 1;
  const total = amount * qty;
  document.getElementById('edit-total').value = total.toFixed(2);
}

// When product selected in edit modal, set unit price (edit-amount) if known, then update edit total
function updateEditFormPriceFromProduct() {
  const prod = document.getElementById('edit-product').value;
  const unit = getUnitPrice(prod);
  if (unit !== null) {
    document.getElementById('edit-amount').value = unit.toFixed(2);
  }
  updateEditFormTotal();
}

// Attach listeners (ensure elements exist)
document.addEventListener('DOMContentLoaded', function() {
  // Set today's date as default
  document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];

  // Attach add-form listeners
  const productInput = document.getElementById('product');
  const qtyInput = document.getElementById('quantity');
  const amountInput = document.getElementById('amount');
  if (productInput) productInput.addEventListener('input', updateAddFormPriceFromProduct);
  if (qtyInput) qtyInput.addEventListener('input', updateAddFormTotal);
  if (amountInput) amountInput.addEventListener('input', updateAddFormTotal);

  // Attach edit-modal listeners
  const editProduct = document.getElementById('edit-product');
  const editQty = document.getElementById('edit-quantity');
  const editAmount = document.getElementById('edit-amount');
  if (editProduct) editProduct.addEventListener('input', updateEditFormPriceFromProduct);
  if (editQty) editQty.addEventListener('input', updateEditFormTotal);
  if (editAmount) editAmount.addEventListener('input', updateEditFormTotal);

  // Initialize dashboard/lists/charts
  updateDashboard();
  renderSalesList();
  initializeCharts();

  // initialize totals on load
  updateAddFormTotal();
  updateEditFormTotal();
});

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  // Set today's date as default
  document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
  
  updateDashboard();
  renderSalesList();
  initializeCharts();
});

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('successToast');
  const toastMessage = document.getElementById('toast-message');
  const toastHeader = toast.querySelector('.toast-header');
  
  toastMessage.textContent = message;
  
  if (type === 'success') {
    toastHeader.className = 'toast-header bg-success text-white';
    toastHeader.innerHTML = '<i class="fas fa-check-circle me-2"></i><strong class="me-auto">Success</strong><button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>';
  } else if (type === 'error') {
    toastHeader.className = 'toast-header bg-danger text-white';
    toastHeader.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i><strong class="me-auto">Error</strong><button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>';
  }
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

// Add new sale
document.getElementById('sale-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const sale = {
    id: Date.now(),
    product: document.getElementById('product').value.trim(),
    amount: parseFloat(document.getElementById('amount').value),
    quantity: parseInt(document.getElementById('quantity').value) || 1,
    client: document.getElementById('client').value.trim(),
    date: document.getElementById('sale-date').value,
    payment: document.getElementById('payment').value,
    category: document.getElementById('category').value,
    notes: document.getElementById('notes').value.trim(),
    timestamp: new Date().toISOString()
  };

  // Validation
  if (!sale.product || sale.amount <= 0 || sale.quantity <= 0) {
    showToast('Please fill in all required fields correctly.', 'error');
    return;
  }

  sales.push(sale);
  localStorage.setItem('mojacart_sales', JSON.stringify(sales));
  
  // Reset form
  this.reset();
  // reset defaults
  document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('quantity').value = 1;
  document.getElementById('amount').value = '';
  document.getElementById('total').value = '0.00';
  // Update dashboard and lists
  updateDashboard();
  renderSalesList();
  updateCharts();
  
  showToast('Sale added successfully!');
  
  // Switch to dashboard tab
  const dashboardTab = new bootstrap.Tab(document.getElementById('dashboard-tab'));
  dashboardTab.show();
});

// Update dashboard statistics
function updateDashboard() {
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + ((sale.amount || 0) * (sale.quantity || 1)), 0);
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = sales.filter(sale => sale.date === today);
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + ((sale.amount || 0) * (sale.quantity || 1)), 0);
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  document.getElementById('total-sales-count').textContent = totalSales;
  document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2);
  document.getElementById('today-revenue').textContent = todaysRevenue.toFixed(2);
  document.getElementById('avg-sale').textContent = avgSale.toFixed(2);

  // Update recent sales table — ensure column order matches HTML: Date, Product, Qty, Client, Amount, Payment
  const recentSales = sales.slice(-5).reverse();
  const recentSalesTable = document.getElementById('recent-sales-table');
  if (!recentSalesTable) return;
  recentSalesTable.innerHTML = '';

  if (recentSales.length === 0) {
    recentSalesTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No sales recorded yet</td></tr>';
  } else {
    recentSales.forEach(sale => {
      const total = ((sale.amount || 0) * (sale.quantity || 1)).toFixed(2);
      const row = `
        <tr>
          <td>${formatDate(sale.date)}</td>
          <td>${sale.product || ''}</td>
          <td>${sale.quantity || 1}</td>
          <td>${sale.client || 'N/A'}</td>
          <td>Rs. ${total}</td>
          <td><span class="badge bg-primary">${sale.payment || ''}</span></td>
        </tr>
      `;
      recentSalesTable.innerHTML += row;
    });
  }
}

// Format date for display
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Render sales list with filters
function renderSalesList() {
  const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
  const categoryFilter = document.getElementById('category-filter')?.value || '';
  const startDate = document.getElementById('start-date')?.value || '';
  const endDate = document.getElementById('end-date')?.value || '';

  let filteredSales = sales.filter(sale => {
    const matchesSearch = sale.product.toLowerCase().includes(searchTerm) ||
                         (sale.client && sale.client.toLowerCase().includes(searchTerm)) ||
                         sale.payment.toLowerCase().includes(searchTerm);
    const matchesCategory = !categoryFilter || sale.category === categoryFilter;
    const matchesDateRange = (!startDate || sale.date >= startDate) &&
                            (!endDate || sale.date <= endDate);
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // Sort by date (newest first)
  filteredSales.sort((a, b) => new Date(b.date) - new Date(a.date));

  const tableBody = document.getElementById('sales-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  if (filteredSales.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No sales found</td></tr>';
    return;
  }

  filteredSales.forEach(sale => {
    const total = ((sale.amount || 0) * (sale.quantity || 1)).toFixed(2);
    const row = `
      <tr>
        <td>${formatDate(sale.date)}</td>
        <td>${sale.product}</td>
        <td>${sale.quantity || 1}</td>
        <td>Rs. ${total}</td>
        <td>${sale.client || 'N/A'}</td>
        <td><span class="badge bg-info">${sale.payment}</span></td>
        <td><span class="badge bg-secondary">${sale.category || ''}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editSale(${sale.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteSale(${sale.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

// Edit sale
function editSale(id) {
  const sale = sales.find(s => s.id === id);
  if (!sale) return;

  document.getElementById('edit-sale-id').value = sale.id;
  document.getElementById('edit-product').value = sale.product;
  document.getElementById('edit-amount').value = sale.amount;
  document.getElementById('edit-client').value = sale.client || '';
  document.getElementById('edit-date').value = sale.date;
  document.getElementById('edit-payment').value = sale.payment;
  document.getElementById('edit-category').value = sale.category;
  document.getElementById('edit-notes').value = sale.notes || '';
  document.getElementById('edit-quantity').value = sale.quantity || 1;
  document.getElementById('edit-total').value = ((sale.amount || 0) * (sale.quantity || 1)).toFixed(2);

  const modal = new bootstrap.Modal(document.getElementById('editSaleModal'));
  modal.show();
}

// Update sale
function updateSale() {
  const id = parseInt(document.getElementById('edit-sale-id').value);
  const saleIndex = sales.findIndex(s => s.id === id);
  
  if (saleIndex === -1) return;

  sales[saleIndex] = {
    ...sales[saleIndex],
    product: document.getElementById('edit-product').value.trim(),
    amount: parseFloat(document.getElementById('edit-amount').value),
    client: document.getElementById('edit-client').value.trim(),
    date: document.getElementById('edit-date').value,
    payment: document.getElementById('edit-payment').value,
    category: document.getElementById('edit-category').value,
    notes: document.getElementById('edit-notes').value.trim()
  };

  localStorage.setItem('mojacart_sales', JSON.stringify(sales));
  
  updateDashboard();
  renderSalesList();
  updateCharts();
  
  const modal = bootstrap.Modal.getInstance(document.getElementById('editSaleModal'));
  modal.hide();
  
  showToast('Sale updated successfully!');
}

// Delete sale
function deleteSale(id) {
  if (confirm('Are you sure you want to delete this sale?')) {
    sales = sales.filter(s => s.id !== id);
    localStorage.setItem('mojacart_sales', JSON.stringify(sales));
    
    updateDashboard();
    renderSalesList();
    updateCharts();
    
    showToast('Sale deleted successfully!');
  }
}

// Export to CSV
document.getElementById('export-btn').addEventListener('click', function() {
  // Create CSV header
  let csv = 'Date,Product,Quantity,Amount,Client,Payment,Notes\n';
  
  // Add each sale as a row
  sales.forEach(sale => {
    // Format date properly
    const formattedDate = formatDate(sale.date);
    
    // Create CSV row with proper escaping
    const row = [
      formattedDate,
      sale.product.replace(/,/g, ';'),
      (sale.quantity || 1),
      sale.amount,
      sale.client.replace(/,/g, ';'),
      sale.payment,
      sale.notes.replace(/,/g, ';')
    ].join(',');
    
    csv += row + '\n';
  });

  // Create and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `sales_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Initialize charts
function initializeCharts() {
  // Monthly Revenue Chart
  createMonthlyChart();
  // Payment Methods Chart
  createPaymentChart();
  // Category Chart
  createCategoryChart();
  // Daily Trend Chart
  createDailyChart();
}

// Create monthly revenue chart
function createMonthlyChart() {
  const monthlyData = {};
  sales.forEach(sale => {
    const month = (sale.date || '').substring(0, 7); // YYYY-MM
    const value = ((sale.amount || 0) * (sale.quantity || 1));
    if (!month) return;
    monthlyData[month] = (monthlyData[month] || 0) + value;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const values = sortedMonths.map(month => monthlyData[month]);

  const ctx = document.getElementById('monthly-chart');
  if (ctx) {
    if (charts.monthly) charts.monthly.destroy();
    charts.monthly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedMonths.map(month => {
          const date = new Date(month + '-01');
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        }),
        datasets: [{
          label: 'Revenue (Rs.)',
          data: values,
          backgroundColor: 'rgba(37, 99, 235, 0.8)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => 'Rs. ' + Number(v).toFixed(0) }
          }
        }
      }
    });
  }
}

// Create payment methods chart (use revenue per method)
function createPaymentChart() {
  const paymentData = {};
  sales.forEach(sale => {
    const key = sale.payment || 'Unknown';
    const value = ((sale.amount || 0) * (sale.quantity || 1));
    paymentData[key] = (paymentData[key] || 0) + value;
  });

  const ctx = document.getElementById('payment-chart');
  if (ctx) {
    if (charts.payment) charts.payment.destroy();
    charts.payment = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(paymentData),
        datasets: [{
          data: Object.values(paymentData),
          backgroundColor: ['#2563eb','#059669','#d97706','#dc2626','#7c3aed']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: { label: ctx => `${ctx.label}: Rs. ${ctx.parsed.toFixed(2)}` }
          }
        }
      }
    });
  }
}

// Create category chart (use revenue per category)
function createCategoryChart() {
  const categoryData = {};
  sales.forEach(sale => {
    const key = sale.category || 'Uncategorized';
    const value = ((sale.amount || 0) * (sale.quantity || 1));
    categoryData[key] = (categoryData[key] || 0) + value;
  });

  const ctx = document.getElementById('category-chart');
  if (ctx) {
    if (charts.category) charts.category.destroy();
    charts.category = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(categoryData),
        datasets: [{
          data: Object.values(categoryData),
          backgroundColor: ['#2563eb','#059669','#d97706','#dc2626','#7c3aed']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: { label: ctx => `${ctx.label}: Rs. ${ctx.parsed.toFixed(2)}` }
          }
        }
      }
    });
  }
}

// Create daily trend chart
function createDailyChart() {
  const dailyData = {};
  sales.forEach(sale => {
    const key = sale.date || '';
    const value = ((sale.amount || 0) * (sale.quantity || 1));
    if (!key) return;
    dailyData[key] = (dailyData[key] || 0) + value;
  });

  const sortedDates = Object.keys(dailyData).sort();
  const last30Days = sortedDates.slice(-30);
  const values = last30Days.map(d => dailyData[d]);

  const ctx = document.getElementById('daily-chart');
  if (ctx) {
    if (charts.daily) charts.daily.destroy();
    charts.daily = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last30Days.map(date => {
          const d = new Date(date);
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Daily Revenue (Rs.)',
          data: values,
          borderColor: 'rgba(37, 99, 235, 1)',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => 'Rs. ' + Number(v).toFixed(0) } }
        }
      }
    });
  }
}

// Update all charts (destroy existing then recreate)
function updateCharts() {
  // destroy any existing charts safely
  Object.keys(charts).forEach(k => {
    if (charts[k]) {
      try { charts[k].destroy(); } catch (e) { /* ignore */ }
      charts[k] = null;
    }
  });
  initializeCharts();
}

// Event listeners for filters
document.getElementById('search-input')?.addEventListener('input', renderSalesList);
document.getElementById('category-filter')?.addEventListener('change', renderSalesList);
document.getElementById('filter-btn')?.addEventListener('click', renderSalesList);

// Tab change event to update charts
document.addEventListener('shown.bs.tab', function (event) {
  if (event.target.getAttribute('data-bs-target') === '#analytics') {
    setTimeout(updateCharts, 100);
  }
});