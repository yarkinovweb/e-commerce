let products = [];
let orders = [];
let analytics = {};

const API_BASE_URL = "https://e-commerce-c5fu.onrender.com/api";

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
  setupNavigation();
  loadDashboardData();
  setupEventListeners();
});

function checkAdminAuth() {
  const authToken = localStorage.getItem("authToken");
  const currentUser = localStorage.getItem("currentUser");

  if (!authToken || !currentUser) {
    alert("Ushbu panelga kirish uchun administrator sifatida tizimga kiring");
    window.location.href = "/index.html";
    return false;
  }

  try {
    const user = JSON.parse(currentUser);
    if (!user.isAdmin) {
      alert("Administrator ruxsati talab qilinadi");
      window.location.href = "index.html";
      return false;
    }
  } catch (error) {
    console.error(
      "Foydalanuvchi maʼlumotlarini tahlil qilishda xatolik yuz berdi:",
      error
    );
    window.location.href = "index.html";
    return false;
  }

  return true;
}

function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".content-section");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active class from all links and sections
      navLinks.forEach((l) => l.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

      // Add active class to clicked link
      this.classList.add("active");

      // Show corresponding section
      const sectionId = this.getAttribute("data-section");
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.add("active");
        document.getElementById("pageTitle").textContent =
          this.textContent.trim();

        // Load section-specific data
        loadSectionData(sectionId);
      }
    });
  });
}

function setupEventListeners() {
  document
    .getElementById("productForm")
    .addEventListener("submit", handleProductSubmit);

  document
    .getElementById("orderStatusFilter")
    .addEventListener("change", filterOrders);

  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", function () {
      this.closest(".modal").style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  });
}

async function loadDashboardData() {
  try {
    const [analyticsResponse, productsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/analytics`, {
        headers: getAuthHeaders(),
      }),
      fetch(`${API_BASE_URL}/products`),
    ]);

    if (!analyticsResponse.ok) {
      throw new Error(
        `Analytics so‘rovi bajarilmadi: ${analyticsResponse.status}`
      );
    }

    analytics = await analyticsResponse.json();
    products = await productsResponse.json();

    updateDashboardStats();
    displayRecentOrders(analytics.recentOrders);
    displayTopProducts(analytics.topProducts);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    if (error.message.includes("401") || error.message.includes("403")) {
      alert("Seans muddati tugadi. Iltimos, qayta kiring.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    }
  }
}

function updateDashboardStats() {
  document.getElementById("totalOrders").textContent =
    analytics.totalOrders || 0;
  document.getElementById("totalRevenue").textContent = `$${(
    analytics.totalRevenue || 0
  ).toFixed(2)}`;
  document.getElementById("totalProducts").textContent = products.length;
  document.getElementById("totalCustomers").textContent =
    analytics.totalOrders || 0; // Simplified
}

function displayRecentOrders(recentOrders) {
  const container = document.getElementById("recentOrders");

  if (!recentOrders || recentOrders.length === 0) {
    container.innerHTML = "<p>Oxirgi buyurtmalar yo'q</p>";
    return;
  }

  container.innerHTML = recentOrders
    .map(
      (order) => `
        <div class="order-item">
            <div class="order-info">
                <div class="order-id">${order.orderId}</div>
                <div class="order-date">${new Date(
                  order.orderDate
                ).toLocaleDateString()}</div>
            </div>
            <div class="order-total">$${order.total.toFixed(2)}</div>
        </div>
    `
    )
    .join("");
}

function displayTopProducts(topProducts) {
  const container = document.getElementById("topProducts");

  if (!topProducts || topProducts.length === 0) {
    container.innerHTML = "<p>Savdo maʼlumotlari mavjud emas</p>";
    return;
  }

  container.innerHTML = topProducts
    .map(
      (product) => `
        <div class="product-item">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-sold">${product.totalSold} sold</div>
            </div>
            <div class="product-revenue">$${product.revenue.toFixed(2)}</div>
        </div>
    `
    )
    .join("");
}

async function loadSectionData(sectionId) {
  switch (sectionId) {
    case "products":
      await loadProducts();
      break;
    case "orders":
      await loadOrders();
      break;
    case "analytics":
      await loadAnalytics();
      break;
    case "support":
      await loadSupportMessages();
      break;
  }
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error(`Mahsulotlar yuklanmadi: ${response.status}`);
    }
    products = await response.json();
    displayProducts();
  } catch (error) {
    console.error("Mahsulotlarni yuklashda xatolik yuz berdi:", error);
    showNotification(
      "Mahsulotlarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib koʻring."
    );
  }
}

function displayProducts() {
  const tbody = document.getElementById("productsTable");

  tbody.innerHTML = products
    .map(
      (product) => `
        <tr>
            <td>
                <img src="${
                  product.image || "/placeholder.svg?height=50&width=50"
                }" 
                     alt="${product.name}" class="product-image-small">
            </td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price}</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn-secondary btn-small" onclick="editProduct('${
                  product._id
                }')">
                    <i class="fas fa-edit"></i> Tahrirlash
                </button>
                <button class="btn-danger btn-small" onclick="deleteProduct('${
                  product._id
                }')">
                    <i class="fas fa-trash"></i> O'chirish
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

async function loadOrders() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Buyurtmalar yuklanmadi: ${response.status}`);
    }
    orders = await response.json();
    displayOrders(orders);
  } catch (error) {
    console.error("Buyurtmalarni yuklashda xatolik yuz berdi:", error);
    showNotification(
      "Buyurtmalarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib koʻring."
    );
  }
}

function displayOrders(ordersToShow = orders) {
  const tbody = document.getElementById("ordersTable");

  if (!ordersToShow || ordersToShow.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6">Hech qanday buyurtma topilmadi</td></tr>';
    return;
  }

  tbody.innerHTML = ordersToShow
    .map(
      (order) => `
        <tr>
            <td>${order.orderId}</td>
            <td>${order.shipping?.fullName || "N/A"}</td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td>
                <span class="status-badge status-${order.status}">${
        order.status
      }</span>
            </td>
            <td>
                <select onchange="updateOrderStatus('${
                  order._id
                }', this.value)">
                    <option value="pending" ${
                      order.status === "pending" ? "selected" : ""
                    }>Kutilmoqda</option>
                    <option value="processing" ${
                      order.status === "processing" ? "selected" : ""
                    }>Jarayonda</option>
                    <option value="shipped" ${
                      order.status === "shipped" ? "selected" : ""
                    }>Jo'natildi</option>
                    <option value="delivered" ${
                      order.status === "delivered" ? "selected" : ""
                    }>Yetqazildi</option>
                </select>
                <button class="btn-secondary btn-small" onclick="viewOrderDetails('${
                  order._id
                }')">
                    <i class="fas fa-eye"></i> Ko'rish
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

function filterOrders() {
  const status = document.getElementById("orderStatusFilter").value;

  if (status === "") {
    displayOrders(orders);
  } else {
    const filtered = orders.filter((order) => order.status === status);
    displayOrders(filtered);
  }
}

async function loadAnalytics() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Analitika yuklanmadi: ${response.status}`);
    }
    const analyticsData = await response.json();
    displayBestSellingProducts(analyticsData.topProducts);
  } catch (error) {
    console.error("Analitikani yuklashda xatolik:", error);
    showNotification(
      "Analitikani yuklashda xatolik yuz berdi. Iltimos, qayta urinib koʻring."
    );
  }
}

function displayBestSellingProducts(topProducts) {
  const container = document.getElementById("bestSellingProducts");

  if (!topProducts || topProducts.length === 0) {
    container.innerHTML = "<p>Savdo maʼlumotlari mavjud emas</p>";
    return;
  }

  container.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Mahsulot</th>
                        <th>Sotilganlar</th>
                        <th>Daromad</th>
                    </tr>
                </thead>
                <tbody>
                    ${topProducts
                      .map(
                        (product) => `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.totalSold}</td>
                            <td>$${product.revenue.toFixed(2)}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
    `;
}

async function loadSupportMessages() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/support`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Yordam xabarlari yuklanmadi: ${response.status}`);
    }
    const messages = await response.json();
    displaySupportMessages(messages);
  } catch (error) {
    console.error("Yordam xabarlarini yuklashda xatolik yuz berdi:", error);
    showNotification(
      "Yordam xabarlarini yuklashda xatolik yuz berdi. Iltimos, qayta urinib koʻring."
    );
  }
}

function displaySupportMessages(messages) {
  const tbody = document.getElementById("supportTable");

  if (!messages || messages.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6">Hech qanday yordam xabari topilmadi</td></tr>';
    return;
  }

  tbody.innerHTML = messages
    .map(
      (message) => `
        <tr>
            <td>${new Date(message.createdAt).toLocaleDateString()}</td>
            <td>${message.name}</td>
            <td>${message.email}</td>
            <td>${message.message.substring(0, 50)}${
        message.message.length > 50 ? "..." : ""
      }</td>
            
            <td>
            </td>
        </tr>
    `
    )
    .join("");
}

function openProductModal(productId = null) {
  const modal = document.getElementById("productModal");
  const form = document.getElementById("productForm");
  const title = document.getElementById("productModalTitle");

  if (productId) {
    const product = products.find((p) => p._id === productId);
    if (product) {
      title.textContent = "Mahsulotni tahrirlash";
      document.getElementById("productId").value = product._id;
      document.getElementById("productName").value = product.name;
      document.getElementById("productDescription").value = product.description;
      document.getElementById("productPrice").value = product.price;
      document.getElementById("productStock").value = product.stock;
      document.getElementById("productCategory").value = product.category;
      document.getElementById("productImage").value = product.image || "";
    }
  } else {
    title.textContent = "Mahsulot qo'shish";
    form.reset();
    document.getElementById("productId").value = "";
  }

  modal.style.display = "block";
}

async function handleProductSubmit(e) {
  e.preventDefault();

  const productId = document.getElementById("productId").value;
  const productData = {
    name: document.getElementById("productName").value,
    description: document.getElementById("productDescription").value,
    price: Number.parseFloat(document.getElementById("productPrice").value),
    stock: Number.parseInt(document.getElementById("productStock").value),
    category: document.getElementById("productCategory").value,
    image:
      document.getElementById("productImage").value ||
      "/placeholder.svg?height=200&width=280",
  };

  try {
    let response;
    if (productId) {
      response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });
    } else {
      response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });
    }

    if (response.ok) {
      showNotification(
        productId
          ? "Mahsulot muvaffaqiyatli yangilandi!"
          : "Mahsulot muvaffaqiyatli qo'shildi!"
      );
      document.getElementById("productModal").style.display = "none";
      await loadProducts();
    } else {
      const errorData = await response.json();
      showNotification(`Error: ${errorData.error || "Mahsulot saqlanmadi"}`);
    }
  } catch (error) {
    console.error("Mahsulotni saqlashda xatolik yuz berdi:", error);
    showNotification(
      "Mahsulotni saqlashda xatolik yuz berdi. Iltimos, qayta urinib koʻring."
    );
  }
}

function editProduct(productId) {
  openProductModal(productId);
}

async function deleteProduct(productId) {
  if (!confirm("Haqiqatan ham ushbu mahsulotni oʻchirib tashlamoqchimisiz?")) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/products/${productId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (response.ok) {
      showNotification("Mahsulot muvvaffaqiyatli o'chirildi!");
      await loadProducts();
    } else {
      const errorData = await response.json();
      showNotification(
        `Error: ${errorData.error || "Mahsulotni oʻchirib boʻlmadi"}`
      );
    }
  } catch (error) {
    console.error("Mahsulot o'chirishda xatolik:", error);
    showNotification(
      "Mahsulotni oʻchirishda xatolik yuz berdi. Iltimos, qayta urinib koʻring."
    );
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/orders/${orderId}/status`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (response.ok) {
      showNotification("Buyurtma holati muvaffaqiyatli yangilandi!");
      await loadOrders();
    } else {
      const errorData = await response.json();
      showNotification(
        `Error: ${errorData.error || "Buyurtma holatini yangilab bo‘lmadi"}`
      );
    }
  } catch (error) {
    console.error("Buyurtma holatini yangilashda xatolik:", error);
    showNotification(
      "Buyurtma holatini yangilashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring."
    );
  }
}

function viewOrderDetails(orderId) {
  const order = orders.find((o) => o._id === orderId);
  if (order) {
    const itemsList = order.items
      .map((item) => `${item.name} (x${item.quantity})`)
      .join("\n");
    alert(
      `Order Details:\n\nOrder ID: ${order.orderId}\nCustomer: ${
        order.shipping?.fullName || "N/A"
      }\nTotal: $${order.total.toFixed(2)}\nStatus: ${
        order.status
      }\n\nItems:\n${itemsList}`
    );
  }
}

async function markAsResolved(messageId) {
  showNotification("Xabar hal qilindi!");
  await loadSupportMessages();
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  const bgColor = type === "success" ? "#27ae60" : "#e74c3c";

  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 3000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        max-width: 300px;
        word-wrap: break-word;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}
