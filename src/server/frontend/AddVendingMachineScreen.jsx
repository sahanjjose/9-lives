import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Input, Button, Text } from '@ui-kitten/components';
import api from './apiCommunicator';

export default function AddVendingMachineScreen({ route, navigation }) {
  const { user } = route.params;
  const [vmId, setVmId] = useState('');
  const [vmName, setVmName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!vmId.trim() || !vmName.trim()) {
      setError('Please enter both ID and name');
      return;
    }
    setError('');
    try {
      await api.createVendingMachine({
        vm_id: vmId,
        vm_name: vmName,
        org_id: user.org_id,
      });
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Layout style={styles.container}>
      <Text category='h5' style={styles.header}>Add Vending Machine</Text>
      {error ? <Text status='danger' style={styles.error}>{error}</Text> : null}
      <Input
        style={styles.input}
        placeholder='Machine ID'
        value={vmId}
        onChangeText={setVmId}
      />
      <Input
        style={styles.input}
        placeholder='Machine Name'
        value={vmName}
        onChangeText={setVmName}
      />
      <Button style={styles.button} onPress={handleSubmit}>
        Add Machine
      </Button>
      <Button appearance='ghost' style={styles.button} onPress={() => navigation.goBack()}>
        Cancel
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { marginBottom: 20 },
  input: { marginBottom: 15 },
  button: { marginVertical: 5 },
  error: { marginBottom: 10 },
});
