export const parseFixedU128 = (hexString: String) => {
  // Remove '0x' prefix and ensure it's 16 bytes (128 bits)
  hexString = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  hexString = hexString.padStart(32, "0");

  // Split into two 64-bit parts
  const highBits = Number(BigInt("0x" + hexString.slice(0, 16))); // First 64 bits as u64
  const lowBits = BigInt("0x" + hexString.slice(16)); // Last 64 bits as u64

  // Convert to float by dividing the lower 64 bits by the max value of u64
  const u64Max = BigInt(2) ** BigInt(64) - BigInt(1);

  const lb_val = Number(lowBits) / Number(u64Max);

  return Number(highBits + lb_val);
};
