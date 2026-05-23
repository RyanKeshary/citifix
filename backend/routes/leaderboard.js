const express = require("express");
const { getLeaderboard } = require("../store");

const router = express.Router();

// Get leaderboard - top users by complaint count
router.get("/", async (req, res) => {
  try {
    const users = getLeaderboard();

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      email: user.email,
      rewardPoints: user.rewardPoints,
      complaintCount: user.complaintCount,
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
