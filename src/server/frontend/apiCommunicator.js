import { Platform } from 'react-native';

// Dynamically pick host & port
//const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'cs506x19.cs.wisc.edu';
const PORT = '8080';
const API_BASE = `http://${HOST}:${PORT}`;

async function apiFetch(endpoint, { method = 'GET', body } = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = { method, headers: {} };

  if (body) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  }

  const res = await fetch(url, config);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status} – ${errorText}`);
  }
  const ct = res.headers.get('Content-Type') || '';
  return ct.includes('application/json') ? res.json() : null;
}

const api = {
  // —— Organizations (/orgs) ——
  getOrganization: (id) => apiFetch(`/orgs/${id}`),
  createOrganization: (org_name, u_email) =>
    apiFetch(`/orgs`, { method: 'POST', body: { org_name, u_email } }),
  getOrgDisplay: (id) => apiFetch(`/orgs/${id}/display`),
  getOrgName: (id) => apiFetch(`/orgs/${id}/name`),
  getOrgByName: (org_name) =>
    apiFetch(`/orgs/by-name/${encodeURIComponent(org_name)}`),
  createGroup: (org_id, group_name, u_email) =>
    apiFetch(`/orgs/${org_id}/groups`, {
      method: 'POST',
      body: { group_name, u_email },
    }),
  deleteGroup: (org_id, group_id, admin_email) =>
    apiFetch(
      `/orgs/${org_id}/groups/${group_id}`,
      {
        method: 'DELETE',
        body: { admin_email },
      }
    ),
  leaveOrganization: (org_id, u_email) =>
    apiFetch(`/orgs/${org_id}/leave`, {
      method: 'POST',
      body: { u_email },
    }),
  addUserToOrg: (orgId, u_email, admin_email, role, group_id) =>
    apiFetch(`/orgs/${orgId}/add-user`, {
      method: 'POST',
      body: { u_email, admin_email, role, group_id },
    }),

  // —— Health (MQTT) ——
  isVMOnline: (vmId) =>
    apiFetch(`/mqtt/health/${encodeURIComponent(vmId)}`),
  notifyRestock: (vmId) =>
    apiFetch(`/mqtt/restock/${encodeURIComponent(vmId)}`, { method: 'POST' }),

  // —— Users (/users) ——
  createUser: (userData) =>
    apiFetch(`/users/new`, { method: 'POST', body: userData }),
  loginUser: (credentials) =>
    apiFetch(`/users/login`, { method: 'POST', body: credentials }),
  deleteUser: (credentials) =>
    apiFetch(`/users/delete`, { method: 'DELETE', body: credentials }),
  getAllUsers: () => apiFetch(`/users/all`),
  getUser: (email) => apiFetch(`/users/${encodeURIComponent(email)}`),
  getUserOtp: (email) =>
    apiFetch(`/users/${encodeURIComponent(email)}/otp`),
  updateUser: (email, users_changes) =>
    apiFetch(`/users/${encodeURIComponent(email)}/update`, {
      method: 'PATCH',
      body: { users_changes },
    }),

  // —— Group assignment ——
  assignUserToGroup: (email, group_id, admin_email) =>
    apiFetch(`/users/${encodeURIComponent(email)}/group`, {
      method: 'PATCH',
      body: { group_id, admin_email },
    }),

  // —— Vending Machines (/vending-machines) ——
  getAllVendingMachines: () => apiFetch(`/vending-machines`),
  getVendingMachine: (id) => apiFetch(`/vending-machines/${id}`),
  createVendingMachine: (data) =>
    apiFetch(`/vending-machines`, { method: 'POST', body: data }),
  registerVendingMachine: (id, column_row) =>
    apiFetch(`/vending-machines/${id}/register`, {
      method: 'PATCH',
      body: column_row,
    }),
  updateVendingMachineMode: (id, vm_mode) =>
    apiFetch(`/vending-machines/${id}/mode`, {
      method: 'PATCH',
      body: { vm_mode },
    }),
  updateVendingMachineName: (id, vm_name) =>
    apiFetch(`/vending-machines/${id}/name`, {
      method: 'PATCH',
      body: { vm_name },
    }),
  deleteVendingMachine: (id) =>
    apiFetch(`/vending-machines/${id}`, { method: 'DELETE' }),

  // —— VM ↔ Groups (/vending-machines/:id/groups) ——
  getVmGroups: (vmId) => apiFetch(`/vending-machines/${vmId}/groups`),
  addVmToGroup: (vmId, groupId) =>
    apiFetch(`/vending-machines/${vmId}/groups/${groupId}`, {
      method: 'POST',
    }),
  removeVmFromGroup: (vmId, groupId) =>
    apiFetch(`/vending-machines/${vmId}/groups/${groupId}`, {
      method: 'DELETE',
    }),

  // —— VMs by Org & Group ——
  getVendingMachinesByGroup: (orgId, groupId) =>
    apiFetch(`/vending-machines/org/${orgId}/group/${groupId}`),

  // —— Inventory Items (/vending-machines/:id/inventory) ——
  getInventory: (vmId) => apiFetch(`/vending-machines/${vmId}/inventory`),
  addItemToSlot: (vmId, slot_name, itemData) =>
    apiFetch(`/vending-machines/${vmId}/inventory/${slot_name}`, {
      method: 'POST',
      body: itemData,
    }),
  updateItemInSlot: (vmId, slot_name, itemData) =>
    apiFetch(`/vending-machines/${vmId}/inventory/${slot_name}`, {
      method: 'PATCH',
      body: itemData,
    }),
  deleteItemFromSlot: (vmId, slot_name) =>
    apiFetch(`/vending-machines/${vmId}/inventory/${slot_name}`, {
      method: 'DELETE',
    }),
  batchUpdateInventory: (vmId, rows) =>
    apiFetch(`/vending-machines/${vmId}/inventory`, {
      method: 'POST',
      body: rows,
    }),

  // —— Items (/items) ——
  getAllItems: () => apiFetch(`/items`),

  // —— Stripe Payments (/stripes/pay) ——
  makePayment: (amount) =>
    apiFetch(`/stripes/pay`, { method: 'POST', body: { amount } }),
};

export default api;
