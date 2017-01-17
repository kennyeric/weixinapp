var express = require('express')
var fs = require('fs')
var fileUpload = require('express-fileupload')
var app = express()

app.use(fileUpload())

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.post('/audio/upload', function (req, res) {
  if (!req.files) {
    res.send('no file was uploaded.')
    return
  }

  var audioFile = req.files.file
  console.log(audioFile)
  audioFile.mv('data/' + audioFile.name, function(err) {
    if (err)
      res.status(500).send(err)
    else
      res.send('file uploaded')
  })
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
