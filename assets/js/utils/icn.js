// ICN palette, shared by the echarts theme and the profile category colours.
export const ICN_PALETTE = [
  "#1090CA",
  "#6FDCB0",
  "#FFC875",
  "#FF9EC4",
  "#9B8CFF",
  "#7FD6E6",
  "#F4A26B",
  "#4DB2E2",
  "#B7E36F",
  "#C9A0FF",
];

// Same category, same colour, on every page.
export function categoryColor(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return ICN_PALETTE[h % ICN_PALETTE.length];
}
