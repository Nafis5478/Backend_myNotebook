const express = require("express");
const UserSchema = require("../Models/User");
const { body, validationResult } = require("express-validator");
const User = require("../Models/User");
const router = express.Router();
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var fetchuser = require("../Middleware/fetchuser");
require('dotenv').config();


// Route 1: for crating user....
// we have to create a user using: POST "/api/auth/creatreuser".no login required...

router.post(
  "/createuser",
  [
    body("name", "name should be of length 5").isLength({ min: 5 }),
    body("email", "enter a valid email").isEmail(),
    body("passcode", "passcode should be of length 8").isLength({ min: 8 }),
  ],
  async (req, res) => {
    // If there are errors, return bad request and the errors

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // check whether the user with same email exist already...
    try {
      // we will pass all the code below this in try catch form in order to avoid error...
      let success=false;
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({success, error: "Sorry a user with this email already exists.." });
      }
      const salt = await bcrypt.genSalt(10);
      const secPasscode = await bcrypt.hash(req.body.passcode, salt);

      user = await User.create({
        name: req.body.name,
        passcode: secPasscode,
        email: req.body.email,
      });
      // we made the function async so no use of .then
      // .then(user=>res.json(user))
      // .catch(err=>{console.log(err)
      // res.json({error:'Please enter a unique value for email'})})
      const data = {
        user: {
          id: user.id,
        },
      };
      const authToken = jwt.sign(data, process.env.JWT_SECRET);
      success=true;
      // res.json(user.id);
      res.json({ success,authToken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send(success,"Internal Server Error");
    }
  }
);

// Route 2: For login

// we have to create a user using: POST "/api/auth/login".no login required...
router.post(
  "/login",
  [
    body("email", "enter a valid email").isEmail(),
    body("passcode", "Passcode can not be blank").exists(),
  ],
  async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, passcode } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({
            success,
            error: "Please try to login with correct credentials",
          });
      }
      const passcodeCompare = await bcrypt.compare(passcode, user.passcode);
      if (!passcodeCompare) {
        return res
          .status(400)
          .json({
            success,
            error: "Please try to login with correct credentials",
          });
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      const authToken = jwt.sign(data, process.env.JWT_SECRET);
      success = true;
      res.json({ success, authToken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send(success,"Internal Server Error");
    }
  }
);

// Route 3:  Get loggedin users detail: POST "/api/auth/getuser". Login required here...for this we have to send JWT Token....

// logic: we will take id and fetch from it..
router.post("/getuser", fetchuser, async (req, res) => {
  let success=false;
  try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-passcode");
    res.send(success,user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send(success,"Internal Server Error");
  }
});
module.exports = router;
