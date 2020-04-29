const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const APIError = require('../utils/APIError');
const User = require('./user.model');

/**
 * Trip Schema
 * @private
 */
const tripSchema = new mongoose.Schema({
  destination: {
    type: String,
    require: true,
  },
  startdate: {
    type: Date,
    require: true,
  },
  enddate: {
    type: Date,
    require: true,
  },
  comment: {
    type: String
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true,
});

/**
 * Methods
 */
tripSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'destination', 'startdate', 'enddate', 'comment', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    if (this.user instanceof User) {
      transformed['user'] = this.user.transform();
    }

    return transformed;
  },

});

/**
 * Statics
 */
tripSchema.statics = {

  /**
   * Get trip
   *
   * @param {ObjectId} id - The objectId of trip.
   * @returns {Promise<Trip, APIError>}
   */
  async get(id) {
    try {
      let trip;

      if (mongoose.Types.ObjectId.isValid(id)) {
        trip = await this.findById(id).populate("user");
      }
      if (trip) {
        return trip;
      }

      throw new APIError({
        message: 'Trip does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },


  /**
   * List trips in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  async list({
    page = 1, perPage = 10, keyword, startdate, enddate, userId,
  }) {

    let match = omitBy({ "user.id": userId }, isNil);

    if (keyword) {
      match["$or"] = [
        {
          "destination": RegExp(keyword, "i") 
        },
        {
          "comment": RegExp(keyword, "i") 
        }
      ]
    }

    if (startdate || enddate) {
      let options = {};
      if (startdate) {
        options["$gte"] =  new Date(startdate);
      }

      if (enddate) {
        options["$lte"] =  new Date(enddate);
      }
      match["startdate"] = options;
    }   

    try {
      let aggregate = [
        {
          "$lookup": {
            "from": "users",
            "localField": "user",
            "foreignField": "_id",
            "as": "user"
          }
        },
        { "$unwind": "$user" },
        {
          "$project": {
            "_id": 0,
            "id": "$_id",
            "destination": 1,
            "startdate": 1,
            "enddate": 1,
            "comment": 1,
            "createdAt": 1,
            "user.id": "$user._id",
            "user.email": 1,
            "user.name": 1
          }
        },
        {
          "$match": match
        },
        { "$sort": { startdate: 1, createdAt: 1 }},
        { "$skip": perPage * (page - 1) }
      ];
      if (perPage > 0) {
        aggregate.push({ "$limit": perPage });
      }

      let trips = await this.aggregate(aggregate);

      if (match["user.id"]) {
        match["user"] = match["user.id"];
        delete match["user.id"];
      }
      
      let total = await this.countDocuments(match).exec();

      return { trips, total, page, totalPages: Math.ceil(total / perPage) };
    } catch (error) {
      throw error;
    }

  },

};

/**
 * @typedef Trip
 */
module.exports = mongoose.model('Trip', tripSchema);
