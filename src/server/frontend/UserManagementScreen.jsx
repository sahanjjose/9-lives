import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView, View, ActivityIndicator } from 'react-native';
import { 
  Layout,
  Select,
  SelectItem,
  IndexPath,
  Button,
  Text,
  Input,
  Card,
  Divider
} from '@ui-kitten/components';
import api from './apiCommunicator';

export default function UserManagementScreen({ route, navigation }) {
  const { user, orgId, onUsersUpdated } = route.params;

  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState('');
  const [users,   setUsers]         = useState([]);
  const [groups,  setGroups]        = useState([]);

  // Invite form state
  const [inviteEmail,    setInviteEmail]    = useState('');
  const [inviteGroupIdx, setInviteGroupIdx] = useState(null);
  const [inviteRoleIdx,  setInviteRoleIdx]  = useState(new IndexPath(1));

  const groupNames = groups.map(g => g.group_name);
  const isAdmin    = user.u_role === 'admin';

  // Fetch users + groups via /orgs/:id/display
  const loadDisplay = async () => {
    try {
      setLoading(true);
      const { users: u, groups: g } = await api.getOrgDisplay(orgId);
      setUsers(u);
      setGroups(g);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // On mount, redirect non-admins or load data
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'Only administrators can manage users.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { cancelable: false }
      );
    } else {
      loadDisplay();
    }
  }, [isAdmin, orgId]);

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter a valid email address');
      return;
    }
  
    setError('');
    try {
      const role = inviteRoleIdx.row === 0 ? 'admin' : 'maintainer';
  
      // Only include groupId if one was picked
      if (inviteGroupIdx !== null) {
        const groupId = groups[inviteGroupIdx.row].group_id;
        await api.addUserToOrg(orgId, inviteEmail.trim(), user.email, role, groupId);
      } else {
        await api.addUserToOrg(orgId, inviteEmail.trim(), user.email, role);
      }
  
      await loadDisplay();
      onUsersUpdated?.();
      Alert.alert(
        'Success',
        inviteGroupIdx !== null
          ? `${inviteEmail.trim()} added as ${role}`
          : `${inviteEmail.trim()} invited without group`
      );
  
      // reset form
      setInviteEmail('');
      setInviteGroupIdx(null);
      setInviteRoleIdx(new IndexPath(1));
    } catch (e) {
      setError(e.message);
    }
  };

  // Actually call the API and refresh
  const removeMember = (email) => {
  setLoading(true);
  api
    .leaveOrganization(orgId, email)
    .then(() => loadDisplay())
    .then(() => {
      onUsersUpdated?.();
      Alert.alert('Removed', `${email} has been removed from the organization.`);
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
  };

  // Reassign an existing member to a group
  const assignMember = async (email, idxPath) => {
    if (!idxPath || idxPath.row < 0) return;
    setError('');
  
    // If user selected the “No Group” option (at index 0), reset to default group
    const isNoGroup = idxPath.row === 0;
    const groupId = isNoGroup
      ? 3000001
      : groups[idxPath.row - 1].group_id;  // real groups shifted by one in the dropdown
  
    try {
      await api.assignUserToGroup(email, groupId, user.email);
      await loadDisplay();
      onUsersUpdated?.();
      Alert.alert(
        'Success',
        isNoGroup
          ? `${email} has been reset to the default group.`
          : `${email} moved to ${groups[idxPath.row - 1].group_name}`
      );
    } catch (e) {
      setError(e.message);
    }
  };

  
  const changeRole = async (targetEmail, idxPath) => {
    if (!idxPath || idxPath.row < 0) return;
  
    const role = idxPath.row === 0 ? 'admin' : 'maintainer';

    /* ‑‑ stop if the admin tries to demote themself ‑‑ */
    if (targetEmail === user.email && role !== 'admin') {
      Alert.alert(
        'Permission denied',
        'You cannot remove your own admin privilege.'
      );
      return;
    }
  
    try {
      /* 1 ─ send exactly the structure updateUser expects */
      await api.updateUser(
        user.email,                        // credential / path param
        { [targetEmail]: { n_role: role } } // ← JUST the map of changes
      );
  
      /* 2 ─ optimistic UI update */
      setUsers(prev =>
        prev.map(u =>
          u.email === targetEmail ? { ...u, u_role: role } : u
        )
      );
  
      /* 3 ─ refresh from server */
      await loadDisplay();
      onUsersUpdated?.();
      Alert.alert('Success', `${targetEmail} is now ${role}`);
    } catch (e) {
      setError(e.message);
    }
  };

  // Render
  if (!isAdmin) {
    return (
      <Layout style={styles.container}>
        <Text status="danger">Access Denied. Redirecting…</Text>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout style={styles.container}>
        <ActivityIndicator size="large" />
      </Layout>
    );
  }

  return (
    <Layout style={styles.container}>
      <Text category="h4">Manage Organization Users</Text>
      {error ? <Text status="danger" style={styles.error}>{error}</Text> : null}

      {/* Invite New Member Section */}
      <Card style={styles.card}>
        <Text category="h6" style={styles.cardHeader}>Invite New Member</Text>
        <Input
          placeholder="User Email"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          style={styles.input}
        />
        <Select
          placeholder="Select Group"
          selectedIndex={inviteGroupIdx}
          value={inviteGroupIdx !== null ? groupNames[inviteGroupIdx.row] : 'Select Group'}
          onSelect={setInviteGroupIdx}
          style={styles.input}
        >
          {groupNames.map((name, index) => (
            <SelectItem key={index} title={name} />
          ))}
        </Select>
        <Select
          placeholder="Select Role"
          selectedIndex={inviteRoleIdx}
          value={inviteRoleIdx.row === 0 ? 'admin' : 'maintainer'}
          onSelect={setInviteRoleIdx}
          style={styles.input}
        >
          <SelectItem title="admin" />
          <SelectItem title="maintainer" />
        </Select>
        <Button
          onPress={inviteMember}
          disabled={loading || !inviteEmail.trim()}
          style={styles.button}
        >
          Add Member
        </Button>
      </Card>

      {/* Existing Users Section */}
      <Card style={styles.card}>
        <Text category="h6" style={styles.cardHeader}>Organization Members</Text>
        <ScrollView style={styles.scrollView}>
          {users.map((u, userIdx) => {
            /* group dropdown */
            const grpIdx = groups.findIndex(g => g.group_id === u.group_id);
            const grpPath = grpIdx !== -1 ? new IndexPath(grpIdx) : null;

            /* role dropdown */
            const roleIdx = u.u_role === 'admin' ? new IndexPath(0) : new IndexPath(1);

            return (
              <React.Fragment key={u.email}>
                <Layout style={styles.userRow}>
                  {/* name + email */}
                  <Layout style={styles.userInfo}>
                  <Text
    category="s1"
    numberOfLines={1}
    ellipsizeMode="tail"
    style={styles.noWrapText}
  >
    {u.u_name || u.email}
  </Text>
  <Text
    appearance="hint"
    numberOfLines={1}
    ellipsizeMode="tail"
    style={styles.noWrapText}
  >
    ID: {u.email}
  </Text>
                  </Layout>
              
                  {/* role selector (only admins can change) */}
                  {isAdmin && (
                    <Select
                      selectedIndex={roleIdx}
                      value={roleIdx.row === 0 ? 'admin' : 'maintainer'}
                      onSelect={idx => changeRole(u.email, idx)}
                      disabled={loading || u.email === user.email}
                      style={[styles.roleSelect, { marginLeft: 'auto' }]}
                    >
                      <SelectItem title="admin" />
                      <SelectItem title="maintainer" />
                    </Select>
                  )}

                  {/* group selector */}
                  <Select
  // If grpPath is not null, select its index+1; else select 0 (“No Group”)
  selectedIndex={
    grpPath !== null
      ? new IndexPath(grpPath.row + 1)
      : new IndexPath(0)
  }
  // Display the actual group name or “No Group”
  value={
    grpPath !== null
      ? groupNames[grpPath.row]
      : 'No Group'
  }
  onSelect={idx => assignMember(u.email, idx)}
  disabled={loading}
  style={[styles.groupSelect, { marginLeft: 8 }]}
>
  {/* 0: No Group */}
  <SelectItem title="No Group" />
  {/* 1…N: actual groups */}
  {groupNames.map((name, i) => (
    <SelectItem key={i + 1} title={name} />
  ))}
</Select>
                  <Button
                    size="small"
                    status="danger"
                    onPress={() => removeMember(u.email)}
                    disabled={loading || u.email === user.email}
                    style={styles.removeButton}
                  >
                    Remove
                  </Button>
                </Layout>

                {userIdx < users.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </Card>

      <Button appearance="ghost" onPress={() => navigation.goBack()} style={styles.button}>
        Back
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginVertical: 10,
    width: '100%',
  },
  cardHeader: {
    marginBottom: 10,
  },
  input: {
    marginVertical: 8,
  },
  button: {
    marginVertical: 8,
  },
  error: {
    marginVertical: 10,
  },
  userInfo: {
    //flex: 1,
    marginRight: 0,        // space between text block and controls
    minWidth: 100,           // allow it to shrink below its content width
    paddingRight: 100
  },
  groupSelect: {
    width: '40%',
  },
  scrollView: {
    maxHeight: 300,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeButton: {
    marginLeft: 8,
  },
  noWrapText: {
    flexShrink: 1,    // allow it to shrink but not wrap
  },
  userRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',      // allow children to wrap onto next line
    alignItems: 'center',
    paddingVertical: 12,
  },
});
