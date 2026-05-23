const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
	const token = localStorage.getItem('citifix_token');
	const headers = {
		'Content-Type': 'application/json',
		...(options.headers || {}),
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers,
	});

	const contentType = response.headers.get('content-type') || '';
	const payload = contentType.includes('application/json')
		? await response.json()
		: await response.text();

	if (!response.ok) {
		const message = typeof payload === 'string' ? payload : payload?.error || 'Request failed';
		throw new Error(message);
	}

	return payload;
}

export function normalizeUser(user, token) {
	if (!user) {
		return null;
	}

	return {
		...user,
		role: String(user.role || 'citizen').toLowerCase(),
		...(token ? { token } : {}),
	};
}

export function normalizeComplaint(complaint) {
	return {
		...complaint,
		location: complaint.location || {
			latitude: complaint.latitude,
			longitude: complaint.longitude,
		},
		votes: complaint.votes ?? 0,
		votedBy: complaint.votedBy || [],
		assignedDepartment: complaint.assignedDepartment || '',
		address: complaint.address || '',
		userName: complaint.user?.name || complaint.userName || '',
	};
}

export async function loginUser(credentials) {
	const data = await request('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify(credentials),
	});

	return {
		token: data.token,
		user: normalizeUser(data.user, data.token),
	};
}

export async function registerUser(payload) {
	const data = await request('/api/auth/register', {
		method: 'POST',
		body: JSON.stringify(payload),
	});

	return {
		token: data.token,
		user: normalizeUser(data.user, data.token),
	};
}

export async function fetchComplaints() {
	const data = await request('/api/complaints');
	return Array.isArray(data) ? data.map(normalizeComplaint) : [];
}

export async function fetchMyComplaints() {
	const data = await request('/api/complaints/user/my-complaints');
	return Array.isArray(data) ? data.map(normalizeComplaint) : [];
}

export async function createComplaint(payload) {
	const data = await request('/api/complaints', {
		method: 'POST',
		body: JSON.stringify(payload),
	});

	return normalizeComplaint(data);
}

export async function voteComplaint(complaintId) {
	const data = await request(`/api/complaints/${complaintId}/vote`, {
		method: 'POST',
	});

	return normalizeComplaint(data);
}

export async function updateComplaint(complaintId, payload) {
	const data = await request(`/api/admin/complaints/${complaintId}/status`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	});

	return normalizeComplaint(data);
}

export async function fetchLeaderboard() {
	const data = await request('/api/leaderboard');
	return Array.isArray(data) ? data : [];
}

export async function fetchAdminAnalytics() {
	return request('/api/admin/analytics');
}

export async function fetchAdminComplaints(query = '') {
	const data = await request(`/api/admin/complaints${query}`);
	return data;
}

export async function fetchAdminUsers() {
	const data = await request('/api/admin/users');
	return Array.isArray(data) ? data : [];
}
