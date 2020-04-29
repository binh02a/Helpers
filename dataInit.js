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
// the first 5 users are treated as employers
const users = [...Array(50)]
    .map((__, idx) => {
        const salt = crypto.randomBytes(128);
        const password = crypto.createHmac('sha512', salt).update('password').digest('hex').toString();

        return `(uuid(), "${fake.internet.email()}", UNHEX("${password.toString()}"), UNHEX("${salt.toString('hex')}"), "${
            idx > 4 && 'employee' || 'employer'}", TRUE, "${[...Array(6)].map(() => Math.random().toString(36)[2]).join('')}")`;
    });

locations = (locations || []).map(location => `(uuid(), "${location.address}", ${location.longitude}, ${location.latitude})`);
let userIds;
let locationIds;
let roleIds;
let employers, employees;
let jobIds;

const dice = () => fake.random.boolean();
const salaryLowEnds = [8.72,10,15];
const salaryHighEnds = [20,25,30];
const salaryPool = [...salaryLowEnds, ...salaryHighEnds];

const nullableDate = () => {
  return dice() && `"${fake.date.between('2021-01-01', '2022-12-31').toJSON().slice(0, 10)}"` || null;
}

// hash "password" using secret "random"
// chaining atomic actions so it will be easier to comment out unnecessary parts
return connect()
    // USERS
    .then(() => query(`insert into users(id, email, password, salt, userType, active, resetCode) values ${users.join(',')}`))
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
        const docs = employees.map((id) => `("${
          id}", "${
            fake.name.firstName()}", "${
              fake.name.lastName()}", "${
                fake.phone.phoneNumber()}", "${
                  fake.date.between('1980-01-01', '2000-12-31').toJSON().slice(0, 10)}", "${
                    fake.date.between('2020-05-01', '2020-12-31').toJSON().slice(0, 10)}", ${
                      nullableDate()}, ${
                        _.sample(salaryLowEnds)}, ${
                          dice() && _.sample(salaryHighEnds) || null}, ${
                            fake.random.number({min: 100})}, "${
                              _.sample(locationIds)}", ${
                                dice() && dice()}, "${
                                  fake.lorem.sentence()}", "${
                                    fake.lorem.words(10)}", ${
                                      true}, ${
                                        true})`);

        return query(`insert into employees values ${docs.join(',')};`);
    })
    // EMPLOYERS
    .then(() => {
        const docs = employers.map((id) => `("${
          id}", "${
            fake.name.firstName()}", "${
              fake.name.lastName()}", "${
                fake.company.companyName()}", "${
                  fake.random.number({min: 10000, max:999999})}","${
                    fake.phone.phoneNumber()}", "${
                      fake.phone.phoneNumber()}", "${
                        fake.internet.url()}", ${
                          dice()})`);

        return query(`insert into employers values ${docs.join(',')};`);
    })
    // JOBS
    .then(() => {
        const jobs = [...Array(20)].map(() => `(uuid(), "${
            _.sample(employers)}", "${
                _.sample(roleIds)}", "${
                  fake.name.findName()}", "${
                    fake.phone.phoneNumber()}", "${
                      fake.internet.email()}", "${
                        fake.lorem.words(5 + fake.random.number(20))}", ${
                          _.sample(salaryPool)},"${
                              fake.date.between('2020-05-01', '2021-12-31').toJSON().slice(0, 10)}", "${
                                fake.date.between('2022-05-01', '2022-12-31').toJSON().slice(0, 10)}", "${
                                  _.sample(locationIds)}", "${
                                    fake.lorem.sentence()}", ${
                                      dice()}, ${
                                        dice()}, ${
                                          true})`);

        return query(`insert into jobs values ${jobs.join(',')};`);
    })
    .then(() => query('select id from jobs;'))
    .then((jobs) => {
        jobIds = _.map(jobs, 'id');
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
      const docs = _.flatten(employees.map((id) => {
        return _.sampleSize(jobIds, fake.random.number({min: 6, max: 20})).map((job) => {
          const initEmployer = dice();
          const status = initEmployer && _.sample(['available', 'offered']) || _.sample(['liked', 'offered']);

          return `("${job}", "${id}", "${initEmployer && 'employer' || 'employee'}", "${status}")`;
        });
      }));

      return query(`insert into jobInterest values ${docs.join(',')};`);
    })
    .then(() => console.log('Done fam, enjoy'))
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.log(err);

        process.exit(1);
    });
