import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.string('id').primary()
    table.integer('xp').notNullable().defaultTo(0)
    table.integer('reps').notNullable().defaultTo(0)
    table.timestamp('lastXPDate').notNullable().defaultTo(0)
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}

