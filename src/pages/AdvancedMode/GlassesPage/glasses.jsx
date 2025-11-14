import React, { useState, useEffect } from 'react';
import GlassService from '@/services/glass.service';
import GlassModal from './components/GlassModal';
import useAuthStore from '@/store/authStore';
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
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-md border-b border-base-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Glasses</h1>
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>
              <PlusCircle size={16} className="mr-2" />
              Add Glass
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto">
          {glasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-base-content/40 mb-4">
                <svg
                  className="w-16 h-16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-labelledby="no-glasses-title"
                >
                  <title id="no-glasses-title">No glasses icon</title>
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No glasses found</h3>
              <p className="text-base-content/60 text-center text-sm mb-4">
                Get started by adding your first glass
              </p>
              <button className="btn btn-primary" onClick={handleAdd}>
                <PlusCircle size={16} className="mr-2" />
                Add Glass
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
              {glasses.map((glass) => (
                <div
                  key={glass.id}
                  className="card bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-base-200"
                >
                  <div className="card-body p-4">
                    <h3 className="card-title text-base font-bold text-base-content/90 line-clamp-1">
                      {glass.name}
                    </h3>
                    <p className="text-sm text-base-content/70 line-clamp-2 flex-1">
                      {glass.description || 'No description'}
                    </p>
                    <div className="card-actions justify-end mt-4 pt-4 border-t border-base-200">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
