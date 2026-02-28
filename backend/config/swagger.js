const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Thermovex Courier API',
            version: '1.0.0',
            description: 'RESTful API for integrating with Thermovex Courier Management System. This API allows third-party applications to create bookings, track shipments, calculate rates, and manage invoices.',
            contact: {
                name: 'Thermovex API Support',
                email: 'api@thermovex.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Development server'
            },
            {
                url: 'https://api.thermovex.com/v1',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'API Key for authentication'
                },
                ApiSecretAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Secret',
                    description: 'API Secret for authentication'
                }
            },
            schemas: {
                Booking: {
                    type: 'object',
                    required: ['consignee', 'serviceType', 'weight'],
                    properties: {
                        consignee: {
                            type: 'object',
                            required: ['name', 'phone', 'address', 'city', 'state', 'pincode'],
                            properties: {
                                name: { type: 'string', example: 'John Doe' },
                                phone: { type: 'string', example: '9876543210' },
                                email: { type: 'string', example: 'john@example.com' },
                                address: { type: 'string', example: '123 Main Street' },
                                city: { type: 'string', example: 'Mumbai' },
                                state: { type: 'string', example: 'Maharashtra' },
                                pincode: { type: 'string', example: '400001' }
                            }
                        },
                        serviceType: {
                            type: 'string',
                            enum: ['Express', 'Standard', 'Economy', 'Same Day', 'Overnight', 'International'],
                            example: 'Express'
                        },
                        shipmentType: {
                            type: 'string',
                            enum: ['Document', 'Parcel', 'Cargo'],
                            example: 'Parcel'
                        },
                        weight: { type: 'number', example: 2.5 },
                        dimensions: {
                            type: 'object',
                            properties: {
                                length: { type: 'number', example: 30 },
                                width: { type: 'number', example: 20 },
                                height: { type: 'number', example: 10 }
                            }
                        },
                        paymentMode: {
                            type: 'string',
                            enum: ['COD', 'Prepaid', 'Credit'],
                            example: 'Prepaid'
                        },
                        codAmount: { type: 'number', example: 0 },
                        packageValue: { type: 'number', example: 5000 },
                        referenceNumber: { type: 'string', example: 'ORD12345' },
                        specialInstructions: { type: 'string', example: 'Handle with care' }
                    }
                },
                BookingResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: {
                            type: 'object',
                            properties: {
                                awbNumber: { type: 'string', example: 'AWB0001234' },
                                bookingId: { type: 'string' },
                                status: { type: 'string', example: 'Booked' },
                                expectedDelivery: { type: 'string', format: 'date-time' },
                                totalAmount: { type: 'number', example: 350.50 },
                                consignee: { type: 'object' },
                                charges: { type: 'object' }
                            }
                        }
                    }
                },
                TrackingResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: {
                            type: 'object',
                            properties: {
                                awbNumber: { type: 'string', example: 'AWB0001234' },
                                currentStatus: { type: 'string', example: 'In Transit' },
                                currentLocation: { type: 'string', example: 'Mumbai Hub' },
                                expectedDelivery: { type: 'string', format: 'date-time' },
                                timeline: { type: 'array', items: { type: 'object' } },
                                pod: { type: 'object' }
                            }
                        }
                    }
                },
                RateRequest: {
                    type: 'object',
                    required: ['serviceType', 'weight'],
                    properties: {
                        serviceType: {
                            type: 'string',
                            enum: ['Express', 'Standard', 'Economy', 'Same Day', 'Overnight', 'International']
                        },
                        weight: { type: 'number', example: 2.5 },
                        packageValue: { type: 'number', example: 5000 },
                        codAmount: { type: 'number', example: 0 }
                    }
                },
                RateResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: {
                            type: 'object',
                            properties: {
                                serviceType: { type: 'string' },
                                weight: { type: 'number' },
                                charges: {
                                    type: 'object',
                                    properties: {
                                        shipping: { type: 'number' },
                                        insurance: { type: 'number' },
                                        cod: { type: 'number' },
                                        fuelSurcharge: { type: 'number' },
                                        gst: { type: 'number' },
                                        total: { type: 'number' }
                                    }
                                },
                                estimatedDelivery: { type: 'string', format: 'date-time' }
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example: 'Error message' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        security: [
            {
                ApiKeyAuth: [],
                ApiSecretAuth: []
            }
        ]
    },
    apis: ['./routes/api.routes.js', './controllers/api.controller.js']
};

const swaggerSpec = swaggerJsdoc(options);

// Custom Swagger documentation
swaggerSpec.paths = {
    '/bookings': {
        post: {
            tags: ['Bookings'],
            summary: 'Create a new booking',
            description: 'Creates a new shipment booking with automatic AWB generation and rate calculation',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Booking' }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Booking created successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/BookingResponse' }
                        }
                    }
                },
                '400': {
                    description: 'Bad request - Missing required fields',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' }
                        }
                    }
                },
                '401': {
                    description: 'Unauthorized - Invalid API credentials'
                },
                '429': {
                    description: 'Rate limit exceeded'
                }
            }
        }
    },
    '/bookings/{awbNumber}': {
        get: {
            tags: ['Bookings'],
            summary: 'Get booking details',
            description: 'Retrieves detailed information about a specific booking',
            parameters: [
                {
                    name: 'awbNumber',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'AWB number of the booking',
                    example: 'AWB0001234'
                }
            ],
            responses: {
                '200': {
                    description: 'Booking details retrieved successfully'
                },
                '404': {
                    description: 'Booking not found'
                }
            }
        }
    },
    '/track/{awbNumber}': {
        get: {
            tags: ['Tracking'],
            summary: 'Track shipment',
            description: 'Get real-time tracking information for a shipment',
            parameters: [
                {
                    name: 'awbNumber',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'AWB number to track',
                    example: 'AWB0001234'
                }
            ],
            responses: {
                '200': {
                    description: 'Tracking information retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/TrackingResponse' }
                        }
                    }
                },
                '404': {
                    description: 'Shipment not found'
                }
            }
        }
    },
    '/rates/calculate': {
        post: {
            tags: ['Rates'],
            summary: 'Calculate shipping rate',
            description: 'Calculate shipping charges for a shipment based on service type, weight, and other parameters',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/RateRequest' }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Rate calculated successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RateResponse' }
                        }
                    }
                },
                '400': {
                    description: 'Bad request'
                }
            }
        }
    },
    '/invoices': {
        get: {
            tags: ['Invoices'],
            summary: 'Get invoices',
            description: 'Retrieve list of invoices with optional filtering',
            parameters: [
                {
                    name: 'status',
                    in: 'query',
                    schema: { type: 'string' },
                    description: 'Filter by invoice status'
                },
                {
                    name: 'startDate',
                    in: 'query',
                    schema: { type: 'string', format: 'date' },
                    description: 'Start date for filtering'
                },
                {
                    name: 'endDate',
                    in: 'query',
                    schema: { type: 'string', format: 'date' },
                    description: 'End date for filtering'
                },
                {
                    name: 'limit',
                    in: 'query',
                    schema: { type: 'integer', default: 50 },
                    description: 'Number of results per page'
                },
                {
                    name: 'page',
                    in: 'query',
                    schema: { type: 'integer', default: 1 },
                    description: 'Page number'
                }
            ],
            responses: {
                '200': {
                    description: 'Invoices retrieved successfully'
                }
            }
        }
    }
};

module.exports = { swaggerSpec, swaggerUi };
