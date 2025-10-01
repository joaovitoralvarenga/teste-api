require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/app', express.static(path.join(__dirname, '/public')))

app.get('/', (req, res) => {
    res.json({
        message: '🎯 API de Produtos está rodando!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        status: 'online'
    })  
})



let PORT = process.env.PORT || 3000
app.listen(PORT)

const apiRouter = require('./api/routes/api_routes')

app.use ('/api', apiRouter)