import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
} from "echarts/components";
// Features like Universal Transition and Label Layout
import { LabelLayout, UniversalTransition } from "echarts/features";
// Import the Canvas renderer
// Note that introducing the CanvasRenderer or SVGRenderer is a required step
import { CanvasRenderer } from "echarts/renderers";

// Register the required components
echarts.use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
  ToolboxComponent,
  DataZoomComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

// ICN: text and grid colours follow the page theme, series use the ICN palette.
// Applied over each page's own option, so its data and layout are untouched.
const ICN_PALETTE = ["#1090CA", "#6FDCB0", "#FFC875", "#FF9EC4", "#9B8CFF", "#7FD6E6", "#F4A26B", "#4DB2E2", "#B7E36F", "#C9A0FF"];

function icnColors() {
  const light = document.documentElement.getAttribute("data-bs-theme") === "light";
  return light
    ? { text: "rgba(18,24,32,.68)", title: "#121820", grid: "rgba(18,24,32,.08)", axis: "rgba(18,24,32,.2)", label: "#121820" }
    : { text: "rgba(254,254,254,.68)", title: "#FEFEFE", grid: "rgba(254,254,254,.08)", axis: "rgba(254,254,254,.2)", label: "#FEFEFE" };
}

function icnAxis(axis, c) {
  const style = (a) => ({
    ...a,
    axisLabel: { ...(a.axisLabel || {}), color: c.text },
    axisLine: { ...(a.axisLine || {}), lineStyle: { ...((a.axisLine || {}).lineStyle || {}), color: c.axis } },
    splitLine: { ...(a.splitLine || {}), lineStyle: { ...((a.splitLine || {}).lineStyle || {}), color: c.grid } },
  });
  return Array.isArray(axis) ? axis.map(style) : style(axis);
}

function icnOption(option) {
  const c = icnColors();
  const o = { ...option, backgroundColor: "transparent", color: ICN_PALETTE };
  o.textStyle = { ...(option.textStyle || {}), color: c.text, fontFamily: '"Inter Tight", system-ui, sans-serif' };
  if (option.title) o.title = { ...option.title, textStyle: { ...(option.title.textStyle || {}), color: c.title, fontWeight: 600 } };
  if (option.legend) o.legend = { ...option.legend, textStyle: { ...(option.legend.textStyle || {}), color: c.text } };
  if (option.xAxis) o.xAxis = icnAxis(option.xAxis, c);
  if (option.yAxis) o.yAxis = icnAxis(option.yAxis, c);
  if (option.series) {
    const series = Array.isArray(option.series) ? option.series : [option.series];
    // Only line series are recoloured: bar series (solves vs fails) carry meaning in their colours
    o.series = series.map((s, i) => {
      if (s.type !== "line") return s;
      const color = ICN_PALETTE[i % ICN_PALETTE.length];
      // core's options use the legacy `normal` sub-key, which wins over plain keys
      const flat = (x) => ({ ...(x || {}), ...((x && x.normal) || {}), normal: undefined });
      const out = { ...s, itemStyle: { ...flat(s.itemStyle), color }, lineStyle: { ...flat(s.lineStyle), color } };
      if (s.areaStyle) out.areaStyle = { ...flat(s.areaStyle), color, opacity: 0.18 };
      if (s.label) out.label = { ...flat(s.label), color: c.label, textBorderWidth: 0 };
      return out;
    });
  }
  return o;
}

export function embed(target, option) {
  let chart = echarts.init(target);
  const base = option;
  option = icnOption(base);

  // Redraw in the new colours when the theme switch flips data-bs-theme
  new MutationObserver(() => chart && chart.setOption(icnOption(base), true)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-bs-theme"],
  });
  // https://echarts.apache.org/en/api.html#echartsInstance.setOption
  // https://github.com/apache/echarts/issues/6202#issuecomment-315054637
  // https://stackoverflow.com/a/72211534
  chart.setOption(option, true);

  window.addEventListener("resize", () => {
    if (chart) {
      chart.resize();
    }
  });
}
