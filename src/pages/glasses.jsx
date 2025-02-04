import React, { useState, useEffect } from 'react';
import GlassService from '../services/glass.service';
import GlassModal from '../components/GlassModal';
import useAuthStore from '../store/authStore';

function Glasses() {
  const [glasses, setGlasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGlass, setSelectedGlass] = useState(null);
  const { token } = useAuthStore();

  useEffect(() => {
    loadGlasses();
  }, []);

  const loadGlasses = async () => {
    try {
      const data = await GlassService.getGlasses(token);
      setGlasses(data);
    } catch (error) {
      window.toast.error('Failed to load glasses');
    }
  };

  const handleAdd = () => {
    setSelectedGlass(null);
    setShowModal(true);
  };

  const handleEdit = (glass) => {
    setSelectedGlass(glass);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this glass?')) {
      try {
        await GlassService.deleteGlass(id);
        window.toast.success('Glass deleted successfully');
        loadGlasses();
      } catch (error) {
        window.toast.error('Failed to delete glass');
      }
    }
  };

  const handleSave = async (glass) => {
    try {
      if (glass.id) {
        await GlassService.updateGlass(glass);
        window.toast.success('Glass updated successfully');
      } else {
        await GlassService.createGlass(glass);
        window.toast.success('Glass created successfully');
      }
      setShowModal(false);
      loadGlasses();
    } catch (error) {
      window.toast.error('Failed to save glass');
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Glasses</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          Add Glass
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {glasses.map((glass) => (
              <tr key={glass.id}>
                <td>{glass.name}</td>
                <td>{glass.description}</td>
                <td className="flex gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEdit(glass)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-error btn-outline"
                    onClick={() => handleDelete(glass.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GlassModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSave={handleSave}
        glass={selectedGlass}
      />
    </div>
  );
}

export default Glasses;
