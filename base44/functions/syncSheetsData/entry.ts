import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SPREADSHEET_ID = '1S4e3Q5fiwNKvsKJzGm0CLqzMTjp9c5fv3wqu4QExlLY';
const SHEET_NAME = 'Report';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get access token from Google Sheets connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch data from Google Sheets API
    const range = `${SHEET_NAME}!A:E`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
    const sheetsRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!sheetsRes.ok) {
      const err = await sheetsRes.text();
      return Response.json({ error: 'Sheets API error', details: err }, { status: 500 });
    }

    const sheetsData = await sheetsRes.json();
    const rows = sheetsData.values || [];

    if (rows.length < 2) {
      return Response.json({ message: 'No data rows found', rows_count: rows.length });
    }

    // First row is header
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    // Map column indexes
    const colDia = headers.findIndex(h => h.includes('dia'));
    const colCriativo = headers.findIndex(h => h.includes('criativo'));
    const colImpressoes = headers.findIndex(h => h.includes('impress'));
    const colCliques = headers.findIndex(h => h.includes('clique'));
    const colEstado = headers.findIndex(h => h.includes('estado') || h.includes('cidade'));

    // Clear existing data
    const existing = await base44.asServiceRole.entities.CampaignData.list('created_date', 1000);
    for (const record of existing) {
      await base44.asServiceRole.entities.CampaignData.delete(record.id);
    }

    // Insert new data
    const records = dataRows
      .filter(row => row.length > 0 && row[0])
      .map(row => ({
        dia: colDia >= 0 ? (row[colDia] || '') : '',
        criativo: colCriativo >= 0 ? (row[colCriativo] || '') : '',
        impressoes_display: colImpressoes >= 0 ? (parseFloat((row[colImpressoes] || '0').toString().replace(/\./g, '').replace(',', '.')) || 0) : 0,
        cliques_display: colCliques >= 0 ? (parseFloat((row[colCliques] || '0').toString().replace(/\./g, '').replace(',', '.')) || 0) : 0,
        estado: colEstado >= 0 ? (row[colEstado] || '') : '',
      }));

    await base44.asServiceRole.entities.CampaignData.bulkCreate(records);

    return Response.json({
      success: true,
      synced: records.length,
      headers_found: headers,
      col_indexes: { colDia, colCriativo, colImpressoes, colCliques, colEstado }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
