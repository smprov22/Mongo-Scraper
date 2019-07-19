// Grab the articles as a json
$.getJSON("/headlines", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    var newDiv = $("<div>").addClass("article").append("<h2>" + data[i].title + "<br />" + "</h2>").append("<p>" + data[i].summary  + "</p>").append("<p><i>" + data[i].author + "</i></p>" + "<br>").append("<p>" + "https://www.nytimes.com" + data[i].link + "</p>" + "<hr>");
    $(newDiv).attr("data-id", data[i]._id);

    $("#headlines").append(newDiv);  
  }
});


// Whenever someone clicks a p tag
$(document).on("click", ".article", function() {
  // Empty the notes from the note section
  $("#comments").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/headlines/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data);
      // The title of the article
      $("#comments").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#comments").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#comments").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#comments").append("<button data-id='" + data._id + "' id='saveComment'>Save Comment</button>");
      // Add a delete button
      $("#comments").append("<button data-id='" + data.comment._id + "' id='deleteComment'>Delete Comment</button>");

      // If there's a note in the article
      if (data.comment) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.comment.title);
        // Place the body of the notes in the body textarea
        $("#bodyinput").val(data.comment.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#saveComment", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/headlines/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from note textarea
      body: $("#bodyinput").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      // console.log(data);
      // Empty the notes section
      $("#comments").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

$(document).on("click", "#deleteComment", function() {
  let id = $(this).attr('data-id')
  let url = '/comments/' + id
  $.ajax({
    method: 'DELETE',
    url: url,
    data: { id: id }
  }).then(function () {
    $("#comments").empty();
  })
})
