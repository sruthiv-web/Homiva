function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.redirect("/admin/login");
    }

    if (req.user.role !== "admin") {
        return res.status(403).send("Admin access required.");
    }

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    next();
}

module.exports = requireAdmin;