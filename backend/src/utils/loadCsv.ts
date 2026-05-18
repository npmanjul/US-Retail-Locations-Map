import fs from "fs";
import path from "path";
import Papa from "papaparse";

export const loadCsv = async () => {
  const filePath = path.join(
    process.cwd(),
    "/dataset/my_pois.csv"
  );

  const file = fs.readFileSync(filePath, "utf-8");

  const parsed = Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data;
};