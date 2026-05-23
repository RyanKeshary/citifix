const fs = require("node:fs");
const path = require("node:path");

const cacheDir = path.join(__dirname, ".cache");
const cacheFile = path.join(cacheDir, "citifix-cache.json");

const state = {
	users: [],
	complaints: [],
	nextUserId: 1,
	nextComplaintId: 1,
};

function ensureCacheDir() {
	if (!fs.existsSync(cacheDir)) {
		fs.mkdirSync(cacheDir, { recursive: true });
	}
}

function loadState() {
	try {
		if (!fs.existsSync(cacheFile)) {
			return;
		}

		const raw = fs.readFileSync(cacheFile, "utf8");
		const parsed = JSON.parse(raw);
		state.users = Array.isArray(parsed.users) ? parsed.users : [];
		state.complaints = Array.isArray(parsed.complaints) ? parsed.complaints : [];
		state.nextUserId = Number(parsed.nextUserId) || 1;
		state.nextComplaintId = Number(parsed.nextComplaintId) || 1;
	} catch (error) {
		state.users = [];
		state.complaints = [];
		state.nextUserId = 1;
		state.nextComplaintId = 1;
	}
}

function persistState() {
	try {
		ensureCacheDir();
		fs.writeFileSync(
			cacheFile,
			JSON.stringify(state, null, 2),
			"utf8"
		);
	} catch (error) {
		// Cache persistence is best-effort; the in-memory copy remains usable.
	}
}

function normalizeRole(role) {
	return String(role || "CITIZEN").toUpperCase() === "ADMIN" ? "ADMIN" : "CITIZEN";
}

function toPublicUser(user) {
	if (!user) {
		return null;
	}

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		phone: user.phone || null,
		aadhaar: user.aadhaar,
		role: user.role,
		rewardPoints: user.rewardPoints || 0,
		createdAt: user.createdAt,
	};
}

function toPublicComplaint(complaint) {
	if (!complaint) {
		return null;
	}

	const user = findUserById(complaint.userId);

	return {
		id: complaint.id,
		title: complaint.title,
		description: complaint.description,
		category: complaint.category,
		latitude: complaint.latitude,
		longitude: complaint.longitude,
		location: {
			latitude: complaint.latitude,
			longitude: complaint.longitude,
		},
		image: complaint.image || null,
		address: complaint.address || null,
		assignedDepartment: complaint.assignedDepartment || null,
		votes: complaint.votes || 0,
		votedBy: Array.isArray(complaint.votedBy) ? complaint.votedBy : [],
		status: complaint.status || "open",
		userId: complaint.userId,
		userName: user ? user.name : complaint.userName || "",
		user: user ? {
			id: user.id,
			name: user.name,
			email: user.email,
		} : null,
		createdAt: complaint.createdAt,
	};
}

function findUserById(id) {
	return state.users.find((user) => user.id === Number(id)) || null;
}

function findUserByEmail(email) {
	return state.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function findUserByAadhaar(aadhaar) {
	return state.users.find((user) => user.aadhaar === String(aadhaar)) || null;
}

function createUser({ name, email, phone, aadhaar, password, role }) {
	const user = {
		id: state.nextUserId++,
		name,
		email,
		phone: phone || null,
		aadhaar: String(aadhaar),
		password,
		role: normalizeRole(role),
		rewardPoints: 0,
		createdAt: new Date().toISOString(),
	};

	state.users.push(user);
	persistState();
	return user;
}

function updateUser(id, updates) {
	const user = findUserById(id);
	if (!user) {
		return null;
	}

	Object.assign(user, updates);
	persistState();
	return user;
}

function incrementUserRewardPoints(id, points) {
	const user = findUserById(id);
	if (!user) {
		return null;
	}

	user.rewardPoints = (user.rewardPoints || 0) + Number(points || 0);
	persistState();
	return user;
}

function createComplaint({
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
	votedBy,
	userId,
}) {
	const complaint = {
		id: state.nextComplaintId++,
		title,
		description,
		category,
		latitude: Number(latitude),
		longitude: Number(longitude),
		image: image || null,
		address: address || null,
		assignedDepartment: assignedDepartment || null,
		status: status || "open",
		votes: Number(votes || 0),
		votedBy: Array.isArray(votedBy) ? votedBy : [],
		userId: Number(userId),
		createdAt: new Date().toISOString(),
	};

	state.complaints.push(complaint);
	persistState();
	return complaint;
}

function findComplaintById(id) {
	return state.complaints.find((complaint) => complaint.id === Number(id)) || null;
}

function updateComplaint(id, updates) {
	const complaint = findComplaintById(id);
	if (!complaint) {
		return null;
	}

	Object.assign(complaint, updates);
	persistState();
	return complaint;
}

function deleteComplaint(id) {
	const index = state.complaints.findIndex((complaint) => complaint.id === Number(id));
	if (index === -1) {
		return false;
	}

	state.complaints.splice(index, 1);
	persistState();
	return true;
}

function listComplaints() {
	return state.complaints.map(toPublicComplaint);
}

function listUsers() {
	return state.users.map(toPublicUser);
}

function addComplaintVote(id, voterId) {
	const complaint = findComplaintById(id);
	if (!complaint) {
		return null;
	}

	const votedBy = Array.isArray(complaint.votedBy) ? complaint.votedBy : [];
	if (votedBy.includes(Number(voterId))) {
		return { error: "Already voted" };
	}

	votedBy.push(Number(voterId));
	complaint.votedBy = votedBy;
	complaint.votes = (complaint.votes || 0) + 1;
	if (complaint.votes >= 50 && complaint.status === "open") {
		complaint.status = "escalated";
	}
	persistState();
	return toPublicComplaint(complaint);
}

function getAnalytics() {
	const complaints = state.complaints;
	const users = state.users;
	const countsByCategory = complaints.reduce((accumulator, complaint) => {
		accumulator[complaint.category] = (accumulator[complaint.category] || 0) + 1;
		return accumulator;
	}, {});

	return {
		totalComplaints: complaints.length,
		totalUsers: users.length,
		pendingComplaints: complaints.filter((complaint) => complaint.status === "open").length,
		resolvedComplaints: complaints.filter((complaint) => complaint.status === "resolved").length,
		escalatedComplaints: complaints.filter((complaint) => complaint.status === "escalated").length,
		complaintsByCategory: Object.entries(countsByCategory).map(([category, count]) => ({ category, count })),
	};
}

function getComplaintsForUser(userId) {
	return state.complaints
		.filter((complaint) => complaint.userId === Number(userId))
		.map(toPublicComplaint);
}

function getLeaderboard() {
	return state.users
		.map((user) => ({
			id: user.id,
			name: user.name,
			email: user.email,
			rewardPoints: user.rewardPoints || 0,
			complaintCount: state.complaints.filter((complaint) => complaint.userId === user.id).length,
		}))
		.sort((left, right) => right.rewardPoints - left.rewardPoints);
}

loadState();

module.exports = {
	createUser,
	findUserById,
	findUserByEmail,
	findUserByAadhaar,
	updateUser,
	incrementUserRewardPoints,
	createComplaint,
	findComplaintById,
	updateComplaint,
	deleteComplaint,
	listComplaints,
	listUsers,
	addComplaintVote,
	getAnalytics,
	getComplaintsForUser,
	getLeaderboard,
	toPublicUser,
	toPublicComplaint,
};