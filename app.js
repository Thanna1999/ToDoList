//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/toDoListDB", {
  useNewUrlParser: true
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});
const item2 = new Item({
  name: "Hit the + button to add a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Successfully added!");
          })
          .catch(err => {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(err => {
      console.log(err);
    });
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("ลบรายการเรียบร้อยแล้ว");
        res.redirect("/");
      })
      .catch(err => {
        console.error("เกิดข้อผิดพลาดในการลบรายการ:", err);
        res.redirect("/");
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.error("เกิดข้อผิดพลาดในการอัปเดตรายการ:", err);
        res.redirect("/" + listName);
      });
  }
});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item
      .save()
      .then(() => {
        res.redirect("/");
      })
      .catch(err => {
        console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", err);
      });
  } else {
    List.findOne({ name: listName })
      .then(foundList => {
        if (!foundList) {
          console.log("ไม่พบรายการ");
          return;
        }
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.error("เกิดข้อผิดพลาดในการค้นหาหรือบันทึกข้อมูล:", err);
      });
  }
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(foundList => {
      if (!foundList) {
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    })
    .catch(err => {
      console.error("เกิดข้อผิดพลาดในการค้นหา:", err);
    });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
