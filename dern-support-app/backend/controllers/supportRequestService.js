// Process file attachments for support requests
export const processAttachments = async (files) => {
    // In a real application, this would handle file storage
    // For this implementation, we'll create attachment metadata
    return files.map(file => ({
        filename: file.filename || `file-${Date.now()}`,
        originalname: file.originalname || 'uploaded-file',
        path: file.path || `/uploads/${file.filename}`,
        mimetype: file.mimetype || 'application/octet-stream',
        size: file.size || 0,
        uploadedAt: new Date()
    }));
};

// Get dynamic fields based on request type
export const getDynamicFieldsForRequestType = (requestType) => {
    const fieldDefinitions = {
        hardware: [
            { name: 'deviceType', type: 'string', required: true },
            { name: 'model', type: 'string', required: true },
            { name: 'serialNumber', type: 'string', required: false },
            { name: 'purchaseDate', type: 'date', required: false }
        ],
        software: [
            { name: 'softwareName', type: 'string', required: true },
            { name: 'version', type: 'string', required: true },
            { name: 'operatingSystem', type: 'string', required: true },
            { name: 'installationDate', type: 'date', required: false }
        ],
        network: [
            { name: 'networkType', type: 'string', required: true },
            { name: 'deviceAffected', type: 'string', required: true },
            { name: 'connectionType', type: 'string', required: false }
        ],
        account: [
            { name: 'accountType', type: 'string', required: true },
            { name: 'username', type: 'string', required: true },
            { name: 'lastAccessDate', type: 'date', required: false }
        ],
        other: [
            { name: 'category', type: 'string', required: false }
        ]
    };

    return fieldDefinitions[requestType] || [];
};

// Validate dynamic fields based on request type
export const validateDynamicFields = (requestType, dynamicFields) => {
    const requiredFields = getDynamicFieldsForRequestType(requestType)
        .filter(field => field.required)
        .map(field => field.name);

    const missingFields = requiredFields.filter(field => !dynamicFields[field]);

    return {
        valid: missingFields.length === 0,
        missingFields
    };
};

// Calculate priority based on request details
export const calculatePriority = (requestType, dynamicFields) => {
    // This is a simplified priority calculation
    // In a real application, this would be more sophisticated

    let score = 0;

    // Request type factors
    if (requestType === 'hardware') score += 3;
    if (requestType === 'network') score += 4;
    if (requestType === 'software') score += 2;
    if (requestType === 'account') score += 1;

    // Dynamic fields factors
    if (dynamicFields) {
        // Hardware factors
        if (dynamicFields.deviceType === 'server') score += 5;
        if (dynamicFields.deviceType === 'workstation') score += 3;

        // Network factors
        if (dynamicFields.networkType === 'internet') score += 4;
        if (dynamicFields.networkType === 'intranet') score += 3;

        // Software factors
        if (dynamicFields.softwareName && dynamicFields.softwareName.toLowerCase().includes('critical')) score += 4;
    }

    // Determine priority based on score
    if (score >= 8) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
};

// Export default object for backward compatibility
export default {
    processAttachments,
    getDynamicFieldsForRequestType,
    validateDynamicFields,
    calculatePriority
};
