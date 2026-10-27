/**
 * ==============================================================================
 * SHOPMASTER 🛒 - APLICACIÓN DE E-COMMERCE POTENCIADA CON INTELIGENCIA ARTIFICIAL
 * ==============================================================================
 * Funcionalidades Principales:
 * 1. Consumo asíncrono de la API FakeStore (https://fakestoreapi.com/products)
 * 2. Renderizado dinámico de tarjetas de productos y filtrado interactivo
 * 3. Ventana modal con información detallada y selector de cantidad
 * 4. Carrito de compras reactivo con persistencia en LocalStorage
 * 5. Pasarela de pago simulada con validación de datos bancarios
 * 6. Generación e impresión de ticket térmico en formato PDF (80mm) con jsPDF
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// ------------------------------------------------------------------------------
let allProducts = [];               // Catálogo completo recibido de la API
let displayedProducts = [];         // Catálogo filtrado en pantalla
let cart = [];                      // Carrito de compras del usuario
let selectedProductForModal = null; // Producto actualmente cargado en el modal
let lastCompletedOrder = null;      // Información de la última compra para el PDF

// Clave para almacenamiento en LocalStorage
const CART_STORAGE_KEY = 'shopmaster_cart_v1';

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');
const productCountLabel = document.getElementById('productCountLabel');
const searchInput = document.getElementById('searchInput');
const searchInputMobile = document.getElementById('searchInputMobile');
const categoryFilters = document.getElementById('categoryFilters');
const cartCountBadge = document.getElementById('cartCount');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartTaxesEl = document.getElementById('cartTaxes');
const cartTotalEl = document.getElementById('cartTotal');
const btnClearCart = document.getElementById('btnClearCart');
const btnGoToCheckout = document.getElementById('btnGoToCheckout');
const checkoutTotalDisplay = document.getElementById('checkoutTotalDisplay');
const paymentForm = document.getElementById('paymentForm');
const btnDownloadPDF = document.getElementById('btnDownloadPDF');

// Instancias de Modales Bootstrap
let productDetailModalInstance = null;
let cartOffcanvasInstance = null;
let checkoutModalInstance = null;
let receiptModalInstance = null;

// ------------------------------------------------------------------------------
// 2. INICIALIZACIÓN AL CARGAR LA PÁGINA
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar instancias de Bootstrap
  productDetailModalInstance = new bootstrap.Modal(document.getElementById('productDetailModal'));
  cartOffcanvasInstance = new bootstrap.Offcanvas(document.getElementById('cartOffcanvas'));
  checkoutModalInstance = new bootstrap.Modal(document.getElementById('checkoutModal'));
  receiptModalInstance = new bootstrap.Modal(document.getElementById('receiptModal'));

  // Cargar carrito persistido en LocalStorage
  loadCartFromLocalStorage();

  // Obtener productos desde la FakeStore API
  fetchProducts();

  // Registrar eventos de interacción
  setupEventListeners();
});

// ------------------------------------------------------------------------------
// 3. OBTENCIÓN DE DATOS (FETCH API)
// ------------------------------------------------------------------------------
async function fetchProducts() {
  loadingSpinner.classList.remove('d-none');
  errorAlert.classList.add('d-none');
  productsGrid.innerHTML = '';

  try {
    const response = await fetch('https://fakestoreapi.com/products');
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - No se pudo conectar a la API.`);
    }

    allProducts = await response.json();
    displayedProducts = [...allProducts];

    // Ocultar spinner y renderizar
    loadingSpinner.classList.add('d-none');
    renderProducts(displayedProducts);
    updateProductCount(displayedProducts.length);
  } catch (error) {
    console.error('Error al consultar FakeStore API:', error);
    loadingSpinner.classList.add('d-none');
    errorAlert.classList.remove('d-none');
    productCountLabel.textContent = 'Error al cargar catálogo.';
  }
}

// ------------------------------------------------------------------------------
// 4. RENDERIZADO DE CARDS DE PRODUCTOS
// ------------------------------------------------------------------------------
function renderProducts(productsList) {
  productsGrid.innerHTML = '';

  if (productsList.length === 0) {
    productsGrid.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="fa-solid fa-box-open text-muted display-4 mb-3"></i>
        <h4 class="text-secondary">No se encontraron productos</h4>
        <p class="text-muted small">Intenta ajustar tu búsqueda o seleccionar otra categoría.</p>
      </div>
    `;
    return;
  }

  productsList.forEach(product => {
    const cardCol = document.createElement('div');
    cardCol.className = 'col';

    cardCol.innerHTML = `
      <div class="product-card h-100">
        <div class="card-img-wrapper">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" loading="lazy">
        </div>
        <div class="card-body">
          <span class="badge bg-light text-primary border mb-2 text-uppercase fs-xs align-self-start">
            ${escapeHtml(product.category)}
          </span>
          <h5 class="product-title" title="${escapeHtml(product.title)}">
            ${escapeHtml(product.title)}
          </h5>
          <p class="product-desc-preview mb-3">
            ${escapeHtml(product.description)}
          </p>
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="price-tag">$${product.price.toFixed(2)}</span>
              <div class="text-warning small">
                <i class="fa-solid fa-star"></i>
                <span class="text-dark fw-bold">${product.rating ? product.rating.rate : '4.5'}</span>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm flex-grow-1 fw-semibold btn-view-more" data-id="${product.id}">
                🔍 Ver más
              </button>
              <button class="btn btn-success btn-sm btn-quick-add" data-id="${product.id}" title="Agregar 1 unidad al carrito">
                🛒
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    productsGrid.appendChild(cardCol);
  });
}

function updateProductCount(count) {
  productCountLabel.textContent = `Mostrando ${count} producto${count === 1 ? '' : 's'} disponibles`;
}

// ------------------------------------------------------------------------------
// 5. VENTANA MODAL DE DETALLE DEL PRODUCTO
// ------------------------------------------------------------------------------
function openProductDetailModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  selectedProductForModal = product;

  // Poblar campos del modal
  document.getElementById('modalProductImage').src = product.image;
  document.getElementById('modalProductImage').alt = product.title;
  document.getElementById('modalProductTitle').textContent = product.title;
  document.getElementById('modalProductCategory').textContent = product.category;
  document.getElementById('modalProductPrice').textContent = `$${product.price.toFixed(2)}`;
  document.getElementById('modalProductDescription').textContent = product.description;
  document.getElementById('modalQuantity').value = 1;

  // Rating Stars
  const ratingRate = product.rating ? product.rating.rate : 4.5;
  const ratingCount = product.rating ? product.rating.count : 120;
  const starsContainer = document.getElementById('modalProductRatingStars');
  starsContainer.innerHTML = generateStarIcons(ratingRate);
  document.getElementById('modalProductRatingText').textContent = `${ratingRate} (${ratingCount} valoraciones)`;

  // Mostrar modal
  productDetailModalInstance.show();
}

function generateStarIcons(rate) {
  let stars = '';
  const fullStars = Math.floor(rate);
  const hasHalfStar = rate % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fa-solid fa-star"></i> ';
  }
  if (hasHalfStar) {
    stars += '<i class="fa-solid fa-star-half-stroke"></i> ';
  }
  const emptyStars = 5 - Math.ceil(rate);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="fa-regular fa-star"></i> ';
  }
  return stars;
}

// ------------------------------------------------------------------------------
// 6. GESTIÓN DEL CARRITO DE COMPRAS (LOCALSTORAGE REACTIVO)
// ------------------------------------------------------------------------------
function addToCart(product, quantity = 1) {
  const existingItemIndex = cart.findIndex(item => item.id === product.id);

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: quantity
    });
  }

  saveCartToLocalStorage();
  updateCartUI();

  // Feedback visual momentáneo
  showToastNotification(`🛍️ ¡"${product.title.substring(0, 25)}..." agregado al carrito!`);
}

function updateCartItemQuantity(productId, change) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex === -1) return;

  cart[itemIndex].quantity += change;

  if (cart[itemIndex].quantity <= 0) {
    cart.splice(itemIndex, 1);
  }

  saveCartToLocalStorage();
  updateCartUI();
}

function removeCartItem(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCartToLocalStorage();
  updateCartUI();
}

function clearCart() {
  if (cart.length === 0) return;
  if (confirm('¿Estás seguro de que deseas vaciar tu carrito de compras?')) {
    cart = [];
    saveCartToLocalStorage();
    updateCartUI();
  }
}

function saveCartToLocalStorage() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error al leer LocalStorage:', e);
    cart = [];
  }
  updateCartUI();
}

// Actualiza toda la interfaz del carrito (Offcanvas y contadores)
function updateCartUI() {
  // Cantidad total de items
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountBadge.textContent = totalCount;

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxes = subtotal * 0.18; // 18% ITBIS / Impuesto simulado
  const grandTotal = subtotal + taxes;

  cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  cartTaxesEl.textContent = `$${taxes.toFixed(2)}`;
  cartTotalEl.textContent = `$${grandTotal.toFixed(2)}`;
  checkoutTotalDisplay.textContent = `$${grandTotal.toFixed(2)}`;

  // Renderizar items del offcanvas
  cartItemsContainer.innerHTML = '';

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="fa-solid fa-cart-shopping display-4 mb-3 text-secondary opacity-50"></i>
        <h6>Tu carrito está vacío</h6>
        <p class="small">Agrega productos desde el catálogo para comenzar tu compra.</p>
      </div>
    `;
    btnGoToCheckout.disabled = true;
    return;
  }

  btnGoToCheckout.disabled = false;

  cart.forEach(item => {
    const itemRow = document.createElement('div');
    itemRow.className = 'cart-item-row d-flex align-items-center gap-3';

    itemRow.innerHTML = `
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="cart-item-thumb">
      <div class="flex-grow-1 min-w-0">
        <div class="cart-item-title mb-1" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="fw-bold text-success small">$${(item.price * item.quantity).toFixed(2)}</span>
          <div class="d-flex align-items-center gap-1">
            <button class="btn btn-outline-secondary cart-qty-btn btn-qty-dec" data-id="${item.id}">-</button>
            <span class="small fw-bold px-2">${item.quantity}</span>
            <button class="btn btn-outline-secondary cart-qty-btn btn-qty-inc" data-id="${item.id}">+</button>
            <button class="btn btn-outline-danger cart-qty-btn ms-2 btn-remove-item" data-id="${item.id}" title="Eliminar ítem">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    cartItemsContainer.appendChild(itemRow);
  });
}

// ------------------------------------------------------------------------------
// 7. PASARELA DE PAGO (SIMULADA)
// ------------------------------------------------------------------------------
function proceedToCheckout() {
  if (cart.length === 0) {
    alert('Tu carrito de compras está vacío.');
    return;
  }

  // Cerrar el offcanvas del carrito y abrir el modal de checkout
  cartOffcanvasInstance.hide();
  checkoutModalInstance.show();
}

function handlePaymentSubmission(e) {
  e.preventDefault();

  const cardNameInput = document.getElementById('cardName');
  const cardNumberInput = document.getElementById('cardNumber');
  const cardExpiryInput = document.getElementById('cardExpiry');
  const cardCVVInput = document.getElementById('cardCVV');
  const btnSubmit = document.getElementById('btnSubmitPayment');

  // Validación básica de campos
  let isValid = true;

  if (!cardNameInput.value.trim()) {
    cardNameInput.classList.add('is-invalid');
    isValid = false;
  } else {
    cardNameInput.classList.remove('is-invalid');
  }

  // Tarjeta (al menos 16 dígitos numéricos sin contar espacios)
  const digitsOnly = cardNumberInput.value.replace(/\s+/g, '');
  if (digitsOnly.length < 15 || digitsOnly.length > 16) {
    cardNumberInput.classList.add('is-invalid');
    isValid = false;
  } else {
    cardNumberInput.classList.remove('is-invalid');
  }

  // Expiración MM/AA
  if (!/^\d{2}\/\d{2}$/.test(cardExpiryInput.value.trim())) {
    cardExpiryInput.classList.add('is-invalid');
    isValid = false;
  } else {
    cardExpiryInput.classList.remove('is-invalid');
  }

  // CVV (3 o 4 dígitos)
  if (!/^\d{3,4}$/.test(cardCVVInput.value.trim())) {
    cardCVVInput.classList.add('is-invalid');
    isValid = false;
  } else {
    cardCVVInput.classList.remove('is-invalid');
  }

  if (!isValid) return;

  // Simulación de procesamiento de transacción
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span> Procesando pago seguro...`;

  setTimeout(() => {
    // Restaurar botón
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `✅ Pagar Ahora y Generar Ticket`;

    // Guardar detalles de la orden completada
    const now = new Date();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxes = subtotal * 0.18;
    const total = subtotal + taxes;
    const orderNumber = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

    lastCompletedOrder = {
      orderNumber: orderNumber,
      clientName: cardNameInput.value.trim().toUpperCase(),
      cardLastDigits: digitsOnly.slice(-4),
      date: now.toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      time: now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      items: [...cart],
      subtotal: subtotal,
      taxes: taxes,
      total: total
    };

    // Actualizar vista previa en pantalla del ticket térmico
    updateReceiptModalPreview(lastCompletedOrder);

    // Vaciar carrito y LocalStorage
    cart = [];
    saveCartToLocalStorage();
    updateCartUI();

    // Resetear formulario
    paymentForm.reset();

    // Transición de modales
    checkoutModalInstance.hide();
    receiptModalInstance.show();
  }, 1400);
}

function updateReceiptModalPreview(order) {
  document.getElementById('ticketPreviewClient').textContent = `CLIENTE: ${order.clientName}`;
  document.getElementById('ticketPreviewDate').textContent = `FECHA: ${order.date}  HORA: ${order.time}`;
  document.getElementById('ticketPreviewOrder').textContent = `ORDEN #: ${order.orderNumber}`;
  document.getElementById('ticketPreviewTotal').textContent = `$${order.total.toFixed(2)}`;

  const itemsContainer = document.getElementById('ticketPreviewItems');
  itemsContainer.innerHTML = '';

  order.items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'd-flex justify-content-between my-1';
    const shortTitle = item.title.length > 20 ? item.title.substring(0, 18) + '..' : item.title;
    row.innerHTML = `
      <span>${item.quantity}x ${shortTitle}</span>
      <span>$${(item.price * item.quantity).toFixed(2)}</span>
    `;
    itemsContainer.appendChild(row);
  });
}

// ------------------------------------------------------------------------------
// 8. GENERACIÓN DE TICKET TÉRMICO EN PDF (80MM CON JSPDF)
// ------------------------------------------------------------------------------
function generateThermalReceiptPDF() {
  if (!lastCompletedOrder) {
    alert('No hay ninguna orden reciente para generar el ticket.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const order = lastCompletedOrder;

  // Calcular altura dinámica en mm para que el papel térmico no corte el texto
  // 80mm de ancho estándar de impresora POS (Epson, Bixolon, Star)
  const baseHeight = 90;
  const itemHeight = 10;
  const calculatedHeight = Math.max(130, baseHeight + (order.items.length * itemHeight));

  // Crear documento jsPDF con formato térmico estrecho
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, calculatedHeight]
  });

  // Configuración de tipografía monoespaciada tipo caja registradora
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);

  let y = 8;
  const leftX = 5;
  const centerX = 40;
  const rightX = 75;

  // Encabezado del Comercio
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text('SHOPMASTER DIGITAL', centerX, y, { align: 'center' });
  y += 4;
  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.text('RNC / TAX ID: 101-9876543-2', centerX, y, { align: 'center' });
  y += 3.5;
  doc.text('Av. Las Américas #45, Edif. Tech', centerX, y, { align: 'center' });
  y += 3.5;
  doc.text('Tel: (809) 555-0199 / Santo Domingo', centerX, y, { align: 'center' });
  y += 4.5;
  doc.text('========================================', centerX, y, { align: 'center' });
  y += 4;

  // Datos Fiscales y del Cliente
  doc.setFont('courier', 'bold');
  doc.text('TICKET DE VENTA FISCAL (B02)', centerX, y, { align: 'center' });
  y += 4;
  doc.setFont('courier', 'normal');
  doc.text(`TICKET #: ${order.orderNumber}`, leftX, y);
  y += 3.5;
  doc.text(`FECHA   : ${order.date}  ${order.time}`, leftX, y);
  y += 3.5;
  doc.text(`CLIENTE : ${order.clientName.substring(0, 24)}`, leftX, y);
  y += 3.5;
  doc.text(`PAGO    : TARJETA CRÉDITO (**** ${order.cardLastDigits})`, leftX, y);
  y += 3.5;
  doc.text(`ESTADO  : TRANSACCIÓN APROBADA`, leftX, y);
  y += 4.5;
  doc.text('----------------------------------------', centerX, y, { align: 'center' });
  y += 3.5;

  // Cabecera de Ítems
  doc.setFont('courier', 'bold');
  doc.text('CANT  DESCRIPCIÓN              TOTAL', leftX, y);
  y += 3;
  doc.setFont('courier', 'normal');
  doc.text('----------------------------------------', centerX, y, { align: 'center' });
  y += 4;

  // Detalle de Ítems
  order.items.forEach(item => {
    // Truncar descripción o cortarla para formato térmico
    const lineQty = `${item.quantity}x`.padEnd(5, ' ');
    const maxTitleLength = 18;
    const cleanTitle = item.title.replace(/[^\w\s-]/gi, '');
    const shortTitle = cleanTitle.length > maxTitleLength 
      ? cleanTitle.substring(0, maxTitleLength) 
      : cleanTitle.padEnd(maxTitleLength, ' ');
    const lineTotal = `$${(item.price * item.quantity).toFixed(2)}`;

    doc.text(`${lineQty} ${shortTitle}`, leftX, y);
    doc.text(lineTotal, rightX, y, { align: 'right' });
    y += 3.5;

    // Sublínea con precio unitario
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    doc.text(`      (P.Unit: $${item.price.toFixed(2)})`, leftX, y);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    y += 4;
  });

  // Totales
  doc.text('----------------------------------------', centerX, y, { align: 'center' });
  y += 4;
  doc.text('SUBTOTAL:', leftX, y);
  doc.text(`$${order.subtotal.toFixed(2)}`, rightX, y, { align: 'right' });
  y += 3.5;
  doc.text('ITBIS / TAX (18%):', leftX, y);
  doc.text(`$${order.taxes.toFixed(2)}`, rightX, y, { align: 'right' });
  y += 4;

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL A PAGAR:', leftX, y);
  doc.text(`$${order.total.toFixed(2)}`, rightX, y, { align: 'right' });
  y += 5;

  // Pie de Página del Ticket
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('========================================', centerX, y, { align: 'center' });
  y += 4;
  doc.text('TOTAL ARTÍCULOS: ' + order.items.reduce((acc, i) => acc + i.quantity, 0), centerX, y, { align: 'center' });
  y += 3.5;
  doc.setFont('courier', 'bold');
  doc.text('¡GRACIAS POR SU COMPRA!', centerX, y, { align: 'center' });
  y += 3.5;
  doc.setFont('courier', 'normal');
  doc.text('Conserve este ticket para devoluciones', centerX, y, { align: 'center' });
  y += 3.5;
  doc.text('Plataforma Web E-Commerce con IA', centerX, y, { align: 'center' });

  // Guardar archivo PDF con descarga directa
  doc.save(`Ticket_ShopMaster_${order.orderNumber}.pdf`);
}

// ------------------------------------------------------------------------------
// 9. CONFIGURACIÓN DE EVENT LISTENERS
// ------------------------------------------------------------------------------
function setupEventListeners() {
  // Delegación de eventos para clicks en la cuadrícula de productos
  productsGrid.addEventListener('click', e => {
    const btnViewMore = e.target.closest('.btn-view-more');
    if (btnViewMore) {
      const id = parseInt(btnViewMore.dataset.id, 10);
      openProductDetailModal(id);
      return;
    }

    const btnQuickAdd = e.target.closest('.btn-quick-add');
    if (btnQuickAdd) {
      const id = parseInt(btnQuickAdd.dataset.id, 10);
      const product = allProducts.find(p => p.id === id);
      if (product) addToCart(product, 1);
      return;
    }
  });

  // Modal: Controles de cantidad
  document.getElementById('btnDecreaseModalQty').addEventListener('click', () => {
    const qtyInput = document.getElementById('modalQuantity');
    let val = parseInt(qtyInput.value, 10) || 1;
    if (val > 1) qtyInput.value = val - 1;
  });

  document.getElementById('btnIncreaseModalQty').addEventListener('click', () => {
    const qtyInput = document.getElementById('modalQuantity');
    let val = parseInt(qtyInput.value, 10) || 1;
    if (val < 99) qtyInput.value = val + 1;
  });

  // Modal: Agregar al carrito con cantidad seleccionada
  document.getElementById('btnAddToCartFromModal').addEventListener('click', () => {
    if (!selectedProductForModal) return;
    const qty = parseInt(document.getElementById('modalQuantity').value, 10) || 1;
    addToCart(selectedProductForModal, qty);
    productDetailModalInstance.hide();
  });

  // Delegación en el Carrito Offcanvas
  cartItemsContainer.addEventListener('click', e => {
    const btnInc = e.target.closest('.btn-qty-inc');
    if (btnInc) {
      updateCartItemQuantity(parseInt(btnInc.dataset.id, 10), 1);
      return;
    }

    const btnDec = e.target.closest('.btn-qty-dec');
    if (btnDec) {
      updateCartItemQuantity(parseInt(btnDec.dataset.id, 10), -1);
      return;
    }

    const btnRemove = e.target.closest('.btn-remove-item');
    if (btnRemove) {
      removeCartItem(parseInt(btnRemove.dataset.id, 10));
      return;
    }
  });

  // Vaciar carrito
  btnClearCart.addEventListener('click', clearCart);

  // Ir a Checkout
  btnGoToCheckout.addEventListener('click', proceedToCheckout);

  // Envío del Formulario de Pago
  paymentForm.addEventListener('submit', handlePaymentSubmission);

  // Botón de Descarga del Ticket PDF
  btnDownloadPDF.addEventListener('click', generateThermalReceiptPDF);

  // Búsqueda en tiempo real (Escritorio)
  searchInput.addEventListener('input', e => {
    filterProductsBySearch(e.target.value);
  });

  // Búsqueda en tiempo real (Móvil)
  searchInputMobile.addEventListener('input', e => {
    filterProductsBySearch(e.target.value);
  });

  // Filtros de categoría
  categoryFilters.addEventListener('click', e => {
    const btn = e.target.closest('.btn-category');
    if (!btn) return;

    // Cambiar clase activa
    categoryFilters.querySelectorAll('.btn-category').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const selectedCategory = btn.dataset.category;
    if (selectedCategory === 'all') {
      displayedProducts = [...allProducts];
    } else {
      displayedProducts = allProducts.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    renderProducts(displayedProducts);
    updateProductCount(displayedProducts.length);
  });

  // Formato asistido para tarjeta de crédito (Espacios cada 4 números)
  const cardNumberInput = document.getElementById('cardNumber');
  cardNumberInput.addEventListener('input', e => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    const groups = val.match(/.{1,4}/g);
    e.target.value = groups ? groups.join(' ') : '';

    // Cambiar ícono según franquicia
    const iconSpan = document.getElementById('cardBrandIcon');
    if (val.startsWith('4')) {
      iconSpan.innerHTML = '<i class="fa-brands fa-cc-visa text-primary"></i>';
    } else if (val.startsWith('5')) {
      iconSpan.innerHTML = '<i class="fa-brands fa-cc-mastercard text-danger"></i>';
    } else if (val.startsWith('3')) {
      iconSpan.innerHTML = '<i class="fa-brands fa-cc-amex text-info"></i>';
    } else {
      iconSpan.innerHTML = '<i class="fa-solid fa-credit-card text-muted"></i>';
    }
  });

  // Formato asistido para Vencimiento (MM/AA)
  const cardExpiryInput = document.getElementById('cardExpiry');
  cardExpiryInput.addEventListener('input', e => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    e.target.value = val.substring(0, 5);
  });

  // Formato para CVV (solo números)
  const cardCVVInput = document.getElementById('cardCVV');
  cardCVVInput.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
  });
}

// ------------------------------------------------------------------------------
// 10. FUNCIONES AUXILIARES
// ------------------------------------------------------------------------------
function filterProductsBySearch(term) {
  const query = term.toLowerCase().trim();
  if (!query) {
    displayedProducts = [...allProducts];
  } else {
    displayedProducts = allProducts.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }
  renderProducts(displayedProducts);
  updateProductCount(displayedProducts.length);
}

function showToastNotification(message) {
  // Crear toast dinámico ligero
  const toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-white bg-dark border-0 position-fixed bottom-0 end-0 m-3 shadow-lg';
  toastEl.style.zIndex = '1090';
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body small fw-semibold">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  document.body.appendChild(toastEl);
  const toastInstance = new bootstrap.Toast(toastEl, { delay: 2800 });
  toastInstance.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
