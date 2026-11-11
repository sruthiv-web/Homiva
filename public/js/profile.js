
document.addEventListener("DOMContentLoaded", function () {

    // PROFILE NAVIGATION

    const navItems = document.querySelectorAll(".profile-nav-item");
    const profileSections = document.querySelectorAll(".profile-section");

    navItems.forEach(item => {
        item.addEventListener("click", function () {

            navItems.forEach(nav => {
                nav.classList.remove("active");
            });

            profileSections.forEach(section => {
                section.classList.remove("active");
            });

            this.classList.add("active");

            const sectionName = this.dataset.section;

            document.getElementById(
                `${sectionName}-section`
            ).classList.add("active");
        });
    });


    /* =====================================
       PROFILE ELEMENTS
    ===================================== */

    let currentUser = null;

    const editProfileBtn = document.getElementById("editProfileBtn");
    const editProfileForm = document.getElementById("editProfileForm");
    const profileDetails = document.getElementById("profileDetails");
    const cancelEditBtn = document.getElementById("cancelEditBtn");

    //ADDRESS ELEMENTS

    const addAddressBtn = document.getElementById("addAddressBtn");
    const addressForm = document.getElementById("addressForm");
    const cancelAddressBtn = document.getElementById("cancelAddressBtn");
    const addressList = document.getElementById("addressList");

    const ordersContainer = document.getElementById("orders-container");
    let editingAddressId = null;


    //  CHECK REQUIRED ELEMENTS

    if (
        !editProfileBtn ||
        !editProfileForm ||
        !profileDetails ||
        !cancelEditBtn ||
        !addAddressBtn ||
        !addressForm ||
        !cancelAddressBtn ||
        !addressList
    ) {
        console.error("Profile page elements are missing. Check profile.ejs IDs.");
        return;
    }


    /* =====================================
       LOAD USER PROFILE
    ===================================== */

    async function loadProfile() {

        try {

            const response = await fetch("/api/profile");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load profile.");
            }

            currentUser = data.user;

            // Display personal details
            document.getElementById("profileName").textContent =
                currentUser.name || "";

            document.getElementById("profileEmail").textContent =
                currentUser.email || "";

            document.getElementById("profilePhone").textContent =
                currentUser.phone || "Not added";

            // Display saved addresses
            displayAddresses(currentUser.addresses);

        } catch (error) {

            console.error("Profile loading error:", error);
        }
    }


    // DISPLAY SAVED ADDRESSES

    function displayAddresses(addresses) {

        addressList.replaceChildren();

        if (!addresses || addresses.length === 0) {

            const message = document.createElement("p");
            message.textContent = "No addresses added yet.";

            addressList.appendChild(message);
            return;
        }

        addresses.forEach(address => {

            const card = document.createElement("div");
            card.className = "saved-address-card";

            const name = document.createElement("h3");
            name.textContent = address.fullName;

            const phone = document.createElement("p");
            phone.textContent = `Phone: ${address.phone}`;

            const house = document.createElement("p");
            house.textContent = address.houseName;

            const street = document.createElement("p");
            street.textContent = address.street;

            const location = document.createElement("p");
            location.textContent =
                `${address.city}, ${address.state} - ${address.pincode}`;

            // Edit button
            const editBtn = document.createElement("button");

            editBtn.type = "button";
            editBtn.textContent = "Edit";
            editBtn.className = "edit-address-btn";
            editBtn.dataset.id = address._id;

            // Delete button
            const deleteBtn = document.createElement("button");

            deleteBtn.type = "button";
            deleteBtn.textContent = "Delete";
            deleteBtn.className = "delete-address-btn";
            deleteBtn.dataset.id = address._id;

            // Address action buttons
            const actions = document.createElement("div");
            actions.className = "address-actions";

            actions.append(editBtn, deleteBtn);

            card.append(
                name,
                phone,
                house,
                street,
                location
            );

            // Default address label
            if (address.isDefault) {

                const defaultLabel = document.createElement("span");

                defaultLabel.textContent = "Default Address";

                card.appendChild(defaultLabel);
            }

            card.appendChild(actions);

            addressList.appendChild(card);
        });
    }


    // EDIT PROFILE

    editProfileBtn.addEventListener("click", function () {

        if (!currentUser) return;

        document.getElementById("editName").value =
            currentUser.name || "";

        document.getElementById("editPhone").value =
            currentUser.phone || "";

        profileDetails.hidden = true;
        editProfileBtn.hidden = true;
        editProfileForm.hidden = false;
    });


    // Cancel Profile Editing
    cancelEditBtn.addEventListener("click", function () {

        editProfileForm.hidden = true;
        profileDetails.hidden = false;
        editProfileBtn.hidden = false;
    });


    // Save Profile Changes
    editProfileForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("editName").value.trim();
        const phone = document.getElementById("editPhone").value.trim();

        try {

            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, phone })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update profile.");
            }

            document.getElementById("profileName").textContent =
                data.user.name;

            document.getElementById("profileEmail").textContent =
                data.user.email;

            document.getElementById("profilePhone").textContent =
                data.user.phone || "Not added";

            // Update current user details
            currentUser = {
                ...currentUser,
                ...data.user
            };

            editProfileForm.hidden = true;
            profileDetails.hidden = false;
            editProfileBtn.hidden = false;

            alert("Profile updated successfully!");

        } catch (error) {

            alert(error.message || "Unable to update profile.");
            console.error("Profile update error:", error);
        }
    });


    // OPEN ADDRESS FORM

    addAddressBtn.addEventListener("click", function () {

        addressForm.reset();

        editingAddressId = null;

        addressForm.querySelector('[type="submit"]').textContent =
            "Save Address";

        addressForm.hidden = false;
        addAddressBtn.hidden = true;
    });


    //CANCEL ADDRESS FORM

    cancelAddressBtn.addEventListener("click", function () {

        addressForm.reset();

        addressForm.hidden = true;
        addAddressBtn.hidden = false;

        editingAddressId = null;

        addressForm.querySelector('[type="submit"]').textContent =
            "Save Address";
    });


    // EDIT AND DELETE ADDRESS

    addressList.addEventListener("click", async function (event) {

        // EDIT ADDRESS
        const editBtn = event.target.closest(".edit-address-btn");

        if (editBtn) {

            if (!currentUser) return;

            const addressId = editBtn.dataset.id;

            const address = currentUser.addresses.find(
                item => String(item._id) === String(addressId)
            );

            if (!address) {
                console.error("Address not found:", addressId);
                return;
            }

            editingAddressId = addressId;

            // Fill form with existing address details
            document.getElementById("addressFullName").value =
                address.fullName || "";

            document.getElementById("addressPhone").value =
                address.phone || "";

            document.getElementById("houseName").value =
                address.houseName || "";

            document.getElementById("street").value =
                address.street || "";

            document.getElementById("city").value =
                address.city || "";

            document.getElementById("state").value =
                address.state || "";

            document.getElementById("pincode").value =
                address.pincode || "";

            // Show address form
            addressForm.hidden = false;
            addAddressBtn.hidden = true;

            addressForm.querySelector('[type="submit"]').textContent =
                "Update Address";

            return;
        }


        // DELETE ADDRESS
        const deleteBtn = event.target.closest(".delete-address-btn");

        if (deleteBtn) {

            const addressId = deleteBtn.dataset.id;

            const confirmDelete = confirm(
                "Are you sure you want to delete this address?"
            );

            if (!confirmDelete) return;

            try {

                const response = await fetch(
                    `/api/profile/addresses/${addressId}`,
                    {
                        method: "DELETE"
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to delete address."
                    );
                }

                // Update current user addresses
                currentUser.addresses = data.addresses;

                // Display updated address list
                displayAddresses(currentUser.addresses);

                alert(data.message);

            } catch (error) {

                alert(error.message || "Unable to delete address.");

                console.error("Delete address error:", error);
            }
        }
    });


    // ADD OR UPDATE ADDRESS

    addressForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const address = {
            fullName: document.getElementById("addressFullName").value.trim(),
            phone: document.getElementById("addressPhone").value.trim(),
            houseName: document.getElementById("houseName").value.trim(),
            street: document.getElementById("street").value.trim(),
            city: document.getElementById("city").value.trim(),
            state: document.getElementById("state").value.trim(),
            pincode: document.getElementById("pincode").value.trim()
        };

        try {

            const isEditing = Boolean(editingAddressId);

            const url = isEditing
                ? `/api/profile/addresses/${editingAddressId}`
                : "/api/profile/addresses";

            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(address)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to save address."
                );
            }

            // Update current user addresses
            currentUser.addresses = data.addresses;

            // Display updated addresses
            displayAddresses(currentUser.addresses);

            // Reset form
            addressForm.reset();

            addressForm.hidden = true;
            addAddressBtn.hidden = false;

            editingAddressId = null;

            addressForm.querySelector('[type="submit"]').textContent =
                "Save Address";

            alert(data.message);

        } catch (error) {

            alert(error.message || "Unable to save address.");

            console.error("Address error:", error);
        }
    });
    // LOAD MY ORDERS

    async function loadMyOrders() {
        try {
            ordersContainer.textContent = "Loading orders...";

            const response = await fetch("/api/orders/my-orders", {
                method: "GET",
                credentials: "same-origin",
                headers: {
                    "Accept": "application/json"
                }
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to load orders."
                );
            }

            displayMyOrders(result.data);

        } catch (error) {
            console.error("My orders loading error:", error);
            ordersContainer.textContent = "Unable to load your orders.";
        }
    }
      // DISPLAY MY ORDERS

    function displayMyOrders(orders) {
    ordersContainer.replaceChildren();

    if (!orders || orders.length === 0) {
        const message = document.createElement("p");
        message.textContent = "You haven't placed any orders yet.";
        ordersContainer.appendChild(message);
        return;
    }

    orders.forEach(order => {
        const card = document.createElement("div");
        card.className = "order-card";

        const orderId = document.createElement("h3");
        orderId.textContent = `Order #${order._id}`;

        const date = document.createElement("p");
        date.textContent = new Date(order.createdAt).toLocaleDateString("en-IN");

        const amount = document.createElement("p");
        amount.textContent = `Total: ₹${order.totalAmount.toFixed(2)}`;

        const status = document.createElement("p");
        status.textContent = `Status: ${order.orderStatus}`;

        const payment = document.createElement("p");
        payment.textContent = `Payment: ${order.paymentMethod}`;

        const productsContainer = document.createElement("div");
        productsContainer.className = "order-products";

        order.items.forEach(item => {
            const product = document.createElement("div");
            product.className = "order-product";

            const image = document.createElement("img");
            image.src = item.image || "/images/placeholder.png";
            image.alt = item.name;
            image.className = "order-product-image";

            const name = document.createElement("p");
            name.textContent = item.name;

            const quantity = document.createElement("p");
            quantity.textContent = `Quantity: ${item.quantity}`;

            product.append(image, name, quantity);
            productsContainer.appendChild(product);
        });

        card.append(orderId, date, productsContainer, amount, status, payment);

        if (order.orderStatus === "Pending") {
            const cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.textContent = "Cancel Order";
            cancelButton.className = "cancel-order-btn";

            cancelButton.addEventListener("click", () => {
                cancelUserOrder(order._id);
            });

            card.appendChild(cancelButton);
        }

        ordersContainer.appendChild(card);
    });
}
async function cancelUserOrder(orderId) {
    const confirmed = confirm("Are you sure you want to cancel this order?");

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/orders/cancel/${orderId}`, {
            method: "PATCH",
            credentials: "same-origin"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to cancel order.");
        }

        alert("Order cancelled successfully!");
        loadMyOrders();

    } catch (error) {
        console.error("Cancel order error:", error);
        alert(error.message);
    }
}
    // LOAD WISHLIST PRODUCTS

    async function loadWishlist() {

        const wishlistContainer =
            document.getElementById("wishlistProducts");

        try {

            const response = await fetch("/api/wishlist/items", {
                method: "GET",
                credentials: "same-origin"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to load wishlist."
                );
            }

            displayWishlist(data.data);

        } catch (error) {

            console.error("Wishlist loading error:", error);

            wishlistContainer.textContent =
                "Unable to load wishlist products.";
        }
    }


    //DISPLAY WISHLIST PRODUCTS

    function displayWishlist(products) {

        const wishlistContainer =
            document.getElementById("wishlistProducts");

        wishlistContainer.replaceChildren();

        if (!products || products.length === 0) {
            message.textContent = "Your wishlist is empty.";
            return;
        }

        products.forEach(product => {

            const card = document.createElement("div");
            card.className = "wishlist-card";
            card.dataset.id = product._id;
            const image = document.createElement("img");

            image.src = product.image;
            image.alt = product.name;
            image.className = "wishlist-product-image";

            const name = document.createElement("h3");
            name.textContent = product.name;

            const price = document.createElement("p");
            price.textContent = `₹${product.price}`;
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.className = "wishlist-remove-btn";
            removeButton.dataset.id = product._id;

            card.append(image, name, price, removeButton);

            wishlistContainer.appendChild(card);
        });
    }
    document.getElementById("wishlistProducts")
        .addEventListener("click", async function (event) {

            // Remove button clicked
            const removeButton = event.target.closest(".wishlist-remove-btn");

            if (removeButton) {
                event.stopPropagation();

                const productId = removeButton.dataset.id;

                try {
                    const response = await fetch("/api/wishlist/remove", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ productId })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message);
                    }

                    // Reload wishlist after removal
                    loadWishlist();

                } catch (error) {
                    console.error("Remove wishlist error:", error);
                    alert(error.message || "Unable to remove product.");
                }

                return;
            }

            // Product card clicked
            const card = event.target.closest(".wishlist-card");

            if (!card) return;

            window.location.href = `/products/${card.dataset.id}`;
        });
    loadProfile();
    loadWishlist();
    loadMyOrders();
});
