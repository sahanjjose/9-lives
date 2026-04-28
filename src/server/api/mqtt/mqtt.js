const mqtt = require('mqtt');
const db = require("../db/db_connection"); // Import database connection
const client = mqtt.connect('mqtt://mosquitto:1883', { 
    clean: false,
    clientId: 'server-mqtt-client'  // A stable, consistent client ID
  });

client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

client.on('error', (error) => {
    console.error('MQTT connection error:', error);
});

// Send notification to vending machine of restock
function notifyDatabaseChange(vendingMachineID) {
    const topic = `vm/restocked/${vendingMachineID}`;
    // qos 1 ensures messages that don't go through will be queued until connection is fixed
    // retain true ensures that the last message sent is stored and sent to new subscribers but not repeated
    client.publish(topic, `${vendingMachineID} restocked`, { qos: 1, retain: true }); 
    console.log(`Published to ${topic}: ${vendingMachineID} restocked`);
}

// Sends restock notification if VM just finished restocking
async function notifyIfRestock(vendingMachineID) {
    const [results] = await db.query("SELECT vm_mode FROM vending_machines WHERE vm_id = ?", [vendingMachineID])
    if(results[0].vm_mode === 'r') {
        notifyDatabaseChange(vendingMachineID)
    }
}

const pendingChecks = {}; // To track ongoing health checks

// Set up message handler once
client.on('message', function(topic, message) {
  const topicParts = topic.split('/');
  if (topicParts[1] === 'status' && topicParts.length >= 3) {
    const hardwareId = topicParts[2];
    const status = message.toString();
    
    // If we have a pending check for this hardware ID, resolve it
    if (pendingChecks[hardwareId]) {
      clearTimeout(pendingChecks[hardwareId].timeout);
      client.unsubscribe(`vm/status/${hardwareId}`);
      
      pendingChecks[hardwareId].resolve({
        hardwareId,
        status: status,
        isOnline: status === 'online',
        lastChecked: new Date()
      });
      
      // Remove this pending check
      delete pendingChecks[hardwareId];
    }
  }
});

// Function to check status of a specific client
async function healthCheck(hardwareId) {
  return new Promise((resolve, reject) => {
    // Set a timeout
    const timeout = setTimeout(() => {
      client.unsubscribe(`vm/status/${hardwareId}`);
      delete pendingChecks[hardwareId];
      resolve({ 
        hardwareId,
        status: 'unknown', 
        isOnline: false,
        error: 'Timeout waiting for status'
      });
    }, 500);
    
    // Store the pending check
    pendingChecks[hardwareId] = {
      resolve: resolve,
      reject: reject,
      timeout: timeout
    };
    
    // Subscribe to the status topic
    client.subscribe(`vm/status/${hardwareId}`);
  });
}

module.exports = { notifyIfRestock, healthCheck }