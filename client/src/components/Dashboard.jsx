import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { 
  Box, 
  Button, 
  IconButton, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import { FileText, Share2, Copy, ExternalLink } from 'lucide-react';
import DownloadIcon from '@mui/icons-material/Download';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ShareIcon from '@mui/icons-material/Share';
import EmailIcon from '@mui/icons-material/Email';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TrafficIcon from '@mui/icons-material/Traffic';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { tokens } from '../theme';
import Header from './Header';
import StatBox from './charts/StatBox';
import ProgressCircle from './charts/ProgressCircle';
import BarChart from './charts/BarChart';
import LineChart from './charts/LineChart';
import PieChart from './charts/PieChart';
import AreaChart from './charts/AreaChart';
import ScatterChart from './charts/ScatterChart';

function Dashboard({ rawTable = [], title = 'Analytics Dashboard' }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { id } = useParams();
  const location = useLocation();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [embeddedData, setEmbeddedData] = useState([]);
  const [embeddedTitle, setEmbeddedTitle] = useState('');

  // Check if we're in iframe mode
  const isEmbedded = window !== window.top || new URLSearchParams(window.location.search).get('embed') === 'true';

  // Handle iframe data loading
  useEffect(() => {
    if (isEmbedded) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        const embedTitle = urlParams.get('title');
        
        console.log('Iframe mode detected. Checking for data...', {
          hasEncodedData: !!encodedData,
          hasTitle: !!embedTitle,
          urlLength: window.location.href.length
        });
        
        if (encodedData) {
          const decodedData = JSON.parse(decodeURIComponent(encodedData));
          setEmbeddedData(decodedData);
          console.log('Successfully loaded embedded data:', decodedData.length, 'records');
        } else {
          console.warn('No embedded data found in URL parameters');
        }
        
        if (embedTitle) {
          setEmbeddedTitle(embedTitle);
          document.title = `${embedTitle} - Embedded Dashboard`;
        }
      } catch (error) {
        console.error('Error loading iframe data:', error);
        setSnackbarMessage('Error loading embedded data');
        setSnackbarOpen(true);
      }
    }
  }, [isEmbedded]);

  // Use embedded data if available, otherwise use props
  const currentData = isEmbedded && embeddedData.length > 0 ? embeddedData : rawTable;
  const currentTitle = isEmbedded && embeddedTitle ? embeddedTitle : title;  // Handle PDF export - Full page capture including charts
  const handleExportPdf = async () => {
    console.log('Starting full-page PDF export...');
    setIsLoading(true);
    
    try {
      // Wait a bit for charts to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find the dashboard container element
      const dashboardElement = document.querySelector('[data-dashboard-container]') || 
                              document.querySelector('.MuiBox-root') ||
                              document.body;
      
      if (!dashboardElement) {
        throw new Error('Dashboard container not found');
      }

      setSnackbarMessage('Capturing dashboard...');
      setSnackbarOpen(true);

      // Configure html2canvas for high quality capture
      const canvas = await html2canvas(dashboardElement, {
        scale: 1.5, // Good balance between quality and performance
        useCORS: true,
        allowTaint: false,
        backgroundColor: colors.primary[400],
        width: dashboardElement.scrollWidth,
        height: dashboardElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        ignoreElements: (element) => {
          // Ignore scroll bars and other unwanted elements
          return element.classList.contains('MuiBackdrop-root') ||
                 element.classList.contains('MuiDialog-root') ||
                 element.tagName === 'SCRIPT';
        },
        onclone: (clonedDoc) => {
          // Ensure charts are visible in the clone
          const clonedElement = clonedDoc.querySelector('[data-dashboard-container]');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.webkitTransform = 'none';
            clonedElement.style.position = 'static';
          }
          
          // Force display of all chart elements
          const chartElements = clonedDoc.querySelectorAll('svg, canvas');
          chartElements.forEach(el => {
            el.style.visibility = 'visible';
            el.style.opacity = '1';
          });
        }
      });

      setSnackbarMessage('Generating PDF...');

      // Calculate PDF dimensions (A4 landscape for better dashboard viewing)
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 20; // margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // top margin

      // Add the dashboard image to PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG for smaller file size
      
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      // Add metadata page
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.text(currentTitle || 'Dashboard Report', 20, 30);
      
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 50);
      
      const recordCount = currentData ? currentData.length : 0;
      const columnCount = currentData && currentData.length > 0 ? Object.keys(currentData[0]).length : 0;
      
      pdf.text(`Total Records: ${recordCount}`, 20, 70);
      pdf.text(`Data Columns: ${columnCount}`, 20, 85);
      pdf.text('Dashboard exported as high-resolution visual snapshot', 20, 100);
      pdf.text('All charts and visualizations included', 20, 115);

      // Save PDF
      const fileName = `${(currentTitle || 'Dashboard').replace(/\s+/g, '_')}_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      setSnackbarMessage('Dashboard PDF exported successfully!');
      setSnackbarOpen(true);
      console.log('Full-page PDF export completed successfully');
    } catch (error) {
      console.error('PDF export failed:', error);
      setSnackbarMessage(`PDF export failed: ${error.message}`);
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle embed functionality
  const handleEmbed = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    
    try {
      // Try with full data first, if URL gets too long, reduce the data
      let dataToEmbed = currentData.slice(0, 500);
      let params = new URLSearchParams({
        embed: 'true',
        title: currentTitle,
        data: encodeURIComponent(JSON.stringify(dataToEmbed))
      });
      
      let embedUrl = `${baseUrl}?${params.toString()}`;
      
      // If URL is too long (browser limit ~2048 chars), reduce data
      if (embedUrl.length > 2000) {
        dataToEmbed = currentData.slice(0, 100);
        params = new URLSearchParams({
          embed: 'true',
          title: currentTitle,
          data: encodeURIComponent(JSON.stringify(dataToEmbed))
        });
        embedUrl = `${baseUrl}?${params.toString()}`;
        
        setSnackbarMessage('Large dataset detected - embedding first 100 records for optimal performance');
        setSnackbarOpen(true);
      }
      
      setEmbedUrl(embedUrl);
      setEmbedDialogOpen(true);
    } catch (error) {
      console.error('Error creating embed URL:', error);
      setSnackbarMessage('Error creating embed URL - data might be too large');
      setSnackbarOpen(true);
    }
  };

  const copyEmbedCode = () => {
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="800" frameborder="0" style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setSnackbarMessage('Embed code copied to clipboard!');
    setSnackbarOpen(true);
  };
  const copyEmbedUrl = () => {
    navigator.clipboard.writeText(embedUrl);
    setSnackbarMessage('Embed URL copied to clipboard!');
    setSnackbarOpen(true);
  };

  const handlePreviewEmbed = () => {
    setPreviewDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  };

  useEffect(() => {
    setLastUpdated(new Date());
  }, [currentData]);
  
  const handleExportTableCsv = async () => {
    setIsLoading(true);
    try {
      if (!hasValidData) return;
      
      const headers = Object.keys(currentData[0] || {});
      const csvContent = [
        headers.join(','),
        ...currentData.map(row => headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value !== undefined && value !== null ? value : '';
        }).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getKPI = (table, key) => {
    if (!table || table.length === 0 || !key) return { count: 'NA', sum: 'NA', avg: 'NA' };
    
    const numericValues = table
      .map(row => row[key])
      .filter(val => typeof val === 'number' && !isNaN(val));
    
    if (numericValues.length === 0) return { count: 'NA', sum: 'NA', avg: 'NA' };
    
    const sum = numericValues.reduce((acc, val) => acc + val, 0);
    const count = numericValues.length;
    const avg = count > 0 ? sum / count : 0;
    
    return { 
      count: count.toString(), 
      sum: sum.toLocaleString(), 
      avg: Math.round(avg).toLocaleString() 
    };
  };  // Enhanced data validation
  const hasValidData = currentData && Array.isArray(currentData) && currentData.length > 0;
  const dataKeys = hasValidData ? Object.keys(currentData[0] || {}) : [];
  const numericKeys = hasValidData ? dataKeys.filter(k => typeof currentData[0]?.[k] === 'number') : [];
  const stringKeys = hasValidData ? dataKeys.filter(k => typeof currentData[0]?.[k] === 'string') : [];
  const kpiKey = numericKeys.length > 0 ? numericKeys[0] : null;
  const kpiData = getKPI(currentData, kpiKey);
  
  // Chart availability checks - More lenient to show more charts
  const hasLineChartData = numericKeys.length > 0; // Show if any numeric data
  const hasBarChartData = numericKeys.length > 0; // Show if any numeric data  
  const hasPieChartData = dataKeys.length > 1; // Show if multiple columns
  const hasAreaChartData = numericKeys.length > 0; // Show if any numeric data
  const hasScatterChartData = numericKeys.length >= 1; // Show even with 1 numeric column
  
  // Paginated data for the table
  const paginatedData = hasValidData 
    ? currentData.slice(currentPage * rowsPerPage, currentPage * rowsPerPage + rowsPerPage) 
    : [];

  // Show loading or no data state
  if (!hasValidData) {
    return (
      <Box m="20px">
        <Header title="ANALYTICS DASHBOARD" subtitle="Welcome to your data dashboard" />
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          height="60vh"
          backgroundColor={colors.primary[400]}
          borderRadius="10px"
        >
          <Box textAlign="center" p="30px">
            <Box 
              width="80px" 
              height="80px" 
              margin="0 auto 20px" 
              backgroundColor={colors.primary[500]} 
              borderRadius="50%" 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
            >
              <AssessmentIcon sx={{ fontSize: "40px", color: colors.grey[100] }} />
            </Box>
            <Typography variant="h3" color={colors.grey[100]} fontWeight="bold" mb="10px">
              No Data Available
            </Typography>
            <Typography variant="h5" color={colors.greenAccent[400]}>
              Please provide data to generate the dashboard.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box m={isEmbedded ? "10px" : "20px"} data-dashboard-container="true">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="ANALYTICS DASHBOARD" subtitle={`${currentTitle} - ${currentData.length} records analyzed`} />

        <Box display="flex" gap="10px">
          {!isEmbedded && (
            <>
              <Button
                onClick={handleEmbed}
                sx={{
                  backgroundColor: colors.greenAccent[700],
                  color: colors.grey[100],
                  fontSize: "14px",
                  fontWeight: "bold",
                  padding: "10px 20px",
                }}
              >
                <ShareIcon sx={{ mr: "10px" }} />
                Embed Dashboard
              </Button>
              <Button
                onClick={handleExportPdf}
                disabled={isLoading}
                sx={{
                  backgroundColor: colors.blueAccent[700],
                  color: colors.grey[100],
                  fontSize: "14px",
                  fontWeight: "bold",
                  padding: "10px 20px",
                }}
              >
                <DownloadOutlinedIcon sx={{ mr: "10px" }} />
                {isLoading ? 'Capturing Dashboard...' : 'Export as PDF'}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* GRID & CHARTS */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="140px"
        gap="20px"
      >
        {/* ROW 1 - KPI CARDS */}
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={currentData.length.toString()}
            subtitle="Total Records"
            progress="0.75"
            increase="+14%"
            icon={
              <AssessmentIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={dataKeys.length.toString()}
            subtitle="Data Columns"
            progress="0.85"
            increase="+8%"
            icon={
              <EmailIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={kpiData.sum}
            subtitle={kpiKey ? `Total ${kpiKey}` : 'Total Value'}
            progress="0.95"
            increase="+23%"
            icon={
              <PointOfSaleIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>
        
        <Box
          gridColumn="span 3"
          backgroundColor={colors.primary[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <StatBox
            title={kpiData.avg}
            subtitle={kpiKey ? `Avg ${kpiKey}` : 'Average Value'}
            progress="0.80"
            increase="+12%"
            icon={
              <TrendingUpIcon
                sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
              />
            }
          />
        </Box>

        {/* ROW 2 - MAIN TREND CHART */}
        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          borderRadius="10px"
          overflow="hidden"
        >
          <Box
            mt="25px"
            p="0 30px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                color={colors.grey[100]}
              >
                Data Trends
              </Typography>
              <Typography
                variant="h3"
                fontWeight="bold"
                color={colors.greenAccent[500]}
              >
                {kpiData.sum}
              </Typography>
            </Box>
            <Box>
              <IconButton onClick={handleExportTableCsv}>
                <DownloadOutlinedIcon
                  sx={{ fontSize: "26px", color: colors.greenAccent[500] }}
                />
              </IconButton>
            </Box>
          </Box>
          <Box height="250px" m="-20px 0 0 0" p="10px">
            <LineChart data={currentData} isDashboard={true} />
          </Box>
        </Box>

        {/* ROW 2 - DATA PREVIEW */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          overflow="auto"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            borderBottom={`4px solid ${colors.primary[500]}`}
            p="15px"
          >
            <Typography color={colors.grey[100]} variant="h5" fontWeight="600">
              Data Preview
            </Typography>
          </Box>
          {paginatedData.slice(0, 6).map((row, i) => (
            <Box
              key={i}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`4px solid ${colors.primary[500]}`}
              p="15px"
            >
              <Box>
                <Typography
                  color={colors.greenAccent[500]}
                  variant="h5"
                  fontWeight="600"
                >
                  #{i + 1}
                </Typography>
                <Typography color={colors.grey[100]} fontSize="12px">
                  {dataKeys.slice(0, 2).map(key => 
                    `${key}: ${row[key] || 'N/A'}`
                  ).join(' | ')}
                </Typography>
              </Box>
              <Box
                backgroundColor={colors.greenAccent[500]}
                p="5px 10px"
                borderRadius="4px"
                color={colors.primary[900]}
              >
                Row {i + 1}
              </Box>
            </Box>
          ))}
        </Box>

        {/* ROW 3 - PROGRESS CIRCLE */}
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          borderRadius="10px"
          p="30px"
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            mt="25px"
          >
            <ProgressCircle size="125" progress="0.85" />
            <Typography
              variant="h5"
              color={colors.greenAccent[500]}
              sx={{ mt: "15px" }}
            >
              85% Data Quality
            </Typography>
            <Typography color={colors.grey[300]} textAlign="center">
              {currentData.length} records analyzed
            </Typography>
          </Box>
        </Box>
        
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          borderRadius="10px"
        >
          <Box height="280px" mt="20px">
            <BarChart data={currentData} isDashboard={true} />
          </Box>
        </Box>
        
        <Box
          gridColumn="span 4"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          borderRadius="10px"
          padding="30px"
        >
          <Box height="200px">
            <PieChart data={currentData} isDashboard={true} />
          </Box>
        </Box>

        {/* ROW 4 - AREA AND SCATTER CHARTS */}
        <Box
          gridColumn="span 6"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          borderRadius="10px"
        >
          <Box height="280px" mt="20px">
            <AreaChart data={currentData} isDashboard={true} />
          </Box>
        </Box>

        <Box
          gridColumn="span 6"
          gridRow="span 2"
          backgroundColor={colors.primary[400]}
          borderRadius="10px"
        >
          <Box height="280px" mt="20px">
            <ScatterChart data={currentData} isDashboard={true} />
          </Box>
        </Box>

        {/* ROW 6 - DATA TABLE */}
        <Box
          gridColumn="span 12"
          gridRow="span 3"
          backgroundColor={colors.primary[400]}
          borderRadius="10px"
          p="20px"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
            <Typography variant="h5" fontWeight="600" color={colors.grey[100]}>
              Complete Data Table
            </Typography>
            <IconButton 
              onClick={handleExportTableCsv}
              disabled={isLoading}
              sx={{ color: colors.grey[100] }}
            >
              <DownloadIcon />
            </IconButton>
          </Box>
          
          <TableContainer component={Paper} sx={{ 
            backgroundColor: colors.primary[400],
            maxHeight: "300px" 
          }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {dataKeys.map((column) => (
                    <TableCell 
                      key={column}
                      sx={{ 
                        backgroundColor: colors.blueAccent[700],
                        color: colors.grey[100],
                        fontWeight: "bold"
                      }}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow 
                    key={index}
                    sx={{ 
                      "&:hover": { backgroundColor: colors.primary[500] }
                    }}
                  >
                    {dataKeys.map((column) => (
                      <TableCell 
                        key={`${index}-${column}`}
                        sx={{ 
                          color: colors.grey[100],
                          borderBottom: `1px solid ${colors.grey[700]}`
                        }}
                      >
                        {typeof row[column] === 'number' 
                          ? row[column].toLocaleString() 
                          : row[column] || 'NA'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={currentData.length}
            rowsPerPage={rowsPerPage}
            page={currentPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ 
              color: colors.grey[100],
              '.MuiTablePagination-select': { color: colors.grey[100] },
              '.MuiTablePagination-selectIcon': { color: colors.grey[100] }
            }}
          />
        </Box>
      </Box>

      {/* Embed Dialog */}
      <Dialog open={embedDialogOpen} onClose={() => setEmbedDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: colors.primary[400], color: colors.grey[100] }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Share2 size={20} />
            Embed Dashboard
          </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: colors.primary[400], color: colors.grey[100] }}>
          <Typography variant="body1" sx={{ mb: 2, mt: 2 }}>
            Use the embed URL or iframe code to integrate this dashboard into your website or application.
          </Typography>
          
          <Typography variant="subtitle2" sx={{ mb: 1, color: colors.grey[300] }}>
            Embed URL:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              value={embedUrl}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                sx: { backgroundColor: colors.primary[500], color: colors.grey[100] }
              }}
            />
            <Button
              variant="outlined"
              onClick={copyEmbedUrl}
              sx={{ 
                borderColor: colors.grey[700], 
                color: colors.grey[100],
                '&:hover': { borderColor: colors.grey[600] }
              }}
            >
              <Copy size={16} />
            </Button>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1, color: colors.grey[300] }}>
            Iframe Code:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={`<iframe 
  src="${embedUrl}" 
  width="100%" 
  height="800" 
  frameborder="0" 
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
</iframe>`}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                sx: { backgroundColor: colors.primary[500], color: colors.grey[100] }
              }}
            />
            <Button
              variant="outlined"
              onClick={copyEmbedCode}
              sx={{ 
                borderColor: colors.grey[700], 
                color: colors.grey[100],
                '&:hover': { borderColor: colors.grey[600] }
              }}
            >
              <Copy size={16} />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.primary[400], p: 2 }}>
          <Button
            onClick={handlePreviewEmbed}
            sx={{ color: colors.blueAccent[400] }}
            startIcon={<ExternalLink size={16} />}
          >
            Live Preview
          </Button>
          <Button
            onClick={() => window.open(embedUrl, '_blank')}
            sx={{ color: colors.greenAccent[400] }}
            startIcon={<ExternalLink size={16} />}
          >
            Open in New Tab
          </Button>
          <Button 
            onClick={() => setEmbedDialogOpen(false)}
            sx={{ color: colors.grey[100] }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Embed Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            backgroundColor: colors.primary[400],
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: colors.primary[400], color: colors.grey[100] }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ExternalLink size={20} />
              Embed Preview
            </Box>
            <Typography variant="body2" sx={{ color: colors.grey[300] }}>
              This is how your dashboard will appear when embedded
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ 
          backgroundColor: colors.primary[400], 
          p: 1,
          height: '100%',
          overflow: 'hidden'
        }}>
          <Box
            component="iframe"
            src={embedUrl}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: colors.primary[500]
            }}
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: colors.primary[400], p: 2 }}>
          <Button 
            onClick={() => setPreviewDialogOpen(false)}
            sx={{ color: colors.grey[100] }}
          >
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Dashboard;
