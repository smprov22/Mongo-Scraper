$.getJSON("/headlines", data => {
  // For each one
  for (let i = 0; i < data.length; i++) {

    const newDiv = $("<div>").addClass("article").append("<h2>" + data[i].title + "<br />" + "</h2>").append("<p>" + data[i].summary  + "</p>").append("<p><i>" + data[i].author + "</i></p>" + "<br>").append("<p>" + "https://www.nytimes.com" + data[i].link + "</p>" + "<hr>");
    $(newDiv).attr("data-id", data[i]._id);

    $("#headlines").append(newDiv);  
  }
});


// Click event to add a comment
$(document).on("click", ".article", function() {
  $("#comments").empty();
  let thisId = $(this).attr("data-id");

  $.ajax({
    method: "GET",
    url: "/headlines/" + thisId
  })
    .then((data) => {
      console.log(data);
      $("#comments").append("<h2>" + data.title + "</h2>");
      $("#comments").append("<input id='titleinput' name='title' >");
      $("#comments").append("<textarea id='bodyinput' name='body'></textarea>");
      $("#comments").append("<button data-id='" + data._id + "' id='saveComment'>Save Comment</button>");
      $("#comments").append("<button data-id='" + data.comment._id + "' id='deleteComment'>Delete Comment</button>");

      // If there's a comment in the article
      if (data.comment) {
        $("#titleinput").val(data.comment.title);
        $("#bodyinput").val(data.comment.body);
      }
    });
});

// Click event to save a comment
$(document).on("click", "#saveComment", function() {
  let thisId = $(this).attr("data-id");

  $.ajax({
    method: "POST",
    url: "/headlines/" + thisId,
    data: {
      title: $("#titleinput").val(),
      body: $("#bodyinput").val()
    }
  })
    .then(data => {
      $("#comments").empty();
    });

  $("#titleinput").val("");
  $("#bodyinput").val("");
});

// Click event to delete a comment
$(document).on("click", "#deleteComment", function() {
  let id = $(this).attr('data-id')
  let url = '/comments/' + id
  $.ajax({
    method: 'DELETE',
    url: url,
    data: { id: id }
  }).then(() => {
    $("#comments").empty();
  })
})
