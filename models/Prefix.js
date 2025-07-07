import mongoose from "mongoose";

const PrefixSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: "+" }
});

export default mongoose.model("Prefix", PrefixSchema);
