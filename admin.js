const STORAGE_KEY = "cardapio_digital_products";
const PRODUCTS_ENDPOINT = "http://localhost:9000/api/produto/buscartodosintegracao";
const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "123456";

let products = [];

const loginSection = document.getElementById("admin-login");
const panelSection = document.getElementById("admin-panel");
const loginForm = document.getElementById("admin-login-form");
const adminSourceEl = document.getElementById("admin-source");

const adminForm = document.getElementById("admin-product-form");
const adminProductIdEl = document.getElementById("admin-product-id");
const adminProductNameEl = document.getElementById("admin-product-name");
const adminProductPriceEl = document.getElementById("admin-product-price");
const adminProductImageEl = document.getElementById("admin-product-image");
const adminProductActiveEl = document.getElementById("admin-product-active");
const adminProductsListEl = document.getElementById("admin-products-list");
const adminCancelEditButton = document.getElementById("admin-cancel-edit");
const adminLogoutButton = document.getElementById("admin-logout");

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
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeProduct);
  } catch {
    return [];
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
    if (!Array.isArray(list) || !list.length) throw new Error("Sem produtos API");

    products = list.map(normalizeProduct);
    saveProducts();
    adminSourceEl.textContent = "Base carregada da API. Alterações feitas aqui são locais no navegador.";
  } catch {
    products = readLocalProducts();
    adminSourceEl.textContent = "API indisponível. Gerenciando produtos locais no navegador.";
  }

  renderAdminProducts();
}

function getProductById(productId) {
  return products.find((product) => product.id === productId);
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

function renderAdminProducts() {
  adminProductsListEl.innerHTML = "";

  if (!products.length) {
    adminProductsListEl.innerHTML = "<li>Nenhum produto encontrado.</li>";
    return;
  }

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

      const actionsEl = document.createElement("div");
      actionsEl.className = "admin-item-actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "secondary-button";
      editButton.textContent = "Editar";
      editButton.addEventListener("click", () => fillAdminFormForEdit(product.id));

      const toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.textContent = product.active ? "Inativar" : "Ativar";
      toggleButton.addEventListener("click", () => toggleProductActive(product.id));

      actionsEl.append(editButton, toggleButton);
      itemEl.appendChild(actionsEl);
      adminProductsListEl.appendChild(itemEl);
    });
}

function toggleProductActive(productId) {
  const product = getProductById(productId);
  if (!product) return;

  product.active = !product.active;
  saveProducts();
  renderAdminProducts();
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
  renderAdminProducts();
}

function login(event) {
  event.preventDefault();
  const user = document.getElementById("admin-username").value.trim();
  const pass = document.getElementById("admin-password").value;

  if (user !== ADMIN_USER || pass !== ADMIN_PASSWORD) {
    alert("Usuário ou senha inválidos.");
    return;
  }

  loginSection.classList.add("hidden");
  panelSection.classList.remove("hidden");
  loadProducts();
}

function logout() {
  panelSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  loginForm.reset();
  clearAdminForm();
}

loginForm.addEventListener("submit", login);
adminForm.addEventListener("submit", saveProduct);
adminCancelEditButton.addEventListener("click", clearAdminForm);
adminLogoutButton.addEventListener("click", logout);
