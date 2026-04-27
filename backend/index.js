const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'unitypulse_secret';

app.use(cors());
app.use(express.json());

// --- Haversine distance (km) ---
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// --- Auth ---
app.post('/api/register', async (req, res) => {
  const { email, password, name, role, organization } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role, organization }
    });
    res.json({ message: 'User created', user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, efficiency: user.efficiency, impactHours: user.impactHours, skills: user.skills } });
});

// --- Update volunteer location ---
app.post('/api/volunteers/:id/location', async (req, res) => {
  const { lat, lng } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { lat: parseFloat(lat), lng: parseFloat(lng) }
  });
  res.json({ ok: true });
});

// --- Proximity Dispatch: find hazards near volunteer ---
// Returns hazards within `radius` km sorted by distance, highest efficiency volunteers first
app.get('/api/dispatch', async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required' });

  const hazards = await prisma.hazard.findMany({ where: { status: 'Active' } });
  const nearby = hazards
    .filter(h => h.lat && h.lng)
    .map(h => ({
      ...h,
      distanceKm: haversineDistance(parseFloat(lat), parseFloat(lng), h.lat, h.lng)
    }))
    .filter(h => h.distanceKm <= parseFloat(radius))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  res.json(nearby);
});

// --- Accept dispatch ---
app.post('/api/dispatch/:hazardId/accept', async (req, res) => {
  const { volunteerId } = req.body;
  // Update volunteer task count & hours
  await prisma.user.update({
    where: { id: volunteerId },
    data: { tasksCompleted: { increment: 1 }, impactHours: { increment: 3 } }
  });
  // Mark hazard as resolved
  await prisma.hazard.update({
    where: { id: req.params.hazardId },
    data: { status: 'InProgress' }
  });
  res.json({ ok: true });
});

// --- Mark hazard as resolved (task complete) ---
app.post('/api/dispatch/:hazardId/complete', async (req, res) => {
  const { volunteerId } = req.body;
  await prisma.hazard.update({
    where: { id: req.params.hazardId },
    data: { status: 'Resolved' }
  });
  // Give bonus efficiency nudge on completion
  const volunteer = await prisma.user.findUnique({ where: { id: volunteerId } });
  if (volunteer) {
    const newEff = Math.min(100, parseFloat(((volunteer.efficiency * volunteer.tasksCompleted + 100) / (volunteer.tasksCompleted + 1)).toFixed(1)));
    await prisma.user.update({ where: { id: volunteerId }, data: { efficiency: newEff } });
  }
  res.json({ ok: true });
});

// --- Real-time stats ---
app.get('/api/stats', async (req, res) => {
  const [volunteers, hazards, reports] = await Promise.all([
    prisma.user.findMany({ where: { role: 'VOLUNTEER' } }),
    prisma.hazard.findMany(),
    prisma.report.findMany()
  ]);

  const totalVolunteers = volunteers.length;
  const totalHazards = hazards.length;
  const activeHazards = hazards.filter(h => h.status === 'Active').length;
  const inProgressHazards = hazards.filter(h => h.status === 'InProgress').length;
  const resolvedHazards = hazards.filter(h => h.status === 'Resolved').length;
  const criticalHazards = hazards.filter(h => h.severity === 'Critical').length;
  const totalReports = reports.length;
  const totalImpactHours = volunteers.reduce((sum, v) => sum + (v.impactHours || 0), 0);
  const totalTasksCompleted = volunteers.reduce((sum, v) => sum + (v.tasksCompleted || 0), 0);
  const avgEfficiency = totalVolunteers > 0
    ? (volunteers.reduce((sum, v) => sum + v.efficiency, 0) / totalVolunteers).toFixed(1)
    : 0;
  const responseRate = (inProgressHazards + resolvedHazards) > 0
    ? (resolvedHazards / (inProgressHazards + resolvedHazards) * 100).toFixed(1)
    : 0;

  res.json({
    totalVolunteers,
    totalHazards,
    activeHazards,
    criticalHazards,
    resolvedHazards,
    totalReports,
    totalImpactHours,
    totalTasksCompleted,
    avgEfficiency,
    responseRate
  });
});

// --- Hazards ---
app.get('/api/hazards', async (req, res) => {
  const hazards = await prisma.hazard.findMany({
    include: { reports: true },
    orderBy: { reportsCount: 'desc' }
  });
  res.json(hazards);
});

app.post('/api/hazards', async (req, res) => {
  const { title, description, location, userId, lat, lng } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  try {
    const hazard = await prisma.hazard.create({
      data: {
        title,
        description: description || null,
        location,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        reportsCount: 1,
        reports: { create: { userId } }
      }
    });
    res.json(hazard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create hazard' });
  }
});

app.post('/api/hazards/:id/report', async (req, res) => {
  const { userId } = req.body;
  const hazardId = req.params.id;
  const existing = await prisma.report.findFirst({ where: { hazardId, userId } });
  if (existing) return res.status(400).json({ error: 'Already reported' });

  const hazard = await prisma.hazard.update({
    where: { id: hazardId },
    data: { reportsCount: { increment: 1 }, reports: { create: { userId } } }
  });

  let newSeverity = 'Unverified';
  if (hazard.reportsCount >= 15) newSeverity = 'Critical';
  else if (hazard.reportsCount >= 5) newSeverity = 'Severe';
  else if (hazard.reportsCount >= 2) newSeverity = 'Moderate';

  const updated = await prisma.hazard.update({ where: { id: hazardId }, data: { severity: newSeverity } });
  res.json(updated);
});

// --- Volunteers ---
app.get('/api/volunteers', async (req, res) => {
  const volunteers = await prisma.user.findMany({
    where: { role: 'VOLUNTEER' },
    select: { id: true, name: true, efficiency: true, tasksCompleted: true, impactHours: true, skills: true, lat: true, lng: true }
  });
  res.json(volunteers);
});

app.post('/api/volunteers/:id/score', async (req, res) => {
  const { score } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { efficiency: parseFloat(score) }
  });
  res.json(user);
});

app.post('/api/volunteers/:id/skills', async (req, res) => {
  const { skills } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { skills }
  });
  res.json(user);
});

// --- Joint Tasks ---
app.get('/api/tasks', async (req, res) => {
  const tasks = await prisma.task.findMany({
    include: { ngo: { select: { name: true, organization: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
  const { title, description, location, type, priority, partnerOrg, volunteersNeeded, ngoId } = req.body;
  if (!ngoId) return res.status(400).json({ error: 'ngoId required' });
  try {
    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        location,
        type,
        priority: priority || 'Medium',
        partnerOrg: partnerOrg || null,
        volunteersNeeded: parseInt(volunteersNeeded) || 1,
        ngoId,
        status: 'Open'
      },
      include: { ngo: { select: { name: true, organization: true } } }
    });
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.post('/api/tasks/:id/join', async (req, res) => {
  const { volunteerId } = req.body;
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { volunteerId, status: 'InProgress' }
  });
  res.json(task);
});

app.post('/api/tasks/:id/complete', async (req, res) => {
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { status: 'Completed' }
  });
  res.json(task);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// --- Purge noise hazards (one-time cleanup) ---
app.delete('/api/hazards/purge-noise', async (req, res) => {
  const hazards = await prisma.hazard.findMany()
  const noisePatterns = [
    /^ai extraction:/i,
    /^new ai detected:/i,
    /^field crisis/i,
    /screenshot/i,
    /^unidentified crisis/i,
    /\d{4}-\d{2}-\d{2}/,     // date-stamped filenames
    /\d{6,}/                  // long number strings (timestamps)
  ]
  const junkIds = hazards
    .filter(h => noisePatterns.some(p => p.test(h.title)))
    .map(h => h.id)

  if (junkIds.length === 0) return res.json({ deleted: 0, message: 'No noise found' })

  // Delete reports first (FK constraint)
  await prisma.report.deleteMany({ where: { hazardId: { in: junkIds } } })
  await prisma.hazard.deleteMany({ where: { id: { in: junkIds } } })

  res.json({ deleted: junkIds.length, message: `Purged ${junkIds.length} noise records` })
});
