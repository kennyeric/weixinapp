var express = require('express')
var fs = require('fs')
var fileUpload = require('express-fileupload')
var mysql = require('mysql')
var bodyParser = require('body-parser')
var asyncExecCmd = require('async-exec-cmd')

var app = express()
app.use(bodyParser.json())          // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
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

//change meta data of jpeg
const DelimiterHigh = 0xff
const DelimiterLow = 0xff

function changeMetaData(filename, hash) {
  //read file
  fs.open(filename, 'r', function opened(err, fd) {
    if (err) { throw err }
    var readBuffer = new Buffer(1024*1024),
        bufferOffset = 0,
        bufferLength = readBuffer.length,
        filePosition = 0
    fs.read(fd, readBuffer, bufferOffset, bufferLength, filePosition, function read(err, readBytes) {
        if (err) { throw err }
        console.log('just read ' + readBytes + ' bytes')
        if (readBytes > 0) {
          console.log(readBuffer.slice(0, readBytes))
          var contentBuffer = readBuffer.slice(0, readBytes)
          var delimiter = new Buffer([0xff, 0xff])
          var hashBuffer = new Buffer(hash)
          fs.open('data/' + hash + '.jpg', 'w', function write(err, writeFD) {
            var writeBuffer = Buffer.concat([contentBuffer, delimiter, hashBuffer], contentBuffer.length + delimiter.length + hashBuffer.length)
                bufferPosition = 0,
                bufferLength = writeBuffer.length, filePosition = 0
            fs.write(writeFD, writeBuffer, bufferPosition, bufferLength, filePosition, function(err, written) {
              if (err) { throw err }
              console.log('wrote ' + written + ' bytes')
            })
          })
        }
      })
  })
}

function generateImgFile(filename, hash) {
  //read file
  fs.open(filename, 'r', function opened(err, fd) {
    if (err) { throw err }
    var readBuffer = new Buffer(1024*1024),
      bufferOffset = 0,
      bufferLength = readBuffer.length,
      filePosition = 0
    fs.read(fd, readBuffer, bufferOffset, bufferLength, filePosition, function read(err, readBytes) {
      if (err) { throw err }
      console.log('just read ' + readBytes + ' bytes')
      if (readBytes > 0) {
        console.log(readBuffer.slice(0, readBytes))
        var contentBuffer = readBuffer.slice(0, readBytes)
        fs.open('data/' + hash + '.jpg', 'w', function write(err, writeFD) {
          var writeBuffer = contentBuffer
              bufferPosition = 0,
              bufferLength = writeBuffer.length, filePosition = 0
          fs.write(writeFD, writeBuffer, bufferPosition, bufferLength, filePosition, function(err, written) {
            if (err) { throw err }
            console.log('wrote ' + written + ' bytes')
          })
        })
      }
    })
  })
}

function parseHash(hash) {

}

app.get('/test', function(req, res) {
  res.setHeader('Content-Type', 'application/json')
  // var data = fs.readFileSync('data/sf.jpg', 'utf-8')
  // changeMetaData('data/sf.jpg', 'abc')
  // parseHash('abc')
  generateImgFile('data/sf.jpg', 'abc')
  res.send(JSON.stringify({
    status: 1,
    msg: 'img file meta data info',
    data: {}
  }))
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
      sdkCmd = '/data/dev/xunfei/silk-v3-decoder-master/converter.sh /data/dev/weixinapp/weixinapp/data/%s wav'
      asyncExecCmd(util.format(adkCmd, hash), [], function (err, res, code, buffer) {
        console.log(res)
      })
      insertData['title'] = req.body.title;
      insertData['name'] = hash;
      insertData['content'] = content
      connection.query('INSERT INTO app_audio_files SET ?', insertData, function(err, result) {
        if(!err) {
          generateImgFile('data/sf.jpg', hash)
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

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
