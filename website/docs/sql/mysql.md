---
tags:
  - database
---

# MySQL

The MySQL database can be used as database for StoryBooker.

## Install

```sh
npm i storybooker mysql
```

## Usage

```js
import { MySQLDatabaseAdapter } from "storybooker/mysql";
import mysql from "mysql";

// Initialize the SQL client
const client = mysql.createConnection({
  host: "localhost",
  user: "me",
  password: "secret",
  database: "my_db",
});
// Create the service adapter
const database = new MySQLDatabaseAdapter(client);

// use as `database` in StoryBooker hosting options.
```
