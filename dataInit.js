const mysql = require('mysql');
const fake = require('faker');
const _ = require('lodash');
const axios = require('axios');
const crypto = require('crypto');
const industryList = require('./dummies/industries');
let locations = require('./locations.json');
const defaultConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'recruiter'
});

const connect = (connection = defaultConnection) => {
    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                return reject(err);
            }

            resolve(connection);
        })
    });
};

const query = (sql = '', connection = defaultConnection) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, res) => {
            if (err) {
                return reject(err);
            }

            return resolve(res);
        });
    });
};

// 100 job titles and 10 industries, randomly map a job to an industry index
const jobs = [...Array(100)].map(() => fake.lorem.words(5 + fake.random.number(5)));
let roles = _.uniq([...Array(20)].map(fake.name.jobTitle));
const industries = _.sampleSize(industryList, 5).map(ind => `(uuid(), "${ind}", "${fake.lorem.sentence()}")`);

// 50 users
const salt = 'subject to change';
const hashedPassword = crypto.createHmac('sha512', salt).update('password').digest('hex');
const users = [...Array(50)]
    .map(() => `(uuid(), "${fake.internet.email()}", "${hashedPassword}", "${salt}", "${[...Array(6)].map(() => Math.random().toString(36)[2]).join('')}")`);

locations = (locations || []).map(location => `(uuid(), "${location.address}", '${JSON.stringify(location.location)}', "${location.area}")`);
let userIds;
let locationIds;
let roleIds;
let employers, employees;

// hash "password" using secret "random"
// chaining atomic actions so it will be easier to comment out unnecessary parts
return connect()
    // USERS
    .then(() => query(`insert into users(id, email, password, salt, resetCode) values ${users.join(',')}`))
    .then(() => console.log('Users added'))
    .then(() => query('select id from users;'))
    .then((docs) => {
      // the first 5 users are treated as employers
      const ids = _.map(docs, 'id');
      employers = ids.slice(0, 5);
      employees = ids.slice(5);
    })
    // INDUSTRIES, ROLES
    .then(() => query(`insert into industries values ${industries.join(',')}; `))
    .then(() => query('select id from industries;'))
    .then((inds) => {
        inds = _.map(inds, 'id');
        roles = roles.map((role) => `(uuid(), "${role}", "${inds[fake.random.number(inds.length - 1)]}", "${fake.lorem.sentence()}")`);

        return query(`insert into roles values ${roles.join(',')};`);
    })
    .then(() => console.log('Roles added'))
    .then(() => query('select id from roles;'))
    .then((roles) => {
        roleIds = _.map(roles, 'id');
    })
    // LOCATIONS
    .then(() => query(`insert into locations values ${locations.join(',')};`))
    .then(() => query('select id from locations;'))
    .then((docs) => {
      locationIds = _.map(docs, 'id');
    })
    // EMPLOYEES
    .then(() => {
        const docs = employees.map((id) => `("${id}", "${fake.name.findName()}", "${fake.phone.phoneNumber()}", "${fake.lorem.sentence()}")`);

        return query(`insert into employees values ${docs.join(',')};`);
    })
    // EMPLOYERS
    .then(() => {
        const docs = employers.map((id) => `("${id}", "${fake.company.companyName()}", "${fake.phone.phoneNumber()}", "${fake.internet.url()}", "${_.sample(locationIds)}")`);

        return query(`insert into employers values ${docs.join(',')};`);
    })
    // JOBS
    .then(() => {
        const jobs = [...Array(10)].map(() => `(uuid(), "${
            _.sample(employers)}", "${
                _.sample(roleIds)}", "${
                    fake.lorem.words(5 + fake.random.number(5))}","${
                        fake.random.number({min: 10000, max: 20000})} - ${
                            fake.random.number({min: 20001, max: 100000})}", "${
                                _.sample(locationIds)}", "${fake.lorem.sentence()}")`);

        return query(`insert into jobs values ${jobs.join(',')};`);
    })
    // INTERESTED ROLES, DESIRED LOCATIONS
    .then(() => {
        // each employees has 3-5 interested roles
        const interestedRoles = _.flatten(employees.map((employee) => {
            return _.sampleSize(roleIds, fake.random.number({min:3, max:5})).map((role) => `("${employee}", "${role}")`);
        }));

        return query(`insert into interestedRoles values ${interestedRoles.join(',')};`);
    })
    .then(() => {
        // each employees 3-5 interested job locations
        const desiredLocations = _.flatten(employees.map((employee) => {
            return _.sampleSize(locationIds, fake.random.number({min:3, max:5})).map((loc) => `("${employee}", "${loc}")`);
        }));

        return query(`insert into desiredLocations values ${desiredLocations.join(',')};`);
    })
    .then(() => console.log('Done fam, enjoy'))
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.log(err);

        process.exit(1);
    });
