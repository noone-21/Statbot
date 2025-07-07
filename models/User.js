import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 1000 },
  portfolio: [
    {
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
      quantity: { type: Number, default: 0 }
    }
  ]
});

export default mongoose.model("User", UserSchema);
