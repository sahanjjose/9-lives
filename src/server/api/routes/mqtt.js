const express = require('express');
const router = express.Router();

// Import the MQTT handlers (adjust path as needed)
const { healthCheck, notifyIfRestock } = require('../mqtt/mqtt.js');

// GET /health/:vmId
// Returns JSON: { hardwareId, status, isOnline, lastChecked, [error] }
router.get('/health/:vmId', async (req, res) => {
  const { vmId } = req.params;
  try {
    const result = await healthCheck(vmId);
    res.json(result);
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /restock/:vmId
// Triggers a restock notification if the VM has just completed restocking
router.post('/restock/:vmId', async (req, res) => {
  const { vmId } = req.params;
  try {
    await notifyIfRestock(vmId);
    res.json({ success: true });
  } catch (err) {
    console.error('Notify restock failed:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
