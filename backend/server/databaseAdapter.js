function toPgSql(sql) {
  let parameterIndex = 0;
  return sql.replace(/\?/g, () => `$${++parameterIndex}`);
}

function mapRow(row) {
  if (!row) return row;

  const mappedRow = { ...row };
  if (typeof mappedRow.planting_count === "string") mappedRow.planting_count = Number(mappedRow.planting_count);
  if (typeof mappedRow.count === "string") mappedRow.count = Number(mappedRow.count);
  return mappedRow;
}

function createQueryInterface(query) {
  return {
    async get(...params) {
      const result = await query(params);
      return mapRow(result.rows[0]);
    },
    async all(...params) {
      const result = await query(params);
      return result.rows.map(mapRow);
    },
    async run(...params) {
      const result = await query(params);
      return { rowCount: result.rowCount };
    }
  };
}

module.exports = { createQueryInterface, mapRow, toPgSql };
