//Zeit als ausschlaggebender Faktor


const express = require('express')
const cors = require('cors')
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

app.use(cors())

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
        let partId = req.body.id

        let file = path.resolve(`../data/part${partId}.csv`)
        let content = ""
        try {
            let data = await fs.readFile(file, "utf-8")
            content = data.toString()
        } catch (err) {
            console.log('File was not found, creating new CSV file')
            content = 'participant_id,timestamp,time_to_finish,ui_mode,environment,fill_character,outlier_character,trial,trial_combined\n'
        }
        content = content + message + '\n'
        await fs.writeFile(file, content, 'utf8')
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
        return
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).send('The file you are looking for was not found')
            return
        } else {
        res.status(500).send('Internal Server Error')
        }
    }
})

app.listen(port, (error) => {
    if (error) {
        console.log("Error occurred, server can't start", error)
    } else {
        console.log("Server listening on port", port)
    }
})