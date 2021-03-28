import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.enum('profileBackgroundType', ['color', 'url'])
    table.string('profileBackground')
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumns('profileBackgroundType', 'profileBackground')
  })
}

