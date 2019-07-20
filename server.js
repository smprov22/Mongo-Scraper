const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
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
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/Mongo-scraper";

mongoose.connect(MONGODB_URI);

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", (req, res) => {
  // First, we grab the body of the html with axios
  axios.get("https://www.nytimes.com/section/movies").then((response) => {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // console.log(response.data)

    // Now, we grab every h2 within an article tag, and do the following:
    $("li.css-ye6x8s").each((i, element) => {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children().find("h2").text();
      result.summary = $(this)
        .children().find("p.css-1echdzn").text();
      result.link = $(this)
        .find("a").attr("href");
      result.author = $(this)
        .children().find("p.css-1xonkmu").text();

      // Create a new Article using the `result` object built from scraping
      db.Headline.create(result)
        .then(dbHeadline => {
          // View the added result in the console
          // console.log(dbHeadline);
        })
        .catch(err => {
          // If an error occurred, log it
          // console.log(err);
        });
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/headlines", (req, res) => {
  // Grab every document in the Articles collection
  db.Headline.find({})
    .then(dbHeadline => {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbHeadline);
    })
    .catch(err => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/headlines/:id", (req, res) => {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Headline.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("comment")
    .then(dbHeadline => {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbHeadline);
    })
    .catch(err => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/headlines/:id", (req, res) => {
  // Create a new note and pass the req.body to the entry
  db.Comment.create(req.body)
    .then(dbComment => {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Headline.findOneAndUpdate({ _id: req.params.id }, { comment: dbComment._id }, { new: true });
    })
    .then(dbHeadline => {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbHeadline);
    })
    .catch(err => {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Comment by id
app.get("/comments/:id", (req, res) => {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Comment.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .then(dbComment => {
      // If we were able to successfully find an Article with the given id, send it back to the client
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
