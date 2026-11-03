import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line as SvgLine, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CurveChart = ({
  data = [],
  height = 200,
  width = SCREEN_WIDTH - 48,
  title = 'Cumulative Drug Release Profile',
  showTarget = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.card, { height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>No simulation curve data available</Text>
      </View>
    );
  }

  // Padding inside SVG canvas
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 28;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Domain & Range
  const maxTime = Math.max(...data.map((d) => d.time || 0), 1);
  const maxY = 100; // Fixed 0 - 100% cumulative release

  // Mapping coordinates
  const getX = (t) => paddingLeft + (t / maxTime) * chartWidth;
  const getY = (v) => paddingTop + chartHeight - (Math.max(0, Math.min(100, v)) / maxY) * chartHeight;

  // Build SVG path string for predicted curve
  const points = data.map((d) => ({
    x: getX(d.time),
    y: getY(d.predicted !== undefined ? d.predicted : d.percentage || 0),
  }));

  let pathD = '';
  points.forEach((p, idx) => {
    if (idx === 0) {
      pathD += `M ${p.x} ${p.y}`;
    } else {
      pathD += ` L ${p.x} ${p.y}`;
    }
  });

  // Area under curve
  const areaD = `${pathD} L ${points[points.length - 1].x} ${getY(0)} L ${points[0].x} ${getY(0)} Z`;

  // Build target / simulated curve if available
  let targetPathD = '';
  if (showTarget) {
    data.forEach((d, idx) => {
      const tgtVal = d.target !== undefined ? d.target : d.simulated;
      if (tgtVal !== undefined) {
        const x = getX(d.time);
        const y = getY(tgtVal);
        if (idx === 0) {
          targetPathD += `M ${x} ${y}`;
        } else {
          targetPathD += ` L ${x} ${y}`;
        }
      }
    });
  }

  // Generate Y-axis grid ticks (0%, 25%, 50%, 75%, 100%)
  const yTicks = [0, 25, 50, 75, 100];

  // Generate X-axis ticks (e.g. 0, 6, 12, 18, 24)
  const xTickCount = Math.min(data.length, 5);
  const xTicks = [];
  for (let i = 0; i < xTickCount; i++) {
    const t = Math.round((i / (xTickCount - 1)) * maxTime);
    xTicks.push(t);
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primaryLight }]} />
            <Text style={styles.legendText}>Predicted</Text>
          </View>
          {showTarget && targetPathD.length > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.legendText}>Target</Text>
            </View>
          )}
        </View>
      </View>

      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Y-axis grid lines & labels */}
        {yTicks.map((val) => {
          const y = getY(val);
          return (
            <React.Fragment key={`y-${val}`}>
              <SvgLine
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={COLORS.surfaceBorder}
                strokeDasharray="4, 4"
                strokeWidth="1"
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 3}
                fill={COLORS.textMuted}
                fontSize="10"
                textAnchor="end"
              >
                {val}%
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X-axis labels */}
        {xTicks.map((t, idx) => {
          const x = getX(t);
          return (
            <SvgText
              key={`x-${idx}-${t}`}
              x={x}
              y={height - 8}
              fill={COLORS.textMuted}
              fontSize="10"
              textAnchor="middle"
            >
              {t}h
            </SvgText>
          );
        })}

        {/* Area fill */}
        <Path d={areaD} fill="url(#curveGradient)" />

        {/* Target curve */}
        {targetPathD.length > 0 && (
          <Path
            d={targetPathD}
            fill="none"
            stroke={COLORS.secondary}
            strokeWidth="1.8"
            strokeDasharray="5, 3"
          />
        )}

        {/* Primary predicted curve */}
        <Path
          d={pathD}
          fill="none"
          stroke={COLORS.primaryLight}
          strokeWidth="2.5"
        />

        {/* Data points dots */}
        {points.map((p, idx) => (
          <Circle
            key={`dot-${idx}`}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill={COLORS.background}
            stroke={COLORS.primaryLight}
            strokeWidth="2"
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});

