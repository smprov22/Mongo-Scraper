const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
const db = require("./models");
const PORT =  process.env.PORT || 8080;

// Initialize Express
const app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Routes

// A GET route for scraping the NYT Movie News website
app.get("/scrape", function(req, res) {
  axios.get("https://www.nytimes.com/section/movies").then(function(response) {
    var $ = cheerio.load(response.data);
    // console.log(response.data);

    $("li.css-ye6x8s").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .children().find("h2").text();
        console.log(result.title);
      result.summary = $(this)
        .children().find("p.css-1echdzn").text();
      result.link = $(this)
        .find("a").attr("href");
      result.author = $(this)
        .children().find("p.css-1xonkmu").text();

      // Create a new Headline using the `result` object built from scraping
      db.Headline.create(result)
        .then(dbHeadline => {
          // View the added result in the console
          console.log(dbHeadline);
        })
        .catch(err => {
          // If an error occurred, log it
          console.log(err);
        });
    });

    // Send a message to the client
    res.send("index.html");
  });
});

// Route for getting all Headlines from the db
app.get("/headlines", (req, res) => {
  db.Headline.find({})
    .then(dbHeadline => {
      res.json(dbHeadline);
    })
    .catch(err => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Headline by id, populate it with it's comments
app.get("/headlines/:id", (req, res) => {
  
  db.Headline.findOne({ _id: req.params.id })
    .populate("comment")
    .then(dbHeadline => {
      res.json(dbHeadline);
    })
    .catch(err => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Headline's associated Comment
app.post("/headlines/:id", (req, res) => {
  // Create a new comment and pass the req.body to the entry
  db.Comment.create(req.body)
    .then(dbComment => {
      return db.Headline.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
    })
    .then(dbHeadline => {
      res.json(dbHeadline);
    })
    .catch(err => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Comment by id
app.get("/comments/:id", (req, res) => {
  db.Comment.findOne({ _id: req.params.id })
    .then(dbComment => {
      res.json(dbComment);
    })
    .catch(err => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for deleting a comment on an article
app.delete("/comments/:id", (req, res) => {
  db.Comment.findOne({ _id: req.params.id })
  .then(dbComment => {
    dbComment.remove(err => {
      res.json(err);
    })
  })
  .catch(err => {
    res.json(err);
  })
})

// Connect to the Mongo DB
// const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/Mongo-scraper";

// mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines"
mongoose.connect(MONGODB_URI);
// Start the server
app.listen(PORT, () => {
  console.log("App running on port " + PORT + "!");
});
