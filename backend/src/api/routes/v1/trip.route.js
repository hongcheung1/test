const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/trip.controller');
const { authorize } = require('../../middlewares/auth');
const { ADMIN, MANAGER, REGULAR } = require('../../../helpers/role');
const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
router.param('tripId', controller.load);


router
  .route('/owned')
  .get(authorize(), controller.listForLoggedin);

router
  .route('/')
  .get(authorize(ADMIN), controller.list)
  .post(authorize(), controller.create);

router
  .route('/:tripId')
  .get(authorize(), controller.get)
  .put(authorize(), controller.update)
  .delete(authorize(), controller.remove);


module.exports = router;
