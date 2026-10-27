const SimpleDrinkCardSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="w-full h-full overflow-hidden rounded-lg border-hairline border-border bg-surface shadow-md"
    >
      <div className="w-full aspect-[4/3] animate-pulse bg-surface-sunken" />
      <div className="px-4 py-3">
        <div className="h-5 sm:h-6 w-2/3 animate-pulse rounded-full bg-surface-sunken" />
      </div>
    </div>
  );
};

export default SimpleDrinkCardSkeleton;
