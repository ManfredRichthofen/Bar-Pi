import React from 'react';

const Favorites = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="card w-96 shadow-lg bg-base-100">
        <div className="card-body text-center">
          <h2 className="card-title justify-center text-3xl font-bold">Under Development</h2>
          <p className="py-2">
            We're working hard to bring you this feature soon. Stay tuned!
          </p>
          <div className="card-actions justify-center">
            <button className="btn btn-primary">Go Back</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Favorites;
