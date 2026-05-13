/** @jsxImportSource @emotion/react */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { getAllUsers, updateUserRoleRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roleEdits, setRoleEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers();
      const list = Array.isArray(data) ? data : [];
      setUsers(list);
      const initialEdits = {};
      list.forEach((u) => {
        initialEdits[u.id] = (u.role || 'farmer').toLowerCase();
      });
      setRoleEdits(initialEdits);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to load users.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => String(a.email || '').localeCompare(String(b.email || ''))),
    [users]
  );

  const handleRoleChange = (userId, role) => {
    setRoleEdits((prev) => ({ ...prev, [userId]: role }));
  };

  const handleSaveRole = async (targetUser) => {
    const nextRole = (roleEdits[targetUser.id] || targetUser.role || 'farmer').toLowerCase();
    setSavingId(targetUser.id);
    setError('');
    setInfo('');
    try {
      const updated = await updateUserRoleRequest(targetUser.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setInfo(`Updated role for ${updated.email} to ${updated.role}.`);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to update role.';
      setError(detail);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        User Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Admin-only panel to manage user roles.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {info && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {info}
        </Alert>
      )}

      <Stack spacing={1.5}>
        {loading ? (
          <Card>
            <CardContent>
              <Typography>Loading users...</Typography>
            </CardContent>
          </Card>
        ) : (
          sortedUsers.map((u) => {
            const selectedRole = roleEdits[u.id] || (u.role || 'farmer').toLowerCase();
            const originalRole = (u.role || 'farmer').toLowerCase();
            const hasChanges = selectedRole !== originalRole;
            const isCurrentUser = currentUser?.id === u.id;

            return (
              <Card key={u.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {u.full_name || 'Unnamed User'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                      <Box sx={{ mt: 0.8, display: 'flex', gap: 1 }}>
                        <Chip
                          size="small"
                          label={u.is_verified ? 'Verified' : 'Unverified'}
                          color={u.is_verified ? 'success' : 'warning'}
                        />
                        {isCurrentUser && <Chip size="small" label="You" />}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id={`role-label-${u.id}`}>Role</InputLabel>
                        <Select
                          labelId={`role-label-${u.id}`}
                          label="Role"
                          value={selectedRole}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <MenuItem value="farmer">farmer</MenuItem>
                          <MenuItem value="admin">admin</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!hasChanges || savingId === u.id}
                        onClick={() => handleSaveRole(u)}
                      >
                        {savingId === u.id ? 'Saving...' : 'Save'}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        )}
      </Stack>
    </Box>
  );
};

export default AdminUsersPage;
