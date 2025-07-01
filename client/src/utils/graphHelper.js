
export const graphHelper = (data, type) => {
  // Validate input data
  if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
    console.warn('Invalid or empty data provided to graphHelper.');
    return null;
  }

  const columns = Object.keys(data[0]);

  // Ensure there are at least two columns to plot
  if (columns.length < 2) {
    console.warn('Insufficient columns for graph generation:', data[0]);
    return null;
  }

  const [xField, yField] = columns;

  // Define chart specs based on type
  switch (type) {
    case 'bar':
      return {
        mark: 'bar',
        encoding: {
          x: { field: xField, type: 'nominal' },
          y: { field: yField, type: 'quantitative' }
        },
        data: { values: data }
      };

    case 'line':
      return {
        mark: 'line',
        encoding: {
          x: { field: xField, type: 'temporal' }, // Change to 'ordinal' if not date
          y: { field: yField, type: 'quantitative' }
        },
        data: { values: data }
      };

    case 'area':
      return {
        mark: 'area',
        encoding: {
          x: { field: xField, type: 'temporal' },
          y: { field: yField, type: 'quantitative' }
        },
        data: { values: data }
      };

    case 'scatter':
      return {
        mark: 'point',
        encoding: {
          x: { field: xField, type: 'quantitative' },
          y: { field: yField, type: 'quantitative' }
        },
        data: { values: data }
      };

    case 'pie':
      return {
        mark: { type: 'arc', tooltip: true },
        encoding: {
          theta: { field: yField, type: 'quantitative' },
          color: { field: xField, type: 'nominal' }
        },
        data: { values: data },
        view: { stroke: null }
      };

    default:
      // Fallback to bar chart
      return {
        mark: 'bar',
        encoding: {
          x: { field: xField, type: 'nominal' },
          y: { field: yField, type: 'quantitative' }
        },
        data: { values: data }
      };
  }
};
