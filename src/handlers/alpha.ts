import { SubstrateBlock } from "@subql/types";
import { fetchAlphaStaked, getAllDelegators } from "../helpers";

export async function fetchStakedAlphas(block: SubstrateBlock) {
  const height = block.block.header.number.toNumber();
  const hash = block.block.header.hash.toString();
  const { timestamp } = block;
  const coldkeys = await getAllDelegators();

  for await (const coldkey of coldkeys) {
    await fetchAlphaStaked(height, timestamp, hash, coldkey);
  }
}
