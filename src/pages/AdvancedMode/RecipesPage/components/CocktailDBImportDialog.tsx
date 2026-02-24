import { Search, Loader2, Download, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import cocktailDBService from '@/services/cocktaildb.service';

interface ConvertedRecipe {
  name: string;
  description: string;
  category: string;
  alcoholic: boolean;
  glass: string;
  imageUrl: string;
  ingredients: Array<{ name: string; measure: string }>;
  instructions: string;
  tags: string[];
  cocktailDbId: string;
  dateModified: string;
  imageFile?: File;
}

interface CocktailDBImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (cocktailData: ConvertedRecipe) => void;
}

export function CocktailDBImportDialog({
  open,
  onOpenChange,
  onImport,
}: CocktailDBImportDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedCocktail, setSelectedCocktail] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setSearching(true);
      const cocktails = await cocktailDBService.searchCocktails(searchTerm);
      setResults(cocktails);
      
      if (cocktails.length === 0) {
        toast.info('No cocktails found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search cocktails');
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (cocktail: any) => {
    try {
      const convertedRecipe = cocktailDBService.convertToRecipeFormat(cocktail) as ConvertedRecipe;
      
      // Download the image if available
      let imageFile: File | undefined = undefined;
      if (convertedRecipe?.imageUrl) {
        try {
          const imageBlob = await cocktailDBService.downloadImage(
            convertedRecipe.imageUrl,
          );
          imageFile = new File([imageBlob], 'cocktail.jpg', {
            type: 'image/jpeg',
          });
        } catch (error) {
          console.error('Failed to download image:', error);
          toast.warning('Failed to download image, but recipe will be imported');
        }
      }

      onImport({ ...convertedRecipe, imageFile });
      onOpenChange(false);
      toast.success(`Imported "${convertedRecipe?.name}" from CocktailDB`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import cocktail');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectCocktail = (cocktail: any) => {
    setSelectedCocktail(cocktail);
    setShowDetail(true);
  };

  const handleBackToResults = () => {
    setShowDetail(false);
    setSelectedCocktail(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[80vh] w-[95vw] sm:w-full">
        <DialogHeader className="px-4 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl">Import from CocktailDB</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Search for cocktails from TheCocktailDB and import them with
            ingredients, instructions, and images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Search cocktails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
            />
            <Button onClick={handleSearch} disabled={searching} className="h-10 w-10 sm:h-11 sm:w-11 p-0">
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Results or Detail View */}
          <ScrollArea className="h-[450px] sm:h-[500px] rounded-md border p-3 sm:p-4">
            {showDetail && selectedCocktail ? (
              <div className="space-y-3 sm:space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToResults}
                  className="mb-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Results
                </Button>

                {selectedCocktail.strDrinkThumb && (
                  <img
                    src={selectedCocktail.strDrinkThumb}
                    alt={selectedCocktail.strDrink}
                    className="w-full rounded-lg"
                  />
                )}

                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">{selectedCocktail.strDrink}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {selectedCocktail.strCategory} • {selectedCocktail.strAlcoholic}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Ingredients:</h4>
                  <ul className="list-disc list-inside space-y-0.5 sm:space-y-1">
                    {Array.from({ length: 15 }).map((_, i) => {
                      const ingredient = selectedCocktail[`strIngredient${i + 1}`];
                      const measure = selectedCocktail[`strMeasure${i + 1}`];
                      if (ingredient) {
                        return (
                          <li key={i} className="text-xs sm:text-sm">
                            {measure} {ingredient}
                          </li>
                        );
                      }
                      return null;
                    })}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Instructions:</h4>
                  <p className="text-xs sm:text-sm">{selectedCocktail.strInstructions}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Glass:</h4>
                  <p className="text-xs sm:text-sm">{selectedCocktail.strGlass}</p>
                </div>

                <Button
                  className="w-full h-11 sm:h-10"
                  onClick={() => {
                    handleImport(selectedCocktail);
                    handleBackToResults();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import This Cocktail
                </Button>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Search className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-50" />
                <p className="text-base sm:text-lg font-medium">No results yet</p>
                <p className="text-xs sm:text-sm">
                  Search for a cocktail to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {results.map((cocktail) => (
                  <div
                    key={cocktail.idDrink}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleSelectCocktail(cocktail)}
                  >
                    <div className="relative aspect-video bg-muted">
                      {cocktail.strDrinkThumb && (
                        <img
                          src={cocktail.strDrinkThumb}
                          alt={cocktail.strDrink}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-base sm:text-lg mb-1">
                        {cocktail.strDrink}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {cocktail.strCategory} • {cocktail.strAlcoholic}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {cocktail.strInstructions}
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 sm:mt-3 w-full h-9 sm:h-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImport(cocktail);
                        }}
                      >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
