// ========== Глобальные переменные ==========
let cart = JSON.parse(localStorage.getItem('cart')) || [];

const products = [
  { id: 1, title: "Фісташки", price: 200, image: "images/products/pistashio.png" },
  { id: 2, title: "Мигдаль", price: 300, image: "images/products/mindal.png" },
  { id: 3, title: "Макадамія", price: 350, image: "images/products/makadamia.png" },
  { id: 4, title: "Арахіс", price: 400, image: "images/products/nut.png" },
  { id: 5, title: "Курага", price: 450, image: "images/products/kuraga.png" },
  { id: 6, title: "Кеш'ю", price: 400, image: "images/products/keshyou.png" },
  { id: 7, title: "Інжир", price: 400, image: "images/products/ingir.png" },
  { id: 8, title: "Фундук", price: 400, image: "images/products/lesnoy.png" },
  { id: 9, title: "Гарбузове насіння", price: 450, image: "images/products/garbuz.png" }
];

const elements = {
  productGrid: document.getElementById('productGrid'),
  cartCounts: document.querySelectorAll('.cart-count'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  cartModal: document.getElementById('cartModal'),
  cartButton: document.getElementById('cartButton'),
  cartButtonMobile: document.getElementById('cartButtonMobile'),
  mobileMenuToggle: document.querySelector('.mobile-menu-toggle'),
  nav: document.querySelector('.nav')
};

// ========== Основные функции ========== //

function init() {
  renderProducts();
  renderCart();
  setupListeners();
}

function renderProducts() {
  if (!elements.productGrid) return;
  elements.productGrid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-image" style="background-image: url('${p.image}')"></div>
      <div class="product-info">
        <h3>${p.title}</h3>
        <p>${p.price} грн</p>
        <button class="add-to-cart" data-id="${p.id}">Додати в кошик</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.add-to-cart').forEach(btn =>
    btn.addEventListener('click', addToCart)
  );
}

function addToCart(e) {
  const id = +e.target.dataset.id;
  const product = products.find(p => p.id === id);
  if (!product) return;

  const item = cart.find(i => i.id === id);
  item ? item.quantity++ : cart.push({ ...product, quantity: 1 });
  renderCart();
}

function renderCart() {
  localStorage.setItem('cart', JSON.stringify(cart));

  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
  elements.cartCounts.forEach(c => {
    c.textContent = totalItems;
    c.style.display = totalItems ? 'flex' : 'none';
  });

  if (!elements.cartItems || !elements.cartTotal) return;
  if (!cart.length) {
    elements.cartItems.innerHTML = '<div class="empty-cart">Кошик порожній</div>';
    elements.cartTotal.textContent = '0';
    return;
  }

  let total = 0;
  elements.cartItems.innerHTML = cart.map(item => {
    const sum = item.price * item.quantity;
    total += sum;
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}" class="cart-item-image">
        <div class="cart-item-info">
          <span>${item.title}</span>
          <span>${item.price} грн × ${item.quantity} = ${sum} грн</span>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="quantity-btn minus" data-id="${item.id}">−</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn plus" data-id="${item.id}">+</button>
          </div>
          <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
  }).join('');

  elements.cartTotal.textContent = total;

  document.querySelectorAll('.quantity-btn.minus').forEach(btn =>
    btn.addEventListener('click', e => changeQuantity(+e.target.dataset.id, -1)));

  document.querySelectorAll('.quantity-btn.plus').forEach(btn =>
    btn.addEventListener('click', e => changeQuantity(+e.target.dataset.id, 1)));

  document.querySelectorAll('.remove-item').forEach(btn =>
    btn.addEventListener('click', e => removeItem(+e.target.dataset.id)));
}

function changeQuantity(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

// ========== Оформлення замовлення ========== //

async function submitOrder() {
  if (!cart.length) {
    alert('Кошик порожній!');
    return;
  }

  const order = {  // Переименовано orderData в order для consistency
    name: document.getElementById('customerName').value.trim(),
    phone: document.getElementById('customerPhone').value.trim(),
    address: document.getElementById('customerAddress').value.trim(),
    email: document.getElementById('customerEmail').value.trim() || '-',
    comment: document.getElementById('customerComment').value.trim() || '-',
    products: cart.map(i => `${i.title} (${i.quantity}шт)`).join(', '),
    total: calculateTotal()
  };

  if (!order.name || !order.phone || !order.address) {
    alert("Будь ласка, заповніть обов'язкові поля");
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/submit-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),  // Исправлено orderData на order
      credentials: 'omit'  // Лучше использовать вместо mode: 'cors'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Сервер повернув помилку');
    }

    alert(`Замовлення #${result.orderId || 'N/A'} успішно оформлено!`);
    clearCartAndForm();
    
  } catch (error) {
    console.error('Помилка відправки замовлення:', error);
    alert(`Помилка при оформленні: ${error.message}`);
    
    // Дополнительное логирование для отладки
    if (error.response) {
      console.error('Деталі помилки:', await error.response.text());
    }
  }
}


function calculateTotal() {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function clearCartAndForm() {
  cart = [];
  localStorage.removeItem('cart');
  updateCart();
  
  document.getElementById('cartModal').style.display = 'none';
  
  // Очистка формы
  ['customerName', 'customerPhone', 'customerEmail', 'customerAddress', 'customerComment']
      .forEach(id => document.getElementById(id).value = '');
}

// ========== Модальные окна ========== //

function toggleModal(id, show = true) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.style.display = show ? 'block' : 'none';
  document.body.style.overflow = show ? 'hidden' : 'auto';
}

function setupModalListeners() {
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) toggleModal(modal.id, false);
    });
  });

  window.addEventListener('click', e => {
    if (e.target.classList.contains('modal')) toggleModal(e.target.id, false);
  });
}

// ========== Мобильное меню ========== //

function setupMobileMenu() {
  const toggle = elements.mobileMenuToggle;
  const nav = elements.nav;
  if (!toggle || !nav) return;

  toggle.innerHTML = '<i class="fas fa-bars"></i>';

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    nav.classList.toggle('active');
    toggle.innerHTML = nav.classList.contains('active') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  document.querySelectorAll('.nav-link, .nav-button').forEach(el => {
    el.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        nav.classList.remove('active');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && nav.classList.contains('active')) {
      nav.classList.remove('active');
      toggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
  });

  document.addEventListener('click', e => {
    if (window.innerWidth <= 768 && nav.classList.contains('active') && !nav.contains(e.target) && e.target !== toggle) {
      nav.classList.remove('active');
      toggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
  });
}

// ========== Слушатели событий ========== //

function setupListeners() {
  elements.cartButton?.addEventListener('click', () => toggleModal('cartModal'));
  elements.cartButtonMobile?.addEventListener('click', () => toggleModal('cartModal'));
  document.getElementById('submitOrder')?.addEventListener('click', e => {
    e.preventDefault();
    submitOrder();
  });
  document.getElementById('deliveryInfoButton')?.addEventListener('click', () => toggleModal('deliveryInfoModal'));
  document.getElementById('contactsButton')?.addEventListener('click', () => toggleModal('contactsModal'));
  setupModalListeners();
  setupMobileMenu();
}

document.addEventListener('DOMContentLoaded', init);