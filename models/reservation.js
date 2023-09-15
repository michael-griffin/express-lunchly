"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  get notes() {
    return this._notes;
  }

  set notes(val){
    if (!val) {
      val = "";
    }
    this._notes = val;
  }

  get numGuests() {
    return this._numGuests;
  }

  set numGuests(num) {
    if (num < 1){
      throw new Error("number of guests must be >= 1");
    }
    this._numGuests = num;
  }

  // get customerId() {
  //   return this._customerId;
  // }

  // //I"m not sure how we could get these errors? Maybe if the reservations had a
  // //different form that included customer id explicitly?
  // set customerId(id) {
  //   if (this.customerId) {
  //     throw new Error("can't reassign customer ids for reservations")
  //   } else {
  //     this._customerId = id;
  //   }
  // }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** get Reservation Instance by reservation id */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
        customer_id AS "customerId",
        num_guests AS "numGuests",
        start_at AS "startAt",
        notes
      FROM reservations
      WHERE id = $1`,
      [id]);
    const reservation = results.rows[0];

    if (reservation === undefined){
      throw new Error(`No such reservation for  ${id}`);
    }
    return new Reservation(reservation);
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** save: creates new reservation or updates existing reservation */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [
          this.customerId,
          this.startAt,
          this.numGuests,
          this.notes
      ],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
             SET start_at=$1,
                 num_guests=$2,
                 notes=$3
             WHERE id = $4`, [
        this.startAt,
        this.numGuests,
        this.notes,
        this.id
      ],
      );
    }
  }
}

module.exports = Reservation;
