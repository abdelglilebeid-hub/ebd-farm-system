'use client';

import React, { useState } from 'react';
import Button from 'A/components/core/Button';

const VouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-sand-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-600` mb-6">vouchers</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
  
                        </div>
      </div>
    </div>
  );
};

export default VouchersPage;