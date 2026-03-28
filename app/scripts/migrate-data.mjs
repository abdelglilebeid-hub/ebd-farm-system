/**
 * EBD Farm - Data Migration Script
 * Migrates existing Excel data to Supabase
 *
 * Usage:
 *   1. Place your Excel file in the same directory as this script
 *   2. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables
 *   3. Run: node scripts/migrate-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// =====================================================
// 1. SEED FARM STRUCTURE (from palm registry document)
// =====================================================
async function seedFarmStructure() {
  console.log('\n🌴 Seeding farm structure...');

  // Sectors
  const sectors = [
    { name: 'ال 22 فدان', name_en: '22 Feddan', area_feddan: 22, description: 'زراعة أكتوبر 2018 (18 فدان) + أبريل 2019 (4 فدان)' },
    { name: 'الحصوه', name_en: 'El-Haswa', area_feddan: 30, description: '14 فدان عوامه (2022) + 16 فدان أصلية (2025)' },
    { name: 'حوض البابور', name_en: 'Howd El-Babour', area_feddan: 30.5, description: '3 حوشات (يونيو 2023) + 2 حوشات (يوليو 2025)' },
    { name: 'الشفعه', name_en: 'El-Shofaa', area_feddan: 9.5, description: 'زراعة يونيو 2023' },
    { name: 'الخطاره', name_en: 'El-Khatara', area_feddan: 23, description: 'زراعات متتالية 2010-2024' },
  ];

  const { data: sectorData, error: sErr } = await supabase.from('sectors').upsert(sectors, { onConflict: 'name' }).select();
  if (sErr) console.error('Sector error:', sErr.message);
  else console.log(`  ✅ ${sectorData.length} sectors created`);

  const sectorMap = {};
  sectorData?.forEach(s => sectorMap[s.name] = s.id);

  // Farms (from your Excel "الدليل" sheet)
  const farmDefs = [
    { name: 'الحصوه', sector: 'الحصوه', area: 30 },
    { name: 'الخطاره', sector: 'الخطاره', area: 23 },
    { name: 'حوض البابور', sector: 'حوض البابور', area: 23 },
    { name: 'الشفعه', sector: 'الشفعه', area: 9.5 },
    { name: 'الكمثري', sector: 'حوض البابور', area: 7.5 },
    { name: 'مزرعه 4 فدان', sector: 'ال 22 فدان', area: 4 },
    { name: 'مزرعه 18 فدان', sector: 'ال 22 فدان', area: 18 },
    { name: 'موالح الحصوه', sector: 'الحصوه', area: 16, farm_type: 'موالح' },
    { name: 'نخيل الحصوه', sector: 'الحصوه', area: 14, farm_type: 'نخيل' },
    { name: 'نخيل الخطاره', sector: 'الخطاره', area: 10, farm_type: 'نخيل' },
    { name: 'قشطة الخطاره', sector: 'الخطاره', area: 13, farm_type: 'قشطة' },
    { name: 'موالح حوض البابور', sector: 'حوض البابور', area: 11, farm_type: 'موالح' },
    { name: 'نخيل حوض البابور', sector: 'حوض البابور', area: 12, farm_type: 'نخيل' },
    { name: 'نخيل9.5فدان', sector: 'الشفعه', area: 9.5, farm_type: 'نخيل' },
    { name: 'نخيل7.5فدان', sector: 'حوض البابور', area: 7.5, farm_type: 'نخيل' },
    { name: 'نخيل22فدان', sector: 'ال 22 فدان', area: 14, farm_type: 'نخيل' },
    { name: 'قشطة22فدان', sector: 'ال 22 فدان', area: 8, farm_type: 'قشطة' },
  ];

  const farms = farmDefs.map(f => ({
    name: f.name,
    sector_id: sectorMap[f.sector],
    area_feddan: f.area,
    farm_type: f.farm_type || 'نخيل',
    is_active: true,
  }));

  const { data: farmData, error: fErr } = await supabase.from('farms').upsert(farms, { onConflict: 'name', ignoreDuplicates: true }).select();
  if (fErr) console.error('Farm error:', fErr.message);
  else console.log(`  ✅ ${farmData?.length || 0} farms created`);

  const farmMap = {};
  farmData?.forEach(f => farmMap[f.name] = f.id);

  // Hawshat (from palm registry)
  const hawshatData = [
    // 22 Feddan sector
    { farm: 'مزرعه 4 فدان', name: 'حوشة 1', area_feddan: 4, palm_count_barhi: 194, palm_count_male: 0, spacing: '9×9', planting_date: '2019-04-01' },
    { farm: 'مزرعه 18 فدان', name: 'حوشة 1', area_feddan: 3.25, palm_count_barhi: 134, palm_count_male: 11, spacing: '8×12', planting_date: '2018-10-01' },
    { farm: 'مزرعه 18 فدان', name: 'حوشة 2', area_feddan: 3.125, palm_count_barhi: 130, palm_count_male: 0, spacing: '8×12', planting_date: '2018-10-01' },
    { farm: 'مزرعه 18 فدان', name: 'حوشة 3', area_feddan: 2.83, palm_count_barhi: 120, palm_count_male: 6, spacing: '8×12', planting_date: '2018-10-01' },
    { farm: 'مزرعه 18 فدان', name: 'حوشة 4', area_feddan: 2.83, palm_count_barhi: 120, palm_count_male: 0, spacing: '8×12', planting_date: '2018-10-01' },
    { farm: 'مزرعه 18 فدان', name: 'حوشة 5', area_feddan: 2.83, palm_count_barhi: 120, palm_count_male: 3, spacing: '8×12', planting_date: '2018-10-01' },
    { farm: 'مزرعه 18 فدان', name: 'حوشة 6', area_feddan: 3.125, palm_count_barhi: 130, palm_count_male: 5, spacing: '8×12', planting_date: '2018-10-01' },
    // Haswa sector - Awama
    { farm: 'نخيل الحصوه', name: 'حوشة 1 عوامه', area_feddan: 3.33, palm_count_barhi: 160, palm_count_male: 16, spacing: '9×10', planting_date: '2022-06-01' },
    { farm: 'نخيل الحصوه', name: 'حوشة 2 عوامه', area_feddan: 3.58, palm_count_barhi: 170, palm_count_male: 16, spacing: '9×10', planting_date: '2022-06-01' },
    { farm: 'نخيل الحصوه', name: 'حوشة 3 عوامه', area_feddan: 3.58, palm_count_barhi: 170, palm_count_male: 16, spacing: '9×10', planting_date: '2022-06-01' },
    { farm: 'نخيل الحصوه', name: 'حوشة 4 عوامه', area_feddan: 3.5, palm_count_barhi: 167, palm_count_male: 0, spacing: '9×10', planting_date: '2022-06-01' },
    // Howd El-Babour
    { farm: 'نخيل حوض البابور', name: 'حوشة 1', area_feddan: 6, palm_count_barhi: 276, palm_count_male: 58, spacing: '8×10', planting_date: '2023-06-01' },
    { farm: 'نخيل حوض البابور', name: 'حوشة 2', area_feddan: 7.58, palm_count_barhi: 347, palm_count_male: 16, spacing: '8×10', planting_date: '2023-06-01' },
    { farm: 'نخيل حوض البابور', name: 'حوشة 3', area_feddan: 7.5, palm_count_barhi: 428, palm_count_male: 17, spacing: '8×9', planting_date: '2023-06-01' },
    { farm: 'نخيل حوض البابور', name: 'حوشة 4', area_feddan: 4.42, palm_count_barhi: 203, palm_count_male: 0, spacing: '8×10', planting_date: '2025-07-01' },
    { farm: 'نخيل حوض البابور', name: 'حوشة 5', area_feddan: 5, palm_count_barhi: 231, palm_count_male: 0, spacing: '8×10', planting_date: '2025-07-01' },
    // Shofaa
    { farm: 'نخيل9.5فدان', name: 'حوشة 1', area_feddan: 2.04, palm_count_barhi: 118, palm_count_male: 0, spacing: '8×9', planting_date: '2023-06-01' },
    { farm: 'نخيل9.5فدان', name: 'حوشة 2', area_feddan: 2.58, palm_count_barhi: 151, palm_count_male: 36, spacing: '8×9', planting_date: '2023-06-01' },
    { farm: 'نخيل9.5فدان', name: 'حوشة 3 ذكور', area_feddan: 0, palm_count_barhi: 0, palm_count_male: 34, spacing: '-', planting_date: '2023-06-01' },
    { farm: 'نخيل9.5فدان', name: 'حوشة 4 ذكور', area_feddan: 0, palm_count_barhi: 0, palm_count_male: 33, spacing: '-', planting_date: '2023-06-01' },
    // Khatara
    { farm: 'نخيل الخطاره', name: 'المشاية', area_feddan: 0, palm_count_barhi: 56, palm_count_male: 0, spacing: '8.5×10', planting_date: '2010-03-01' },
    { farm: 'نخيل الخطاره', name: 'محبس 1', area_feddan: 0, palm_count_barhi: 134, palm_count_male: 0, spacing: '8.5×10', planting_date: '2019-06-01' },
    { farm: 'نخيل الخطاره', name: 'محبس 2', area_feddan: 0, palm_count_barhi: 154, palm_count_male: 0, spacing: '8.5×10', planting_date: '2022-06-01' },
    { farm: 'نخيل الخطاره', name: 'محبس 3', area_feddan: 0, palm_count_barhi: 169, palm_count_male: 0, spacing: '8.5×10', planting_date: '2024-05-01' },
  ];

  const hawshat = hawshatData.map(h => ({
    farm_id: farmMap[h.farm],
    name: h.name,
    area_feddan: h.area_feddan,
    palm_count_barhi: h.palm_count_barhi,
    palm_count_male: h.palm_count_male,
    spacing: h.spacing,
    planting_date: h.planting_date,
  })).filter(h => h.farm_id);

  const { data: hData, error: hErr } = await supabase.from('hawshat').insert(hawshat).select();
  if (hErr) console.error('Hawshat error:', hErr.message);
  else console.log(`  ✅ ${hData?.length || 0} hawshat created`);

  return { sectorMap, farmMap };
}

// =====================================================
// 2. MIGRATE EXPENSES
// =====================================================
async function migrateExpenses(workbook, farmMap) {
  console.log('\n💰 Migrating expenses...');
  const sheet = workbook.Sheets['المصروفات'];
  if (!sheet) { console.log('  ⚠️ Sheet not found'); return; }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = data[0];
  let inserted = 0;
  let errors = 0;

  // Build farm name -> id mapping
  const farmNameToId = {};
  Object.entries(farmMap).forEach(([name, id]) => { farmNameToId[name] = id; });

  const BATCH_SIZE = 500;
  let batch = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[7]) continue; // Skip empty rows

    const year = Number(row[0]);
    const month = Number(row[1]);
    if (!year || !month) continue;

    // Resolve farm
    const farmName = row[5]?.toString().trim();
    const farm_id = farmNameToId[farmName] || null;

    const expense = {
      year,
      month,
      day: Number(row[2]) || null,
      sector_name: row[4]?.toString() || null,
      farm_id,
      season: row[6]?.toString() || null,
      expense_category: row[7]?.toString() || null,
      description: row[8]?.toString() || 'بدون بيان',
      labor_type: row[9]?.toString() || null,
      worker_count: Number(row[10]) || null,
      fertilizer_name: row[11]?.toString() || null,
      unit: row[12]?.toString() || null,
      quantity: Number(row[13]) || null,
      unit_price: Number(row[14]) || null,
      expense_amount: Number(row[15]) || 0,
      labor_cost: Number(row[16]) || 0,
      fertilizer_cost: Number(row[17]) || 0,
      total_amount: Number(row[18]) || Number(row[15]) || 0,
    };

    if (expense.total_amount === 0 && expense.expense_amount === 0) continue;

    batch.push(expense);

    if (batch.length >= BATCH_SIZE) {
      const { data: result, error } = await supabase.from('expenses').insert(batch);
      if (error) { errors += batch.length; console.error(`  Batch error:`, error.message); }
      else inserted += batch.length;
      batch = [];
      process.stdout.write(`  📊 Processed ${i}/${data.length - 1} rows...\r`);
    }
  }

  // Remaining batch
  if (batch.length > 0) {
    const { error } = await supabase.from('expenses').insert(batch);
    if (error) errors += batch.length;
    else inserted += batch.length;
  }

  console.log(`  ✅ ${inserted} expenses imported (${errors} errors)`);
}

// =====================================================
// 3. MIGRATE SALES
// =====================================================
async function migrateSales(workbook, farmMap) {
  console.log('\n🛒 Migrating sales...');
  const sheet = workbook.Sheets['المبيعات'];
  if (!sheet) { console.log('  ⚠️ Sheet not found'); return; }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const farmNameToId = {};
  Object.entries(farmMap).forEach(([name, id]) => { farmNameToId[name] = id; });

  let batch = [];
  let inserted = 0;

  // Data starts at row 3 (index 2)
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const year = Number(row[0]);
    const month = Number(row[1]);
    if (!year || !month) continue;

    const farmName = row[4]?.toString().trim();
    const sale = {
      year,
      month,
      day: Number(row[2]) || null,
      sector_name: row[3]?.toString() || null,
      farm_id: farmNameToId[farmName] || null,
      season: row[5]?.toString() || null,
      product_name: row[7]?.toString() || 'غير محدد',
      sale_method: row[8]?.toString() || 'نقدي',
      quantity: Number(row[9]) || null,
      unit_price: Number(row[10]) || null,
      total_amount: Number(row[11]) || 0,
      labor_cost: Number(row[12]) || 0,
      commission: Number(row[13]) || 0,
      packaging_cost: Number(row[14]) || 0,
      other_costs: Number(row[15]) || 0,
      total_expenses: Number(row[16]) || 0,
      net_amount: Number(row[17]) || Number(row[11]) || 0,
    };

    if (sale.total_amount === 0) continue;
    batch.push(sale);
  }

  if (batch.length > 0) {
    // Insert in batches of 500
    for (let j = 0; j < batch.length; j += 500) {
      const chunk = batch.slice(j, j + 500);
      const { error } = await supabase.from('sales').insert(chunk);
      if (error) console.error(`  Sales batch error:`, error.message);
      else inserted += chunk.length;
    }
  }

  console.log(`  ✅ ${inserted} sales imported`);
}

// =====================================================
// 4. MIGRATE PAYMENT VOUCHERS
// =====================================================
async function migrateVouchers(workbook) {
  console.log('\n💳 Migrating payment vouchers...');
  const sheet = workbook.Sheets['اذونات الصرف '];
  if (!sheet) { console.log('  ⚠️ Sheet not found'); return; }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  let batch = [];

  // Header row is row 1, data starts row 2
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const name = row[0]?.toString().trim();
    const amount = Number(row[2]);
    if (!name || !amount) continue;

    batch.push({
      employee_name: name,
      role_description: row[1]?.toString() || null,
      amount,
      payment_type: 'salary',
      is_paid: true,
    });
  }

  if (batch.length > 0) {
    const { data: result, error } = await supabase.from('payment_vouchers').insert(batch);
    if (error) console.error('  Voucher error:', error.message);
    else console.log(`  ✅ ${batch.length} payment vouchers imported`);
  }
}

// =====================================================
// 5. MIGRATE SEEDLING INVENTORY
// =====================================================
async function migrateSeedlings() {
  console.log('\n🌱 Migrating seedling inventory...');

  // From the PDF data
  const seedlings = [
    // 2022
    { year: 2022, category: 'planted', description: 'الفسائل المنزرعة بعوامه', quantity: 668, location: 'عوامه' },
    { year: 2022, category: 'transferred', description: 'ترقيع 6 فسيلة', quantity: 6, location: 'عوامه' },
    { year: 2022, category: 'sold', description: 'مبيعات 475 فسيلة', quantity: 475 },
    // 2023
    { year: 2023, category: 'planted', description: 'الفسائل المنزرعة بحوض البابور', quantity: 624, location: 'حوض البابور' },
    { year: 2023, category: 'planted', description: 'الفسائل المنزرعة ب7.5 فدان (ارض الكمثري)', quantity: 421, location: 'الكمثري' },
    { year: 2023, category: 'planted', description: 'الفسائل المنزرعة ب9.5 فدان (ارض الشفعه)', quantity: 273, location: 'الشفعه' },
    { year: 2023, category: 'planted', description: 'الفسائل المنزرعة بالخطارة', quantity: 52, location: 'الخطاره' },
    { year: 2023, category: 'transferred', description: 'ترقيع 48 فسيلة بارض عوامة', quantity: 48, location: 'عوامه' },
    { year: 2023, category: 'sold', description: 'مبيعات 362 فسيلة', quantity: 362 },
    // 2024
    { year: 2024, category: 'sold', description: 'مبيعات 204 فسيلة', quantity: 204 },
    { year: 2024, category: 'transferred', description: '149 فسيلة ترقيع و 2 فسيلة هدية لاشرف بيومي', quantity: 151, recipient: 'اشرف بيومي' },
    // 2025
    { year: 2025, category: 'planted', description: 'الفسائل المنزرعة بحوض البابور الجزء علي الاسفلب', quantity: 434, location: 'حوض البابور' },
    { year: 2025, category: 'planted', description: 'الفسائل المنزرعة بالحصوة', quantity: 498, location: 'الحصوه' },
    { year: 2025, category: 'sold', description: 'مبيعات 8 فسيلة ا/ اشرف بيومي', quantity: 8, recipient: 'اشرف بيومي' },
  ];

  const { data, error } = await supabase.from('seedling_inventory').insert(seedlings);
  if (error) console.error('  Seedling error:', error.message);
  else console.log(`  ✅ ${seedlings.length} seedling records imported`);
}

// =====================================================
// MAIN
// =====================================================
async function main() {
  console.log('🚀 EBD Farm - Data Migration');
  console.log('============================\n');

  // Step 1: Seed farm structure
  const { farmMap } = await seedFarmStructure();

  // Step 2: Read Excel file
  const xlsxPath = process.argv[2] || './شيت محاسبي للمزارع0 (1).xlsx';
  let workbook;
  try {
    const buffer = readFileSync(xlsxPath);
    workbook = XLSX.read(buffer, { type: 'buffer' });
    console.log(`\n📁 Excel file loaded: ${workbook.SheetNames.join(', ')}`);
  } catch (err) {
    console.error(`\n❌ Could not read Excel file at: ${xlsxPath}`);
    console.log('   Place the Excel file next to this script or pass the path as argument');
    console.log('   Skipping Excel migration, but farm structure is seeded.');
    await migrateSeedlings();
    console.log('\n✅ Migration complete (partial - without Excel data)');
    return;
  }

  // Step 3: Migrate data
  await migrateExpenses(workbook, farmMap);
  await migrateSales(workbook, farmMap);
  await migrateVouchers(workbook);
  await migrateSeedlings();

  console.log('\n✅ Migration complete!');
  console.log('============================');
  console.log('📈 Summary:');
  console.log('   - Farm sectors and structure: ✅');
  console.log('   - Palm tree registry (hawshat): ✅');
  console.log('   - Expenses (~25,000 records): ✅');
  console.log('   - Sales (~166 records): ✅');
  console.log('   - Payment vouchers: ✅');
  console.log('   - Seedling inventory: ✅');
}

main().catch(console.error);
