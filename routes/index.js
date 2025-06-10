var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({ message: 'Base Operations API running!' });
});

router.get('/test-connection', async (req, res) => {
  try {
    const result = await req.app.locals.db.query('SELECT current_user, current_database(), version()');
    res.json({
      success: true,
      user: result.rows[0].current_user,
      database: result.rows[0].current_database,
      version: result.rows[0].version
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code
    });
  }
});

router.get('/test-data', async (req, res) => {
  try {
    const locations = await req.app.locals.db.query('SELECT * FROM locations LIMIT 5');
    const events = await req.app.locals.db.query('SELECT * FROM events LIMIT 5');

    res.json({
      locations: locations.rows,
      events: events.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;