/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return Promise.all ([

        knex.schema.createTable("produto", tbl => {
            tbl.increments ('id') ;
            tbl.text ("descricao", 255).unique ().notNullable();
            tbl.text ("marca", 128).notNullable();
            tbl.decimal ("valor").notNullable();
        }),
        
        knex.schema.createTable("usuario", tbl => {
            tbl.increments ('id') ;
            tbl.text ("nome", 255).unique ().notNullable();
            tbl.text ("login", 100).unique ().notNullable();
            tbl.text ("email", 100).notNullable();
            tbl.text ("senha", 100).notNullable();
            tbl.text ("roles", 100).notNullable();
            
        })     
    ])
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return Promise.all ([
        knex.schema.dropTableIfExists ("produto"),
        knex.schema.dropTableIfExists ("usuario")
    ])
};
