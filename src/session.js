
const mongoose = require('mongoose')


// create schema

const clientSchema= new mongoose.Schema({
    clientId: String,
    connection: Object
})

const sessionModel = new mongoose.model('sessionDetail', clientSchema)
module.exports = {
    sessionModel
}
