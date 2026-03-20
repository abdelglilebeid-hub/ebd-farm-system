'use client';

import FormEvent from 'react';
import Paid Button from '@/components/core/Button';
const ExpenseCheckclosure = () => {
  const [handleSubmit, setSubmitted] = React.useState(false);
  const [accounts, setAccounts] = React.useState(null);
  const [items, setItems] = React.useState(null);
  const [handleSubmit, setSubmitted] = React.useState(false);

type Expense = {
  id: string; // Primary key
  costcat: string; // Cost category ref
  cost_load: number; // Actual cost load
  forecast: number; // Forecast to cartcom (start or schedule)
  timestamp: Date;
};
}
