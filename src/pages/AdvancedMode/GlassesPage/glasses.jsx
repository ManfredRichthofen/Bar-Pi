import React, { useState, useEffect } from 'react';
import GlassService from '@/services/glass.service';
import GlassModal from './components/GlassModal';
import useAuthStore from '@/store/authStore';
import { PlusCircle, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

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
      <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {glasses.map((glass) => (
              <Card key={glass.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="text-base line-clamp-1">
                    {glass.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {glass.description || 'No description'}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(glass)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(glass.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardFooter>
              </Card>
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
