import { SubstrateEvent } from "@subql/types";
import { Delegator, Staking, StakingAction } from "../types";
import { fetchAlphaStaked } from "../helpers";

export async function handleAlphaStaked(event: SubstrateEvent): Promise<void> {
  await handleStake(StakingAction.STAKING, event);
}

export async function handleAlphaUnstaked(
  event: SubstrateEvent
): Promise<void> {
  await handleStake(StakingAction.UNSTAKING, event);
}

async function handleStake(action: StakingAction, event: SubstrateEvent) {
  const { block } = event;
  const height = block.block.header.number.toNumber();
  const { timestamp } = block;
  const hash = block.block.header.hash.toString();
  const eventIdx = event.idx;
  const extIdx = event.extrinsic?.idx;

  const coldkey = event.event.data[0].toString();
  const hotkey = event.event.data[1].toString();
  const tao = BigInt(event.event.data[2].toString());
  const alpha = BigInt(event.event.data[3].toString());
  const netUid = event.event.data[4].toJSON() as number;

  const delegatorRecord = await Delegator.get(coldkey);
  if (!delegatorRecord) {
    return;
  }

  const entity = Staking.create({
    id: `${height}-${eventIdx}`,
    height,
    timestamp,
    extrinsicId: extIdx,
    coldkey,
    hotkey,
    action,
    tao,
    netUid,
    alpha,
  });
  await entity.save();

  await fetchAlphaStaked(height, timestamp, hash, coldkey);
}
