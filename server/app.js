//Zeit als ausschlaggebender Faktor


const express = require('express')
const fs = require('fs').promises
const path = require('path')
const bodyParser = require('body-parser')
const {json} = require("express");
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false })

const username = "Forschungsseminar"
const password = "tV04rKqF0REtpsjqK7BZ"

const app = express()
const port = process.env.PORT || 6969

app.get('/online', (req, res) => {
    res.status(200).send('Server is running')
})

app.post('/write-data', jsonParser, async (req, res) => {
    console.log('Write-Data endpoint requested')
    let usernameHeader = req.headers['username']
    let passwordHeader = req.headers['password']
    if (!usernameHeader || !passwordHeader) {
        res.status(401).send('Authentication must be sent in headers')
        console.log('Request denied, missing authentication')
        return
    } else if (usernameHeader !== username || passwordHeader !== password) {
        res.status(403).send('The provided username or password was incorrect')
        console.log('Request denied, authentication failed')
        return
    }
    try {
        //console.log(username, password)
        let message = req.body.message
        let partId = message['id']
        //console.log('id: ' + partId)
        let times = message['times']
        //console.log('times: ' + times)
        let mode = message['mode']
        //console.log('mode: ' + mode)
        let file = path.resolve(`../data/part${partId}.json`)
        let json = {}
        try {
            let data = await fs.readFile(file, "utf-8")
            json = JSON.parse(data)
        } catch (err) {
            console.log('File was not found or does not contain json, using new json isntead')
        }
        json[mode] = times
        await fs.writeFile(file, JSON.stringify(json, null, 2))
        console.log('Wrote data to file')
        res.status(200).send('Successfully written data to file')
    } catch (error) {
        console.log('Error handling write request: ' + error)
        res.status(500).send('Internal Server Error')
    }
})


app.post('/read-data', jsonParser, async (req, res) => {
    console.log('Read-Data endpoint requested')
    let usernameHeader = req.headers['username']
    let passwordHeader = req.headers['password']
    if (!usernameHeader || !passwordHeader) {
        res.status(401).send('Authentication must be sent in headers')
        console.log('Request denied, missing authentication')
        return
    } else if (usernameHeader !== username || passwordHeader !== password) {
        res.status(403).send('The provided username or password was incorrect')
        console.log('Request denied, authentication failed')
        return
    }
    let id = req.body.id
    let file = path.resolve(`../data/part${id}.json`)
    console.log(`Loading for id ${id} - ${file}`)
    try {
        let data = await fs.readFile(file, "utf-8")
        res.status(200).send(data)
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).send('The file you are looking for was not found')
        }
        res.status(500).send('Internal Server Error')
    }
})

app.listen(port, (error) => {
    if (error) {
        console.log("Error occurred, server can't start", error)
    } else {
        console.log("Server listening on port", port)
    }
})