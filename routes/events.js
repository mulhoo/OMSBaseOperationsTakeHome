var express = require('express');
const { all } = require('.');
var router = express.Router();

// count of events by location
router.get('/monthly/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;

    const query = `
      SELECT
        DATE_TRUNC('month', date) as month,
        SUM(count) as total_count,
        l.name as location_name
      FROM events e
      JOIN locations l ON e.location_id = l.id
      WHERE e.location_id = $1
      GROUP BY DATE_TRUNC('month', date), l.name
      ORDER BY month ASC
    `;

    const result = await req.app.locals.db.query(query, [locationId]);

    res.json({
      locationId: parseInt(locationId),
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// top 3 events by count for a specific location
router.get('/recent/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;

    const query = `
      SELECT
        e.id,
        e.count,
        e.date,
        e.location_id,
        l.name as location_name,
        l.timezone
      FROM events e
      JOIN locations l ON e.location_id = l.id
      WHERE e.location_id = $1
      ORDER BY e.date DESC
      LIMIT 3
    `;

    const result = await req.app.locals.db.query(query, [locationId]);

    res.json({
      locationId: parseInt(locationId),
      events: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get all locations
router.get('/locations', async (req, res) => {
  try {
    const query = 'SELECT * FROM locations ORDER BY name';
    const result = await req.app.locals.db.query(query);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;