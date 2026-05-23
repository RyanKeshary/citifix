const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  createComplaint,
  listComplaints,
  findComplaintById,
  updateComplaint,
  deleteComplaint,
  getComplaintsForUser,
  addComplaintVote,
  findUserById,
  toPublicComplaint,
} = require("../store");

const router = express.Router();

// Create complaint
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      latitude,
      longitude,
      image,
      address,
      assignedDepartment,
      status,
      votes,
      location,
    } = req.body;

    const resolvedLatitude = latitude ?? location?.latitude;
    const resolvedLongitude = longitude ?? location?.longitude;

    if (!title || !description || !category || resolvedLatitude === undefined || resolvedLongitude === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const complaint = createComplaint({
      title,
      description,
      category,
      latitude: Number(resolvedLatitude),
      longitude: Number(resolvedLongitude),
      image: image || null,
      address: address || null,
      assignedDepartment: assignedDepartment || null,
      status: status || "open",
      votes: Number.isFinite(Number(votes)) ? Number(votes) : 0,
      votedBy: [],
      userId: req.userId,
    });

    res.status(201).json(toPublicComplaint(complaint));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all complaints
router.get("/", async (req, res) => {
  try {
    const complaints = listComplaints().sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote complaint
router.post("/:id/vote", authMiddleware, async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id);

    const complaint = findComplaintById(complaintId);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const updated = addComplaintVote(complaintId, req.userId);

    if (updated && updated.error) {
      return res.status(400).json({ error: updated.error });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's complaints
router.get("/user/my-complaints", authMiddleware, async (req, res) => {
  try {
    const complaints = getComplaintsForUser(req.userId);

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get complaint by ID
router.get("/:id", async (req, res) => {
  try {
    const complaint = findComplaintById(parseInt(req.params.id));

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update complaint
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id);
    const { title, description, category, status, latitude, longitude } = req.body;

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (complaint.userId !== req.userId && req.userRole !== "ADMIN") {
      return res.status(403).json({ error: "Not authorized to update this complaint" });
    }

    const updated = updateComplaint(complaintId, {
      ...(title && { title }),
      ...(description && { description }),
      ...(category && { category }),
      ...(status && { status }),
      ...(latitude !== undefined && { latitude: Number(latitude) }),
      ...(longitude !== undefined && { longitude: Number(longitude) }),
    });

    res.json(toPublicComplaint(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete complaint
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id);

    const complaint = findComplaintById(complaintId);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (complaint.userId !== req.userId && req.userRole !== "ADMIN") {
      return res.status(403).json({ error: "Not authorized to delete this complaint" });
    }

    deleteComplaint(complaintId);

    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
