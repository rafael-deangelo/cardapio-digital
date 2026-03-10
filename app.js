const WHATSAPP_NUMBER = "5511999999999";
const STORAGE_KEY = "cardapio_digital_products";
const PRODUCTS_ENDPOINT = "http://localhost:9000/api/produto/buscartodosintegracao";

const defaultProducts = [
  { id: 1, name: "X-Burger Artesanal", price: 24.9, image: "", active: true },
  { id: 2, name: "Batata Frita Grande", price: 16.0, image: "", active: true },
  { id: 3, name: "Refrigerante 2L", price: 12.0, image: "", active: true },
];

let products = [];
const cart = [];

const productListEl = document.getElementById("product-list");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-button");
const clearCartButton = document.getElementById("clear-cart-button");
const paymentMethodEl = document.getElementById("payment-method");
const catalogSourceEl = document.getElementById("catalog-source");

const cepEl = document.getElementById("customer-cep");
const streetEl = document.getElementById("customer-street");
const numberEl = document.getElementById("customer-number");
const neighborhoodEl = document.getElementById("customer-neighborhood");
const cityEl = document.getElementById("customer-city");
const stateEl = document.getElementById("customer-state");

function currency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeProduct(raw, index) {
  const id = Number(raw.id ?? raw.codigo ?? raw.produtoId ?? index + 1);
  const price = Number(raw.price ?? raw.valor ?? raw.preco ?? 0);

  return {
    id: Number.isNaN(id) ? index + 1 : id,
    name: String(raw.name ?? raw.nome ?? "Produto sem nome"),
    price: Number.isNaN(price) ? 0 : price,
    image: String(raw.image ?? raw.imagem ?? raw.foto ?? ""),
    active: raw.active ?? raw.ativo ?? true,
  };
}

function readLocalProducts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [...defaultProducts];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [...defaultProducts];
    return parsed.map(normalizeProduct).filter((product) => product.price > 0);
  } catch {
    return [...defaultProducts];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

async function loadProducts() {
  try {
    const response = await fetch(PRODUCTS_ENDPOINT);
    if (!response.ok) throw new Error("Falha na API");

    const data = await response.json();
    const list = Array.isArray(data) ? data : data?.content || data?.data || [];
    if (!Array.isArray(list) || !list.length) throw new Error("Sem produtos na API");

    products = list.map(normalizeProduct).filter((product) => product.price > 0);
    saveProducts();
    catalogSourceEl.textContent = "Produtos carregados da API de integração.";
  } catch {
    products = readLocalProducts();
    catalogSourceEl.textContent = "API indisponível: exibindo produtos locais (cache).";
  }

  renderProducts();
  renderCart();
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
  if (item) item.quantity += 1;
  else cart.push({ productId, quantity: 1 });

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
    itemEl.innerHTML = `<div><span>${entry.quantity}x ${product.name}</span><small>${currency(subtotal)}</small></div>`;

    const removeButton = document.createElement("button");
    removeButton.className = "remove-item-button";
    removeButton.type = "button";
    removeButton.textContent = "Remover";
    removeButton.addEventListener("click", () => removeItemFromCart(entry.productId));

    itemEl.appendChild(removeButton);
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
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (data.erro) throw new Error();

    streetEl.value = data.logradouro || "";
    neighborhoodEl.value = data.bairro || "";
    cityEl.value = data.localidade || "";
    stateEl.value = data.uf || "";
    numberEl.focus();
  } catch {
    alert("Não foi possível buscar o endereço pelo CEP.");
  }
}

function getAddress() {
  const address = {
    cep: cepEl.value.trim(),
    street: streetEl.value.trim(),
    number: numberEl.value.trim(),
    neighborhood: neighborhoodEl.value.trim(),
    city: cityEl.value.trim(),
    state: stateEl.value.trim(),
  };

  if (Object.values(address).some((value) => !value)) return null;
  return address;
}

function sendOrderByWhatsApp() {
  const customerName = document.getElementById("customer-name").value.trim();
  const paymentMethod = paymentMethodEl.value;
  const address = getAddress();

  if (!customerName || !paymentMethod || !address) {
    alert("Preencha nome, pagamento e endereço completo.");
    return;
  }

  if (!cart.length) {
    alert("Adicione pelo menos um produto ao pedido.");
    return;
  }

  let total = 0;
  let message = "*Novo pedido - Cardápio Digital*%0A";
  message += `Cliente: ${customerName}%0A`;
  message += `Pagamento: ${paymentMethod}%0A`;
  message += `Endereço: ${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state} - CEP ${address.cep}%0A%0A`;
  message += "*Itens:*%0A";

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

checkoutButton.addEventListener("click", sendOrderByWhatsApp);
clearCartButton.addEventListener("click", clearCart);
cepEl.addEventListener("input", formatCepInput);
cepEl.addEventListener("blur", fetchAddressByCep);

loadProducts();
