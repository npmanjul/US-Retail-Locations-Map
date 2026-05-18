import type { Request, Response } from "express";
import { getMapData } from "../services/map.service.ts";
import { getViewportCache, setViewportCache } from "../utils/cacheing.ts";

export const viewportController = async (req: Request, res: Response) => {
  try {
    const north = Number(req.query.north);
    const south = Number(req.query.south);
    const east = Number(req.query.east);
    const west = Number(req.query.west);
    const zoom = Number(req.query.zoom);

    if (
      isNaN(north) ||
      isNaN(south) ||
      isNaN(east) ||
      isNaN(west) ||
      isNaN(zoom)
    ) {
      return res.status(400).json({
        message: "Invalid query params",
      });
    }

    // data cacheing
    const cacheKey = `viewport:${north}:${south}:${east}:${west}:${zoom}`;
    const cachedData = getViewportCache(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        source: "cache",
        data: cachedData,
      });
    }

    // Fetch from database
    const data = await getMapData(north, south, east, west, zoom);
    setViewportCache(cacheKey, data);

    return res.status(200).json({
      source: "database",
      data,
    });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
};
