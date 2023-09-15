"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** Search for any customers whose first/last name includes searchTerm */
  static async search(searchTerm) {
    const formattedSearchTerm = `%${searchTerm}%`;
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
        FROM customers
        WHERE first_name ILIKE $1 OR last_name ILIKE $1`,
      [formattedSearchTerm],
    );

    return results.rows.map(c => new Customer(c));
  }


  /** Get list of 10 best customers, by # of reservations */
  static async topTen(){
    console.log('got to topTen method');
    // const results = await db.query(`
    // SELECT customer_id, COUNT(*) FROM reservations
    // GROUP BY customer_id ORDER BY COUNT(*) DESC LIMIT 10;
    // `)

    // return results.rows.map(async function (reservation) {
    //   const customer = await Customer.get(reservation.customer_id);
    //   return customer;
    // });

    // //Join version
    const results = await db.query(
      `SELECT first_name AS "firstName", last_name AS "lastName",
       phone, customers.notes AS "notes", customer_id AS "id", COUNT(*)
      FROM reservations
      JOIN customers ON customer_id = customers.id
      GROUP BY customer_id, first_name, last_name, phone, customers.notes
      ORDER BY COUNT(*) DESC LIMIT 10;`
    );
    console.log('finished query in topTen');
    console.log('results.rows is ', results.rows);

    return results.rows.map(c => new Customer(c));
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }


  /** ALL NEW full name method! */
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = Customer;
