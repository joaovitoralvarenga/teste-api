const express = require ('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
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




let checkToken = (req, res, next) => {
    let authToken = req.headers["authorization"]
    if (!authToken) {
        return res.status(401).json({ message: 'Token de acesso requerida' })
    }
    
    let token = authToken.split(' ')[1]
    req.token = token

    jwt.verify(req.token, process.env.SECRET_KEY, (err, decodeToken) => {
        if (err) {
            return res.status(401).json({ message: 'Acesso negado'})
           
        }
        req.usuarioId = decodeToken.id
        next()
    })
}

let isAdmin = (req, res, next) => {
    knex
        .select ('*').from ('usuario').where({ id: req.usuarioId })
        .then ((usuarios) => {
            if (usuarios.length) {
                let usuario = usuarios[0]
                let roles = usuario.roles.split(';')
                let adminRole = roles.find(i => i === 'ADMIN')
                if (adminRole === 'ADMIN') {
                    next()
                    return
                }
                else {
                    res.status(403).json({ message: 'Role de ADMIN requerida' })
                    return
                }
            } else {
                req.status(404).json({message: 'Usuário não encontrado'})
            }
        })
        .catch (err => {
             res.status(500).json({
              message: 'Erro ao verificar roles de usuário - ' + err.message })
        })
}









apiRouter.get(endpoint + 'produtos', checkToken, (req, res) => {
    knex.select('*').from('produto')
    .then( produtos => res.status(200).json(produtos) )                       //Rota GET, utilizada para obter informações de um produto.
    .catch(err => {
        res.status(500).json({
            message: 'Erro ao recuperar produtos - ' + err.message })
    })
})

apiRouter.get(endpoint + 'produtos/:id', checkToken,(req, res) => {
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









apiRouter.post (endpoint + 'seguranca/register', (req, res) => {
    knex ('usuario')
        .insert({
        nome: req.body.nome,
        login: req.body.login,
        senha: bcrypt.hashSync(req.body.senha, 8),
        email: req.body.email
        }, ['id'])
        .then((result) => {
        let usuario = result[0]                                                  //Middleware para registro de novos usuários na aplicação.
        res.status(200).json({"id": usuario.id })
        return
        })
        .catch(err => {
        res.status(500).json({
        message: 'Erro ao registrar usuario - ' + err.message })
        })
})



apiRouter.post('/seguranca/login', (req, res) => {
    
    // ✅ NOVO: Log para debug - ajuda a identificar problemas
    console.log('🔐 Tentativa de login:', req.body.login)
    
    // ✅ NOVO: Validação de campos obrigatórios
    if (!req.body.login || !req.body.senha) {
        return res.status(400).json({ message: 'Login e senha são obrigatórios' })
    }

    knex
        .select('*').from('usuario').where({ login: req.body.login })
        .then(usuarios => {
            if (usuarios.length) {
                let usuario = usuarios[0]
                let checkSenha = bcrypt.compareSync(req.body.senha, usuario.senha)
                
                if (checkSenha) {
                    var tokenJWT = jwt.sign(
                        { id: usuario.id },
                        process.env.SECRET_KEY,
                        { expiresIn: 3600 }
                    )
                    
                    // ✅ NOVO: Log de sucesso
                    console.log('✅ Login bem-sucedido:', usuario.login)
                    
                    // ✅ CORRIGIDO: Adicionado RETURN para evitar execução do código abaixo
                    return res.status(200).json({
                        id: usuario.id,
                        login: usuario.login,
                        nome: usuario.nome,
                        roles: usuario.roles || 'USER', // ✅ NOVO: Fallback para 'USER' se roles estiver vazio
                        token: tokenJWT
                    })
                } else {
                    // ✅ NOVO: Log de senha incorreta
                    console.log('❌ Senha incorreta para:', usuario.login)
                }
            } else {
                // ✅ NOVO: Log de usuário não encontrado
                console.log('❌ Usuário não encontrado:', req.body.login)
            }
            
            // ❌ ANTES: res.status(200).json({ message: 'Login ou senha incorretos' })
            // ⚠️ PROBLEMA: Status 200 indica SUCESSO! Mas o login falhou!
            
            // ✅ CORRIGIDO: Status 401 (Unauthorized) para login/senha incorretos
            // Isso faz o frontend entrar no bloco catch ou tratar como erro
            res.status(401).json({ message: 'Login ou senha incorretos' })
        })
        .catch(err => {
            // ✅ NOVO: Log de erro no console
            console.error('❌ Erro no login:', err)
            res.status(500).json({
                message: 'Erro ao verificar login - ' + err.message
            })
        })
})






module.exports = apiRouter;