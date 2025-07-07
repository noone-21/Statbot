import mongoose from "mongoose";

const recentMatchSchema = new mongoose.Schema({
  runs: { type: Number, required: true },
  balls: { type: Number, required: true },
  wickets: { type: Number, required: true },
  conceded: { type: Number, required: true },
  deliveries: { type: Number, required: true },
}, { _id: false });

const statsSchema = new mongoose.Schema({
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  ballsPlayed: { type: Number, default: 0 },
  ballsBowled: { type: Number, default: 0 },
  ducks: { type: Number, default: 0 },
  conceded: { type: Number, default: 0 },
  fifties: { type: Number, default: 0 },
  hundreds: { type: Number, default: 0 },
  highScore: { type: Number, default: 0 },
  highestWickets: { type: Number, default: 0 },
  threeWicketHauls: { type: Number, default: 0 },
  fiveWicketHauls: { type: Number, default: 0 },
  matches: { type: Number, default: 0 },
  batInnings: { type: Number, default: 0 },
  bowlInnings: { type: Number, default: 0 },
  recentMatches: {
    type: [recentMatchSchema],
    default: []
  }
}, { _id: false });

const PlayerSchema = new mongoose.Schema({
  discordId: { type: String, required: true },
  guildId: { type: String, required: true },
  stats: { type: statsSchema, default: () => ({}) },
  stock: {
    price: { type: Number, default: 50000 },
    history: { type: [Number], default: [] }
  }
});

// Ensure uniqueness per user per server
// PlayerSchema.index({ discordId: 1, guildId: 1 }, { unique: true });

// const PlayerSchema = new mongoose.Schema({
//   discordId: { type: String, required: true, unique: true },
//   stats: {
//     runs: { type: Number, default: 0 },
//     balls: { type: Number, default: 0 },
//     conceded: { type: Number, default: 0 },
//     deliveries: { type: Number, default: 0 },
//     wickets: { type: Number, default: 0 },
//     ducks: { type: Number, default: 0 }
//   },
//   stock: {
//     price: { type: Number, default: 50000 },
//     history: { type: [Number], default: [] }
//   }
// });

export default mongoose.model("Player", PlayerSchema);
