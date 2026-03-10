const WHATSAPP_NUMBER = "5511999999999"; // Troque pelo número da loja com DDI e DDD
const STORAGE_KEY = "cardapio_digital_products";

const defaultProducts = [
  { id: 1, name: "X-Burger Artesanal", price: 24.9, image: "", active: true },
  { id: 2, name: "Batata Frita Grande", price: 16.0, image: "", active: true },
  { id: 3, name: "Refrigerante 2L", price: 12.0, image: "", active: true },
  { id: 4, name: "Açaí 500ml", price: 18.5, image: "", active: true },
  { id: 5, name: "Pizza Broto Calabresa", price: 29.9, image: "", active: true },
  { id: 6, name: "Suco Natural", price: 9.0, image: "", active: true },
];

let products = loadProducts();
const cart = [];

const productListEl = document.getElementById("product-list");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-button");
const clearCartButton = document.getElementById("clear-cart-button");
const paymentMethodEl = document.getElementById("payment-method");

const cepEl = document.getElementById("customer-cep");
const streetEl = document.getElementById("customer-street");
const numberEl = document.getElementById("customer-number");
const neighborhoodEl = document.getElementById("customer-neighborhood");
const cityEl = document.getElementById("customer-city");
const stateEl = document.getElementById("customer-state");

const adminForm = document.getElementById("admin-product-form");
const adminProductIdEl = document.getElementById("admin-product-id");
const adminProductNameEl = document.getElementById("admin-product-name");
const adminProductPriceEl = document.getElementById("admin-product-price");
const adminProductImageEl = document.getElementById("admin-product-image");
const adminProductActiveEl = document.getElementById("admin-product-active");
const adminProductsListEl = document.getElementById("admin-products-list");
const adminCancelEditButton = document.getElementById("admin-cancel-edit");

function currency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function loadProducts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [...defaultProducts];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [...defaultProducts];

    return parsed.map((product) => ({
      id: Number(product.id),
      name: String(product.name),
      price: Number(product.price),
      image: product.image ? String(product.image) : "",
      active: product.active !== false,
    }));
  } catch {
    return [...defaultProducts];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function getProductById(productId) {
  return products.find((product) => product.id === productId);
}

function renderProducts() {
  productListEl.innerHTML = "";
  const activeProducts = products.filter((product) => product.active);

  if (!activeProducts.length) {
    productListEl.innerHTML = "<p>Nenhum produto ativo no momento.</p>";
    return;
  }

  activeProducts.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageHtml = product.image
      ? `<img src="${product.image}" alt="${product.name}" class="product-image" />`
      : '<div class="product-image product-image-placeholder">Sem imagem</div>';

    card.innerHTML = `
      ${imageHtml}
      <h3>${product.name}</h3>
      <p><strong>${currency(product.price)}</strong></p>
      <button data-id="${product.id}" type="button">Adicionar ao pedido</button>
    `;

    card.querySelector("button").addEventListener("click", () => addToCart(product.id));
    productListEl.appendChild(card);
  });
}

function addToCart(productId) {
  const product = getProductById(productId);
  if (!product || !product.active) return;

  const item = cart.find((entry) => entry.productId === productId);
  if (item) {
    item.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }
  renderCart();
}

function removeItemFromCart(productId) {
  const index = cart.findIndex((item) => item.productId === productId);
  if (index === -1) return;

  cart.splice(index, 1);
  renderCart();
}

function clearCart() {
  cart.length = 0;
  renderCart();
}

function renderCart() {
  cartItemsEl.innerHTML = "";

  if (!cart.length) {
    const emptyState = document.createElement("li");
    emptyState.textContent = "Seu carrinho está vazio.";
    cartItemsEl.appendChild(emptyState);
    cartTotalEl.textContent = currency(0);
    return;
  }

  let total = 0;

  cart.forEach((entry) => {
    const product = getProductById(entry.productId);
    if (!product) return;

    const subtotal = product.price * entry.quantity;
    total += subtotal;

    const itemEl = document.createElement("li");
    itemEl.className = "cart-item";

    const detailsEl = document.createElement("div");
    detailsEl.innerHTML = `<span>${entry.quantity}x ${product.name}</span><small>${currency(subtotal)}</small>`;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-item-button";
    removeButton.type = "button";
    removeButton.textContent = "Remover";
    removeButton.addEventListener("click", () => removeItemFromCart(entry.productId));

    itemEl.append(detailsEl, removeButton);
    cartItemsEl.appendChild(itemEl);
  });

  cartTotalEl.textContent = currency(total);
}

function formatCepInput() {
  const digits = cepEl.value.replace(/\D/g, "").slice(0, 8);
  cepEl.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

async function fetchAddressByCep() {
  const cep = cepEl.value.replace(/\D/g, "");
  if (cep.length !== 8) return;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error("Falha ao consultar CEP.");

    const data = await response.json();
    if (data.erro) {
      alert("CEP não encontrado.");
      return;
    }

    streetEl.value = data.logradouro || "";
    neighborhoodEl.value = data.bairro || "";
    cityEl.value = data.localidade || "";
    stateEl.value = data.uf || "";
    numberEl.focus();
  } catch {
    alert("Não foi possível buscar o endereço pelo CEP.");
  }
}

function getAddressText() {
  const cep = cepEl.value.trim();
  const street = streetEl.value.trim();
  const number = numberEl.value.trim();
  const neighborhood = neighborhoodEl.value.trim();
  const city = cityEl.value.trim();
  const state = stateEl.value.trim();

  if (!cep || !street || !number || !neighborhood || !city || !state) {
    return null;
  }

  return { cep, street, number, neighborhood, city, state };
}

function sendOrderByWhatsApp() {
  const customerName = document.getElementById("customer-name").value.trim();
  const paymentMethod = paymentMethodEl.value;
  const address = getAddressText();

  if (!customerName || !address || !paymentMethod) {
    alert("Preencha nome, forma de pagamento e endereço completo para finalizar o pedido.");
    return;
  }

  if (!cart.length) {
    alert("Adicione pelo menos um produto ao pedido.");
    return;
  }

  let message = "*Novo pedido - Cardápio Digital*%0A";
  message += `Cliente: ${customerName}%0A`;
  message += `Pagamento: ${paymentMethod}%0A`;
  message += `Endereço: ${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state} - CEP ${address.cep}%0A%0A`;
  message += "*Itens:*%0A";

  let total = 0;
  cart.forEach((entry) => {
    const product = getProductById(entry.productId);
    if (!product) return;

    const subtotal = product.price * entry.quantity;
    total += subtotal;
    message += `- ${entry.quantity}x ${product.name} (${currency(subtotal)})%0A`;
  });

  message += `%0A*Total:* ${currency(total)}`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
}

function renderAdminProducts() {
  adminProductsListEl.innerHTML = "";

  products
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((product) => {
      const itemEl = document.createElement("li");
      itemEl.className = "admin-product-item";
      itemEl.innerHTML = `
        <div>
          <strong>${product.name}</strong>
          <small>${currency(product.price)} • ${product.active ? "Ativo" : "Inativo"}</small>
        </div>
      `;

      const buttonsWrap = document.createElement("div");
      buttonsWrap.className = "admin-item-actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "secondary-button";
      editButton.textContent = "Editar";
      editButton.addEventListener("click", () => fillAdminFormForEdit(product.id));

      const toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.textContent = product.active ? "Inativar" : "Ativar";
      toggleButton.addEventListener("click", () => toggleProductActive(product.id));

      buttonsWrap.append(editButton, toggleButton);
      itemEl.appendChild(buttonsWrap);
      adminProductsListEl.appendChild(itemEl);
    });
}

function clearAdminForm() {
  adminForm.reset();
  adminProductIdEl.value = "";
  adminProductActiveEl.checked = true;
}

function fillAdminFormForEdit(productId) {
  const product = getProductById(productId);
  if (!product) return;

  adminProductIdEl.value = String(product.id);
  adminProductNameEl.value = product.name;
  adminProductPriceEl.value = String(product.price);
  adminProductImageEl.value = product.image;
  adminProductActiveEl.checked = product.active;
}

function saveProduct(event) {
  event.preventDefault();

  const id = adminProductIdEl.value ? Number(adminProductIdEl.value) : null;
  const name = adminProductNameEl.value.trim();
  const price = Number(adminProductPriceEl.value);
  const image = adminProductImageEl.value.trim();
  const active = adminProductActiveEl.checked;

  if (!name || Number.isNaN(price) || price <= 0) {
    alert("Preencha nome e preço válido.");
    return;
  }

  if (id) {
    const product = getProductById(id);
    if (!product) return;

    product.name = name;
    product.price = price;
    product.image = image;
    product.active = active;
  } else {
    const newId = products.length ? Math.max(...products.map((product) => product.id)) + 1 : 1;
    products.push({ id: newId, name, price, image, active });
  }

  saveProducts();
  clearAdminForm();
  renderProducts();
  renderCart();
  renderAdminProducts();
}

function toggleProductActive(productId) {
  const product = getProductById(productId);
  if (!product) return;

  product.active = !product.active;
  saveProducts();

  for (let i = cart.length - 1; i >= 0; i -= 1) {
    if (cart[i].productId === productId && !product.active) {
      cart.splice(i, 1);
    }
  }

  renderProducts();
  renderCart();
  renderAdminProducts();
}

checkoutButton.addEventListener("click", sendOrderByWhatsApp);
clearCartButton.addEventListener("click", clearCart);

cepEl.addEventListener("input", formatCepInput);
cepEl.addEventListener("blur", fetchAddressByCep);

adminForm.addEventListener("submit", saveProduct);
adminCancelEditButton.addEventListener("click", clearAdminForm);

renderProducts();
renderCart();
renderAdminProducts();
