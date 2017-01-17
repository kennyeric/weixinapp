var express = require('express')
var fs = require('fs')
var util = require('util')
var fileUpload = require('express-fileupload')
var mysql = require('mysql')
var bodyParser = require('body-parser')
var asyncExecCmd = require('async-exec-cmd')
var syncCmd = require('sync-exec')

var app = express()
app.use(bodyParser.json())          // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123<>?zxc)_+',
    database: 'app'
})

connection.connect(function(err){
    if (!err) {
        console.log('database is connected ...\n')
    } else {
        console.log('error connecting database ...\n')
    }
})

const md5File = require('md5-file')

app.use(fileUpload())

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.post('/audio/upload', function (req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (!req.files) {
    res.send(JSON.stringify({
        status: 0,
        msg: 'no file was uploaded',
        data: {}
    }))
  }

  var audioFile = req.files.file
  audioFile.mv('data/' + audioFile.name, function(err) {
    if (err)
      res.status(500).send(err)
    const hash = md5File.sync('data/' + audioFile.name)
    var newPath = 'data/' + hash + '.silk'
    fs.writeFile(newPath, audioFile.data, function (err) {
      var insertData = {}
      //xunfei sdk
      convertCmd = util.format('sh converter.sh /data/dev/weixinapp/weixinapp/data/%s.silk wav', hash)
      console.log(syncCmd(util.format('cd /data/dev/xunfei/silk-v3-decoder-master/ && %s', convertCmd)))
      sdkASyncCmd = util.format('/data/dev/xunfei/Linux_voice_1135_58751388/bin/iat_sample data/%s.wav', hash)
      process.env.LD_LIBRARY_PATH = '/data/dev/xunfei/Linux_voice_1135_58751388/libs/x64/'
      asyncExecCmd(sdkASyncCmd, [], function (err, result, code, buffer) {
        console.log(result)
        insertData['title'] = req.body.title;
        insertData['name'] = hash;
        insertData['content'] = result
        connection.query('INSERT INTO app_audio_files SET ?', insertData, function(err, result) {
          if(!err) {
            res.send(JSON.stringify({
              status: 1,
              msg: 'file was uploaded',
              data: {}
            }))
          } else {
            console.log(err)
          }
        })
      })
    })
  })
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
