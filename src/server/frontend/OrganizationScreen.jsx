import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Layout, Button, Text, Input, List, ListItem, Card } from '@ui-kitten/components';
import api from './apiCommunicator';

export default function OrganizationScreen({ route, navigation }) {
  const { user: initialUser } = route.params;
  const [user, setUser] = useState(initialUser);
  const [orgName, setOrgName] = useState('');
  const [data, setData] = useState({ users: [], groups: [] });
  const [newOrgName, setNewOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine if user is admin
  const isAdmin = user.u_role === 'admin';

  // Fetch organization name
  const fetchOrgName = useCallback(async () => {
    try {
      const { org_name } = await api.getOrgName(user.org_id);
      setOrgName(org_name);
    } catch (err) {
      console.error('Failed to fetch org name', err);
    }
  }, [user.org_id]);

  // Fetch organization display data
  const fetchOrg = useCallback(async () => {
    setLoading(true);
    try {
      await fetchOrgName();
      const display = await api.getOrgDisplay(user.org_id);
      setData({
        users: display.users,
        groups: display.groups
      });
      setError('');
    } catch (e) {
      setError(e.message.includes('404') ? 'Organization not found' : e.message);
    } finally {
      setLoading(false);
    }
  }, [user.org_id, fetchOrgName]);

  /* -----------------------------------------------------------
   * Force‑refresh the org name + users + groups in one shot
   * --------------------------------------------------------- */
  const refreshDisplay = useCallback(async () => {
    if (user.org_id && user.org_id !== 1000001) {
      await fetchOrg();           // fetchOrg already calls fetchOrgName inside
    } else {
      // clear everything when the user no longer belongs to an org
      setOrgName('');
      setData({ users: [], groups: [] });
    }
  }, [user.org_id, fetchOrg]);

  useEffect(() => {
    if (user.org_id && user.org_id !== 1000001) {
      fetchOrg();
    }
  }, [user.org_id, fetchOrg]);

  // Create or leave organization
  const createOrLeave = async action => {
    setLoading(true);
    try {
      if (action === 'create') {
        if (!newOrgName.trim()) {
          setError('Please enter an organization name');
          setLoading(false);
          return;
        }
        
        const { admin_user, org_name } = await api.createOrganization(newOrgName.trim(), user.email);
        setUser(admin_user);
        setOrgName(org_name);
        setNewOrgName('');
      } else {
        await api.leaveOrganization(user.org_id, user.email);
        setUser(u => ({ ...u, org_id: 1000001, u_role: 'maintainer' }));
      }
      /* make sure what we show matches the DB */
      await refreshDisplay();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToUserManagement = () => {
    navigation.navigate('UserManagement', {
      user,
      orgId: user.org_id,
      groups: data.groups,
      users: data.users,
      onUsersUpdated: refreshDisplay
    });
  };

  const navigateToGroupManagement = () => {
    navigation.navigate('GroupManagement', {
      user,
      orgId: user.org_id,
      groups: data.groups,
      onGroupsUpdated: refreshDisplay
    });
  };

  if (loading) {
    return (
      <Layout style={styles.loader}>
        <ActivityIndicator />
      </Layout>
    );
  }

  // No org or error state
  if (error || user.org_id === 1000001) {
    return (
      <Layout style={styles.container}>
        {error && <Text status='danger' style={styles.error}>{error}</Text>}
        <Card style={styles.card}>
          <Text category='h6' style={styles.cardHeader}>Create Organization</Text>
          <Input
            placeholder='Organization Name'
            value={newOrgName}
            onChangeText={setNewOrgName}
            style={styles.input}
          />
          <Button onPress={() => createOrLeave('create')} style={styles.button}>
            Create Organization
          </Button>
        </Card>
        <Button appearance='ghost' onPress={() => navigation.goBack()} style={styles.button}>
          Cancel
        </Button>
      </Layout>
    );
  }

  // Render organization content
  return (
    <Layout style={styles.container}>
      <Text category='h4'>{orgName} #{user.org_id}</Text>
      
      {/* Users Section */}
      <Card style={styles.card}>
        <Text category='h6' style={styles.cardHeader}>Organization Members</Text>
        <List
          data={data.users}
          renderItem={({ item }) => {
            const groupName = data.groups.find(g => g.group_id === item.group_id)?.group_name || 'No Group';
            return (
              <ListItem
                title={`${item.u_name} (${item.u_role})`}
                description={`Group: ${groupName}`}
              />
            );
          }}
          style={styles.list}
        />
        {isAdmin ? (
          <Button 
            onPress={navigateToUserManagement} 
            style={styles.button}
            status='primary'
          >
            Manage Users
          </Button>
        ) : (
          <Text appearance='hint' style={styles.hintText}>
            Only admins can manage users
          </Text>
        )}
      </Card>

      {/* Groups Section */}
      <Card style={styles.card}>
        <Text category='h6' style={styles.cardHeader}>Organization Groups</Text>
        <List
          data={data.groups}
          renderItem={({ item }) => (
            <ListItem
              title={item.group_name}
            />
          )}
          style={styles.list}
        />
        {isAdmin ? (
          <Button 
            onPress={navigateToGroupManagement} 
            style={styles.button}
            status='primary'
          >
            Manage Groups
          </Button>
        ) : (
          <Text appearance='hint' style={styles.hintText}>
            Only admins can manage groups
          </Text>
        )}
      </Card>

      <Button 
        status='danger' 
        onPress={() => createOrLeave('leave')} 
        style={styles.button}
      >
        Leave Organization
      </Button>
      <Button 
        appearance='ghost' 
        onPress={() => navigation.goBack()} 
        style={styles.button}
      >
        Back
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    alignItems: 'center' 
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  card: {
    width: '100%',
    marginVertical: 10,
  },
  cardHeader: {
    marginBottom: 10,
  },
  list: {
    maxHeight: 200,
    marginBottom: 10,
  },
  input: { 
    marginVertical: 10 
  },
  button: { 
    marginVertical: 5 
  },
  error: {
    marginBottom: 10,
  },
  hintText: {
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic'
  }
});