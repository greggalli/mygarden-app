const test = require("node:test");
const assert = require("node:assert/strict");

const { createQueryInterface, mapRow, toPgSql } = require("../databaseAdapter");

test("converts positional placeholders to PostgreSQL parameters", () => {
  assert.equal(
    toPgSql("SELECT * FROM zones WHERE id = ? AND name = ?"),
    "SELECT * FROM zones WHERE id = $1 AND name = $2"
  );
});

test("normalizes PostgreSQL aggregate counts without mutating the row", () => {
  const row = { id: 1, planting_count: "3", count: "4" };

  assert.deepEqual(mapRow(row), { id: 1, planting_count: 3, count: 4 });
  assert.deepEqual(row, { id: 1, planting_count: "3", count: "4" });
});

test("query interface forwards parameters and normalizes result shapes", async () => {
  const calls = [];
  const query = async (params) => {
    calls.push(params);
    return { rows: [{ count: "2" }, { count: "5" }], rowCount: 2 };
  };
  const statement = createQueryInterface(query);

  assert.deepEqual(await statement.get("first"), { count: 2 });
  assert.deepEqual(await statement.all("second"), [{ count: 2 }, { count: 5 }]);
  assert.deepEqual(await statement.run("third"), { rowCount: 2 });
  assert.deepEqual(calls, [["first"], ["second"], ["third"]]);
});
