import React, { useMemo } from 'react';
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";

const ScatterChart = ({ data = [], isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Process data for scatter plot
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    try {
      const keys = Object.keys(data[0] || {});
      const numericKeys = keys.filter(key => typeof data[0][key] === 'number');
      
      if (numericKeys.length < 2) return [];

      // Use first two numeric columns for x and y
      const xKey = numericKeys[0];
      const yKey = numericKeys[1];
      
      // Group data by series (use string column if available, otherwise create single series)
      const stringKey = keys.find(key => typeof data[0][key] === 'string');
      
      if (stringKey) {
        // Group by string column
        const grouped = data.reduce((acc, item) => {
          const groupKey = item[stringKey] || 'Unknown';
          if (!acc[groupKey]) acc[groupKey] = [];
          acc[groupKey].push({
            x: item[xKey] || 0,
            y: item[yKey] || 0,
            id: `${groupKey}-${acc[groupKey].length}`
          });
          return acc;
        }, {});

        return Object.entries(grouped).slice(0, 5).map(([key, values]) => ({
          id: key,
          data: values.slice(0, 20) // Limit points per series
        }));
      } else {
        // Single series
        return [{
          id: 'Data Points',
          data: data.slice(0, 50).map((item, index) => ({
            x: item[xKey] || 0,
            y: item[yKey] || 0,
            id: `point-${index}`
          }))
        }];
      }
    } catch (error) {
      console.error('Error processing scatter chart data:', error);
      return [];
    }
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <span>No suitable data for scatter plot</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveScatterPlot
        data={chartData}
        theme={{
          background: colors.primary[400],
          text: {
            fontSize: 11,
            fill: colors.grey[100],
          },
          axis: {
            domain: {
              line: {
                stroke: colors.grey[100],
              },
            },
            legend: {
              text: {
                fill: colors.grey[100],
              },
            },
            ticks: {
              line: {
                stroke: colors.grey[100],
                strokeWidth: 1,
              },
              text: {
                fill: colors.grey[100],
              },
            },
          },
          grid: {
            line: {
              stroke: colors.grey[700],
              strokeWidth: 1,
            },
          },
          legends: {
            text: {
              fill: colors.grey[100],
            },
          },
        }}
        margin={{ top: 20, right: 120, bottom: 60, left: 80 }}
        xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        colors={{ scheme: 'nivo' }}
        blendMode="multiply"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          orient: 'bottom',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'X Axis',
          legendPosition: 'middle',
          legendOffset: 46
        }}
        axisLeft={{
          orient: 'left',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Y Axis',
          legendPosition: 'middle',
          legendOffset: -60
        }}
        legends={!isDashboard ? [
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 130,
            translateY: 0,
            itemWidth: 100,
            itemHeight: 12,
            itemsSpacing: 5,
            itemDirection: 'left-to-right',
            symbolSize: 12,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1
                }
              }
            ]
          }
        ] : []}
      />
    </div>
  );
};

export default ScatterChart;
