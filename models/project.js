
/*
 * project model
 */

var mongoose = require('mongoose');
var db = require('../db');

var Schema = mongoose.Schema;
var Project = new Schema({
    username  : String,
    reponame  : String
});

mongoose.model('Project', Project);
module.exports = db.model('Project');