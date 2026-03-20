'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from 'A/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, getMonthName, getCurrentYear } from '@/lib/utils';
import DataTable from 'A/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { SALE_METHODS, type Sale, type Farm } from 'A/types/database';
import { Plus, Filter, TrendingUp } from 'lucide-react';

