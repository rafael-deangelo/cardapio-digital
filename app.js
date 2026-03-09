const WHATSAPP_NUMBER = "5511999999999"; // Troque pelo número da loja com DDI e DDD

const products = [
  { id: 1, name: "X-Burger Artesanal", price: 24.9 },
  { id: 2, name: "Batata Frita Grande", price: 16.0 },
  { id: 3, name: "Refrigerante 2L", price: 12.0 },
  { id: 4, name: "Açaí 500ml", price: 18.5 },
  { id: 5, name: "Pizza Broto Calabresa", price: 29.9 },
  { id: 6, name: "Suco Natural", price: 9.0 },
];

const cart = [];

const productListEl = document.getElementById("product-list");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-button");

function currency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function renderProducts() {
  productListEl.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <h3>${product.name}</h3>
      <p><strong>${currency(product.price)}</strong></p>
      <button data-id="${product.id}">Adicionar ao pedido</button>
    `;

    card.querySelector("button").addEventListener("click", () => addToCart(product.id));
    productListEl.appendChild(card);
  });
}

function addToCart(productId) {
  const item = cart.find((entry) => entry.productId === productId);
  if (item) {
    item.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }
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
    const product = products.find((p) => p.id === entry.productId);
    const subtotal = product.price * entry.quantity;
    total += subtotal;

    const itemEl = document.createElement("li");
    itemEl.textContent = `${entry.quantity}x ${product.name}`;

    const subtotalEl = document.createElement("span");
    subtotalEl.textContent = currency(subtotal);

    itemEl.appendChild(subtotalEl);
    cartItemsEl.appendChild(itemEl);
  });

  cartTotalEl.textContent = currency(total);
}

function sendOrderByWhatsApp() {
  const customerName = document.getElementById("customer-name").value.trim();
  const customerAddress = document.getElementById("customer-address").value.trim();

  if (!customerName || !customerAddress) {
    alert("Preencha seu nome e endereço para finalizar o pedido.");
    return;
  }

  if (!cart.length) {
    alert("Adicione pelo menos um produto ao pedido.");
    return;
  }

  let message = `*Novo pedido - Cardápio Digital*%0A`;
  message += `Cliente: ${customerName}%0A`;
  message += `Endereço: ${customerAddress}%0A%0A`;
  message += `*Itens:*%0A`;

  let total = 0;
  cart.forEach((entry) => {
    const product = products.find((p) => p.id === entry.productId);
    const subtotal = product.price * entry.quantity;
    total += subtotal;
    message += `- ${entry.quantity}x ${product.name} (${currency(subtotal)})%0A`;
  });

  message += `%0A*Total:* ${currency(total)}`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
}

checkoutButton.addEventListener("click", sendOrderByWhatsApp);

renderProducts();
renderCart();
