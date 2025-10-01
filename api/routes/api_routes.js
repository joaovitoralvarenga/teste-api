const express = require ('express')
let apiRouter = express.Router()

const endpoint = '/'

const knex = require('knex')({
    client : 'pg',
    debug: true,
    connection : {
        connectionString: process.env.DATABASE_URL,                           //Requisição para conexão ao banco de dados, passando as credencias por parâmetro
        ssl: {rejectUnauthorized: false},
    }
});

apiRouter.get(endpoint + 'produtos', (req, res) => {
    knex.select('*').from('produto')
    .then( produtos => res.status(200).json(produtos) )                       //Rota GET, utilizada para obter informações de um produto.
    .catch(err => {
        res.status(500).json({
            message: 'Erro ao recuperar produtos - ' + err.message })
    })
})

apiRouter.get(endpoint + 'produtos/:id', checkToken, (req, res) => {
    knex.select('*').from('produto').where({ id: req.params.id })         
    .then(produtos => {
        if (produtos.length > 0) {                                            //Rota GET, para obter um produto a partir do ID
            res.status(200).json(produtos[0])
        } else {
            res.status(404).json({ message: 'Produto não encontrado' })
        }
    })
    .catch(err => {
        res.status(500).json({
            message: 'Erro ao recuperar produto - ' + err.message 
        })
    })
})

apiRouter.post(endpoint + 'produtos', checkToken, isAdmin, (req, res) => {   //Rota POST, para a criação de um produto, apenas admins tem acesso a ela.
    knex('produto')
    .insert({
        descricao: req.body.descricao,
        valor: req.body.valor,
        marca: req.body.marca
    }, ['id'])
    .then(result => {
        let produto = result[0]
        res.status(201).json({ id: produto.id })
    })
    .catch(err => {
        res.status(500).json({
            message: 'Erro ao criar produto - ' + err.message 
        })
    })
})

apiRouter.put(endpoint + 'produtos/:id', checkToken, isAdmin, (req, res) => {  //Rota PUT, para atualização dos dados de um produto já existente. Apenas admins tem acesso a mesma.
    knex('produto')
    .where({ id: req.params.id })
    .update({
        descricao: req.body.descricao,
        valor: req.body.valor,
        marca: req.body.marca
    })
    .then(() => {
        res.status(200).json({ message: 'Produto atualizado com sucesso' })
    })
    .catch(err => {
        res.status(500).json({
            message: 'Erro ao atualizar produto - ' + err.message 
        })
    })
})

apiRouter.delete(endpoint + 'produtos/:id', checkToken, isAdmin, (req, res) => {  //Rota DELETE, remove uma instância e suas informações do banco de dados.
    knex('produto')
    .where({ id: req.params.id })
    .del()
    .then(() => {
        res.status(200).json({ message: 'Produto deletado com sucesso' })
    })
    .catch(err => {
        res.status(500).json({
            message: 'Erro ao deletar produto - ' + err.message 
        })
    })
})





module.exports = apiRouter;