import { createCanvas, loadImage } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateLeaderboardImage(players, selectedType, typeLabel, perPage = 10) {
    const width = 900;
    const height = 140 + perPage * 65;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 🖼️ Background
    const bgPath = path.join(__dirname, "../assets/images/background.png");
    const bgImage = await loadImage(bgPath);
    ctx.drawImage(bgImage, 0, 0, width, height);

    // 🏆 Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("LEADERBOARD", 60, 90);

    // ⭐ Stat label
    ctx.fillStyle = "#ffcc00";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(typeLabel.toUpperCase(), 60, 130);

    if (players.every(p => p == null)) {
        ctx.fillStyle = "#ff0000";
        ctx.font = "bold 24px sans-serif";
        const lines = [
            "❌ Empty Leaderboard ❌",
            "No players have recorded any stats for this category yet.",
            "Be the first to make your mark!"
        ];

        const lineHeight = 50;
        const totalHeight = lines.length * lineHeight;
        let y = (height - totalHeight) / 2;

        lines.forEach(line => {
            const textWidth = ctx.measureText(line).width;
            const x = (width - textWidth) / 2;
            ctx.fillText(line, x, y);
            y += lineHeight;
        });
    }


    // 👤 Loop through players
    for (let i = 0; i < perPage; i++) {
        const y = 180 + i * 60;
        const player = players[i];

        if (!player) continue;

        const rank = player.rank;
        const name = player.username || `User-${player.discordId}`;
        const value = player.stats?.[selectedType]?.toString() || "0";

        // Draw avatar (using axios to support animated GIF/webp)
        try {
            const response = await axios.get(player.avatarURL, { responseType: "arraybuffer" });
            const avatar = await loadImage(response.data);
            ctx.save();
            ctx.beginPath();
            ctx.arc(65, y - 10, 24, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 40, y - 35, 50, 50);
            ctx.restore();
        } catch (err) {
            console.error(`Failed to load avatar for ${name}: ${err.message}`);
            ctx.fillStyle = "#444";
            ctx.beginPath();
            ctx.arc(65, y - 10, 24, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rank styling (top 3 get medals on page 1 only)
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

        // Draw name and stat
        ctx.fillStyle = nameColor;
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(`${rankPrefix} ${name}`, 110, y);

        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(value, 750, y);
    }

    // 🖊️ Footer Text
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    const footerText = "developed by daniibhaii";
    const textWidth = ctx.measureText(footerText).width;
    ctx.fillText(footerText, width - textWidth - 90, height - 25);

    // 🖼️ Footer Logo
    try {
        const logoPath = path.join(__dirname, "../assets/images/daniibhaii.png");
        const logo = await loadImage(logoPath);
        ctx.drawImage(logo, width - 70, height - 50, 30, 30);
    } catch (err) {
        console.warn("Footer logo failed to load:", err.message);
    }

    return canvas.toBuffer("image/png");
}
