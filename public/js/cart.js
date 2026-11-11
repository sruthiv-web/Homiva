
const cartItemsContainer = document.getElementById("cart-items");
const cartItemCount = document.getElementById("cart-item-count");
const cartCountElement = document.getElementById("cartCount");

const subtotalElement = document.getElementById("cart-subtotal");
const shippingElement = document.getElementById("cart-shipping");
const discountElement = document.getElementById("cart-discount");
const totalElement = document.getElementById("cart-total");

const couponInput = document.getElementById("coupon-code");
const applyCouponButton = document.getElementById("apply-coupon");
const couponMessage = document.getElementById("coupon-message");
const availableCouponsContainer =
    document.getElementById("available-coupons");

let appliedCoupon = null;
let discountAmount = 0;
let availableCoupons = [];

// Load available coupons from database
async function loadAvailableCoupons() {
    try {
        const response = await fetch("/api/cart/coupons/available", {
            credentials: "same-origin"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error("Unable to load coupons:", result.message);
            availableCoupons = [];
            return;
        }

        availableCoupons = result.data || [];

    } catch (error) {
        console.error("Coupon loading error:", error);
        availableCoupons = [];
    }
}

// Calculate discount
function calculateDiscount(subtotal) {
    const coupon = availableCoupons.find(
        item => item.code === appliedCoupon
    );

    if (!coupon || subtotal < coupon.minPurchase) {
        return 0;
    }

    let discount = 0;

    if (coupon.discountType === "FLAT") {
        discount = coupon.discountValue;

    } else if (coupon.discountType === "PERCENTAGE") {
        discount = subtotal * coupon.discountValue / 100;

        if (coupon.maxDiscountAmount !== null) {
            discount = Math.min(
                discount,
                coupon.maxDiscountAmount
            );
        }
    }

    return Math.min(discount, subtotal);
}

// Display available coupons
function displayAvailableCoupons(subtotal) {
    availableCouponsContainer.replaceChildren();

    const eligibleCoupons = availableCoupons.filter(
        coupon => subtotal >= coupon.minPurchase
    );

    if (eligibleCoupons.length === 0) {
        availableCouponsContainer.textContent =
            "No available coupons for your purchase.";
        return;
    }

    eligibleCoupons.forEach(coupon => {
        const couponCard = document.createElement("div");
        couponCard.className = "available-coupon";

        const couponInfo = document.createElement("p");

        if (coupon.discountType === "FLAT") {
            couponInfo.textContent =
                `${coupon.code} - ₹${coupon.discountValue} OFF`;
        } else {
            couponInfo.textContent =
                `${coupon.code} - ${coupon.discountValue}% OFF (Up to ₹${coupon.maxDiscountAmount})`;
        }

        const selectButton = document.createElement("button");
        selectButton.type = "button";
        selectButton.textContent = "Select Coupon";

        selectButton.addEventListener("click", () => {
            couponInput.value = coupon.code;
            couponMessage.textContent =
                `${coupon.code} selected. Click Apply to use it.`;
        });

        couponCard.append(couponInfo, selectButton);
        availableCouponsContainer.appendChild(couponCard);
    });
}

// Apply coupon
applyCouponButton.addEventListener("click", async () => {
    const couponCode = couponInput.value.trim().toUpperCase();

    if (!couponCode) {
        couponMessage.textContent = "Please enter a coupon code.";
        return;
    }

    try {
        const response = await fetch("/api/cart/apply-coupon", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ couponCode })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            couponMessage.textContent = result.message;
            return;
        }

        appliedCoupon = result.couponCode;
        couponMessage.textContent = result.message;

        await loadCart();

    } catch (error) {
        console.error("Apply coupon error:", error);
        couponMessage.textContent = "Unable to apply coupon.";
    }
});

// Format price
function formatPrice(price) {
    return "₹" + Number(price).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Load cart
async function loadCart() {
    try {
        const response = await fetch("/api/cart", {
            credentials: "same-origin",
            headers: {
                "Accept": "application/json"
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            cartItemsContainer.textContent =
                result.message || "Unable to load cart.";
            return;
        }

        const items = result.data.items || [];

        await loadAvailableCoupons();

        appliedCoupon = result.data.appliedCoupon || null;

        console.log("Applied Coupon:", appliedCoupon);
        console.log("Cart Items:", items);

        cartItemsContainer.replaceChildren();

        if (items.length === 0) {
            cartItemsContainer.textContent = "Your cart is empty.";
            cartItemCount.textContent = "0 items";
            subtotalElement.textContent = formatPrice(0);
            shippingElement.textContent = formatPrice(0);
            discountElement.textContent = "-" + formatPrice(0);
            totalElement.textContent = formatPrice(0);

            availableCouponsContainer.replaceChildren();

            if (cartCountElement) {
                cartCountElement.textContent = 0;
            }

            return;
        }

        let subtotal = 0;
        let totalQuantity = 0;

        items.forEach(item => {
            const product = item.product;

            if (!product) return;

            const quantity = Number(item.quantity);
            const price = Number(product.price);

            subtotal += price * quantity;
            totalQuantity += quantity;

            const card = document.createElement("article");
            card.className = "cart-item";

            const image = document.createElement("img");
            image.src = product.image;
            image.alt = product.name;
            image.className = "cart-item-image";

            const details = document.createElement("div");
            details.className = "cart-item-details";

            const name = document.createElement("h3");
            name.textContent = product.name;

            const priceText = document.createElement("p");
            priceText.textContent = formatPrice(price);

            // Quantity controls
            const quantityControls = document.createElement("div");
            quantityControls.className = "quantity-controls";

            const decreaseButton = document.createElement("button");
            decreaseButton.type = "button";
            decreaseButton.textContent = "−";
            decreaseButton.disabled = quantity <= 1;

            const quantityDisplay = document.createElement("span");
            quantityDisplay.textContent = quantity;

            const increaseButton = document.createElement("button");
            increaseButton.type = "button";
            increaseButton.textContent = "+";
            increaseButton.disabled = quantity >= product.stock;

            quantityControls.append(
                decreaseButton,
                quantityDisplay,
                increaseButton
            );

            // Decrease quantity
            decreaseButton.addEventListener("click", async () => {
                if (quantity <= 1) return;

                await updateCartQuantity(
                    product._id,
                    quantity - 1
                );
            });

            // Increase quantity
            increaseButton.addEventListener("click", async () => {
                if (quantity >= product.stock) return;

                await updateCartQuantity(
                    product._id,
                    quantity + 1
                );
            });

            // Remove product
            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.textContent = "Remove";

            removeButton.addEventListener("click", async () => {
                const removeResponse = await fetch(
                    "/api/cart/remove/" + product._id,
                    {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            "Accept": "application/json"
                        }
                    }
                );

                const removeResult = await removeResponse.json();

                if (removeResponse.ok && removeResult.success) {
                    await loadCart();
                } else {
                    alert(
                        removeResult.message ||
                        "Unable to remove product."
                    );
                }
            });

            details.append(
                name,
                priceText,
                quantityControls,
                removeButton
            );

            card.append(image, details);
            cartItemsContainer.append(card);
        });

        const shipping = subtotal > 0 ? 90 : 0;

        displayAvailableCoupons(subtotal);

        cartItemCount.textContent =
            totalQuantity +
            (totalQuantity === 1 ? " item" : " items");

        subtotalElement.textContent = formatPrice(subtotal);
        shippingElement.textContent = formatPrice(shipping);

        discountAmount = calculateDiscount(subtotal);

        console.log("Subtotal:", subtotal);
        console.log("Discount Amount:", discountAmount);

        discountElement.textContent =
            "-" + formatPrice(discountAmount);

        totalElement.textContent =
            formatPrice(subtotal + shipping - discountAmount);

        if (cartCountElement) {
            cartCountElement.textContent = totalQuantity;
        }

    } catch (error) {
        console.error("Load cart error:", error);
        cartItemsContainer.textContent =
            "Unable to load your cart.";
    }
}

// Update cart product quantity
async function updateCartQuantity(productId, quantity) {
    try {
        const response = await fetch("/api/cart/update", {
            method: "PATCH",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                productId,
                quantity
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || "Unable to update quantity.");
            return;
        }

        await loadCart();

    } catch (error) {
        console.error("Quantity update error:", error);
        alert("Unable to update quantity.");
    }
}

// Initial cart loading
loadCart();

// Checkout button
const checkoutButton = document.getElementById("checkout-btn");

checkoutButton.addEventListener("click", () => {
    const cartItems = document.querySelectorAll(".cart-item");

    if (cartItems.length === 0) {
        alert("Your cart is empty. Please add products first.");
        return;
    }

    window.location.href = "/checkout";
});
