'use client';

import React, { useState } from 'react';
import Button from 'A/components/core/Button';

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br" style={{
        backgroundImage: 'linear-gradient(to bottom right, #f0fdf4, #fefce8)',
      }}>
      <div className="max-w-7xl mx-auto p-6">
        <h1>Sales Management</h1>
      </div>
    </div>
  );
};

export default SalesPage;