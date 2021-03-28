// Update with your config settings.

export default {

  development: {
    client: "sqlite3",
    connection: {
      filename: "./data/dev.sqlite3"
    },
    useNullAsDefault: true
  },

  production: {
    client: "sqlite3",
    connection: {
      filename: "./data/main.sqlite3"
    },
    migrations: {
      tableName: "knex_migrations"
    },
    useNullAsDefault: true
  }

};
