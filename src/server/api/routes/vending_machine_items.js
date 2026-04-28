const express = require("express");
const router = express.Router({ mergeParams: true }); // Merge params from parent route
const db = require("../db/db_connection"); // Import database connection
const items = require("../db/items"); // Import items table functions
const IJT = require("../db/inventory_join_table"); // Import inventory_join_table functions
const VM = require("../db/vending_machine"); // Import vending_machine functions
const mqtt = require("../mqtt/mqtt") // Import mqtt functions

// Get all items for a vending machine
router.get("/", async (req, res) => {
    try {
        const vendingMachineId = req.params.id; // Get vending machine ID from URL
        // Check if vending machine exists
        if(!await VM.vendingMachineExists(vendingMachineId, res)) return;

        const [results] = await db.query(`
            SELECT 
                ijt.IJT_slot_name AS slot_name, 
                items.item_name AS item_name, 
                ijt.IJT_price AS price, 
                ijt.IJT_stock AS stock
            FROM inventory_join_table AS ijt
            INNER JOIN items ON ijt.IJT_item_id = items.item_id
            WHERE ijt.IJT_vm_id = ?
        `, [vendingMachineId]);

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add an item to a vending machine
router.post("/:slot_name", async (req, res) => {
    try {
        const vendingMachineId = req.params.id;
        // Check if vending machine exists
        if(!await VM.vendingMachineExists(vendingMachineId, res)) return;
        
        const slot_name = req.params.slot_name;
        const { item_name, price, stock } = req.body;
        
        // Add to items table if item does not exist
        await items.create_item_if_not_exists(item_name);
        const item_id = await items.getItemIdByName(item_name);

        // Add item to inventory_join_table
        const result = IJT.add_to_slot(vendingMachineId, slot_name, item_id, price, stock);
        if(result.affectedRows === 0) {
            res.status(500).json({ error: "Failed to add item to vending machine" });
            return;
        }

        // Notifies vending machine of restock if current operation is restock
        await mqtt.notifyIfRestock(vendingMachineId)

        res.json({ 
            vm_id: vendingMachineId, 
            slot_name, 
            item_id, 
            price, 
            stock,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update an item in a vending machine
router.patch("/:slot_name", async (req, res) => {
    try {
        const vendingMachineId = req.params.id;
        // Check if vending machine exists
        if(!await VM.vendingMachineExists(vendingMachineId, res)) return;

        const slotName = req.params.slot_name;
        const { item_name, price, stock } = req.body;

        // Add item to items table if it does not exist
        await items.create_item_if_not_exists(item_name);
        const item_id = await items.getItemIdByName(item_name);

        // Update item in inventory_join_table
        const results = IJT.update_slot(vendingMachineId, slotName, item_id, price, stock);
        if(results.affectedRows === 0) {
            res.status(404).json({ error: "Item not found in vending machine" });
            return;
        }

        res.json({ 
            vm_id: vendingMachineId, 
            slot_name: slotName, 
            item_id, 
            price, 
            stock,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an item from a vending machine
// Also deletes the item from the items table if it is not used in any other vending machine
router.delete("/:slot_name", async (req, res) => {
    try {
        const vendingMachineId = req.params.id;
        // Check if vending machine exists
        if(!await VM.vendingMachineExists(vendingMachineId, res)) return;

        const slotName = req.params.slot_name;

        // Delete item from inventory_join_table
        const result = IJT.delete_slot(vendingMachineId, slotName);

        if(result.affectedRows === 0) {
            res.status(404).json({ error: "Item not found in vending machine" });
            return;
        }

        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Batch operation to update many rows in inventory_join_table
router.post("/", async (req, res) => {
    try {
        const vendingMachineId = req.params.id;
        // Check if vending machine exists
        if(!await VM.vendingMachineExists(vendingMachineId, res)) return;

        const rows = req.body;

        // Loop through each row and perform specified operation
        for(const row of rows) {
            const { slot_name, item_name, price, stock } = row;

            // Add item to items table if it does not exist
            var item_id = null;
            if(item_name !== null) {
                await items.create_item_if_not_exists(item_name);
                item_id = await items.getItemIdByName(item_name);
            }

            // Update item in inventory_join_table
            await IJT.modify_item_slot(vendingMachineId, slot_name, item_id, price, stock);
        }

        // Notifies vending machine of restock if current operation is restock
        await mqtt.notifyIfRestock(vendingMachineId)

        res.json({ message: "Items updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;