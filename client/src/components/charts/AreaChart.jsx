import React, { useMemo } from 'react';
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { Box, Typography } from "@mui/material";
import { ResponsiveLine } from "@nivo/line";

const AreaChart = ({ data = [], isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Process data for area chart
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    try {
      const keys = Object.keys(data[0] || {});
      
      // Find suitable columns
      const xKey = keys.find(key => typeof data[0][key] === 'string') || keys[0];
      const numericKeys = keys.filter(key => 
        key !== xKey && typeof data[0][key] === 'number' && !isNaN(data[0][key])
      ).slice(0, isDashboard ? 2 : 3); // Limit series for dashboard
      
      if (!numericKeys.length) {
        return [];
      }
      
      // Limit data points for better performance
      const limitedData = data.slice(0, isDashboard ? 10 : 20);
      
      return numericKeys.map((key, index) => ({
        id: key,
        color: `hsl(${140 + index * 60}, 70%, 50%)`,
        data: limitedData.map((item, dataIndex) => ({
          x: item[xKey]?.toString().slice(0, 10) || `Point ${dataIndex + 1}`,
          y: typeof item[key] === 'number' ? item[key] : 0
        }))
      }));
      
    } catch (error) {
      console.error('Error processing area chart data:', error);
      return [];
    }
  }, [data, isDashboard]);

  if (!chartData.length) {
    return (
      <Box
        height="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="h6" color={colors.grey[300]}>
          No data available for area chart
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveLine
      data={chartData}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: 'point' }}
      yScale={{
        type: 'linear',
        min: 'auto',
        max: 'auto',
        stacked: false,
        reverse: false
      }}
      yFormat=" >-.2f"
      curve="cardinal"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: 'bottom',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? '' : 'Category',
        legendOffset: 36,
        legendPosition: 'middle'
      }}
      axisLeft={{
        orient: 'left',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: isDashboard ? '' : 'Value',
        legendOffset: -40,
        legendPosition: 'middle'
      }}
      enableGridX={false}
      enableGridY={true}
      pointSize={8}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabelYOffset={-12}
      enableArea={true}
      areaOpacity={0.15}
      useMesh={true}
      enableSlices="x"
      colors={{ scheme: 'category10' }}
      legends={!isDashboard ? [
        {
          anchor: 'bottom-right',
          direction: 'column',
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: 'left-to-right',
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: 'circle',
          symbolBorderColor: 'rgba(0, 0, 0, .5)',
          effects: [
            {
              on: 'hover',
              style: {
                itemBackground: 'rgba(0, 0, 0, .03)',
                itemOpacity: 1
              }
            }
          ]
        }
      ] : []}
      theme={{
        background: colors.primary[400],
        text: {
          fontSize: 11,
          fill: colors.grey[100],
          outlineWidth: 0,
          outlineColor: "transparent"
        },
        axis: {
          domain: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1
            }
          },
          legend: {
            text: {
              fontSize: 12,
              fill: colors.grey[100],
              outlineWidth: 0,
              outlineColor: "transparent"
            }
          },
          ticks: {
            line: {
              stroke: colors.grey[100],
              strokeWidth: 1
            },
            text: {
              fontSize: 11,
              fill: colors.grey[100],
              outlineWidth: 0,
              outlineColor: "transparent"
            }
          }
        },
        grid: {
          line: {
            stroke: colors.grey[100],
            strokeWidth: 0.5
          }
        },
        legends: {
          title: {
            text: {
              fontSize: 11,
              fill: colors.grey[100],
              outlineWidth: 0,
              outlineColor: "transparent"
            }
          },
          text: {
            fontSize: 11,
            fill: colors.grey[100],
            outlineWidth: 0,
            outlineColor: "transparent"
          }
        },
        tooltip: {
          container: {
            background: colors.primary[400],
            color: colors.grey[100],
          }
        }
      }}
    />
  );
};

export default AreaChart;
