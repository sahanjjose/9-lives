const express = require("express");
const router = express.Router();
const VM = require("../db/vending_machine");
const db = require("../db/db_connection");
const { healthCheck } = require("../mqtt/mqtt");

// Nested inventory routes
router.use("/:id/inventory", require("./vending_machine_items"));

// —— Existing VM routes ——

// Get all vending machines
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM vending_machines");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vending-machines/org/:org_id/group/:group_id
// Returns all vending machine IDs and names in that org and group.
router.get('/org/:org_id/group/:group_id', async (req, res) => {
    const { org_id, group_id } = req.params;
    try {
      const [rows] = await db.query(
        `SELECT vm.vm_id,
                vm.vm_name,
                vm.vm_row_count,
                vm.vm_column_count
         FROM vending_machines AS vm
         JOIN grpjoin           AS gj ON vm.vm_id = gj.vm_id
         WHERE vm.org_id = ? AND gj.group_id = ?`,
        [org_id, group_id]
      );
      res.json(rows);
    } catch (err) {
      console.error('Error fetching vending machines by org & group:', err);
      res.status(500).json({ error: err.message });
    }
  });

// Get vending machine by ID
router.get("/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM vending_machines WHERE vm_id = ?",
      [req.params.id]
    );
    if (results.length === 0) {
      res.status(404).json({ error: "Vending machine not found" });
    } else {
      res.json(results[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check status of vending machine
router.get("/:id/status", async (req, res) => {
    try {
        const status = await healthCheck(req.params.id);
        res.json(status);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
});

// Create a new vending machine
router.post("/", async (req, res) => {
    try {

        const { vm_id, vm_name, org_id } = req.body;
        if(await VM.vendingMachineExistsBool(vm_id, res)){
            res.status(400).json({ error: "Vending machine already exists" });
            return;
        } 
         

        if (!vm_id || !org_id) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        // TODO user posrt org_id, grp_id, and name
        
      
        await db.query(
            `INSERT INTO vending_machines 
            (vm_id, vm_name, org_id) 
            VALUES (?, ?, ?)`, 
            [vm_id, vm_name, org_id]
        );

        res.status(200).json({
            vm_id,
            vm_name,
            org_id 
        });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            // If there's a duplicate entry error, return a 400 status
            return res.status(400).json({ error: "Vending machine with this ID already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// Hardware registration
router.patch("/:id/register", async (req, res) => {
  const vm_id = req.params.id;
  const {vm_column_count, vm_row_count} = req.body;
  if (!(await VM.vendingMachineExistsBool(vm_id, res))) {
    res.status(400).json({ error: "Vending machine is not registered by vendor" });
    return;
  }

  try {
    await db.query(
      `UPDATE vending_machines
       SET vm_column_count = ?, vm_row_count = ?
       WHERE vm_id = ?`,
      [vm_column_count, vm_row_count, vm_id]
    );
    res.status(200).json({ message: "success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change mode
router.patch("/:id/mode", async (req, res) => {
    try {
        const { vm_mode } = req.body;

        if(vm_mode !== "i" && vm_mode !== "r" && vm_mode !== "t") {
            res.status(400).json({ error: "Invalid vending machine mode, must be 'i', 'r', or 't'" });
            return;
        }

        const [results] = await db.query("UPDATE vending_machines SET vm_mode = ? WHERE vm_id = ?", [vm_mode, req.params.id]);
        if (results.affectedRows === 0) {
            res.status(404).json({ error: "Vending machine not found" });
        } else {
            res.json({ message: "Vending machine mode updated successfully" });
        }
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "A vending machine with this ID already exists." });
        }
        res.status(500).json({ error: err.message });
  }
});

// Change name
router.patch("/:id/name", async (req, res) => {
  try {
    const { vm_name } = req.body;
    const [results] = await db.query(
      "UPDATE vending_machines SET vm_name = ? WHERE vm_id = ?",
      [vm_name, req.params.id]
    );
    if (results.affectedRows === 0) {
      res.status(404).json({ error: "Vending machine not found" });
    } else {
      res.json({ message: "Vending machine name updated successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete machine
router.delete("/:id", async (req, res) => {
  try {
    const [results] = await db.query(
      "DELETE FROM vending_machines WHERE vm_id = ?",
      [req.params.id]
    );
    if (results.affectedRows === 0) {
      res.status(404).json({ error: "Vending machine not found" });
    } else {
      res.json({ message: "Vending machine deleted successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// —— New Group‑assignment routes ——
// List all groups this VM belongs to
router.get("/:id/groups", async (req, res) => {
  const vm_id = req.params.id;
  try {
    const [rows] = await db.query(
      `SELECT g.group_id, g.group_name
       FROM grpjoin gj
       JOIN grp g ON gj.group_id = g.group_id
       WHERE gj.vm_id = ?`,
      [vm_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add this VM to a group
router.post("/:id/groups/:group_id", async (req, res) => {
  const vm_id = req.params.id;
  const group_id = req.params.group_id;
  try {
    await db.query(
      `INSERT INTO grpjoin (vm_id, group_id)
       VALUES (?, ?)`,
      [vm_id, group_id]
    );
    res.status(201).json({ vm_id, group_id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Remove this VM from a group
router.delete("/:id/groups/:group_id", async (req, res) => {
  const vm_id = req.params.id;
  const group_id = req.params.group_id;
  try {
    const [result] = await db.query(
      `DELETE FROM grpjoin
       WHERE vm_id = ? AND group_id = ?`,
      [vm_id, group_id]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ error: "Assignment not found" });
    } else {
      res.json({ message: "Removed from group", vm_id, group_id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
