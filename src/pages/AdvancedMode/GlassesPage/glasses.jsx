import { AlertCircle, Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import GlassService from '@/services/glass.service';
import useAuthStore from '@/store/authStore';
import GlassModal from './components/GlassModal';

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
      toast.error('Failed to load glasses');
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
        toast.success('Glass deleted successfully');
        loadGlasses();
      } catch (error) {
        toast.error('Failed to delete glass');
      }
    }
  };

  const handleSave = async (glass) => {
    try {
      if (glass.id) {
        await GlassService.updateGlass(glass);
        toast.success('Glass updated successfully');
      } else {
        await GlassService.createGlass(glass);
        toast.success('Glass created successfully');
      }
      setShowModal(false);
      loadGlasses();
    } catch (error) {
      toast.error('Failed to save glass');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-16 z-40 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Glasses</h1>
            <Button onClick={handleAdd}>
              <PlusCircle />
              Add Glass
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {glasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Glasses Found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Get started by adding your first glass to begin managing your
              collection
            </p>
            <Button size="lg" onClick={handleAdd}>
              <PlusCircle className="mr-2" />
              Add First Glass
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {glasses.map((glass) => (
              <div
                key={glass.id}
                className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-all duration-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-base truncate">
                      {glass.name}
                    </h3>
                    {glass.sizeInMl && (
                      <Badge variant="secondary" className="text-xs">
                        {glass.sizeInMl}ml
                      </Badge>
                    )}
                  </div>
                  {glass.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {glass.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {glass.type && (
                      <Badge variant="outline" className="text-xs">
                        {glass.type}
                      </Badge>
                    )}
                    {glass.sizeInMl && (
                      <span className="text-xs text-muted-foreground">
                        Capacity: {glass.sizeInMl}ml
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(glass)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(glass.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
