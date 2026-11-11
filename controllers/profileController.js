const User = require("../models/User");

// Get user profile
async function getProfile(req, res) {
    try {
        const user = await User.findById(req.user.id)
            .select("name email phone addresses");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch profile."
        });
    }
}


// Update user profile
async function updateProfile(req, res) {
    try {
        const { name, phone } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required."
            });
        }

        if (phone && !/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 10 digit phone number."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        user.name = name.trim();
        user.phone = phone ? phone.trim() : "";

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile."
        });
    }
}


// Add new address
async function addAddress(req, res) {
    try {
        const {
            fullName, phone, houseName,
            street, city, state, pincode
        } = req.body;

        if (
            !fullName?.trim() ||
            !phone?.trim() ||
            !houseName?.trim() ||
            !street?.trim() ||
            !city?.trim() ||
            !state?.trim() ||
            !pincode?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all address fields."
            });
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 10 digit phone number."
            });
        }

        if (!/^[0-9]{6}$/.test(pincode)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 6 digit pincode."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const newAddress = {
            fullName: fullName.trim(),
            phone: phone.trim(),
            houseName: houseName.trim(),
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            isDefault: user.addresses.length === 0
        };

        user.addresses.push(newAddress);

        await user.save();

        return res.status(201).json({
            success: true,
            message: "Address added successfully.",
            addresses: user.addresses
        });

    } catch (error) {
        console.error("Add address error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add address."
        });
    }
}


// Update existing address
async function updateAddress(req, res) {
    try {
        const {
            fullName, phone, houseName,
            street, city, state, pincode
        } = req.body;

        const { addressId } = req.params;

        // Validate required fields
        if (
            !fullName?.trim() ||
            !phone?.trim() ||
            !houseName?.trim() ||
            !street?.trim() ||
            !city?.trim() ||
            !state?.trim() ||
            !pincode?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all address fields."
            });
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 10 digit phone number."
            });
        }

        if (!/^[0-9]{6}$/.test(pincode)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid 6 digit pincode."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Find address using its ID
        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found."
            });
        }

        // Update address fields
        address.fullName = fullName.trim();
        address.phone = phone.trim();
        address.houseName = houseName.trim();
        address.street = street.trim();
        address.city = city.trim();
        address.state = state.trim();
        address.pincode = pincode.trim();

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Address updated successfully.",
            addresses: user.addresses
        });

    } catch (error) {
        console.error("Update address error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update address."
        });
    }
}
// Delete saved address
async function deleteAddress(req, res) {
    try {
        const { addressId } = req.params;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found."
            });
        }

        const wasDefault = address.isDefault;

        address.deleteOne();

        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Address deleted successfully.",
            addresses: user.addresses
        });

    } catch (error) {
        console.error("Delete address error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete address."
        });
    }
}


module.exports = {
    getProfile,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress
};