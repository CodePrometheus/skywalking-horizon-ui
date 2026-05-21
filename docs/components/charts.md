# Charts

Charts are the visual forms used by dashboard and overview widgets. Most users choose a widget type rather than a chart directly; this page helps template authors understand what each chart is good for.

## Time Chart

Used by `line` dashboard widgets.

Best for metrics that change over time: throughput, latency, error rate, queue depth, JVM memory, CPU, and similar series.

Behavior:

- Supports one or more lines.
- Shows a legend when there is more than one series.
- Supports a second y-axis for mixed units, such as throughput and latency.
- Shares hover position with other time charts on the same page, so operators can compare the same moment across panels.

Use `card` instead when the MQE expression returns a single scalar.

## Top List

Used by `top` dashboard widgets.

Best for ranked lists: slow endpoints, high-traffic services, worst error rates, busiest instances.

Behavior:

- Shows rank, name, value, and a proportional background bar.
- Supports tabs when the widget has multiple ranking expressions.
- Rows can navigate to an entity page when the result carries an entity reference.

Use `line` instead when the expression returns a time series.

## Alarms Timeline

Used on the Alarms page.

Best for triage during an incident. It buckets firing and recovered alarms over time and lets the operator select a time range for the alarm table below.

Behavior:

- Shows firing and recovered alarms as stacked bars.
- Clicking a busy minute narrows the alarm list to that minute.
- Dragging a range narrows the alarm list to the selected window.

## Sparkline

Used in compact places such as tiles, sidebars, and picker rows.

Best for small trend hints where a full chart would be too heavy.

Behavior:

- Renders a tiny trend line.
- Shows a single dot when there is only one usable sample.
- Shares hover position with related sparklines when the page supports it.

## Colors

Charts follow the active Horizon theme. Use the layer accent or the theme accent for normal metrics, and reserve explicit colors for semantic states such as severity or error.
