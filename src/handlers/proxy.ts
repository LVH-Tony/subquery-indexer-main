import { SubstrateEvent } from "@subql/types";
import { Delegator, ProxyAction, ProxyEvent } from "../types";
import { fetchAlphaStaked } from "../helpers";

export async function handleProxyAdded(event: SubstrateEvent): Promise<void> {
  const { block } = event;
  const { timestamp } = block;
  const height = block.block.header.number.toNumber();
  const hash = block.block.header.hash.toString();

  const {
    event: { data },
    idx,
  } = event;
  const extrinsicId = event.extrinsic?.idx;

  const delegator = data[0].toString();
  const proxy = data[1].toString();
  const type = data[2].toString();

  const eventRecord = ProxyEvent.create({
    id: `${height}-${idx}`,
    height,
    timestamp,
    extrinsicId,
    delegator,
    proxy,
    type,
    action: ProxyAction.ADD,
  });

  await eventRecord.save();

  const delegatorRecord = Delegator.create({
    id: `${delegator}`,
    address: delegator,
    from_block: height,
    from_timestamp: timestamp,
    type,
  });
  await delegatorRecord.save();

  await fetchAlphaStaked(height, timestamp, hash, delegator);
}

export async function handleProxyRemoved(event: SubstrateEvent): Promise<void> {
  const { block } = event;
  const { timestamp } = block;
  const height = block.block.header.number.toNumber();
  const hash = block.block.header.hash.toString();

  const {
    event: { data },
    idx,
  } = event;
  const extrinsicId = event.extrinsic?.idx;
  const delegator = data[0].toString();
  const proxy = data[1].toString();
  const type = data[2].toString();

  const eventRecord = ProxyEvent.create({
    id: `${height}-${idx}`,
    height,
    timestamp,
    extrinsicId,
    delegator,
    proxy,
    type,
    action: ProxyAction.ADD,
  });

  await eventRecord.save();

  const delegatorRecord = await Delegator.get(delegator);
  if (!delegatorRecord) {
    logger.error(
      `#${height} handleProxyRemoved Failed to get the delegator record for ${delegator}`
    );
    return;
  }
  await Delegator.remove(delegatorRecord.id);

  await fetchAlphaStaked(height, timestamp, hash, delegator);
}
