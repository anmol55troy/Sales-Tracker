// Sales data management
let sales = JSON.parse(localStorage.getItem('mojacart_sales')) || [];
let charts = {};

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
    client: document.getElementById('client').value.trim(),
    date: document.getElementById('sale-date').value,
    payment: document.getElementById('payment').value,
    category: document.getElementById('category').value,
    notes: document.getElementById('notes').value.trim(),
    timestamp: new Date().toISOString()
  };

  // Validation
  if (!sale.product || sale.amount <= 0) {
    showToast('Please fill in all required fields correctly.', 'error');
    return;
  }

  sales.push(sale);
  localStorage.setItem('mojacart_sales', JSON.stringify(sales));
  
  // Reset form
  this.reset();
  document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
  
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
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = sales.filter(sale => sale.date === today);
  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.amount, 0);
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

  document.getElementById('total-sales-count').textContent = totalSales;
  document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2);
  document.getElementById('today-revenue').textContent = todaysRevenue.toFixed(2);
  document.getElementById('avg-sale').textContent = avgSale.toFixed(2);

  // Update recent sales table
  const recentSales = sales.slice(-5).reverse();
  const recentSalesTable = document.getElementById('recent-sales-table');
  recentSalesTable.innerHTML = '';

  if (recentSales.length === 0) {
    recentSalesTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No sales recorded yet</td></tr>';
  } else {
    recentSales.forEach(sale => {
      const row = `
        <tr>
          <td>${formatDate(sale.date)}</td>
          <td>${sale.product}</td>
          <td>${sale.client || 'N/A'}</td>
          <td>Rs. ${sale.amount.toFixed(2)}</td>
          <td><span class="badge bg-primary">${sale.payment}</span></td>
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
    const row = `
      <tr>
        <td>${formatDate(sale.date)}</td>
        <td>${sale.product}</td>
        <td>Rs. ${sale.amount.toFixed(2)}</td>
        <td>${sale.client || 'N/A'}</td>
        <td><span class="badge bg-info">${sale.payment}</span></td>
        <td><span class="badge bg-secondary">${sale.category}</span></td>
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
  if (sales.length === 0) {
    showToast('No sales data to export.', 'error');
    return;
  }

  const csvContent = 'Date,Product,Amount,Client,Payment,Category,Notes\n' +
    sales.map(sale => 
      `${sale.date},"${sale.product}",${sale.amount},"${sale.client || ''}","${sale.payment}","${sale.category}","${sale.notes || ''}"`
    ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mojacart-sales-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showToast('Sales data exported successfully!');
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
    const month = sale.date.substring(0, 7); // YYYY-MM
    monthlyData[month] = (monthlyData[month] || 0) + sale.amount;
  });

  const sortedMonths = Object.keys(monthlyData).sort();
  const values = sortedMonths.map(month => monthlyData[month]);

  const ctx = document.getElementById('monthly-chart');
  if (ctx) {
    if (charts.monthly) {
      charts.monthly.destroy();
    }
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
            ticks: {
              callback: function(value) {
                return 'Rs. ' + value.toFixed(0);
              }
            }
          }
        }
      }
    });
  }
}

// Create payment methods chart
function createPaymentChart() {
  const paymentData = {};
  sales.forEach(sale => {
    paymentData[sale.payment] = (paymentData[sale.payment] || 0) + 1;
  });

  const ctx = document.getElementById('payment-chart');
  if (ctx) {
    if (charts.payment) {
      charts.payment.destroy();
    }
    charts.payment = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(paymentData),
        datasets: [{
          data: Object.values(paymentData),
          backgroundColor: [
            '#2563eb',
            '#059669',
            '#d97706',
            '#dc2626',
            '#7c3aed'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

// Create category chart
function createCategoryChart() {
  const categoryData = {};
  sales.forEach(sale => {
    categoryData[sale.category] = (categoryData[sale.category] || 0) + sale.amount;
  });

  const ctx = document.getElementById('category-chart');
  if (ctx) {
    if (charts.category) {
      charts.category.destroy();
    }
    charts.category = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(categoryData),
        datasets: [{
          data: Object.values(categoryData),
          backgroundColor: [
            '#2563eb',
            '#059669',
            '#d97706',
            '#dc2626'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': Rs. ' + context.parsed.toFixed(2);
              }
            }
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
    dailyData[sale.date] = (dailyData[sale.date] || 0) + sale.amount;
  });

  const sortedDates = Object.keys(dailyData).sort();
  const last30Days = sortedDates.slice(-30);
  const values = last30Days.map(date => dailyData[date]);

  const ctx = document.getElementById('daily-chart');
  if (ctx) {
    if (charts.daily) {
      charts.daily.destroy();
    }
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
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'Rs. ' + value.toFixed(0);
              }
            }
          }
        }
      }
    });
  }
}

// Update all charts
function updateCharts() {
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