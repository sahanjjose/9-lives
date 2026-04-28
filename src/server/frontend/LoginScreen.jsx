// LoginScreen.jsx
import React, { useState } from 'react';
import { StyleSheet, Platform, Dimensions, Image } from 'react-native';
import { Layout, Input, Button, Text } from '@ui-kitten/components';
import api from './apiCommunicator';

const { width } = Dimensions.get('window');
// inputWidth for web, 90% width for mobile
const isMobileWeb = Platform.OS === 'web' && width < 768;
const inputWidth = isMobileWeb
  ? width * 0.9
  : width * 0.25;

//const inputWidth = width * 0.25;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    try {
      await api.loginUser({ u_email: email, password });
      const user = await api.getUser(email);
      navigation.navigate('Dashboard', { user });
    } catch (e) {
      setError(e.message);
    }
  };

  const handleGoogleLogin = () => {
    // implement your Google OAuth flow here
  };

  return (
    <Layout style={styles.container}>
      <Image
        source={require('./assets/nineLivesLogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text category='h4' style={styles.header}>Welcome Back</Text>
      {error ? <Text status='danger' style={styles.error}>{error}</Text> : null}

      <Input
        style={[styles.input, { width: inputWidth }]}
        placeholder='Email'
        value={email}
        onChangeText={setEmail}
        autoCapitalize='none'
      />
      <Input
        style={[styles.input, { width: inputWidth }]}
        placeholder='Password'
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button style={[styles.button, { width: inputWidth }]} onPress={handleLogin}>
        LOGIN
      </Button>
      <Button appearance='ghost' style={[styles.button, { width: inputWidth }]} onPress={() => navigation.navigate('Register')}>
        REGISTER
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  logo:     { width: width * 0.15, height: width * 0.15, marginBottom: 20 },
  header: { marginBottom:20, color:'#333' },
  error: { marginBottom:10 },
  input: { marginBottom:15 },
  button: { marginVertical:5 },
});
