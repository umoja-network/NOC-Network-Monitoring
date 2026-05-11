import express from "express";
import cors from "cors";
import { google } from "googleapis";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import type { Device } from "./src/types";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

  app.use(express.json());
  app.use(cors());

  // Google Auth Setup
  const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || "{}"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

  const sheets = google.sheets({ version: "v4", auth });
  const SPREADSHEET_ID = "1Q8ir1jz8-9x4urq0ESt0HB7i1zBwVAUaDR8riCAQjaM";

  // API Routes
  app.get("/api/devices", async (req, res) => {
    try {
      const type = req.query.type || "CPE200";
      let range: string;
      let devices: Device[] = [];

      const DEFAULT_COORDS = { lat: -26.327521, lng: 27.873059 };

      const parseGPS = (gps: string) => {
        if (!gps || typeof gps !== 'string') return DEFAULT_COORDS;
        // Split by comma or space and filter out non-numbers
        const parts = gps.split(/[,\s]+/).map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
        if (parts.length === 2) {
          return { lat: parts[0], lng: parts[1] };
        }
        return DEFAULT_COORDS;
      };

      if (type === "CPE200") {
        range = "CPE200!A2:L";
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range,
          valueRenderOption: "UNFORMATTED_VALUE",
        });

        devices = (response.data.values || []).map((row) => ({
          type: "CPE200",
          id: row[0] || "",
          name: row[1] || "",
          mac: row[2] || "",
          configStatus: row[3] || "",
          monitoringStatus: row[4] || "",
          connectedTo: row[5] || "",
          ssid: row[6] || "",
          signal: row[7] || "",
          noise: row[8] || "",
          gps: row[10] || "",
          coordinates: parseGPS(row[10]),
        }));
      } else if (type === "Baicell") {
        range = "Baicell!A2:H";
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range,
          valueRenderOption: "UNFORMATTED_VALUE",
        });

        devices = (response.data.values || []).map((row) => ({
          type: "Baicell",
          id: row[0] || "",
          name: row[1] || "",
          mac: row[2] || "",
          configStatus: row[3] || "",
          monitoringStatus: row[4] || "",
          totalConnected: Number(row[5] || 0),
          gps: row[7] || "",
          coordinates: parseGPS(row[7]),
        }));
      }

      res.json(devices);
    } catch (err) {
      console.error("Devices API error:", err);
      res.status(500).json({ error: "Failed to load devices" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const { withSwaps } = req.query;
      const STATS_SPREADSHEET_ID = "1cBnc1BEoxxWaw-ZuudxbvnVCYeQcFdjVdwhFvq-Fyoo";
      
      let ranges;
      if (withSwaps === 'true') {
        ranges = [
          "Gauteng_swap_stats!B23", // AX820 Online G
          "Gauteng_swap_stats!B24", // AX820 Offline G
          "Gauteng_swap_stats!B13", // Baicells Online G
          "Gauteng_swap_stats!B14", // Baicells Offline G
          "Limpopo_swap_stats!B22", // AX820 Online L
          "Limpopo_swap_stats!B23", // AX820 Offline L
          "Limpopo_swap_stats!B25", // Baicells Online L
          "Limpopo_swap_stats!B26"  // Baicells Offline L
        ];
      } else {
        ranges = [
          "Gauteng_306_Stats!B23", // AX820 Online G
          "Gauteng_306_Stats!B24", // AX820 Offline G
          "Gauteng_306_Stats!B13", // Baicells Online G
          "Gauteng_306_Stats!B14", // Baicells Offline G
          "Limpopo_306_Stats!F2",  // AX820 Online L
          "Limpopo_306_Stats!G2",  // AX820 Offline L
          "Limpopo_306_Stats!A6",  // Baicells Online L
          "Limpopo_306_Stats!B6"   // Baicells Offline L
        ];
      }

      const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: STATS_SPREADSHEET_ID,
        ranges,
      });

      const values = response.data.valueRanges?.map(vr => vr.values?.[0]?.[0] || "0") || [];
      
      res.json({
        gauteng: {
          ax820Online: parseInt(values[0].toString()),
          ax820Offline: parseInt(values[1].toString()),
          baicellsOnline: parseInt(values[2].toString()),
          baicellsOffline: parseInt(values[3].toString()),
        },
        limpopo: {
          ax820Online: parseInt(values[4].toString()),
          ax820Offline: parseInt(values[5].toString()),
          baicellsOnline: parseInt(values[6].toString()),
          baicellsOffline: parseInt(values[7].toString()),
        }
      });
    } catch (err) {
      console.error("Stats API error:", err);
      res.status(500).json({ error: "Failed to load stats" });
    }
  });

  app.get("/api/monitoring/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { range = "1d" } = req.query;

      // Pass the range to the external API
      const response = await fetch(
        `https://device.onetel.co.za/api/v1/monitoring/device/${id}/?range=${range}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.ONETEL_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({
          error: "Monitoring API failed",
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("Monitoring API error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use("*", (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
