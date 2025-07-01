import React, { useMemo } from 'react';
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { Box, Typography } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";

const BarChart = ({ data = [], isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Process data for Nivo Bar Chart
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { data: [], keys: [] };
    }

    try {
      const keys = Object.keys(data[0] || {});
      
      // Find label column (string values)
      const labelKey = keys.find(key => typeof data[0][key] === 'string') || keys[0];
      
      // Find numeric columns for bars
      const numericKeys = keys.filter(key => 
        key !== labelKey && typeof data[0][key] === 'number' && !isNaN(data[0][key])
      );
      
      if (!numericKeys.length) {
        return { data: [], keys: [] };
      }
      
      // Limit data for better visualization
      const limitedData = data.slice(0, isDashboard ? 6 : 10);
      const limitedKeys = numericKeys.slice(0, 3); // Max 3 series
      
      const processedData = limitedData.map((item, index) => {
        const result = {
          [labelKey]: item[labelKey]?.toString().slice(0, 12) || `Item ${index + 1}`,
        };
        
        limitedKeys.forEach(key => {
          result[key] = typeof item[key] === 'number' ? item[key] : 0;
        });
        
        return result;
      });
      
      return { 
        data: processedData, 
        keys: limitedKeys,
        labelKey 
      };
    } catch (error) {
      console.error("Error processing bar chart data:", error);
      return { data: [], keys: [] };
    }
  }, [data, isDashboard]);

  // If no valid data, return placeholder
  if (!chartData.data.length || !chartData.keys.length) {
    return (
      <Box 
        height={isDashboard ? "250px" : "75vh"} 
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
          No numeric data available for bar chart
        </Typography>
      </Box>
    );
  }

  return (
    <Box height={isDashboard ? "250px" : "75vh"}>
      <ResponsiveBar
        data={chartData.data}
        keys={chartData.keys}
        indexBy={chartData.labelKey}
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
                fontSize: 12,
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
                fontSize: 11,
              },
            },
          },
          legends: {
            text: {
              fill: colors.grey[100],
              fontSize: 12,
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
              strokeWidth: 1,
            },
          },
        }}
        margin={{ top: 50, right: isDashboard ? 20 : 130, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors={[colors.greenAccent[500], colors.blueAccent[500], colors.redAccent[500]]}
        borderColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: isDashboard ? -30 : 0,
          legend: isDashboard ? undefined : "Categories",
          legendPosition: "middle",
          legendOffset: 32,
          truncateTickAt: isDashboard ? 8 : 0,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: isDashboard ? undefined : "Values",
          legendPosition: "middle",
          legendOffset: -40,
          tickValues: 5,
        }}
        enableGridY={true}
        enableGridX={false}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: "color",
          modifiers: [["darker", 1.6]],
        }}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
        legends={!isDashboard && chartData.keys.length > 1 ? [
          {
            dataFrom: "keys",
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: "left-to-right",
            itemOpacity: 0.85,
            symbolSize: 20,
            effects: [
              {
                on: "hover",
                style: {
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

export default BarChart;
