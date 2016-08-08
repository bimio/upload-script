var needle = require('needle');
var prompt = require('prompt');
var _ = require('lodash');
var fs = require('fs');

var filePath = process.argv[2];
var bimserver = process.argv[3];
var username = process.argv[4];
var password = process.argv[5];

var options = {
  json: true
};


//

//prompt.get(['username', 'password'], function (err, result) {

  var loginData = {
    "request": {
      "interface": "Bimsie1AuthInterface",
      "method": "login",
      "parameters": {
        "username": username,
        "password": password
      }
    }
  };

  // Log in
  needle.post(bimserver + '/json', loginData, options, function (err, resp) {
    var token = resp.body.response.result;
    var getProjectsData = {
      "token": token,
      "request": {
        "interface": "Bimsie1ServiceInterface",
        "method": "getAllProjects",
        "parameters": {
          "onlyTopLevel": "false",
          "onlyActive": "false"
        }
      }
    };

    // Get all projects
    needle.post(bimserver + '/json', getProjectsData, options, function(err, resp) {
      var projects = resp.body.response.result;


      projects.forEach(function(p, i) {
        console.log('[', i, '] ', p.name)
      })

      prompt.get(['project'], function(err, result) {
        var project = projects[result.project];

        var ifcDeserializerData = {
          "token": token,
          "request": {
            "interface": "Bimsie1ServiceInterface",
            "method": "getDeserializerByName",
            "parameters": { "deserializerName": "Ifc2x3tc1 Step Deserializer" }
          }
        };

        // Get ifc deserializer
        needle.post(bimserver + '/json', ifcDeserializerData, options, function(err, resp) {
          var ifcDeserializer = resp.body.response.result;

          var pathSplit = filePath.split("/");
          var fileName = pathSplit[pathSplit.length - 1];

          fs.readFile(filePath, function(err, data) {
            if (err) throw err;
            var encodedFileData = new Buffer(data).toString('base64'); //data

            var newRevisionData = {
              "token": token,
              "request": {
                "interface": "Bimsie1ServiceInterface",
                "method": "checkin",
                "parameters": {
                  "poid": project.oid,
                  "comment": fileName,
                  "deserializerOid": ifcDeserializer.oid,
                  "fileSize": encodedFileData.length,
                  "fileName": fileName,
                  "data": encodedFileData,
                  "sync": "true"
                }
              }
          };

            // Upload revision to project
            needle.post(bimserver + '/json', newRevisionData, options, function(err, resp) {
              var getAllRevisionsData = {
                "token": token,
                "request": {
                  "interface": "Bimsie1ServiceInterface",
                  "method": "getAllRevisionsOfProject",
                  "parameters": { "poid": project.oid}
                }
              };
              var oldResp = resp;
              needle.post(bimserver + '/json', getAllRevisionsData, options, function(err, resp) {
                var revisions = resp.body.response.result;
                console.log(revisions[revisions.length-1]);
                console.log("oldResp", oldResp)
              })
            });
          });
        });
      })

    });
  });
//});
