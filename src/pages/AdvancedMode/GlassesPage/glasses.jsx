import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  PageHeader,
  EmptyState,
  ListCard,
  ActionButtons,
} from '@/components/AdvancedMode';
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
      <PageHeader
        title="Glasses"
        action={
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Glass
          </Button>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {glasses.length === 0 ? (
          <EmptyState
            title="No Glasses Found"
            description="Get started by adding your first glass to begin managing your collection"
            actions={
              <Button size="lg" onClick={handleAdd}>
                <PlusCircle className="mr-2" />
                Add First Glass
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {glasses.map((glass) => (
              <div key={glass.id} className="px-2 sm:px-4 py-1.5 sm:py-2">
                <ListCard
                  title={glass.name}
                  description={glass.description}
                  badges={
                    glass.sizeInMl && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                      >
                        {glass.sizeInMl}ml
                      </Badge>
                    )
                  }
                  metadata={
                    <>
                      {glass.type && (
                        <Badge
                          variant="outline"
                          className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                        >
                          {glass.type}
                        </Badge>
                      )}
                      {glass.sizeInMl && (
                        <span className="text-xs text-muted-foreground">
                          Capacity: {glass.sizeInMl}ml
                        </span>
                      )}
                    </>
                  }
                  actions={
                    <ActionButtons
                      actions={[
                        {
                          icon: <Edit className="h-4 w-4" />,
                          label: 'Edit glass',
                          onClick: (e) => {
                            e.stopPropagation();
                            handleEdit(glass);
                          },
                        },
                        {
                          icon: <Trash2 className="h-4 w-4 text-destructive" />,
                          label: 'Delete glass',
                          onClick: (e) => {
                            e.stopPropagation();
                            handleDelete(glass.id);
                          },
                        },
                      ]}
                    />
                  }
                />
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
