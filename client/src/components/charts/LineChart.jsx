import React, { useMemo } from 'react';
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { Box, Typography } from "@mui/material";
import { ResponsiveLine } from "@nivo/line";

const LineChart = ({ data = [], isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Process data for Nivo Line Chart
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    try {
      const keys = Object.keys(data[0] || {});
      
      // Find a suitable x-axis column (preferably string/categorical)
      let xKey = keys.find(key => typeof data[0][key] === 'string') || keys[0];
      
      // Find numeric columns for y-axis values
      const numericKeys = keys.filter(key => 
        key !== xKey && typeof data[0][key] === 'number' && !isNaN(data[0][key])
      );
      
      if (!numericKeys.length) {
        console.warn('No numeric data found for line chart');
        return [];
      }
      
      // Limit data points for better performance
      const limitedData = data.slice(0, isDashboard ? 15 : 25);
      
      // Create series for each numeric column
      const maxSeries = isDashboard ? 2 : 3;
      const colorScheme = [
        colors.greenAccent[500],
        colors.blueAccent[500], 
        colors.redAccent[500]
      ];
      
      return numericKeys.slice(0, maxSeries).map((key, index) => ({
        id: key,
        color: colorScheme[index % colorScheme.length],
        data: limitedData
          .filter(d => d[xKey] != null && typeof d[key] === 'number' && !isNaN(d[key]))
          .map((d, i) => ({
            x: String(d[xKey]).slice(0, 15) || `Item ${i + 1}`, // Ensure string x value
            y: Number(d[key]) || 0
          }))
      })).filter(series => series.data.length > 0); // Only return series with data
      
    } catch (error) {
      console.error("Error processing line chart data:", error);
      return [];
    }
  }, [data, isDashboard, colors]);

  // Debug logging
  React.useEffect(() => {
    if (isDashboard && chartData.length > 0) {
      console.log('LineChart data processed:', {
        seriesCount: chartData.length,
        series: chartData.map(s => ({
          id: s.id,
          dataPoints: s.data.length,
          sampleData: s.data.slice(0, 3)
        }))
      });
    }
  }, [chartData, isDashboard]);

  // If no valid data, return placeholder
  if (!chartData.length) {
    return (
      <Box 
        height={isDashboard ? "280px" : "75vh"} 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ 
          backgroundColor: colors.primary[500],
          borderRadius: "8px",
          border: `1px solid ${colors.grey[700]}`
        }}
      >
        <Typography color={colors.grey[300]} variant="h6">
          No numeric data available for line chart
        </Typography>
      </Box>
    );
  }

  return (
    <Box height={isDashboard ? "280px" : "75vh"} width="100%">
      <ResponsiveLine
        data={chartData}
        theme={{
          axis: {
            domain: {
              line: {
                stroke: colors.grey[100],
                strokeWidth: 1,
              },
            },
            legend: {
              text: {
                fill: colors.grey[100],
                fontSize: isDashboard ? 10 : 12,
                fontWeight: 600,
              },
            },
            ticks: {
              line: {
                stroke: colors.grey[100],
                strokeWidth: 1,
              },
              text: {
                fill: colors.grey[100],
                fontSize: isDashboard ? 9 : 11,
              },
            },
          },
          legends: {
            text: {
              fill: colors.grey[100],
              fontSize: isDashboard ? 10 : 12,
            },
          },
          tooltip: {
            container: {
              background: colors.primary[500],
              color: colors.grey[100],
              border: `1px solid ${colors.grey[700]}`,
              borderRadius: "4px",
              fontSize: 12,
            },
          },
          grid: {
            line: {
              stroke: colors.grey[700],
              strokeWidth: 0.5,
            },
          },
        }}
        colors={{ datum: "color" }}
        margin={{ 
          top: isDashboard ? 20 : 50, 
          right: isDashboard ? 20 : 110, 
          bottom: isDashboard ? 40 : 50, 
          left: isDashboard ? 50 : 60 
        }}
        xScale={{ type: "point" }}
        yScale={{
          type: "linear",
          min: "auto",
          max: "auto",
          stacked: false,
          reverse: false,
        }}
        yFormat=" >-.2f"
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: isDashboard ? -45 : 0,
          legend: isDashboard ? undefined : "Categories",
          legendOffset: 36,
          legendPosition: "middle",
          truncateTickAt: isDashboard ? 6 : 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: isDashboard ? undefined : "Values",
          legendOffset: -40,
          legendPosition: "middle",
          tickValues: isDashboard ? 4 : 5,
        }}
        enableGridX={false}
        enableGridY={true}
        pointSize={isDashboard ? 4 : 6}
        pointColor={{ theme: "background" }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        animate={true}
        motionConfig="gentle"
        enableSlices="x"
        sliceTooltip={({ slice }) => (
          <div
            style={{
              background: colors.primary[500],
              padding: '9px 12px',
              border: `1px solid ${colors.grey[700]}`,
              borderRadius: '4px',
              color: colors.grey[100]
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {slice.points[0].data.xFormatted}
            </div>
            {slice.points.map((point, index) => (
              <div
                key={index}
                style={{
                  color: point.serieColor,
                  fontSize: '12px',
                  marginBottom: '2px'
                }}
              >
                <strong>{point.serieId}:</strong> {point.data.yFormatted}
              </div>
            ))}
          </div>
        )}
        legends={!isDashboard ? [
          {
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: "left-to-right",
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: "circle",
            symbolBorderColor: "rgba(0, 0, 0, .5)",
            effects: [
              {
                on: "hover",
                style: {
                  itemBackground: "rgba(0, 0, 0, .03)",
                  itemOpacity: 1,
                },
              },
            ],
          },
        ] : []}
      />
    </Box>
  );
};

export default LineChart;
