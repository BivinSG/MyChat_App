const express = require("express");
const { getAiResponse } = require("../controllers/aiControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/chat").post(protect, getAiResponse);

module.exports = router;
