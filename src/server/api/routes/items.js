const express = require("express");
const router = express.Router();
const db = require("../db/db_connection"); // Import database connection

// Get all items
router.get("/", async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM items");
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;