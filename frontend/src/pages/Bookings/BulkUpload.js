import React, { useState } from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Alert,
    LinearProgress,
    Chip,
    Grid
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    CloudUpload as UploadIcon,
    Download as DownloadIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { bookingAPI } from '../../services/api';

const BulkUpload = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
                toast.error('Please upload an Excel file (.xlsx or .xls)');
                return;
            }
            setFile(selectedFile);
            parseExcelFile(selectedFile);
        }
    };

    const parseExcelFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Map Excel columns to booking fields
                const mappedData = jsonData.map((row, index) => ({
                    rowNumber: index + 2, // Excel row number (accounting for header)
                    shipper: row['Shipper ID'] || '',
                    consigneeDetails: {
                        name: row['Consignee Name'] || '',
                        mobile: row['Consignee Mobile'] || '',
                        email: row['Consignee Email'] || '',
                        company: row['Consignee Company'] || '',
                        address: {
                            street: row['Consignee Address'] || '',
                            city: row['Consignee City'] || '',
                            state: row['Consignee State'] || '',
                            postalCode: row['Consignee Postal Code'] || '',
                            country: row['Consignee Country'] || 'USA'
                        }
                    },
                    serviceType: row['Service Type'] || 'Standard',
                    shipmentType: row['Shipment Type'] || 'Parcel',
                    destinationType: row['Destination Type'] || 'Local',
                    numberOfPieces: parseInt(row['Number of Pieces']) || 1,
                    weight: parseFloat(row['Weight (kg)']) || 0,
                    weightUnit: 'kg',
                    description: row['Description'] || '',
                    declaredValue: parseFloat(row['Declared Value']) || 0,
                    paymentMode: row['Payment Mode'] || 'COD',
                    codAmount: parseFloat(row['COD Amount']) || 0,
                    referenceNumber: row['Reference Number'] || '',
                    specialInstructions: row['Special Instructions'] || ''
                }));

                setParsedData(mappedData);
                toast.success(`${mappedData.length} bookings parsed from Excel`);
            } catch (error) {
                toast.error('Failed to parse Excel file. Please check the format.');
                console.error(error);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async () => {
        if (parsedData.length === 0) {
            toast.error('No data to upload');
            return;
        }

        setUploading(true);
        try {
            const response = await bookingAPI.bulkCreate(parsedData);
            setUploadResults(response.data.data);

            const successCount = response.data.data.success.length;
            const failedCount = response.data.data.failed.length;

            if (failedCount === 0) {
                toast.success(`All ${successCount} bookings created successfully!`);
            } else {
                toast.warning(`${successCount} bookings created, ${failedCount} failed`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload bookings');
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const template = [
            {
                'Shipper ID': '60a7f3c8b3f4d5e8a0b1c2d3',
                'Consignee Name': 'John Doe',
                'Consignee Mobile': '+1234567890',
                'Consignee Email': 'john@example.com',
                'Consignee Company': 'ABC Corp',
                'Consignee Address': '123 Main Street',
                'Consignee City': 'New York',
                'Consignee State': 'NY',
                'Consignee Postal Code': '10001',
                'Consignee Country': 'USA',
                'Service Type': 'Standard',
                'Shipment Type': 'Parcel',
                'Destination Type': 'Local',
                'Number of Pieces': 1,
                'Weight (kg)': 2.5,
                'Description': 'Sample Product',
                'Declared Value': 100,
                'Payment Mode': 'COD',
                'COD Amount': 100,
                'Reference Number': 'REF123',
                'Special Instructions': 'Handle with care'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
        XLSX.writeFile(workbook, 'booking_template.xlsx');
        toast.success('Template downloaded successfully');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/bookings')} sx={{ mr: 2 }}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">
                    Bulk Upload Bookings
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Alert severity="info">
                        <Typography variant="body2">
                            Upload an Excel file with booking details. Download the template to see the required format.
                        </Typography>
                    </Alert>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={downloadTemplate}
                            >
                                Download Template
                            </Button>

                            <Button
                                variant="contained"
                                component="label"
                                startIcon={<UploadIcon />}
                            >
                                Choose Excel File
                                <input
                                    type="file"
                                    hidden
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                />
                            </Button>

                            {parsedData.length > 0 && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleUpload}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Uploading...' : `Upload ${parsedData.length} Bookings`}
                                </Button>
                            )}
                        </Box>

                        {file && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                File selected: {file.name} ({parsedData.length} rows)
                            </Alert>
                        )}

                        {uploading && <LinearProgress sx={{ mb: 2 }} />}
                    </Paper>
                </Grid>

                {/* Parsed Data Preview */}
                {parsedData.length > 0 && !uploadResults && (
                    <Grid item xs={12}>
                        <Paper>
                            <Box sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Preview ({parsedData.length} bookings)
                                </Typography>
                            </Box>
                            <TableContainer sx={{ maxHeight: 400 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Row</TableCell>
                                            <TableCell>Consignee Name</TableCell>
                                            <TableCell>Mobile</TableCell>
                                            <TableCell>City</TableCell>
                                            <TableCell>Service</TableCell>
                                            <TableCell>Weight</TableCell>
                                            <TableCell>Payment</TableCell>
                                            <TableCell>Description</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {parsedData.slice(0, 50).map((booking, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{booking.rowNumber}</TableCell>
                                                <TableCell>{booking.consigneeDetails.name}</TableCell>
                                                <TableCell>{booking.consigneeDetails.mobile}</TableCell>
                                                <TableCell>{booking.consigneeDetails.address.city}</TableCell>
                                                <TableCell>{booking.serviceType}</TableCell>
                                                <TableCell>{booking.weight} kg</TableCell>
                                                <TableCell>
                                                    <Chip label={booking.paymentMode} size="small" />
                                                </TableCell>
                                                <TableCell>{booking.description.substring(0, 30)}...</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {parsedData.length > 50 && (
                                <Box sx={{ p: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Showing first 50 of {parsedData.length} bookings
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                )}

                {/* Upload Results */}
                {uploadResults && (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Upload Results
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SuccessIcon color="success" />
                                    <Typography>
                                        <strong>{uploadResults.success.length}</strong> Successful
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ErrorIcon color="error" />
                                    <Typography>
                                        <strong>{uploadResults.failed.length}</strong> Failed
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Successful Uploads */}
                            {uploadResults.success.length > 0 && (
                                <>
                                    <Typography variant="subtitle1" color="success.main" gutterBottom>
                                        Successfully Created Bookings:
                                    </Typography>
                                    <TableContainer sx={{ maxHeight: 300, mb: 3 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Row</TableCell>
                                                    <TableCell>AWB Number</TableCell>
                                                    <TableCell>Consignee</TableCell>
                                                    <TableCell>Service</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {uploadResults.success.map((result, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{result.row}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={result.awbNumber}
                                                                size="small"
                                                                color="success"
                                                                onClick={() => navigate(`/bookings/${result.booking._id}`)}
                                                                clickable
                                                            />
                                                        </TableCell>
                                                        <TableCell>{result.booking.consigneeDetails.name}</TableCell>
                                                        <TableCell>{result.booking.serviceType}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}

                            {/* Failed Uploads */}
                            {uploadResults.failed.length > 0 && (
                                <>
                                    <Typography variant="subtitle1" color="error.main" gutterBottom>
                                        Failed Bookings:
                                    </Typography>
                                    <TableContainer sx={{ maxHeight: 300 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Row</TableCell>
                                                    <TableCell>Error</TableCell>
                                                    <TableCell>Consignee Name</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {uploadResults.failed.map((result, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{result.row}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" color="error">
                                                                {result.error}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>{result.data?.consigneeDetails?.name || 'N/A'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}

                            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setFile(null);
                                        setParsedData([]);
                                        setUploadResults(null);
                                    }}
                                >
                                    Upload Another File
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate('/bookings')}
                                >
                                    View All Bookings
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default BulkUpload;
