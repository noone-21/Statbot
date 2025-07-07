import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  stats: {
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    conceded: { type: Number, default: 0 },
    deliveries: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    ducks: { type: Number, default: 0 }
  },
  stock: {
    price: { type: Number, default: 50000 },
    history: { type: [Number], default: [] }
  }
});

export default mongoose.model("Player", PlayerSchema);
