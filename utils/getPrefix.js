import Prefix from "../models/Prefix.js";

export const getPrefix = async (guildId) => {
  const doc = await Prefix.findOne({ guildId });
  return doc?.prefix || "+";
};
