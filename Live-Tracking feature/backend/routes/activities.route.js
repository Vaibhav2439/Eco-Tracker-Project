// routes/activities.route.js
const express = require('express');
const activityController = require('../controllers/activity.controller');


module.exports = function (io) {
  const router = express.Router();

  // POST /api/activities/        -> create activity (io optional)
  router.post('/', async (req, res, next) => {
    try {
      // controller.create signature in your controller: (req, res, io)
      await activityController.create(req, res, io);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/activities/recent   -> recent activities
  router.get('/recent', async (req, res, next) => {
    try {
      await activityController.getRecent(req, res);
    } catch (err) {
      next(err);
    }
  });

  return router;
};
