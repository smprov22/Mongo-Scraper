const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

const axios = require("axios");
const cheerio = require("cheerio");

// Require all models
const db = require("./models");

const PORT = 8080;

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

// Connect to the Mongo DB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://user1:password1@ds353007.mlab.com:53007/heroku_2b9mxbsk";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Routes

// A GET route for scraping the NYT Movie News website
app.get("/scrape", (req, res) => {
  axios.get("https://www.nytimes.com/section/movies").then((response) => {
    var $ = cheerio.load(response.data);

    $("li.css-ye6x8s").each((i, element) => {
      var result = {};

      result.title = $(this)
        .children().find("h2").text();
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
    res.send("Scrape Complete");
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

// Start the server
app.listen(PORT, () => {
  console.log("App running on port " + PORT + "!");
});
