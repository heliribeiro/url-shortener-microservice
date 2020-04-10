"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");

var cors = require("cors");

var app = express();

var bodyParser = require("body-parser");

// check if url exists
var urlExist = require("url-exist");

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

var Schema = mongoose.Schema;

var shorturlSchema = new Schema({
  original_url: {
    type: String
  },
  short_url: {
    type: String
  }
});

var Shorturl = mongoose.model("Shorturl", shorturlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extented: false }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

//complementary functions
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var findOnebyOriginalUrl = function(originalUrl, done) {
  Shorturl.findOne({ originalUrl: originalUrl }, function(err, data) {
    if (err) return console.log(err);
    done(null, data);
  });
};

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

// Receive a GET request containing an identifier used to find a strored URL
app.get("/api/shorturl/:short", async function(req, res) {
  var shorturl = await Shorturl.findOne({ short_url: req.params.short });
  if (!shorturl) {
    res.json({ error: "invalid URL" });
  } else res.redirect(shorturl.original_url);
});

//Receive a POST request containing a URL to be saved on database(mongodb)
app.post("/api/shorturl/new", async function(req, res, next) {
  var url = req.body.url;

  var exists = await urlExist(url);

  if (exists) {
    var original = await Shorturl.findOne({ original_url: url });

    if (!original) {
      var short_url = getRandomIntInclusive(1, 10000);

      var createAndSaveShorturl = function(done) {
        var shorturl = new Shorturl({
          original_url: req.body.url,
          short_url: short_url
        });

        shorturl.save(function(err, data) {
          if (err) return console.log(err);
          done(null, data);
        });
      };
      createAndSaveShorturl(next);
      res.json({ original_url: url, short_url: short_url });
    }

    var { short_url } = original;
    res.json({ original_url: url, short_url: short_url });
  } else {
    res.json({ error: "invalid URL" });
  }
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
