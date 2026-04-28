import React from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import DashboardScreen from './DashboardScreen';
import InventoryScreen from './InventoryScreen';
import OrganizationScreen from './OrganizationScreen';
import AddVendingMachineScreen from './AddVendingMachineScreen';
import UserManagementScreen from './UserManagementScreen';
import GroupManagementScreen from './GroupManagementScreen';

const Stack = createStackNavigator();

export default function App() {
  // Customize your theme colors to match the logo's pastel gradient
  const customTheme = {
    ...eva.light,
    'color-primary-100': '#FFD1DC', // soft pink
    'color-primary-500': '#FF6B81', // medium coral
    'color-primary-800': '#C41C2F', // deep rose
  };

  return (
    <>  
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={customTheme}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
              name="Inventory"
              component={InventoryScreen}
              options={{ title: 'Manage Inventory' }}
            />
            <Stack.Screen name="Organization" component={OrganizationScreen} />
            <Stack.Screen
              name="UserManagement"
              component={UserManagementScreen}
              options={{ title: 'Manage Users' }}
            />
            <Stack.Screen
              name="GroupManagement"
              component={GroupManagementScreen}
              options={{ title: 'Manage Groups' }}
            />
            <Stack.Screen
              name="AddVendingMachine"
              component={AddVendingMachineScreen}
              options={{ title: 'Register Vending Machine' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ApplicationProvider>
    </>
  );
}