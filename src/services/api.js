const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('UnityPulse API Base:', API_BASE);

export const api = {
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  async purgeNoiseHazards() {
    const res = await fetch(`${API_BASE}/hazards/purge-noise`, { method: 'DELETE' });
    return res.json();
  },

  async completeDispatch(hazardId, volunteerId) {
    const res = await fetch(`${API_BASE}/dispatch/${hazardId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteerId })
    });
    return res.json();
  },

  async createTask(data) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async joinTask(taskId, volunteerId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteerId })
    });
    return res.json();
  },

  async completeTask(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  async register(data) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(data) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getHazards() {
    const res = await fetch(`${API_BASE}/hazards`);
    return res.json();
  },

  async createHazard(data) {
    const res = await fetch(`${API_BASE}/hazards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async reportHazard(hazardId, userId) {
    const res = await fetch(`${API_BASE}/hazards/${hazardId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
  },

  async getVolunteers() {
    const res = await fetch(`${API_BASE}/volunteers`);
    return res.json();
  },

  async updateVolunteerScore(id, score) {
    const res = await fetch(`${API_BASE}/volunteers/${id}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score })
    });
    return res.json();
  },

  async updateVolunteerSkills(id, skills) {
    const res = await fetch(`${API_BASE}/volunteers/${id}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills })
    });
    return res.json();
  },

  async getTasks() {
    const res = await fetch(`${API_BASE}/tasks`);
    return res.json();
  },

  async updateVolunteerLocation(id, lat, lng) {
    const res = await fetch(`${API_BASE}/volunteers/${id}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    });
    return res.json();
  },

  async getNearbyHazards(lat, lng, radius = 10) {
    const res = await fetch(`${API_BASE}/dispatch?lat=${lat}&lng=${lng}&radius=${radius}`);
    return res.json();
  },

  async acceptDispatch(hazardId, volunteerId) {
    const res = await fetch(`${API_BASE}/dispatch/${hazardId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volunteerId })
    });
    return res.json();
  }
};
