import React, { useState, useEffect } from "react";

function GlassModal({ show, onHide, onSave, glass }) {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
	});

	useEffect(() => {
		if (glass) {
			setFormData({
				id: glass.id,
				name: glass.name,
				description: glass.description,
			});
		} else {
			setFormData({
				name: "",
				description: "",
			});
		}
	}, [glass]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onSave(formData);
	};

	if (!show) return null;

	return (
		<dialog open className="modal modal-open">
			<div className="modal-box">
				<form onSubmit={handleSubmit}>
					<h3 className="font-bold text-lg">
						{glass ? "Edit Glass" : "Add Glass"}
					</h3>

					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">Name</span>
						</label>
						<input
							type="text"
							name="name"
							value={formData.name}
							onChange={handleChange}
							className="input input-bordered w-full"
							required
						/>
					</div>

					<div className="form-control w-full">
						<label className="label">
							<span className="label-text">Description</span>
						</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleChange}
							className="textarea textarea-bordered h-24"
							rows={3}
						/>
					</div>

					<div className="modal-action">
						<button type="button" className="btn" onClick={onHide}>
							Cancel
						</button>
						<button type="submit" className="btn btn-primary">
							Save
						</button>
					</div>
				</form>
			</div>
			<form method="dialog" className="modal-backdrop">
				<button onClick={onHide}>close</button>
			</form>
		</dialog>
	);
}

export default GlassModal;
