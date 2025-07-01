import React, { useMemo } from 'react';
import { useTheme } from "@mui/material";
import { tokens } from "../../theme";
import { Box, Typography } from "@mui/material";
import { ResponsivePie } from "@nivo/pie";

const PieChart = ({ data = [], isDashboard = false }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Process data for Nivo Pie Chart
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    try {
      const keys = Object.keys(data[0] || {});
      
      // Find label column (string values) and value column (numeric)
      const labelKey = keys.find(key => typeof data[0][key] === 'string') || keys[0];
      const valueKey = keys.find(key => typeof data[0][key] === 'number') || keys[1];
      
      if (!labelKey || !valueKey) {
        return [];
      }
      
      // Aggregate data by label and sum values
      const aggregated = data.reduce((acc, item) => {
        const label = item[labelKey]?.toString().slice(0, 15) || 'Unknown';
        const value = typeof item[valueKey] === 'number' ? item[valueKey] : 0;
        
        if (acc[label]) {
          acc[label] += value;
        } else {
          acc[label] = value;
        }
        
        return acc;
      }, {});
      
      // Convert to array and sort by value
      const pieData = Object.entries(aggregated)
        .map(([label, value]) => ({
          id: label,
          label: label,
          value: value
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, isDashboard ? 5 : 8); // Limit slices for better visualization
      
      return pieData;
    } catch (error) {
      console.error('Error processing pie chart data:', error);
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
          No data available for pie chart
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsivePie
      data={chartData}
      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      colors={{ scheme: 'nivo' }}
      borderWidth={1}
      borderColor={{
        from: 'color',
        modifiers: [['darker', 0.2]]
      }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor={colors.grey[100]}
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: 'color' }}
      arcLabelsSkipAngle={10}
      arcLabelsTextColor={{
        from: 'color',
        modifiers: [['darker', 2]]
      }}
      enableArcLabels={!isDashboard}
      enableArcLinkLabels={!isDashboard}
      legends={[
        {
          anchor: 'bottom',
          direction: 'row',
          justify: false,
          translateX: 0,
          translateY: isDashboard ? 56 : 70,
          itemsSpacing: 0,
          itemWidth: 100,
          itemHeight: 18,
          itemTextColor: colors.grey[100],
          itemDirection: 'left-to-right',
          itemOpacity: 1,
          symbolSize: 18,
          symbolShape: 'circle',
          effects: [
            {
              on: 'hover',
              style: {
                itemTextColor: colors.greenAccent[500]
              }
            }
          ]
        }
      ]}
      theme={{
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
        legends: {
          text: {
            fill: colors.grey[100],
          },
        },
        tooltip: {
          container: {
            color: colors.primary[500],
          },
        },
      }}
    />
  );
};

export default PieChart;
