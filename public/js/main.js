let products = []
let cart = []
let filteredProducts = []
let currentUser = null
let isLoggedIn = false

const API_BASE_URL = "http://localhost:3000/api"

const productsGrid = document.getElementById("productsGrid")
const loadingSpinner = document.getElementById("loadingSpinner")
const cartModal = document.getElementById("cartModal")
const checkoutModal = document.getElementById("checkoutModal")
const trackingModal = document.getElementById("trackingModal")
const cartCount = document.getElementById("cartCount")
const cartTotal = document.getElementById("cartTotal")

document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus()
  loadProducts()
  setupEventListeners()
  loadCartFromStorage()
})

function setupEventListeners() {
  document.getElementById("searchBtn").addEventListener("click", handleSearch)
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  })

  document.getElementById("categoryFilter").addEventListener("change", applyFilters)
  document.getElementById("sortFilter").addEventListener("change", applyFilters)

  document.getElementById("cartBtn").addEventListener("click", openCartModal)
  document.getElementById("checkoutBtn").addEventListener("click", openCheckoutModal)

  document.getElementById("trackOrderBtn").addEventListener("click", openTrackingModal)
  document.getElementById("trackBtn").addEventListener("click", trackOrder)

  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", function () {
      this.closest(".modal").style.display = "none"
    })
  })

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none"
    }
  })

  document.getElementById("checkoutForm").addEventListener("submit", handleCheckout)

  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", toggleCardDetails)
  })

  document.querySelectorAll(".faq-question").forEach((question) => {
    question.addEventListener("click", function () {
      const answer = this.nextElementSibling
      const isActive = this.classList.contains("active")

      document.querySelectorAll(".faq-question").forEach((q) => q.classList.remove("active"))
      document.querySelectorAll(".faq-answer").forEach((a) => a.classList.remove("active"))

      if (!isActive) {
        this.classList.add("active")
        answer.classList.add("active")
      }
    })
  })

  document.getElementById("supportForm").addEventListener("submit", handleSupportForm)

  setupAuthEventListeners()
}

function setupAuthEventListeners() {
  document.getElementById("loginBtn").addEventListener("click", openLoginModal)
  document.getElementById("registerBtn").addEventListener("click", openRegisterModal)
  document.getElementById("logoutBtn").addEventListener("click", handleLogout)

  document.getElementById("loginForm").addEventListener("submit", handleLogin)
  document.getElementById("registerForm").addEventListener("submit", handleRegister)
}

function openLoginModal() {
  document.getElementById("loginModal").style.display = "block"
}

function openRegisterModal() {
  document.getElementById("registerModal").style.display = "block"
}

function switchToRegister() {
  document.getElementById("loginModal").style.display = "none"
  document.getElementById("registerModal").style.display = "block"
}

function switchToLogin() {
  document.getElementById("registerModal").style.display = "none"
  document.getElementById("loginModal").style.display = "block"
}

async function handleRegister(e) {
  e.preventDefault()

  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const phone = document.getElementById("registerPhone").value
  const password = document.getElementById("registerPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value

  if (password !== confirmPassword) {
    showNotification("Passwords do not match!", "error")
    return
  }

  const userData = {
    name,
    email,
    phone,
    password,
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    const result = await response.json()

    if (response.ok) {
      showNotification("Hisob yaratildi! Iltimos, tizimga kiring.")
      document.getElementById("registerModal").style.display = "none"
      document.getElementById("registerForm").reset()
      openLoginModal()
    } else {
      showNotification(result.error || "Ro‘yxatdan o‘tish amalga oshmadi. Iltimos, qayta urinib koʻring.", "error")
    }
  } catch (error) {
    console.error("Registration error:", error)
    showNotification("Ro‘yxatdan o‘tish amalga oshmadi. Iltimos, qayta urinib koʻring.", "error")
  }
}

async function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value
  const isAdmin = document.getElementById("isAdmin").checked

  const loginData = {
    email,
    password,
    isAdmin,
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    })

    const result = await response.json()

    if (response.ok) {
      currentUser = result.user
      isLoggedIn = true

      localStorage.setItem("currentUser", JSON.stringify(currentUser))
      localStorage.setItem("authToken", result.token)

      if (result.user.isAdmin) {
        showNotification("Administratorga kirish muvaffaqiyatli! Administrator paneliga yoʻnaltirilmoqda...")
        document.getElementById("loginModal").style.display = "none"
        document.getElementById("loginForm").reset()

        setTimeout(() => {
          window.location.href = "admin.html"
        }, 1000)
      } else {
        showNotification(`Xush kelibsiz, ${result.user.name}!`)
        updateAuthUI()
        document.getElementById("loginModal").style.display = "none"
        document.getElementById("loginForm").reset()
      }
    } else {
      showNotification(result.error || "Tizimga kirishda xatolik yuz berdi. Hisob maʼlumotlaringizni tekshiring.", "error")
    }
  } catch (error) {
    console.error("Login error:", error)
    showNotification("Tizimga kirishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.", "error")
  }
}

function handleLogout() {
  currentUser = null
  isLoggedIn = false
  localStorage.removeItem("currentUser")
  localStorage.removeItem("authToken")
  updateAuthUI()
  showNotification("Hisobdan muvaffaqiyatli chiqdi!")
}

function updateAuthUI() {
  const loginBtn = document.getElementById("loginBtn")
  const registerBtn = document.getElementById("registerBtn")
  const logoutBtn = document.getElementById("logoutBtn")
  const userWelcome = document.getElementById("userWelcome")

  if (isLoggedIn && currentUser) {
    loginBtn.style.display = "none"
    registerBtn.style.display = "none"
    logoutBtn.style.display = "inline-block"
    userWelcome.style.display = "inline-block"
    userWelcome.textContent = `${currentUser.name}`
  } else {
    loginBtn.style.display = "inline-block"
    registerBtn.style.display = "inline-block"
    logoutBtn.style.display = "none"
    userWelcome.style.display = "none"
  }
}

function checkAuthStatus() {
  const savedUser = localStorage.getItem("currentUser")
  const authToken = localStorage.getItem("authToken")

  if (savedUser && authToken) {
    currentUser = JSON.parse(savedUser)
    isLoggedIn = true
    updateAuthUI()
  }
}

function requireAuth() {
  if (!isLoggedIn) {
    showNotification("Xaridni davom ettirish uchun tizimga kiring!", "error")
    openLoginModal()
    return false
  }
  return true
}

async function loadProducts() {
  try {
    loadingSpinner.style.display = "block"
    const response = await fetch(`${API_BASE_URL}/products`)
    products = await response.json()
    filteredProducts = [...products]
    displayProducts(filteredProducts)
  } catch (error) {
    console.error("Mahsulotlarni yuklashda xatolik:", error)
    productsGrid.innerHTML = "<p>Mahsulotlarni yuklashda xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.</p>"
  } finally {
    loadingSpinner.style.display = "none"
  }
}

function displayProducts(productsToShow) {
  if (productsToShow.length === 0) {
    productsGrid.innerHTML = "<p>Hech qanday mahsulot topilmadi.</p>"
    return
  }

  productsGrid.innerHTML = productsToShow
    .map(
      (product) => `
        <div class="product-card">
            <img src="${product.image || "/placeholder.svg?height=200&width=280"}" 
                 alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <div class="product-rating">
                    ${"★".repeat(Math.floor(product.rating || 5))}${"☆".repeat(5 - Math.floor(product.rating || 5))}
                    <span>(${product.rating || 5})</span>
                </div>
                <p class="product-description">${product.description}</p>
                <button class="add-to-cart" onclick="addToCart('${product._id}')">
                    Savatga qo'shish
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

function handleSearch() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()
  filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm),
  )
  applyFilters()
}

function applyFilters() {
  const categoryFilter = document.getElementById("categoryFilter").value
  const sortFilter = document.getElementById("sortFilter").value

  let filtered = [...filteredProducts]

  if (categoryFilter) {
    filtered = filtered.filter((product) => product.category === categoryFilter)
  }

  switch (sortFilter) {
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name))
      break
    case "price-low":
      filtered.sort((a, b) => a.price - b.price)
      break
    case "price-high":
      filtered.sort((a, b) => b.price - a.price)
      break
    case "rating":
      filtered.sort((a, b) => (b.rating || 5) - (a.rating || 5))
      break
  }

  displayProducts(filtered)
}

function addToCart(productId) {
  const product = products.find((p) => p._id === productId)
  if (!product) return

  const existingItem = cart.find((item) => item.productId === productId)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({
      productId: productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    })
  }

  updateCartUI()
  saveCartToStorage()

  showNotification("Mahsulot savatga qo'shildi!")
}

function updateCartUI() {
  cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0)

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  cartTotal.textContent = total.toFixed(2)

  const cartItems = document.getElementById("cartItems")
  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Savatingiz boʻsh</p>"
    return
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity('${item.productId}', -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.productId}', 1)">+</button>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.productId}')">O'chirish</button>
        </div>
    `,
    )
    .join("")
}

function updateQuantity(productId, change) {
  const item = cart.find((item) => item.productId === productId)
  if (!item) return

  item.quantity += change

  if (item.quantity <= 0) {
    removeFromCart(productId)
  } else {
    updateCartUI()
    saveCartToStorage()
  }
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.productId !== productId)
  updateCartUI()
  saveCartToStorage()
}

function saveCartToStorage() {
  localStorage.setItem("cart", JSON.stringify(cart))
}

function loadCartFromStorage() {
  const savedCart = localStorage.getItem("cart")
  if (savedCart) {
    cart = JSON.parse(savedCart)
    updateCartUI()
  }
}

function openCartModal() {
  updateCartUI()
  cartModal.style.display = "block"
}

function openCheckoutModal() {
  if (cart.length === 0) {
    showNotification("Savatingiz boʻsh!")
    return
  }

  if (!requireAuth()) {
    return
  }

  cartModal.style.display = "none"
  checkoutModal.style.display = "block"
}

function toggleCardDetails() {
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value
  const cardDetails = document.getElementById("cardDetails")

  if (paymentMethod === "card") {
    cardDetails.style.display = "block"
    cardDetails.querySelectorAll("input").forEach((input) => (input.required = true))
  } else {
    cardDetails.style.display = "none"
    cardDetails.querySelectorAll("input").forEach((input) => (input.required = false))
  }
}

async function handleCheckout(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const orderData = {
    items: cart,
    shipping: {
      fullName: formData.get("fullName"),
      address: formData.get("address"),
      city: formData.get("city"),
      zipCode: formData.get("zipCode"),
      phone: formData.get("phone"),
    },
    payment: {
      method: formData.get("paymentMethod"),
      cardNumber: formData.get("cardNumber"),
      expiryDate: formData.get("expiryDate"),
      cvv: formData.get("cvv"),
    },
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }

  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })

    const result = await response.json()

    if (response.ok) {
      showNotification(`Buyurtma muvaffaqiyatli rasmiylashtirildi! Buyurtma raqami: ${result.orderId}`)
      cart = []
      updateCartUI()
      saveCartToStorage()
      checkoutModal.style.display = "none"
    } else {
      showNotification("Buyurtma berishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.")
    }
  } catch (error) {
    console.error("Buyurtmani joylashtirishda xatolik yuz berdi:", error)
    showNotification("Buyurtma berishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.")
  }
}

function openTrackingModal() {
  trackingModal.style.display = "block"
}

async function trackOrder() {
  const orderId = document.getElementById("orderIdInput").value.trim()
  if (!orderId) {
    showNotification("Please enter an order ID")
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/track`)
    const result = await response.json()

    if (response.ok) {
      displayTrackingResult(result)
    } else {
      document.getElementById("trackingResult").innerHTML = "<p>Buyurtma topilmadi. Buyurtma identifikatorini tekshiring.</p>"
    }
  } catch (error) {
    console.error("Error tracking order:", error)
    document.getElementById("trackingResult").innerHTML = "<p>Buyurtmani kuzatishda xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.</p>"
  }
}

function displayTrackingResult(orderData) {
  const trackingResult = document.getElementById("trackingResult")

  trackingResult.innerHTML = `
        <div class="order-status">
            <h4>Order #${orderData.orderId}</h4>
            <p><strong>Status:</strong> ${orderData.status}</p>
            <p><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString()}</p>
            <p><strong>Total:</strong> $${orderData.total.toFixed(2)}</p>
            
            <div class="status-timeline">
                <div class="status-step ${orderData.status === "pending" ? "current" : "completed"}">
                    <div>📋</div>
                    <div>Order Placed</div>
                </div>
                <div class="status-step ${orderData.status === "processing" ? "current" : orderData.status === "shipped" || orderData.status === "delivered" ? "completed" : ""}">
                    <div>⚙️</div>
                    <div>Processing</div>
                </div>
                <div class="status-step ${orderData.status === "shipped" ? "current" : orderData.status === "delivered" ? "completed" : ""}">
                    <div>🚚</div>
                    <div>Shipped</div>
                </div>
                <div class="status-step ${orderData.status === "delivered" ? "current" : ""}">
                    <div>📦</div>
                    <div>Delivered</div>
                </div>
            </div>
        </div>
    `
}

async function handleSupportForm(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const supportData = {
    name: formData.get("name") || e.target.querySelector('input[type="text"]').value,
    email: formData.get("email") || e.target.querySelector('input[type="email"]').value,
    message: formData.get("message") || e.target.querySelector("textarea").value,
  }

  try {
    const response = await fetch(`${API_BASE_URL}/support`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(supportData),
    })

    if (response.ok) {
      showNotification("Yordam xabari muvaffaqiyatli yuborildi!")
      e.target.reset()
    } else {
      showNotification("Xabar yuborishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.")
    }
  } catch (error) {
    console.error("Yordam xabarini yuborishda xatolik yuz berdi:", error)
    showNotification("Xabar yuborishda xatolik yuz berdi. Iltimos, qayta urinib koʻring.")
  }
}

function scrollToProducts() {
  document.getElementById("products").scrollIntoView({ behavior: "smooth" })
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div")
  const bgColor = type === "error" ? "#dc3545" : "#28a745"

  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 1rem 2rem;
    border-radius: 5px;
    z-index: 3000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}
