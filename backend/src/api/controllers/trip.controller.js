const httpStatus = require('http-status');
const { omit } = require('lodash');
const Trip = require('../models/trip.model');
const Role = require('../../helpers/role');
const APIError = require('../utils/APIError');

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const trip = await Trip.get(id);
    req.locals = { trip, userId: trip.user._id };

    return next();
  } catch (error) {
    return next(error);
  }   
};

/**
 * Get trip
 * @public
 */
exports.get = (req, res) => res.json(req.locals.trip.transform());


/**
 * Create new trip
 * @public
 */
exports.create = async (req, res, next) => {
  console.log('inside create');
  try {
    const trip = new Trip(req.body);
    trip.user = req.user;
    const savedTrip = await trip.save();
    res.status(httpStatus.CREATED);
    res.json(savedTrip.transform());
  } catch (error) {
    next(error);
  }
};


/**
 * Update existing trip
 * @public
 */
exports.update = (req, res, next) => {
  const tripData = req.body;
  const trip = Object.assign(req.locals.trip, tripData);
  
  trip.save()
    .then(savedTrip => res.json(savedTrip.transform()))
    .catch(e => next(e));
};

/**
 * Get trip list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    let trips = await Trip.list({ ...req.query });
    res.json(trips);
  } catch (error) {
    next(error);
  }
};

/**
 * Get trip list
 * @public
 */
exports.listForLoggedin = async (req, res, next) => {
  try {
    let trips = await Trip.list({ ...req.query, userId: req.user._id });
    res.json(trips);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete trip
 * @public
 */
exports.remove = (req, res, next) => {
  const { trip } = req.locals;

  trip.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch(e => next(e));
};
