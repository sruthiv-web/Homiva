const checkoutParams = new URLSearchParams(window.location.search);
const isBuyNow = checkoutParams.get("mode") === "buyNow";

let buyNowData = null;
document.addEventListener("DOMContentLoaded", () => {
    
loadAddresses();

loadAvailableCoupons().then(() => {
    if (isBuyNow) {
        loadBuyNowProduct();
    } else {
        loadCheckoutCart();
    }
});
    if (isBuyNow) {
        loadBuyNowProduct();
    } else {
        loadCheckoutCart();
    }
});


const addressContainer = document.getElementById("address-container");
const checkoutItems = document.getElementById("checkout-items");

const subtotalElement = document.getElementById("checkout-subtotal");
const shippingElement = document.getElementById("checkout-shipping");
const discountElement = document.getElementById("checkout-discount");
const totalElement = document.getElementById("checkout-total");

const SHIPPING_CHARGE = 90;
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
            return;
        }

        availableCoupons = result.data;

        console.log("Available coupons:", availableCoupons);

    } catch (error) {
        console.error("Coupon loading error:", error);
    }
}

// Load saved delivery addresses
async function loadAddresses() {
    try {
        const response = await fetch("/api/profile", {
            credentials: "same-origin"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            addressContainer.textContent = "Unable to load addresses.";
            return;
        }

        savedAddresses = result.user.addresses || [];

        if (savedAddresses.length === 0) {
            addressContainer.textContent = "No saved addresses found.";
            changeAddressButton.hidden = true;
            return;
        }

        const defaultAddress = savedAddresses.find(
            address => address.isDefault
        );

        selectedAddressId =
            defaultAddress?._id || savedAddresses[0]._id;

        displaySelectedAddress();

    } catch (error) {
        console.error("Address loading error:", error);
        addressContainer.textContent = "Something went wrong.";
    }
}
function displaySelectedAddress() {
    const address = savedAddresses.find(
        item => item._id === selectedAddressId
    );

    if (!address) return;

    addressContainer.replaceChildren();

    const card = document.createElement("div");
    card.className = "address-card";

    const name = document.createElement("h3");
    name.textContent = address.fullName;

    const addressText = document.createElement("p");
    addressText.textContent =
        `${address.houseName}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`;

    const phone = document.createElement("p");
    phone.textContent = `Phone: ${address.phone}`;

    card.append(name, addressText, phone);
    addressContainer.appendChild(card);
}

// Load cart products
async function loadCheckoutCart() {
    try {
        const response = await fetch("/api/cart", {
            credentials: "same-origin"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            checkoutItems.textContent = "Unable to load cart.";
            return;
        }

        const items = result.data.items;
        const appliedCoupon = result.data.appliedCoupon;
        checkoutItems.replaceChildren();

        if (items.length === 0) {
            checkoutItems.textContent = "Your cart is empty.";
            updateCheckoutTotal(0, null);
            return;
        }

        let subtotal = 0;

        items.forEach(item => {
            const product = item.product;

            if (!product) return;

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            const card = document.createElement("div");
            card.className = "checkout-item";

            const image = document.createElement("img");
            image.src = product.image;
            image.alt = product.name;

            const details = document.createElement("div");

            const name = document.createElement("h3");
            name.textContent = product.name;

            const price = document.createElement("p");
            price.textContent = `₹${product.price}`;

            const quantity = document.createElement("p");
            quantity.textContent = `Quantity: ${item.quantity}`;

            details.append(name, price, quantity);
            card.append(image, details);

            checkoutItems.appendChild(card);
        });

        updateCheckoutTotal(subtotal, appliedCoupon);

    } catch (error) {
        console.error("Cart loading error:", error);
        checkoutItems.textContent = "Something went wrong.";
    }
}
// Load Buy Now product
async function loadBuyNowProduct() {
    try {
        const storedData = sessionStorage.getItem("buyNowProduct");

        if (!storedData) {
            checkoutItems.textContent = "No product selected.";
            return;
        }

        buyNowData = JSON.parse(storedData);

        const { productId, quantity } = buyNowData;

        if (!productId || !Number.isInteger(quantity) || quantity < 1) {
            checkoutItems.textContent = "Invalid product details.";
            return;
        }

        const response = await fetch(`/api/products/${productId}`, {
            credentials: "same-origin"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            checkoutItems.textContent = "Unable to load product.";
            return;
        }

        const product = result.data;

        if (!product || !product.isActive || product.stock < quantity) {
            checkoutItems.textContent = "Product is unavailable or out of stock.";
            return;
        }

        checkoutItems.replaceChildren();

        const itemTotal = product.price * quantity;

        const card = document.createElement("div");
        card.className = "checkout-item";

        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.name;

        const details = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = product.name;

        const price = document.createElement("p");
        price.textContent = formatPrice(product.price);

        const quantityText = document.createElement("p");
        quantityText.textContent = `Quantity: ${quantity}`;

        const itemTotalText = document.createElement("p");
        itemTotalText.textContent = `Total: ${formatPrice(itemTotal)}`;

        details.append(name, price, quantityText, itemTotalText);
        card.append(image, details);

        checkoutItems.appendChild(card);


        updateCheckoutTotal(itemTotal, null);

    } catch (error) {
        console.error("Buy Now loading error:", error);
        checkoutItems.textContent = "Something went wrong.";
    }
}


// Calculate checkout total
function updateCheckoutTotal(subtotal, appliedCoupon) {
    const shipping = subtotal > 0 ? SHIPPING_CHARGE : 0;

    const coupon = availableCoupons.find(
        item => item.code === appliedCoupon
    );

    let discount = 0;

    if (coupon && subtotal >= coupon.minPurchase) {

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
    }

    discount = Math.min(discount, subtotal);

    const total = subtotal + shipping - discount;

    subtotalElement.textContent = formatPrice(subtotal);
    shippingElement.textContent = formatPrice(shipping);
    discountElement.textContent = "-" + formatPrice(discount);
    totalElement.textContent = formatPrice(total);
}

function formatPrice(price) {
    return "₹" + Number(price).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
// Start Razorpay payment
async function startRazorpayPayment(orderData) {
    const response = await fetch("/api/orders/create-razorpay-order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to create payment.");
    }

    const options = {
        key: result.key,
        amount: result.amount,
        currency: result.currency,
        name: "Homiva",
        description: "Home Decor Purchase",
        order_id: result.orderId,

        handler: async function (paymentResponse) {
            try {
                const verifyResponse = await fetch(
                    "/api/orders/verify-razorpay-payment",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "same-origin",
                        body: JSON.stringify({
                            ...orderData,
                            ...paymentResponse
                        })
                    }
                );

                const verifyResult = await verifyResponse.json();

                if (!verifyResponse.ok || !verifyResult.success) {
                    throw new Error(
                        verifyResult.message || "Payment verification failed."
                    );
                }

                if (isBuyNow) {
                    sessionStorage.removeItem("buyNowProduct");
                }

                window.location.href =
                    `/order-success/${verifyResult.orderId}`;

            } catch (error) {
                console.error("Payment verification error:", error);
                alert(error.message);
            }
        }
    };

    const razorpayPayment = new Razorpay(options);
    razorpayPayment.open();
}
const savedAddressesContainer = document.getElementById("saved-addresses-container");
const changeAddressButton = document.getElementById("change-address-btn");

let savedAddresses = [];
let selectedAddressId = null;
const addAddressButton = document.getElementById("add-address-btn");
const newAddressForm = document.getElementById("new-address-form");
const checkoutAddressForm = document.getElementById("checkout-address-form");
const cancelAddressButton = document.getElementById("cancel-address-btn");
console.log({
    addAddressButton,
    newAddressForm,
    checkoutAddressForm,
    cancelAddressButton
});
// Open address form
addAddressButton.addEventListener("click", () => {
    newAddressForm.hidden = false;
    savedAddressesContainer.hidden = true;
});

// Cancel address form
cancelAddressButton.addEventListener("click", () => {
    newAddressForm.hidden = true;
    checkoutAddressForm.reset();
});

// Save new address
checkoutAddressForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const formData = new FormData(checkoutAddressForm);
        const addressData = Object.fromEntries(formData.entries());

        const response = await fetch("/api/profile/addresses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify(addressData)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || "Unable to save address.");
            return;
        }

        savedAddresses = result.addresses;

        // Automatically select newly added address
        const newAddress = savedAddresses[savedAddresses.length - 1];

        selectedAddressId = newAddress._id;

        displaySelectedAddress();

        newAddressForm.hidden = true;
        checkoutAddressForm.reset();

        alert("Address added successfully!");

    } catch (error) {
        console.error("Add address error:", error);
        alert("Something went wrong. Please try again.");
    }
});
changeAddressButton.addEventListener("click", () => {
    savedAddressesContainer.hidden =
        !savedAddressesContainer.hidden;

    if (!savedAddressesContainer.hidden) {
        displaySavedAddresses();
    }
});
function displaySavedAddresses() {
    savedAddressesContainer.replaceChildren();

    savedAddresses.forEach(address => {
        const card = document.createElement("div");
        card.className = "address-card";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "selectedAddress";
        radio.value = address._id;
        radio.checked = address._id === selectedAddressId;

        radio.addEventListener("change", () => {
            selectedAddressId = address._id;
            displaySelectedAddress();
            savedAddressesContainer.hidden = true;
        });

        const details = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = address.fullName;

        const addressText = document.createElement("p");
        addressText.textContent =
            `${address.houseName}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`;

        const phone = document.createElement("p");
        phone.textContent = `Phone: ${address.phone}`;

        details.append(name, addressText, phone);
        card.append(radio, details);

        savedAddressesContainer.appendChild(card);
    });
}

const placeOrderButton = document.getElementById("place-order-btn");

placeOrderButton.addEventListener("click", async () => {
    if (!selectedAddressId) {
        alert("Please select a delivery address.");
        return;
    }

    try {
        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Placing Order...";
        const selectedPaymentMethod = document.querySelector(
            'input[name="paymentMethod"]:checked'
        ).value;
        const orderData = {
            addressId: selectedAddressId
        };

        if (isBuyNow) {
            if (!buyNowData) {
                alert("Invalid Buy Now product details.");
                return;
            }

            orderData.mode = "buyNow";
            orderData.productId = buyNowData.productId;
            orderData.quantity = buyNowData.quantity;
        }
        // Handle Razorpay payment
        if (selectedPaymentMethod === "ONLINE") {
            await startRazorpayPayment(orderData);
            return;
        }

        const response = await fetch("/api/orders/place", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify(orderData)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || "Unable to place order.");
            return;
        }

        if (isBuyNow) {
            sessionStorage.removeItem("buyNowProduct");
        }

        alert("Order placed successfully!"); window.location.href = `/order-success/${result.orderId}`;

    } catch (error) {
        console.error("Place order error:", error);
        alert("Something went wrong. Please try again.");
    } finally {
        placeOrderButton.disabled = false;
        placeOrderButton.textContent = "Place Order";
    }
});
