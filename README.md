# Helpers

# Dependencies
- [NodeJS](https://nodejs.org/en/)
- [MySQL](https://www.mysql.com/downloads/)

# Database setup
0. Adding Google API key to location.js.
1. ```npm install``` to install the required dependencies
2. **Creating the database schema** Connect to the database and run```schema.sql```.
This will drop the ```recruiter``` database and setup a new one.
3. ```node location``` will query and list out information of the interested locations.
The search strings are configurable within the file. The result will be written to ```locations.json```.
4. **Generate the data**:  ```node dataInit```. This connects to the database and
add data to the tables. This requires ```locations.json``` to run.

# Using dbDump
We can use dbDump to create and add data into the database instead of the way in previous section. But this requires the database to exists beforehand.

1. Create a new database (if it doesn't exists)
```
mysql -u <user> -e "create database recruiter" -p
```

2. Execute the dump
```
 mysql -u <user> -p recruiter < dbDump.sql
```