import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('users', table => {
    table.timestamp('lastRepTime').notNullable().defaultTo(0)
  })
  await knex('users').update('lastRepTime', 0)
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('users', table => {
    table.dropColumn('lastRepTime')
  })
}

