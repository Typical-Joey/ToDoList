const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useFindAndModify: false
});


// Item Schema
const itemSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemSchema);


// Default Items
const item1 = new Item({
  name: "Welcome to your list"
});

const item2 = new Item({
  name: "Click the + or enter to add items"
})

const item3 = new Item({
  name: "<---- Check the box to delete items"
});

const defaultItems = [item1, item2, item3];


// List schema and model
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

const day = date.getDate();


// Home Page
app.get("/", function (req, res) {

  Item.find(function (err, items) {
    if (err) {
      console.log(err);
    } else {

      if (items.length === 0) {

        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("All items succesfully added to colletion");
          }
        });
        res.redirect("/");

      } else {

        res.render("list", {
          listTitle: day,
          newListItems: items
        });

      }

    }
  });


});


// Home post route, handles adding items to appropriate list
app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;



  let item = new Item({
    name: itemName
  });


  if (listName == day) {
    // Add list to home route
    item.save();
    res.redirect("/");

  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {

      if (!err) {
        if (foundList) {
          // Add to custom list
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName);
        }
      } else {
        console.log(err);
      }

    });

  }

});


// Making other lists
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create New List
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + list.name);
      } else {
        // Display Found List
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });



});


// Delete items ------------------------------------------------------------
app.post("/delete", function (req, res) {
  const itemID = req.body.deleteItem;
  const listName = req.body.listName;

  if (listName == day) {
    // Remove item in home route
    Item.findByIdAndRemove(itemID, function (err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/");

  } else {
    console.log("Custom List");
    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: itemID
          }
        }
      },
      function (err) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });

  }

});


// About section
app.get("/about", function (req, res) {
  res.render("about");
});


// Starting Server
app.listen(3000, function () {
  console.log("Server started on port 3000");
});