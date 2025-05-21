import { Delegator } from "../types";

export async function getAllDelegators() {
  let records: Delegator[] = [];
  const limit = 100;
  while (true) {
    const entities = await Delegator.getByFields([["id", "!=", ""]], {
      limit,
    });
    if (entities.length < limit) break;
    records.push(...entities);
  }
  return records.map((item) => item.address);
}
