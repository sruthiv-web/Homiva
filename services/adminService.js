
const User = require("../models/User");

async function getUsers(search = "") {
    const filter = { role: "user" };

    if (search.trim()) {
        const escapedSearch = search.trim().replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        filter.$or = [
            { name: { $regex: escapedSearch, $options: "i" } },
            { email: { $regex: escapedSearch, $options: "i" } }
        ];
    }

    return User.find(filter)
        .select("name email role isBlocked createdAt")
        .sort({ createdAt: -1 })
        .lean();
}

async function getUserById(userId) {
    return User.findOne({
        _id: userId,
        role: "user"
    })
        .select("name email role isBlocked createdAt")
        .lean();
}

async function setUserBlockedStatus(userId, isBlocked) {
    return User.findOneAndUpdate(
        { _id: userId, role: "user" },
        { $set: { isBlocked } },
        { returnDocument: "after", runValidators: true }
    )
        .select("name email role isBlocked")
        .lean();
}
async function getTotalUsers() {
    return User.countDocuments({ role: "user" });
}

module.exports = {
    getUsers,
    getUserById,
    setUserBlockedStatus,
    getTotalUsers
};
