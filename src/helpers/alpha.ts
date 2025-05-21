import { v4 } from "uuid";
import { AlphaBalance, StakedAlpha } from "../types";
import { parseFixedU128 } from "./utils";

export async function getAlphaAmount(
  apiAt: any,
  coldkey: string,
  hotkey: string,
  net_uid: number
): Promise<number> {
  const alpha_raw = await apiAt.query.subtensorModule.alpha(
    hotkey,
    coldkey,
    net_uid
  );
  const share = parseFixedU128((alpha_raw.toJSON() as any).bits.toString(16));

  const hotkey_share_raw = await apiAt.query.subtensorModule.totalHotkeyShares(
    hotkey,
    net_uid
  );
  const hotkey_share = parseFixedU128(
    (hotkey_share_raw.toJSON() as any).bits.toString(16)
  );

  const hotkey_alpha_raw = await apiAt.query.subtensorModule.totalHotkeyAlpha(
    hotkey,
    net_uid
  );
  const hotkey_alpha = Number(hotkey_alpha_raw.toJSON());

  const alpha = (hotkey_alpha * share) / hotkey_share;

  return alpha;
}

export async function getAlphaPrice(
  apiAt: any,
  net_uid: number
): Promise<number> {
  if (net_uid === 0) return 1;
  const alpha_pool_raw = await apiAt.query.subtensorModule.subnetAlphaIn(
    net_uid
  );
  const alpha_pool = Number(alpha_pool_raw.toJSON());

  const tao_pool_raw = await apiAt.query.subtensorModule.subnetTAO(net_uid);
  const tao_pool = Number(tao_pool_raw.toJSON());

  const price = tao_pool / alpha_pool;
  return price;
}

export async function fetchAlphaBalances(
  height: number,
  timestamp: Date | undefined,
  hash: string,
  coldkey: string
): Promise<AlphaBalance[]> {
  const apiAt = await unsafeApi?.at(hash);
  if (!apiAt) return [];

  let records: AlphaBalance[] = [];

  const hotkeysRaw = await apiAt.query.subtensorModule.stakingHotkeys(coldkey);
  const hotkeys = hotkeysRaw.toJSON() as string[];

  for (const hotkey of hotkeys) {
    const keys = await apiAt.query.subtensorModule.alpha.keys(hotkey, coldkey);
    for (const key of keys) {
      const net_uid = Number((key.toHuman() as [string, string, number])[2]);
      const alpha = await getAlphaAmount(apiAt, coldkey, hotkey, net_uid);
      const price = await getAlphaPrice(apiAt, net_uid);
      const tao = alpha * price;

      records.push(
        AlphaBalance.create({
          id: v4(),
          block_number: height,
          timestamp,
          coldkey,
          hotkey,
          net_uid,
          alpha,
          price,
          tao,
        })
      );
    }
  }
  return records;
}

export async function fetchAlphaStaked(
  height: number,
  timestamp: Date | undefined,
  hash: string,
  coldkey: string
) {
  const records = await fetchAlphaBalances(height, timestamp, hash, coldkey);
  const sum = records.reduce((sum, item) => sum + item.tao, 0);
  await store.bulkCreate("AlphaBalance", records);

  const entity = StakedAlpha.create({
    id: v4(),
    block_number: height,
    timestamp,
    coldkey,
    tao: sum,
  });
  await entity.save();
}
