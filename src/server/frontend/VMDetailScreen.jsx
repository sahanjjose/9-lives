import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Layout, Text, Input, Button, List, ListItem } from '@ui-kitten/components';
import api from './apiCommunicator';

export default function VMDetailScreen({ route }) {
  const { vm, user } = route.params;
  const [inventory, setInventory] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => { fetchVMDetail(); }, []);
  const fetchVMDetail = async () => { /* ... */ };

  const handleRestock = async (item) => { /* ... */ };

  const renderInvItem = ({ item }) => (
    <ListItem title={`${item.itemName} (Slot: ${item.slot}) - Stock: ${item.stock}`} />
  );

  return (
    <Layout style={styles.container}>
      <Text category='h5'>{vm.vm_name}</Text>
      <Text>Mode: {vm.vm_mode}</Text>
      <Text category='h6' style={styles.section}>Current Inventory</Text>
      <List
        data={inventory}
        renderItem={renderInvItem}
        style={styles.list}
      />
      <Layout style={styles.restockForm}>
        <Input
          placeholder='Quantity'
          keyboardType='numeric'
          value={quantity}
          onChangeText={setQuantity}
          style={styles.input}
        />
        <Button style={styles.button} onPress={() => handleRestock({ slot: selectedSlot })}>Restock</Button>
      </Layout>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  list: { maxHeight: 200, marginVertical: 8 },
  restockForm: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, marginRight: 8 },
  button: { flex: 1 },
  section: { marginTop: 16 },
});
