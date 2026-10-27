import { Edit, PlusCircle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from '@/components/ui/toast';
import {
  ActionButtons,
  EmptyState,
  ListCard,
  LoadingState,
  PageHeader,
} from '@/components/AdvancedMode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGlassesList, useGlassMutations } from '@/hooks/useGlassesList';
import GlassModal from './components/GlassModal';

function Glasses() {
  const [showModal, setShowModal] = useState(false);
  const [selectedGlass, setSelectedGlass] = useState(null);
  const { data: glasses = [], isLoading, isPending } = useGlassesList();
  const { saveGlass, deleteGlass } = useGlassMutations();
  const loading = isLoading || isPending;

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
        await deleteGlass.mutateAsync(id);
        toast.success('Glass deleted successfully');
      } catch (error) {
        toast.error('Failed to delete glass');
      }
    }
  };

  const handleSave = async (glass) => {
    try {
      await saveGlass.mutateAsync(glass);
      toast.success(
        glass.id ? 'Glass updated successfully' : 'Glass created successfully',
      );
      setShowModal(false);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save glass';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Glasses"
        action={
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 size-6" />
            Add Glass
          </Button>
        }
      />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {loading ? (
          <LoadingState message="Loading glasses..." />
        ) : glasses.length === 0 ? (
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
                      <Badge variant="secondary" className="text-sm">
                        {glass.sizeInMl}ml
                      </Badge>
                    )
                  }
                  metadata={
                    <>
                      {glass.type && (
                        <Badge variant="outline" className="text-sm">
                          {glass.type}
                        </Badge>
                      )}
                      {glass.sizeInMl && (
                        <span className="text-sm text-foreground-muted">
                          Capacity: {glass.sizeInMl}ml
                        </span>
                      )}
                    </>
                  }
                  actions={
                    <ActionButtons
                      actions={[
                        {
                          icon: <Edit className="size-6" />,
                          label: 'Edit glass',
                          onClick: (e) => {
                            e.stopPropagation();
                            handleEdit(glass);
                          },
                        },
                        {
                          icon: <Trash2 className="size-6 text-danger" />,
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
