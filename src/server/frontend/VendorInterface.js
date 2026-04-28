import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import apiCommunicator from './apiCommunicator';

export default function VendorInterface({ hardwareId }) {
  // Local state: machine info, inventory, mode, messages, and error.
  const [machineInfo, setMachineInfo] = useState({});
  const [inventory, setInventory] = useState([]);
  const [mode, setMode] = useState('IDLE');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form states
  const [renameInput, setRenameInput] = useState('');
  const [changeSlot, setChangeSlot] = useState('');
  const [changeAmount, setChangeAmount] = useState('');
  const [addSlot, setAddSlot] = useState('');
  const [addItemName, setAddItemName] = useState('');
  const [addCost, setAddCost] = useState('');
  const [addStock, setAddStock] = useState('');
  const [costSlot, setCostSlot] = useState('');
  const [newCost, setNewCost] = useState('');

  // Fetch machine details and inventory using communicator functions.
  const fetchOptions = async () => {
    try {
      const machine = await apiCommunicator.getSingleMachine(hardwareId);
      const inv = await apiCommunicator.getVMItems(hardwareId);
      setMachineInfo(machine);
      setInventory(inv);
      setMode(machine.vm_mode);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [hardwareId]);

  // Rename vending machine using alterName.
  const renameMachine = async () => {
    if (!renameInput) return;
    try {
      await apiCommunicator.alterName(hardwareId, renameInput);
      setMessage(`Renamed machine to ${renameInput}`);
      setRenameInput('');
      fetchOptions();
    } catch (err) {
      setError(err.message);
    }
  };

  // Start restocking: set mode to "RESTOCKING" by calling alterMode with "r".
  const startRestocking = async () => {
    try {
      await apiCommunicator.alterMode(hardwareId, "r");
      setMessage("Restocking mode started.");
      setMode("RESTOCKING");
      fetchOptions();
    } catch (err) {
      setError(err.message);
    }
  };

  // End restocking: set mode to "IDLE" by calling alterMode with "i".
  const endRestocking = async () => {
    try {
      await apiCommunicator.alterMode(hardwareId, "i");
      setMessage("Restocking ended.");
      setMode("IDLE");
      fetchOptions();
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper: update inventory on the backend using updateVMInv.
  const updateInventory = async (updatedInv) => {
    try {
      await apiCommunicator.updateVMInv(hardwareId, updatedInv);
      fetchOptions();
    } catch (err) {
      setError(err.message);
    }
  };

  // Change stock: update the stock of the item at a given slot.
  const changeStock = async () => {
    if (!changeSlot || !changeAmount) return;
    try {
      const amount = parseInt(changeAmount, 10);
      const updatedInv = inventory.map(item => {
        if (item.slot === changeSlot) {
          return { ...item, stock: item.stock + amount };
        }
        return item;
      });
      await updateInventory(updatedInv);
      setMessage(`Changed stock for slot ${changeSlot} by ${changeAmount}`);
      setChangeSlot('');
      setChangeAmount('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Add (or override) an item in a slot.
  const addItemToSlot = async () => {
    if (!addSlot || !addItemName || !addCost || !addStock) return;
    try {
      const newItem = {
        slot: addSlot,
        itemName: addItemName,
        cost: parseFloat(addCost),
        stock: parseInt(addStock, 10)
      };
      // Replace existing item at the slot or add new one.
      const index = inventory.findIndex(item => item.slot === addSlot);
      let updatedInv;
      if (index !== -1) {
        updatedInv = inventory.map(item =>
          item.slot === addSlot ? newItem : item
        );
      } else {
        updatedInv = [...inventory, newItem];
      }
      await updateInventory(updatedInv);
      setMessage(`Added item "${addItemName}" to slot ${addSlot}`);
      setAddSlot('');
      setAddItemName('');
      setAddCost('');
      setAddStock('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Set cost of an item in a slot.
  const setCostOfSlot = async () => {
    if (!costSlot || !newCost) return;
    try {
      const updatedInv = inventory.map(item => {
        if (item.slot === costSlot) {
          return { ...item, cost: parseFloat(newCost) };
        }
        return item;
      });
      await updateInventory(updatedInv);
      setMessage(`Set new cost for slot ${costSlot}`);
      setCostSlot('');
      setNewCost('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Clear a slot: remove the item from that slot.
  const clearSlot = async () => {
    Alert.prompt(
      "Clear Slot",
      "Enter the slot to clear:",
      async (slot) => {
        if (!slot) return;
        try {
          const updatedInv = inventory.filter(item => item.slot !== slot);
          await updateInventory(updatedInv);
          setMessage(`Cleared slot ${slot}`);
        } catch (err) {
          setError(err.message);
        }
      }
    );
  };

  // Reload data by re-fetching machine info and inventory.
  const reloadData = async () => {
    try {
      await fetchOptions();
      setMessage("Data reloaded.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Vendor Interface</Text>
      <Text style={styles.info}>Machine Info: {JSON.stringify(machineInfo)}</Text>
      <Text style={styles.info}>Mode: {mode}</Text>

      {/* Rename Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Rename Vending Machine</Text>
        <TextInput
          style={styles.input}
          placeholder="New name"
          value={renameInput}
          onChangeText={setRenameInput}
        />
        <Button title="Rename" onPress={renameMachine} />
      </View>

      {/* Start Restocking Section */}
      {mode === "IDLE" && (
        <View style={styles.section}>
          <Button title="Start Restocking" onPress={startRestocking} />
        </View>
      )}

      {/* Restocking Operations */}
      {mode === "RESTOCKING" && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Change Stock of Slot</Text>
            <TextInput
              style={styles.input}
              placeholder="Slot"
              value={changeSlot}
              onChangeText={setChangeSlot}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={changeAmount}
              onChangeText={setChangeAmount}
            />
            <Button title="Change Stock" onPress={changeStock} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Add/Override Item in Slot</Text>
            <TextInput
              style={styles.input}
              placeholder="Slot"
              value={addSlot}
              onChangeText={setAddSlot}
            />
            <TextInput
              style={styles.input}
              placeholder="Item Name"
              value={addItemName}
              onChangeText={setAddItemName}
            />
            <TextInput
              style={styles.input}
              placeholder="Cost"
              keyboardType="numeric"
              value={addCost}
              onChangeText={setAddCost}
            />
            <TextInput
              style={styles.input}
              placeholder="Stock"
              keyboardType="numeric"
              value={addStock}
              onChangeText={setAddStock}
            />
            <Button title="Add Item" onPress={addItemToSlot} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Set Cost of Slot</Text>
            <TextInput
              style={styles.input}
              placeholder="Slot"
              value={costSlot}
              onChangeText={setCostSlot}
            />
            <TextInput
              style={styles.input}
              placeholder="New Cost"
              keyboardType="numeric"
              value={newCost}
              onChangeText={setNewCost}
            />
            <Button title="Set Cost" onPress={setCostOfSlot} />
          </View>

          <View style={styles.section}>
            <Button title="Clear Slot" onPress={clearSlot} />
          </View>

          <View style={styles.section}>
            <Button title="End Restocking" onPress={endRestocking} />
          </View>
        </>
      )}

      {/* Reload Data */}
      <View style={styles.section}>
        <Button title="Reload Data" onPress={reloadData} />
      </View>

      {error ? <Text style={styles.error}>Error: {error}</Text> : null}
      {message ? <Text style={styles.message}>Message: {message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center'
  },
  header: {
    fontSize: 26,
    marginBottom: 10
  },
  info: {
    fontSize: 16,
    marginVertical: 5
  },
  section: {
    marginVertical: 10,
    width: '100%'
  },
  sectionHeader: {
    fontSize: 20,
    marginBottom: 5
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10
  },
  error: {
    color: 'red'
  },
  message: {
    color: 'green'
  }
});


