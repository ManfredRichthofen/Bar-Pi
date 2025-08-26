import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import UserService from "../services/user.service";

const UserPage = () => {
	const navigate = useNavigate();
	const [users, setUsers] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		role: "USER",
	});
	const [error, setError] = useState("");

	useEffect(() => {
		loadUsers();
	}, []);

	const loadUsers = async () => {
		try {
			const data = await UserService.getAllUsers();
			setUsers(data);
		} catch (err) {
			setError("Failed to load users");
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		try {
			const token = localStorage.getItem("token");
			await UserService.createUser(formData, token);
			await loadUsers();
			setFormData({
				username: "",
				password: "",
				role: "USER",
			});
			setIsModalOpen(false);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to create user");
		}
	};

	return (
		<div className="p-4 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-8">User Management</h1>

			<div className="space-y-6">
				{/* Users List Card */}
				<div className="card bg-base-200 shadow-xl">
					<div className="card-body p-6">
						<div className="flex justify-between items-center mb-4">
							<h2 className="card-title">Existing Users</h2>
							<button
								onClick={() => setIsModalOpen(true)}
								className="btn btn-primary btn-sm"
							>
								Create New User
							</button>
						</div>

						<div className="overflow-x-auto -mx-4">
							<table className="table table-zebra w-full">
								<thead>
									<tr>
										<th className="px-4">Username</th>
										<th className="px-4">Role</th>
										<th className="px-4">Actions</th>
									</tr>
								</thead>
								<tbody>
									{users.map((user) => (
										<tr key={user.id}>
											<td className="px-4">{user.username}</td>
											<td className="px-4">{user.role}</td>
											<td className="px-4">
												<button className="btn btn-ghost btn-xs">Edit</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			{/* Create User Modal */}
			<dialog
				id="create_user_modal"
				className={`modal ${isModalOpen ? "modal-open" : ""}`}
			>
				<div className="modal-box w-11/12 max-w-xl p-6">
					<form method="dialog">
						<button
							className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
							onClick={() => setIsModalOpen(false)}
						>
							✕
						</button>
					</form>

					<h3 className="font-bold text-lg mb-6">Create New User</h3>

					{error && (
						<div className="alert alert-error mb-6">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="stroke-current shrink-0 h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Username</span>
							</label>
							<input
								type="text"
								name="username"
								value={formData.username}
								onChange={handleChange}
								className="input input-bordered"
								required
							/>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Password</span>
							</label>
							<input
								type="password"
								name="password"
								value={formData.password}
								onChange={handleChange}
								className="input input-bordered"
								required
							/>
						</div>

						<div className="form-control">
							<label className="label">
								<span className="label-text font-medium">Role</span>
							</label>
							<select
								name="role"
								value={formData.role}
								onChange={handleChange}
								className="select select-bordered"
								required
							>
								<option value="USER">User</option>
								<option value="ADMIN">Admin</option>
							</select>
						</div>

						<div className="modal-action">
							<button type="submit" className="btn btn-primary">
								Create User
							</button>
							<button
								type="button"
								className="btn"
								onClick={() => setIsModalOpen(false)}
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button onClick={() => setIsModalOpen(false)}>close</button>
				</form>
			</dialog>
		</div>
	);
};

export default UserPage;
