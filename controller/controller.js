var express = require("express");
var router = express.Router();
var path = require("path");


// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");


var Note = require("../models/Note.js");
var Article = require("../models/Article.js");

router.get("/", function(req, res) {
  res.redirect("/articles");
});

router.get("/scrape", function(req, res) {
  axios.get("http://www.theonion.com/").then(async function(response) {
    var $ = cheerio.load(response.data);
    var titlesArray = [];
    $("h4.sc-1qoge05-0 gtIwiT").map(function(i, element) {
      console.log(element.html())
    })
    //h4.sc-1qoge05-0 gtIwiT
    // Promise.all($("h4.sc-1qoge05-0 gtIwiT").map(function(i, element) {
    //   var result = {};

    //   result.title = $(this)
    //     .children("p")
    //     .text();
    //   result.link = $(this)
    //     .children("a")
    //     .attr("href");
    //   console.log(result);
    //   if (result.title !== "" && result.link !== "") {
    //     if (titlesArray.indexOf(result.title) == -1) {
    //       titlesArray.push(result.title);

    //       return Article.count({ title: result.title }, function(err, test) {
    //         if (test === 0) {
    //           var entry = new Article(result);

    //           return entry.save(function(err, doc) {
    //             if (err) {
    //               console.log(err);
    //               // res.send({err})
    //               return(err)
    //             } else {
    //               console.log(doc);
    //               // res.send("success")
    //               return(doc)
    //             }
    //           });
    //         }
    //       });
    //     } else {
    //       console.log("Article already exists.");
    //       // res.send("Article already exists.")
    //     }
    //   } else {
    //     console.log("Not saved to DB, missing data");
    //     // res.send("Not saved to DB, missing data")
    //   }
    // }))
    // .then(function(result) {
    //   console.log(result)
    // }).catch(function(err) {
    //   console.log(err)
    // })
    // res.redirect("/");
  });
});
router.get("/articles", function(req, res) {
  Article.find()
    .sort({ _id: -1 })
    .exec(function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        var artcl = { article: doc };
        res.render("index", artcl);
      }
    });
});

router.get("/articles-json", function(req, res) {
  Article.find({}, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      res.json(doc);
    }
  });
});

router.get("/clearAll", function(req, res) {
  Article.remove({}, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log("removed all articles");
    }
  });
  res.redirect("/articles-json");
});

router.get("/readArticle/:id", function(req, res) {
  var articleId = req.params.id;
  var hbsObj = {
    article: [],
    body: []
  };

  Article.findOne({ _id: articleId })
    .populate("comment")
    .exec(function(err, doc) {
      if (err) {
        console.log("Error: " + err);
      } else {
        hbsObj.article = doc;
        var link = doc.link;
        axios.get(link).then(function(error, response, html) {
          var $ = cheerio.load(html);

          $(".l-col__main").each(function(i, element) {
            hbsObj.body = $(this)
              .children(".c-entry-content")
              .children("p")
              .text();

            res.render("article", hbsObj);
            return false;
          });
        });
      }
    });
});
router.post("/comment/:id", function(req, res) {
  var user = req.body.name;
  var content = req.body.comment;
  var articleId = req.params.id;

  var noteObj = {
    name: user,
    body: content
  };

  var newNote = new Note(noteObj);

  newNote.save(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log(doc._id);
      console.log(articleId);

      Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { comment: doc._id } },
        { new: true }
      ).exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/readArticle/" + articleId);
        }
      });
    }
  });
});

module.exports = router;