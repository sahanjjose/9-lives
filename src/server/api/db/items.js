const db = require("./db_connection"); // Import database connection

// Function to create item
const createItem = async (item_name) => {
    await db.query(
        "INSERT INTO items (item_name) VALUES (?)",
        [item_name]
    );
};

// Function to get ID of item by name
const getItemIdByName = async (item_name) => {
    const [results] = await db.query("SELECT item_id FROM items WHERE item_name = ?", [item_name]);
    return results.affectedRows !== 0 ? results[0].item_id : null;
};

const create_item_if_not_exists = async (itemName) => {
    const [results] = await db.query("SELECT item_id FROM items WHERE item_name = ?", [itemName]);
    if(results.length === 0) {
        await createItem(itemName);
    }
};

module.exports = { createItem, getItemIdByName, create_item_if_not_exists };