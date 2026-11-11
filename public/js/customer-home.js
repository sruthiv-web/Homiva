
document.addEventListener("DOMContentLoaded", () => {
    loadFeaturedProducts();
});

async function loadFeaturedProducts() {
    const productContainer = document.getElementById("featuredProducts");

    if (!productContainer) return;

    try {
        const response = await fetch("/api/products/featured");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Failed to load products");
        }

        if (result.data.length === 0) {
            productContainer.innerHTML =
                "<p class='empty-message'>No featured products available yet.</p>";
            return;
        }

        productContainer.innerHTML = result.data.map(product => `
            <article class="product-card">
                <a href="/products" class="product-image">
                    <img
                        src="${escapeHTML(product.image || "/images/product-placeholder.jpg")}"
                        alt="${escapeHTML(product.name)}"
                        loading="lazy"
                    >
                </a>

                <div class="product-info">
                    <p class="product-category">
                        ${escapeHTML(product.category)}
                    </p>
                    <h3>${escapeHTML(product.name)}</h3>
                    <p class="product-price">
                        ₹${Number(product.price).toLocaleString("en-IN")}
                    </p>
                </div>
            </article>
        `).join("");
    } catch (error) {
        console.error("Featured products error:", error);
        productContainer.innerHTML =
            "<p class='error-message'>Unable to load products. Please try again later.</p>";
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}
async function updateCartCount() {
    const cartCountElement = document.getElementById("cartCount");

    if (!cartCountElement) return;

    try {
        const response = await fetch("/api/cart", {
            credentials: "same-origin"
        });

        if (!response.ok) return;

        const result = await response.json();

        if (!result.success) return;

        const items = result.data.items || [];

        const totalQuantity = items.reduce((total, item) => {
            return total + Number(item.quantity || 0);
        }, 0);

        cartCountElement.textContent = totalQuantity;
    } catch (error) {
        console.error("Cart count error:", error);
    }
}

document.addEventListener("DOMContentLoaded", updateCartCount);