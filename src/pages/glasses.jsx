import React, { useState, useEffect } from 'react';
import GlassService from '../services/glass.service';
import GlassModal from '../components/glasses/GlassModal';
import useAuthStore from '../store/authStore';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Glasses</h2>
        <button className="btn btn-primary" onClick={handleAdd}>
          <PlusCircle size={16} className="mr-2" />
          Add Glass
        </button>
      </div>

      <div className="tabs tabs-boxed mb-4">
        <button className="tab tab-active">All Glasses</button>
      </div>

      <div className="card bg-base-100 shadow-xl overflow-x-auto">
        <table className="table w-full">
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
                <td>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleEdit(glass)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm text-error"
                      onClick={() => handleDelete(glass.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
