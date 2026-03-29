'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatNumber } from '@/lib/utils';
import { Palmtree, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

interface SectorData {
  name: string;
  area: number;
  totalBarhi: number;
  totalMale: number;
  farms: {
    id: string;
    name: string;
    area_feddan: number;
    planting_date: string;
    hawshat: {
      id: string;
      name: string;
      palm_count_barhi: number;
      palm_count_male: number;
      spacing: string;
      planting_date: string;
    }[];
  }[];
}

export default function PalmsPage() {
  const { permissions } = useAuth();
  const supabase = createClient();
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [expandedSectors, setExpandedSectors] = useState<string[]>([]);
  const [totals, setTotals] = useState({ barhi: 0, male: 0, total: 0 });

  const fetchData = useCallback(async () => {
    const { data: sectorData } = await supabase.from('sectors').select('*');
    const { data: farmData } = await supabase.from('farms').select('*, hawshat(*)');

    if (!sectorData || !farmData) return;

    const mapped: SectorData[] = sectorData.map(s => {
      const sectorFarms = farmData.filter(f => f.sector_id === s.id);
      const totalBarhi = sectorFarms.reduce((sum, f) =>
        sum + (f.hawshat?.reduce((hs: number, h: any) => hs + (h.palm_count_barhi || 0), 0) || 0), 0);
      const totalMale = sectorFarms.reduce((sum, f) =>
        sum + (f.hawshat?.reduce((hs: number, h: any) => hs + (h.palm_count_male || 0), 0) || 0), 0);

      return {
        name: s.name,
        area: s.area_feddan || 0,
        totalBarhi,
        totalMale,
        farms: sectorFarms.map(f => ({
          id: f.id,
          name: f.name,
          area_feddan: f.area_feddan || 0,
          planting_date: f.planting_date || '',
          hawshat: f.hawshat || [],
        })),
      };
    });

    setSectors(mapped);
    setTotals({
      barhi: mapped.reduce((s, sec) => s + sec.totalBarhi, 0),
      male: mapped.reduce((s, sec) => s + sec.totalMale, 0),
      total: mapped.reduce((s, sec) => s + sec.totalBarhi + sec.totalMale, 0),
    });
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSector = (name: string) => {
    setExpandedSectors(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">سجل النخيل</h1>
        <p className="text-gray-500 mt-1">عزبة النخيل - نخيل برحي</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <Palmtree className="w-8 h-8 text-green-700 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-800">{formatNumber(totals.barhi)}</p>
          <p className="text-sm text-green-600">نخلة برحي</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
          <Palmtree className="w-8 h-8 text-blue-700 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-800">{formatNumber(totals.male)}</p>
          <p className="text-sm text-blue-600">نخلة ذكر</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 text-center">
          <MapPin className="w-8 h-8 text-purple-700 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-800">{sectors.length}</p>
          <p className="text-sm text-purple-600">قطاعات</p>
        </div>
      </div>

      {/* Sectors */}
      <div className="space-y-4">
        {sectors.map(sector => (
          <div key={sector.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSector(sector.name)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Palmtree className="w-6 h-6 text-primary-700" />
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-gray-800">{sector.name}</h3>
                  <p className="text-sm text-gray-500">{sector.area} فدان | {sector.farms.length} مزرعة</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-left">
                  <span className="text-lg font-bold text-primary-700">{formatNumber(sector.totalBarhi)}</span>
                  <span className="text-xs text-gray-400 mr-1">برحي</span>
                </div>
                <div className="text-left">
                  <span className="text-lg font-bold text-blue-600">{formatNumber(sector.totalMale)}</span>
                  <span className="text-xs text-gray-400 mr-1">ذكر</span>
                </div>
                {expandedSectors.includes(sector.name) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {expandedSectors.includes(sector.name) && (
              <div className="border-t border-gray-100 p-5">
                {sector.farms.map(farm => (
                  <div key={farm.id} className="mb-4 last:mb-0">
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      {farm.name} ({farm.area_feddan} فدان)
                    </h4>
                    {farm.hawshat.length > 0 ? (
                      <div className="table-container mr-6">
                        <table>
                          <thead>
                            <tr>
                              <th>الحوشة</th>
                              <th>نخيل برحي</th>
                              <th>نخيل ذكور</th>
                              <th>المسافات</th>
                              <th>تاريخ الزراعة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {farm.hawshat.map(h => (
                              <tr key={h.id}>
                                <td className="font-medium">{h.name}</td>
                                <td>{h.palm_count_barhi}</td>
                                <td>{h.palm_count_male || '-'}</td>
                                <td>{h.spacing || '-'}</td>
                                <td className="text-sm text-gray-500">
                                  {h.planting_date ? new Date(h.planting_date).toLocaleDateString('ar-EG') : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mr-6">لا توجد بيانات حوشات</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {sectors.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Palmtree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">لم يتم تحميل بيانات النخيل بعد</p>
            <p className="text-sm text-gray-400 mt-1">قم بتشغيل سكريبت ترحيل البيانات أولاً</p>
          </div>
        )}
      </div>
    </div>
  );
}
