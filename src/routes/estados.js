const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");

// GET /api/estados
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nombre FROM estados ORDER BY id",
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
