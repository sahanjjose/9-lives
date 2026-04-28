import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ScrollView } from 'react-native';
import { Layout, Button, Text, Input, List, ListItem, Card, CheckBox, Modal, Divider } from '@ui-kitten/components';
import api from './apiCommunicator';

export default function GroupManagementScreen({ route, navigation }) {
  const { user, orgId, groups: initialGroups, onGroupsUpdated } = route.params;
  const [groups, setGroups] = useState(initialGroups);
  const [vms, setVms] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [vmAssignments, setVmAssignments] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [tempVmSelections, setTempVmSelections] = useState([]);

  // Check if user is admin
  const isAdmin = user.u_role === 'admin';

  // Redirect non-admin users back to organization screen
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'Only administrators can manage groups.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { cancelable: false }
      );
    }
  }, [isAdmin, navigation]);

  // If not admin, don't render the content
  if (!isAdmin) {
    return (
      <Layout style={styles.container}>
        <Text status="danger">Access Denied. Redirecting...</Text>
      </Layout>
    );
  }

  // Load vending machines for the organization
  useEffect(() => {
    const fetchVms = async () => {
      setLoading(true);
      try {
        const display = await api.getOrgDisplay(orgId);
        setVms(display.vms || []);
        
        // Initialize VM assignments
        const vmMap = {};
        await Promise.all(
          display.vms.map(async vm => {
            const grps = await api.getVmGroups(vm.vm_id);
            vmMap[vm.vm_id] = grps.map(g => g.group_id);
          })
        );
        setVmAssignments(vmMap);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVms();
  }, [orgId]);

  // Create new group
  const createGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.createGroup(orgId, newGroupName.trim(), user.email);
      
      // Refresh groups after creation
      const display = await api.getOrgDisplay(orgId);
      setGroups(display.groups);
      setNewGroupName('');
      
      // Callback to refresh parent
      if (onGroupsUpdated) onGroupsUpdated();
      
      Alert.alert('Success', `Group "${newGroupName}" created`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a group
  const deleteGroup = (group) => {
    setLoading(true);
    api
      .deleteGroup(orgId, group.group_id, user.email)
      .then(() => api.getOrgDisplay(orgId))
      .then((display) => {
        setGroups(display.groups);
        onGroupsUpdated?.();
        Alert.alert(
          'Deleted',
          `Group "${group.group_name}" has been deleted.`
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Open VM assignment modal for a group
  const openVmAssignmentModal = (group) => {
    setSelectedGroup(group);
    // Initialize temporary selections from current assignments
    const initialSelections = vms.map(vm => {
      const groupIds = vmAssignments[vm.vm_id] || [];
      return {
        ...vm,
        isSelected: groupIds.includes(group.group_id)
      };
    });
    setTempVmSelections(initialSelections);
    setModalVisible(true);
  };

  // Toggle VM selection in modal
  const toggleVmSelection = (index) => {
    const updatedSelections = [...tempVmSelections];
    updatedSelections[index].isSelected = !updatedSelections[index].isSelected;
    setTempVmSelections(updatedSelections);
  };

  // Save VM assignments
  const saveVmAssignments = async () => {
    if (!selectedGroup) return;
    
    setLoading(true);
    try {
      // For each VM, determine if assignment changed
      for (const vm of tempVmSelections) {
        const currentAssignments = vmAssignments[vm.vm_id] || [];
        const isCurrentlyAssigned = currentAssignments.includes(selectedGroup.group_id);
        
        // Only make API calls if assignment changed
        if (vm.isSelected && !isCurrentlyAssigned) {
          await api.addVmToGroup(vm.vm_id, selectedGroup.group_id);
        } else if (!vm.isSelected && isCurrentlyAssigned) {
          await api.removeVmFromGroup(vm.vm_id, selectedGroup.group_id);
        }
      }
      
      // Update vmAssignments state
      const newVmAssignments = { ...vmAssignments };
      tempVmSelections.forEach(vm => {
        const currentAssignments = (newVmAssignments[vm.vm_id] || []).filter(
          id => id !== selectedGroup.group_id
        );
        
        if (vm.isSelected) {
          currentAssignments.push(selectedGroup.group_id);
        }
        
        newVmAssignments[vm.vm_id] = currentAssignments;
      });
      
      setVmAssignments(newVmAssignments);
      setModalVisible(false);
      Alert.alert('Success', `Vending machines updated for group "${selectedGroup.group_name}"`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={styles.container}>
      <Text category="h4">Manage Organization Groups</Text>
      
      {error ? <Text status="danger" style={styles.error}>{error}</Text> : null}
      
      {/* Create Group Section */}
      <Card style={styles.card}>
        <Text category="h6" style={styles.cardHeader}>Create New Group</Text>
        <Input
          placeholder="Group Name"
          value={newGroupName}
          onChangeText={setNewGroupName}
          style={styles.input}
        />
        <Button 
          onPress={createGroup} 
          disabled={loading || !newGroupName.trim()}
          style={styles.button}
        >
          Create Group
        </Button>
      </Card>
      
      {/* Existing Groups Section */}
      <Card style={styles.card}>
        <Text category="h6" style={styles.cardHeader}>Organization Groups</Text>
        <ScrollView style={styles.scrollView}>
          {groups.map((group, index) => (
            <React.Fragment key={group.group_id}>
              <ListItem
                title={group.group_name}
                accessoryRight={() => (
                  <Layout style={styles.groupActions}>
                    <Button
                      size="small"
                      onPress={() => openVmAssignmentModal(group)}
                      disabled={!vms.length}
                    >
                      Edit VMs
                    </Button>
                    <Button
                      size="small"
                      status="danger"
                      onPress={() => deleteGroup(group)}
                      disabled={loading}
                      style={styles.deleteButton}
                    >
                      Delete
                    </Button>
                  </Layout>
                )}
              />
              {index < groups.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </ScrollView>
      </Card>
      
      <Button appearance="ghost" onPress={() => navigation.goBack()} style={styles.button}>
        Back
      </Button>
      
      {/* VM Assignment Modal */}
      <Modal
        visible={modalVisible}
        backdropStyle={styles.modalBackdrop}
        onBackdropPress={() => setModalVisible(false)}
      >
        <Card style={styles.modalCard}>
          <Text category="h6">
            Assign Vending Machines to {selectedGroup?.group_name}
          </Text>
          <Text appearance="hint" style={styles.modalSubtitle}>
            Select the vending machines that belong to this group
          </Text>
          
          <ScrollView style={styles.modalScroll}>
            {tempVmSelections.map((vm, index) => (
              <CheckBox
                key={vm.vm_id}
                checked={vm.isSelected}
                onChange={() => toggleVmSelection(index)}
                style={styles.checkbox}
              >
                {vm.vm_name}
              </CheckBox>
            ))}
          </ScrollView>
          
          <Layout style={styles.modalActions}>
            <Button appearance="outline" status="basic" onPress={() => setModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button onPress={saveVmAssignments} style={styles.modalButton}>
              Save
            </Button>
          </Layout>
        </Card>
      </Modal>
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
  scrollView: {
    maxHeight: 300,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '80%',
    maxHeight: '80%',
  },
  modalSubtitle: {
    marginBottom: 15,
  },
  modalScroll: {
    maxHeight: 300,
    marginVertical: 10,
  },
  checkbox: {
    marginVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    marginHorizontal: 4,
  },
  groupActions: {
    flexDirection: 'row',
  },
  deleteButton: {
    marginLeft: 8,
  }
});