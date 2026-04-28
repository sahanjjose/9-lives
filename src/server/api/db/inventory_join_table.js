const db = require("./db_connection"); // Import database connection

const add_to_slot = async (vendingMachineID, slotName, itemID, price, stock) => {
    await db.query(`INSERT INTO inventory_join_table 
        (IJT_vm_id, IJT_slot_name, IJT_item_id, IJT_price, IJT_stock) 
        VALUES (?, ?, ?, ?, ?)`,
        [vendingMachineID, slotName, itemID, price, stock]);
};

const update_slot = async (vendingMachineID, slotName, itemID, price, stock) => {
    return await db.query(`UPDATE inventory_join_table 
        SET IJT_item_id = ?, IJT_price = ?, IJT_stock = ? 
        WHERE IJT_vm_id = ? AND IJT_slot_name = ?`,
        [itemID, price, stock, vendingMachineID, slotName]);
};

const delete_slot = async (vendingMachineID, slotName) => {
    return await db.query(`DELETE FROM inventory_join_table 
        WHERE IJT_vm_id = ? AND IJT_slot_name = ?`, 
        [vendingMachineID, slotName]);
}

const modify_item_slot = async (vendingMachineID, slotName, itemID, price, stock) => {

    // Delete slot if item is null
    if(itemID === null) {
        return delete_slot(vendingMachineID, slotName);
    }

    const [result] = await db.query(`SELECT * FROM inventory_join_table 
        WHERE IJT_vm_id = ? AND IJT_slot_name = ?`, 
        [vendingMachineID, slotName]);
    
    if(result.length > 0) {
        // Update slot if it already exists
        return update_slot(vendingMachineID, slotName, itemID, price, stock);
    } else {
        // Add slot if it does not exist
        return add_to_slot(vendingMachineID, slotName, itemID, price, stock);
    }
};

module.exports = { add_to_slot, update_slot, delete_slot, modify_item_slot };