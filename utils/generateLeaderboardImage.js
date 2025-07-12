import { createCanvas, loadImage } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateLeaderboardImage(players, selectedType, typeLabel, perPage = 10) {
    const width = 768;
    const height = 768;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🖼️ Background
    const bgPath = path.join(__dirname, "../assets/images/leaderboard.png"); // <- use uploaded background
    const bgImage = await loadImage(bgPath);
    ctx.drawImage(bgImage, 0, 0, width, height);

    // 🏆 Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`🏆 ${typeLabel.toUpperCase()} LEADERBOARD`, width / 2, 50);

    const rowStartY = 100;
    const rowHeight = 55;

    const hasPlayers = players.some(p => p !== null && p !== undefined);

    if (!hasPlayers) {
        // ❌ Show message inside image
        ctx.fillStyle = "#ff4c4c";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("❌ EMPTY LEADERBOARD ❌", width / 2, 380);

        ctx.font = "20px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("No players have recorded any stats for this category yet.", width / 2, 420);
        ctx.fillText("Be the first to make your mark!", width / 2, 455);
    } else {
        for (let i = 0; i < perPage; i++) {
            const player = players[i];
            if (!player) continue;

            const y = rowStartY + i * rowHeight;
            const rank = player.rank;
            const name = player.username || `User-${player.discordId}`;
            const value = player.stats?.[selectedType]?.toString() || "0";

            // 🖼️ Avatar
            try {
                const response = await axios.get(player.avatarURL, { responseType: "arraybuffer" });
                const avatar = await loadImage(response.data);
                ctx.save();
                ctx.beginPath();
                ctx.arc(55, y + 20, 20, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, 35, y, 40, 40);
                ctx.restore();
            } catch (err) {
                console.error(`Failed to load avatar for ${name}: ${err.message}`);
                ctx.fillStyle = "#333";
                ctx.beginPath();
                ctx.arc(55, y + 20, 20, 0, Math.PI * 2);
                ctx.fill();
            }

            // 🥇 Medal logic (top 3 globally only)
            let rankPrefix = `${rank}.`;
            let nameColor = "#ffffff";
            if (rank === 1) {
                rankPrefix = "🥇";
                nameColor = "#ffd700";
            } else if (rank === 2) {
                rankPrefix = "🥈";
                nameColor = "#c0c0c0";
            } else if (rank === 3) {
                rankPrefix = "🥉";
                nameColor = "#cd7f32";
            }

            // 👤 Name
            ctx.font = "bold 20px sans-serif";
            ctx.fillStyle = nameColor;
            ctx.textAlign = "left";
            ctx.textAlign = "left";
            ctx.font = "bold 20px sans-serif";
            ctx.fillStyle = nameColor;
            ctx.fillText(rankPrefix, 110, y + 28);  // Moved from 100 → 110

            // Name (more spacing from rank)
            ctx.fillText(name, 180, y + 28); // Increased gap between rank and name

            // 🔢 Stat
            ctx.font = "bold 20px sans-serif";
            ctx.fillStyle = "#ffcc00";
            ctx.textAlign = "right";
            ctx.fillText(value, width - 50, y + 28);
        }
    }

    // Footer credit
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText("developed by daniibhaii", width - 10, height - 30);
        // 🖊️ Footer Text

    // 🖼️ Footer Logo
    try {
        const logoPath = path.join(__dirname, "../assets/images/daniibhaii.png");
        const logo = await loadImage(logoPath);
        ctx.drawImage(logo, width - 220, height - 50, 30, 30);
    } catch (err) {
        console.warn("Footer logo failed to load:", err.message);
    }

    return canvas.toBuffer("image/png");
}