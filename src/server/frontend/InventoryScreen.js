import React, { useState, useEffect, useCallback, isValidElement, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Layout, Text, Input, Button, Modal, Card } from '@ui-kitten/components';
import api from './apiCommunicator';

export default function InventoryScreen({ route, navigation }) {
  const { user, vm: initialVm } = route.params;
  const [vm, setVm] = useState(initialVm);
  const [vmInventory, setVmInventory] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [isRestockMode, setIsRestockMode] = useState(false);
  const [editedItems, setEditedItems] = useState({});
  const [newItems, setNewItems] = useState({});
  const [deleteSlots, setDeleteSlots] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderedSlots, setOrderedSlots] = useState([]);

  // Create a reference to store the interval ID
  const intervalRef = useRef(null);
  const vmIsRegistered = Boolean(vm.vm_row_count && vm.vm_column_count);
  // Track vm_mode: 'i'=idle, 'r'=restock, 't'=transaction
  const modeChar = vm.vm_mode ?? (isRestockMode ? 'r' : 'i');
  const modeLabel = modeChar === 'i'
  ? 'Idle'
  : modeChar === 'r'
  ? 'Restocking'
  : modeChar === 't'
  ? 'Ongoing Transaction'
  : 'Unknown';
  const fetchInventory = useCallback(async () => {
    try {
      const inv = await api.getInventory(vm.vm_id);
      setVmInventory(
        inv.map(i => ({
          slot: i.slot_name,
          itemName: i.item_name,
          price: Number(i.price),
          stock: Number(i.stock),
        }))
      );
      const { isOnline } = await api.isVMOnline(vm.vm_id);
      setOnlineStatus(isOnline);
    } catch (error) {
      showError(`Failed to fetch inventory: ${error.message}`);
    }
  }, [vm.vm_id]);

  // Fetch latest VM details
  const fetchVmDetails = useCallback(async () => {
    try {
      const updatedVm = await api.getVendingMachine(vm.vm_id);
      setVm(updatedVm);
    } catch (error) {
      // ignore or show error
    }
  }, [vm.vm_id]);

  // Generate slots in column-first order
  useEffect(() => {
    if (vmIsRegistered) {
      const slots = [];
      // Column first (outer loop is column, inner loop is row)
      for (let r = 0; r < (vm.vm_row_count || 0); r++) {
        for (let c = 0; c < (vm.vm_column_count || 0); c++) {
          slots.push(`${r}${c}`); // Creates 01, 01, 02, 10, 11, 12 etc.
        }
      }
      setOrderedSlots(slots);
    }
  }, [vm.vm_column_count, vm.vm_row_count, vmIsRegistered]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Poll VM details and inventory every 1 second
  useEffect(() => {
    // Clear any existing interval first (belt and suspenders approach)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Create new interval and store its ID in the ref
    intervalRef.current = setInterval(() => {
      fetchVmDetails();
      fetchInventory();
    }, 1000);
    
    // Return cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchVmDetails, fetchInventory]);

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const deleteVm = async () => {
    try {
      setShowDeleteConfirm(false);
      
      // Clear the polling interval BEFORE deleting or navigating
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      await api.deleteVendingMachine(vm.vm_id);
      navigation.navigate('Dashboard', { user });
    } catch (e) {
      showError(`Could not delete: ${e.message}`);
    }
  };
  
  const startRestock = async () => {
    if (!vmIsRegistered) return;
    
    try {
       const vmDb = await api.getVendingMachine(vm.vm_id);
    
       if (vmDb.vm_mode !== 'i') {
         showError('Vending machine is not idle – cannot enter restock mode.');
         return;                                             // bail out early
       }
       /* … continue with restock … */
     } catch (err) {
       showError(`Could not enter restock mode: ${err.message}`);
     }
    
    try {
      await api.updateVendingMachineMode(vm.vm_id, 'r');
      setIsRestockMode(true);

      const items = {};
      const newSlots = {};
      const deletes = {};
      vmInventory.forEach(i => {
        items[i.slot] = {
          itemName: i.itemName,
          price: i.price.toString(),
          stock: i.stock.toString()
        };
        deletes[i.slot] = false;
      });

      for (let c = 0; c < (vm.vm_column_count || 0); c++) {
        for (let r = 0; r < (vm.vm_row_count || 0); r++) {
          const slot = `${r}${c}`;
          if (!items[slot]) newSlots[slot] = { itemName: '', price: '', stock: '' };
        }
      }
      
      setEditedItems(items);
      setNewItems(newSlots);
      setDeleteSlots(deletes);
    } catch (error) {
      showError(`Could not enter restock mode: ${error.message}`);
    }
  };

  const cancelRestock = async () => {
    try {
      vm.vm_mode == 'r' ? await api.updateVendingMachineMode(vm.vm_id, 'i') : null;
      setIsRestockMode(false);
      setEditedItems({});
      setNewItems({});
      setDeleteSlots({});
    } catch (error) {
      showError(`Could not cancel restock: ${error.message}`);
    }
  };

  const goBack = async() => {
    cancelRestock();
    navigation.goBack();
  }

  const submitRestock = async () => {
    const updates = vmInventory.map(item => ({
      slot_name: item.slot,
      item_name: deleteSlots[item.slot] ? null : editedItems[item.slot].itemName,
      price: deleteSlots[item.slot] ? 0 : parseFloat(editedItems[item.slot].price),
      stock: deleteSlots[item.slot] ? 0 : parseInt(editedItems[item.slot].stock, 10),
    }));

    const additions = Object.entries(newItems)
      .filter(([_, d]) => d.itemName)
      .map(([slot, d]) => ({
        slot_name: slot,
        item_name: d.itemName,
        price: parseFloat(d.price),
        stock: parseInt(d.stock, 10),
      }));

    try {
      await api.batchUpdateInventory(vm.vm_id, [...updates, ...additions]);
      await api.updateVendingMachineMode(vm.vm_id, 'i');
      setIsRestockMode(false);
      fetchInventory();
    } catch (e) {
      showError(`Could not save changes: ${e.message}`);
    }
  };

  const handleItemChange = (slot, field, v) => {
    setEditedItems(prev => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        [field]: field === 'price'
          ? v.replace(/[^0-9.]/g, '')
          : field === 'stock'
          ? v.replace(/[^0-9]/g, '')
          : v,
      },
    }));
  };

  const handleNewItemChange = (slot, field, v) => {
    setNewItems(p => ({
      ...p,
      [slot]: {
        ...p[slot],
        [field]: field === 'price'
          ? v.replace(/[^0-9.]/g, '')
          : field === 'stock'
          ? v.replace(/[^0-9]/g, '')
          : v,
      },
    }));
  };

  const toggleDeleteSlot = (slot) => {
    setDeleteSlots(p => ({ ...p, [slot]: !p[slot] }));
  };

  const isMaintainer = user.u_role === 'maintainer';

  const renderItemRow = ({ item: slot }) => {
    const item = vmInventory.find(i => i.slot === slot);
    const stock = item ? item.stock : null;

    let statusColor = '#aaa';
    if (stock === 0) statusColor = '#f44336';
    else if (stock !== null && stock < 5) statusColor = '#ffeb3b';
    else if (stock !== null) statusColor = '#4caf50';

    return (
      <View style={styles.itemRow}>
        <View style={styles.slotIndicator}>
          <Text category="c1" style={styles.slotText}>{slot}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        </View>

        {item && !isRestockMode && (
          <>
            <View style={styles.nameSection}>
              <Text category="p2" numberOfLines={1}>{item.itemName}</Text>
            </View>
            <View style={styles.priceSection}>
              <Text category="p2">${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.stockSection}>
              <Text category="p2">Stock: {stock}</Text>
            </View>
          </>
        )}

        {item && isRestockMode && !deleteSlots[slot] && (
          <>
            <View style={styles.nameSection}>
              <Input
                style={styles.input}
                value={editedItems[slot]?.itemName}
                onChangeText={v => handleItemChange(slot, 'itemName', v)}
                maxLength={15}
                placeholder="Item name"
              />
            </View>
            <View style={styles.priceSection}>
              <Input
                style={styles.input}
                placeholder="Price"
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'decimal-pad'}
                value={editedItems[slot]?.price}
                onChangeText={v => handleItemChange(slot, 'price', v)}
              />
            </View>
            <View style={styles.stockSection}>
              <Input
                style={styles.input}
                placeholder="Stock"
                keyboardType="numeric"
                value={editedItems[slot]?.stock}
                onChangeText={v => handleItemChange(slot, 'stock', v)}
              />
            </View>
            <Button 
              size="tiny"
              status="basic"
              onPress={() => toggleDeleteSlot(slot)}
            >
              Delete
            </Button>
          </>
        )}

        {item && isRestockMode && deleteSlots[slot] && (
          <>
            <View style={styles.nameSection}>
              <Text category="p2" style={styles.deleted} numberOfLines={1}>{item.itemName}</Text>
            </View>
            <View style={styles.priceSection}>
              <Text category="p2" style={styles.deleted}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.stockSection}>
              <Text category="p2" style={styles.deleted}>Stock: {stock}</Text>
            </View>
            <Button size="tiny" status="danger" onPress={() => toggleDeleteSlot(slot)}>
              Undo
            </Button>
          </>
        )}

        {isRestockMode && !item && (
          <>
            <View style={styles.nameSection}>
              <Input
                style={styles.input}
                placeholder="Item name"
                value={newItems[slot]?.itemName}
                onChangeText={v => handleNewItemChange(slot, 'itemName', v)}
                maxLength={15}
              />
            </View>
            <View style={styles.priceSection}>
              <Input
                style={styles.input}
                placeholder="Price"
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'decimal-pad'}
                value={newItems[slot]?.price}
                onChangeText={v => handleNewItemChange(slot, 'price', v)}
              />
            </View>
            <View style={styles.stockSection}>
              <Input
                style={styles.input}
                placeholder="Stock"
                keyboardType="numeric"
                value={newItems[slot]?.stock}
                onChangeText={v => handleNewItemChange(slot, 'stock', v)}
              />
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <Layout style={styles.container}>
          <View style={styles.headerRow}>
            <Text category="h5">Inventory: {vm.vm_name}</Text>
            <View style={styles.actionsRow}>
              {!isMaintainer && (
                <Button status="danger" size="tiny" disabled={isMaintainer} onPress={() => setShowDeleteConfirm(true)}>
                  Delete VM
                </Button>
              )}
              <Button appearance="ghost" size="tiny" onPress={goBack}>
                Back
              </Button>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, onlineStatus ? styles.greenDot : styles.redDot]} />
            <Text category="p2">{onlineStatus ? 'Online' : 'Offline'}</Text>
            <Text style={vmIsRegistered ? styles.registeredTag : styles.unregisteredTag}>
              {vmIsRegistered ? `Registered` : 'Unregistered'}
            </Text>
            <Text >
              {vmIsRegistered ? ` Mode: ${modeLabel}` : ''}
            </Text>
          </View>

          {/* Fixed header outside of FlatList */}
          <View style={styles.listHeaderRow}>
            <View style={styles.slotIndicator}>
              <Text category="s2">Slot</Text>
            </View>
            <View style={styles.nameSection}>
              <Text category="s2">Name</Text>
            </View>
            <View style={styles.priceSection}>
              <Text category="s2">Price</Text>
            </View>
            <View style={styles.stockSection}>
              <Text category="s2">Stock</Text>
            </View>
            {isRestockMode && <View style={{ width: 70 }} />}
          </View>

          {/* Using a wrapper View with explicit height and enhanced overflow properties */}
          <View style={styles.listContainer}>
            {/* Use FlatList with improved scrolling properties */}
            <FlatList
              data={orderedSlots}
              keyExtractor={(item) => item}
              renderItem={renderItemRow}
              style={styles.flatList}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text>No inventory slots available</Text>
                </View>
              }
            />
          </View>
        </Layout>

        {/* Bottom fixed button container */}
        <View style={styles.bottomFixedContainer}>
          {!isRestockMode ? (
            <Button
              disabled={!vmIsRegistered}
              appearance={vmIsRegistered ? 'filled' : 'outline'}
              status={vmIsRegistered ? 'primary' : 'basic'}   // neutral/basic palette when disabled
              onPress={startRestock}
            >
              Edit Stocks
            </Button>
          ) : (
            <View style={styles.buttonRow}>
              <Button style={styles.button} onPress={cancelRestock}>Cancel</Button>
              <Button style={styles.button} onPress={submitRestock}>Submit Changes</Button>
            </View>
          )}
        </View>

        <Modal
          visible={showErrorModal}
          backdropStyle={styles.backdrop}
          onBackdropPress={() => setShowErrorModal(false)}
          style={styles.modalContainer}
        >
          <Card>
            <Text category="h6">Error</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <Button onPress={() => setShowErrorModal(false)}>OK</Button>
          </Card>
        </Modal>

        <Modal
          visible={showDeleteConfirm}
          backdropStyle={styles.backdrop}
          onBackdropPress={() => setShowDeleteConfirm(false)}
          style={styles.modalContainer}
        >
          <Card>
            <Text category="h6">Confirm Delete</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this vending machine?</Text>
            <View style={styles.modalButtons}>
              <Button status="basic" onPress={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button status="danger" onPress={deleteVm}>
                Delete
              </Button>
            </View>
          </Card>
        </Modal>
      </KeyboardAvoidingView>

      {/* Web-specific scrollbar styling */}
      <style jsx global>{`
        /* Ensure scrollbar is always visible and prominent */
        *::-webkit-scrollbar {
          width: 14px;
          background-color: #f0f0f0;
        }
        
        *::-webkit-scrollbar-thumb {
          background-color: #FF6B81;
          border-radius: 7px;
          border: 3px solid #f0f0f0;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background-color: #C41C2F;
        }
        
        /* Set specific scrolling mode for the list container */
        .list-container {
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
        }
      `}</style>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
    position: 'relative', // Required for absolute positioning of child elements
  },
  container: { 
    flex: 1,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: 80, // Added padding to make room for the fixed bottom button
  },
  // New container specifically for the list area
  listContainer: {
    flex: 1,
    minHeight: 200, // Ensure minimum height for scrolling
    maxHeight: '85vh', // Use viewport height for web
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginBottom: 16,
    className: 'list-container', // For web-specific styling
  },
  flatList: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  listContent: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionsRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    marginRight: 6 
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  greenDot: { 
    backgroundColor: '#4caf50' 
  },
  redDot: { 
    backgroundColor: '#f44336' 
  },
  registeredTag: { 
    color: '#2e7d32', 
    marginLeft: 12 
  },
  unregisteredTag: { 
    color: '#d32f2f', 
    marginLeft: 12 
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    marginBottom: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 50, // Ensure enough height to be clickable
  },
  slotIndicator: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 8,
  },
  slotText: {
    fontWeight: 'bold',
  },
  nameSection: {
    flex: 3,
    paddingHorizontal: 8,
  },
  priceSection: {
    flex: 1,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
  },
  stockSection: {
    flex: 1,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
  },
  input: {
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  deleted: { 
    textDecorationLine: 'line-through',
    color: '#888'
  },
  // New styles for fixed bottom positioning
  bottomFixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Extra padding for iOS devices with home indicator
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomButton: {
    backgroundColor: '#FF6B81', // Pink color to match scrollbar theme
    borderColor: '#FF6B81',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: { 
    flex: 1, 
    marginHorizontal: 4,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalText: {
    marginVertical: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,              // remove any default margins
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});