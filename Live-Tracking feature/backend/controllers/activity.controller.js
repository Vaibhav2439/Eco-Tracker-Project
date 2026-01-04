const activityService = require('../services/activity.service');

async function create(req, res, io) {
  try {
    const { type, value, unit, user } = req.body;
    if (!type || value == null) return res.status(400).json({ error: 'type and value required' });
    const activity = await activityService.createActivity({ type, value, unit, user });
    if (io) io.emit('activityCreated', activity);
    return res.json({ success: true, activity });
  } catch (err) {
    console.error('create activity error', err);
    return res.status(500).json({ error: 'server error' });
  }
}

async function recent(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 200, 2000);
    const list = await activityService.getRecent(limit);
    res.json(list);
  } catch (err) {
    console.error('recent error', err);
    res.status(500).json({ error: 'server error' });
  }
}

async function summary(req, res) {
  try {
    const agg = await activityService.summaryByType();
    res.json(agg);
  } catch (err) {
    console.error('summary error', err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = { create, recent, summary };