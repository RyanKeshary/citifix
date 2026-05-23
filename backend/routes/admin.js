const express = require("express");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const {
	getAnalytics,
	listComplaints,
	findComplaintById,
	updateComplaint,
	incrementUserRewardPoints,
	listUsers,
	toPublicComplaint,
} = require("../store");

const router = express.Router();

// Admin analytics
router.get("/analytics", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    res.json(getAnalytics());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all complaints with filters
router.get("/complaints", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;

    const complaints = listComplaints()
      .filter((complaint) => {
        if (status && complaint.status !== status) {
          return false;
        }
        if (category && complaint.category !== category) {
          return false;
        }
        return true;
      })
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const total = complaints.length;
    const paginatedComplaints = complaints.slice((pageNumber - 1) * limitNumber, pageNumber * limitNumber);

    res.json({
      complaints: paginatedComplaints,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update complaint status
router.patch("/complaints/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, assignedDepartment } = req.body;

    if (!status && !assignedDepartment) {
      return res.status(400).json({ error: "Status is required" });
    }

    const complaintId = parseInt(req.params.id);
    const existingComplaint = findComplaintById(complaintId);

    if (!existingComplaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const complaint = updateComplaint(complaintId, {
      ...(status && { status }),
      ...(assignedDepartment && { assignedDepartment }),
    });

    if (status === "resolved" && existingComplaint.status !== "resolved") {
      incrementUserRewardPoints(complaint.userId, 10);
    }

    res.json(toPublicComplaint(complaint));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = listUsers().sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
