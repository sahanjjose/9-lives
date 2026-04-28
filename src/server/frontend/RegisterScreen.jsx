import React, { useState } from 'react';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Layout, Input, Button, Text } from '@ui-kitten/components';
import api from './apiCommunicator';

// Calculate dynamic width for inputs (and buttons if desired)
const { width } = Dimensions.get('window');
const isMobileWeb = Platform.OS === 'web' && width < 768;
const inputWidth = isMobileWeb ? width * 0.9 : width * 0.25;

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      // using email as u_name for now
      const user = await api.createUser({ u_name: email, email, password });
      navigation.navigate('Dashboard', { user });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Layout style={styles.container}>
      <Text category='h4' style={styles.header}>Create Account</Text>
      {error ? <Text status='danger' style={styles.error}>{error}</Text> : null}

      <Input
        style={[styles.input, { width: inputWidth }]}
        placeholder='Email'
        autoCapitalize='none'
        value={email}
        onChangeText={setEmail}
      />

      <Input
        style={[styles.input, { width: inputWidth }]}
        placeholder='Password'
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        style={[styles.button, { width: inputWidth }]}
        onPress={handleRegister}
      >
        REGISTER
      </Button>

      <Button
        appearance='ghost'
        style={[styles.button, { width: inputWidth }]}
        onPress={() => navigation.goBack()}
      >
        BACK TO LOGIN
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { marginBottom: 20 },
  error: { marginBottom: 10 },
  input: { marginBottom: 15 },
  button: { marginVertical: 5 },
});
