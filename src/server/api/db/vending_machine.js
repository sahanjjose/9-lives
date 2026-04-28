const db = require("./db_connection"); // Import database connection

// Function to check if vending machine exists
const vendingMachineExists = async (vendingMachineID, res) => {
    const [results] = await db.query("SELECT * FROM vending_machines WHERE vm_id = ?", [vendingMachineID]);
    if(results.length === 0) {
        res.status(404).json({ error: "Vending machine not found" });
        return false;
    }
    return true;
};

const vendingMachineExistsBool = async (vendingMachineID) => {
    const [results] = await db.query("SELECT * FROM vending_machines WHERE vm_id = ?", [vendingMachineID]);
    if(results.length === 0) {
        return false;
    }
    return true;
};

module.exports = { vendingMachineExists, vendingMachineExistsBool };