
/*
 * project controller
 */
var https = require('https');
var v = require('valentine');
var Project = require('../models/project.js');
var session = require('passport').session;

function callGithubAPI(path, accessToken, callback) {
    var options = {
        host: 'api.github.com',
        port: '443',
        path: path,
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'bearer ' + accessToken
        }
    };

    var request = https.request(options, function(result) {
        var output = '';
        result.setEncoding('utf8');

        result.on('data', function (chunk) {
            output += chunk;
        });

        result.on('end', function() {
            var obj = JSON.parse(output);
            callback(null, obj);
        });
    });

    request.on('error', function(err) {
        callback(err);
    });

    request.end();
}

exports.index = function(req, res) {
  var username = req.session.passport.user.username;
  var accessToken = session.accessToken;

  v.waterfall([
    // ユーザの所属してるorgをすべて取得
    function (callback) {
      callGithubAPI('/user/orgs', accessToken, callback);
    },
    //orgのプロジェクト一覧を取得
    function (orgs, callback) {
      var orgnames = new Array(orgs.length);
      for (var i = 0; i < orgs.length; i++) {
        orgnames[i] = orgs[i].login;
      }

      Project.find({'orgname': {$in: orgnames}}, function(err, projects) {
        if (err) callback(err);
        callback(null, projects);
      });
    }
  ], function (err, projects) {
    res.render('project-index', { 'projects' : projects });
  });
};

exports.new = function(req, res) {
    var username = req.session.passport.user.username;
    var accessToken = session.accessToken;

    v.waterfall([
        // userに紐づいているorganizationの一覧の取得
        function(callback) {
            callGithubAPI('/user/orgs', accessToken, callback);
        },
        // organizationに紐づいているリポジトリ取得
        function(org, callback) {
            for (var i = 0; i < org.length; i++) {
                console.log(org[i].login);
                callGithubAPI('/orgs/' + org[i].login + '/repos', accessToken, callback);
            }
        }
    ], function(err, repos) {
        if (err) console.log('error = ' + err);
        res.render('project-new', { 'repos' : repos });
        console.log('repos = ');
        console.log(repos);
    });
};

exports.create = function(req, res) {
  var params = req.body.reponame.split('/');
  var orgname = params[0];
  var reponame = params[1];

  Project.find({'orgname': orgname, 'reponame': reponame}, function(err, projects) {
    if (err) console.log(err);

    if (projects.length === 0) {
      var project = new Project({'orgname': orgname, 'reponame': reponame});
      project.save(function(err) {
          console.log(err);
      });

      res.render('project-created', { 'name' : reponame });
    }
    else {
      res.redirect('/projects');
    }
  });
};

exports.detail = function(req, res) {
  res.send("respond with a resource");
};