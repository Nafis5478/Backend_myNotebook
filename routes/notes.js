const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Notes = require("../Models/Notes");
var fetchuser = require("../Middleware/fetchuser");
// ROUTE 1: Get all the notes....so we will use get here...
// GET "/api/notes/fetchallnotes"
router.get("/fetchallnotes", fetchuser, async (req, res) => {
  try {
    const notes = await Notes.find({ user: req.user.id });
    res.json(notes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});
// ROUTE 2: Add a new note using : POST "/api/notes/addnote". login required....
router.post(
  "/addnote",
  fetchuser,
  [
    body("title", "Title should be min 3").isLength({ min: 3 }),
    body("description", "Description should be min 5").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      const { title, description, tag } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send({ error: errors.array() });
      }
      const note = new Notes({
        title,
        description,
        tag,
        user: req.user.id,
      });
      const savedNote = await note.save();
      res.json(savedNote);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

// ROUTE 3: For updating the existing note: POST "/api/notes/updatenotes".login req...
router.put('/updatenotes/:id', fetchuser, async (req, res) => {
  const { title, description, tag } = req.body;
  try {
      // Create a newNote object
      const newNote = {};
      if (title) { newNote.title = title };
      if (description) { newNote.description = description };
      if (tag) { newNote.tag = tag };

      // Find the note to be updated and update it
      let note = await Notes.findById(req.params.id);
      if (!note) { return res.status(404).send("Not Found") }

      if (note.user.toString() !== req.user.id) {
          return res.status(401).send("Not Allowed");
      }
      note = await Notes.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true })
      res.json({ note });
  } catch (error) {
      res.status(500).send('Found internal error...');
  }
})
// ROUTE 4: For deleting any particular note...using DELETE "/api/deletenotes" login req...

router.delete("/deletenotes/:id", fetchuser, async (req, res) => {
  // Check if req.params.id is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send('Invalid ObjectId');
  }
  try {
    // find the note to be deleted...
    let notes = await Notes.findByIdAndDelete(req.params.id);
    if (!notes) {
      return res.status(404).send("Not Found");
    }

    // allow deletion if the authenticated user is the creator of the note...
    if (notes.user.toString() !== req.user.id) {
      return res.status(401).send("Not Allowed");
    }

    // Send a success response
    res.json({ Success: "Note has been deleted" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});


module.exports = router;
