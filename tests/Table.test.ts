import { testProp, fc } from '@fast-check/jest';
import Table from '@/Table';

describe(Table.name, () => {
  test('empty table should throw `RangeError`', () => {
    expect(() => new Table([])).toThrow(RangeError);
  });
  test('create table with duplicate keys and indexes', () => {
    const t = new Table(['a', 'a'], ['a', 'a']);
    const rI1 = t.insertRow({ a: 'foo' });
    const rI2 = t.insertRow({ a: 'foo' });
    t.setRow(rI2, { a: 'bar' });
    t.updateRow(rI1, { a: 'bar' });
    const rIs = t.whereRows('a', 'bar');
    expect(rIs).toContainAllValues([rI1, rI2]);
    t.deleteRow(rI2);
    t.deleteRow(rI1);
    expect(t.whereRows('a', 'bar')).toHaveLength(0);
  });
  test('inserting, setting, updating rows use shallow copy', () => {
    const t = new Table<{ a: number; b: number }>(['a', 'b']);
    const row1 = { a: 1, b: 2 };
    const rI = t.insertRow(row1);
    row1.a = 3;
    const row1_ = t.getRow(rI)!;
    expect(row1_).toBeDefined();
    expect(row1_.a).toBe(1);
    const row2 = { a: 1, b: 2 };
    t.setRow(rI, row2);
    row2.b = 3;
    const row2_ = t.getRow(rI)!;
    expect(row2_).toBeDefined();
    expect(row2_.b).toBe(2);
    const row3 = { b: 3 };
    t.updateRow(rI, row3);
    row3.b = 4;
    const row3_ = t.getRow(rI)!;
    expect(row3_).toBeDefined();
    expect(row3_.b).toBe(3);
  });
  test('get table uses shallow copy', () => {
    const t = new Table<{ a: number; b: number }>(['a', 'b']);
    const table = t.getTable();
    table.set(1, { a: 3, b: 4 });
    const table_ = t.getTable();
    expect(table_.get(1)).toBeUndefined();
  });
  testProp(
    'insert table rows',
    [
      fc.array(
        fc.record({
          a: fc.integer(),
          b: fc.string(),
          c: fc.boolean(),
          d: fc.float(),
        }),
        { minLength: 1 },
      ),
      fc.uniqueArray(fc.constantFrom('a', 'b', 'c', 'd')),
    ],
    (rows, keysIndex) => {
      const t = new Table(['a', 'b', 'c', 'd'], keysIndex);
      const is = rows.map((r) => t.insertRow(r));
      expect(is).toEqual([...Array(rows.length).keys()]);
      expect([...t]).toEqual(rows);
      expect(t.count).toBe(rows.length);
    },
  );
  testProp(
    'delete table rows',
    [
      fc.array(
        fc.record({
          a: fc.integer(),
          b: fc.string(),
          c: fc.boolean(),
          d: fc.float(),
        }),
        { minLength: 1 },
      ),
      fc.uniqueArray(fc.constantFrom('a', 'b', 'c', 'd')),
    ],
    (rows, keysIndex) => {
      const t = new Table(['a', 'b', 'c', 'd'], keysIndex);
      const is = rows.map((r) => t.insertRow(r));
      is.sort(() => Math.random() - 0.5);
      for (const i of is) {
        t.deleteRow(i);
      }
      expect(t.count).toBe(0);
    },
  );
  testProp(
    'update table rows',
    [
      fc.array(
        fc.record({
          a: fc.integer(),
          b: fc.string(),
          c: fc.boolean(),
          d: fc.float(),
        }),
        { minLength: 1 },
      ),
      fc.uniqueArray(fc.constantFrom('a', 'b', 'c', 'd'), { minLength: 1 }),
      fc.uniqueArray(fc.constantFrom('a', 'b', 'c', 'd')),
    ],
    (rows, keys, keysIndex) => {
      const t = new Table(['a', 'b', 'c', 'd'], keysIndex);
      const is = rows.map((r) => t.insertRow(r));
      is.sort(() => Math.random() - 0.5);
      for (const i of is) {
        const r = t.getRow(i)!;
        const rNew = { ...r };
        for (const k of keys) {
          if (k === 'a') {
            rNew.a = fc.sample(fc.integer(), 1)[0];
          } else if (k === 'b') {
            rNew.b = fc.sample(fc.string(), 1)[0];
          } else if (k === 'c') {
            rNew.c = fc.sample(fc.boolean(), 1)[0];
          } else if (k === 'd') {
            rNew.d = fc.sample(fc.float(), 1)[0];
          }
        }
        t.setRow(i, rNew);
        expect(t.getRow(i)).toEqual(rNew);
      }
    },
  );
  testProp(
    'partial update table rows',
    [
      fc.array(
        fc.record({
          a: fc.integer(),
          b: fc.string(),
          c: fc.boolean(),
          d: fc.float(),
        }),
        { minLength: 1 },
      ),
      fc.uniqueArray(fc.constantFrom('a', 'b', 'c', 'd'), { minLength: 1 }),
      fc.uniqueArray(fc.constantFrom('a', 'b', 'c', 'd')),
    ],
    (rows, keys, keysIndex) => {
      const t = new Table(['a', 'b', 'c', 'd'], keysIndex);
      const is = rows.map((r) => t.insertRow(r));
      is.sort(() => Math.random() - 0.5);
      for (const i of is) {
        const r = t.getRow(i)!;
        const rNew: {
          a?: number;
          b?: string;
          c?: boolean;
          d?: number;
        } = {};
        for (const k of keys) {
          if (k === 'a') {
            rNew.a = fc.sample(fc.integer(), 1)[0];
          } else if (k === 'b') {
            rNew.b = fc.sample(fc.string(), 1)[0];
          } else if (k === 'c') {
            rNew.c = fc.sample(fc.boolean(), 1)[0];
          } else if (k === 'd') {
            rNew.d = fc.sample(fc.float(), 1)[0];
          }
        }
        t.updateRow(i, rNew);
        expect(t.getRow(i)).toEqual({
          ...r,
          ...rNew,
        });
      }
    },
  );
  testProp(
    'get table rows by index',
    [
      fc.array(
        fc.record({
          a: fc.integer(),
          b: fc.string(),
          c: fc.boolean(),
          d: fc.float(),
        }),
        { minLength: 1 },
      ),
      fc.uniqueArray(fc.constantFrom('a', 'b', 'c', 'd')),
    ],
    (rows, keysIndex) => {
      const t = new Table(['a', 'b', 'c', 'd'], keysIndex);
      rows.forEach((r) => t.insertRow(r));
      // Use Math.random
      const i = Math.floor(Math.random() * rows.length);
      const row = rows[i];
      for (const keyIndex of keysIndex) {
        const i_ = t.whereRows(keyIndex, row[keyIndex]);
        expect(i_).toContain(i);
        for (const ii of i_) {
          const r = t.getRow(ii)!;
          expect(r[keyIndex]).toBe(row[keyIndex]);
        }
      }
    },
  );
  testProp(
    'get table rows by derived index',
    [
      fc.array(
        fc.record({
          a: fc.integer(),
          b: fc.string(),
          c: fc.boolean(),
          d: fc.float(),
        }),
        { minLength: 1 },
      ),
      fc.uniqueArray(fc.constantFrom('a', 'b', 'c', 'd')),
    ],
    (rows, keysIndex) => {
      const indexes = keysIndex.reduce((indexes, k) => {
        return indexes.concat([[k, (v: any) => v.toString()]]);
      }, [] as Array<any>);
      const t = new Table(['a', 'b', 'c', 'd'], indexes);
      rows.forEach((r) => t.insertRow(r));
      const rI = Math.floor(Math.random() * rows.length);
      const r = rows[rI];
      for (const keyIndex of keysIndex) {
        const rIs = t.whereRows(keyIndex, r[keyIndex]);
        expect(rIs).toContain(rI);
        for (const rI of rIs) {
          const r_ = t.getRow(rI)!;
          expect(r_).toBeDefined();
          expect(r_[keyIndex]).toBe(r[keyIndex]);
        }
      }
    },
  );
  testProp(
    'get table rows by compound index',
    [
      fc.array(
        fc.record({
          a: fc.integer(),
          b: fc.string(),
          c: fc.boolean(),
          d: fc.float(),
        }),
        { minLength: 1 },
      ),
      fc.array(
        fc.array(fc.constantFrom('a', 'b', 'c', 'd'), {
          minLength: 1,
          maxLength: 4,
        }),
        { minLength: 1 },
      ),
    ],
    (rows, compoundIndexes) => {
      const indexes = compoundIndexes.reduce((indexes, k) => {
        return indexes.concat([
          [k, (...vs: Array<any>) => vs.map((v) => v.toString()).join('')],
        ]);
      }, [] as Array<any>);
      const t = new Table(['a', 'b', 'c', 'd'], indexes);
      rows.forEach((r) => t.insertRow(r));
      const rI = Math.floor(Math.random() * rows.length);
      const r = rows[rI];
      for (const compoundIndex of compoundIndexes) {
        const rIs = t.whereRows(
          compoundIndex,
          compoundIndex.map((k) => r[k]),
        );
        expect(rIs).toContain(rI);
        for (const rI of rIs) {
          const r_ = t.getRow(rI)!;
          expect(r_).toBeDefined();
          expect(compoundIndex.map((k) => r_[k])).toEqual(
            compoundIndex.map((k) => r[k]),
          );
        }
      }
    },
  );
});
