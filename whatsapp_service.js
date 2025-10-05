/**
 * WhatsApp Emergency Alert Service
 * Healthcare Track Pro - Emergency Notification System
 */

class WhatsAppEmergencyService {
    constructor() {
        this.apiEndpoint = 'https://api.whatsapp.com/send';
        this.emergencyThreshold = 8; // Severity level 8+ triggers emergency
        this.criticalSymptoms = [
            'chest pain', 'difficulty breathing', 'severe headache', 
            'loss of consciousness', 'severe abdominal pain', 'high fever'
        ];
    }

    /**
     * Check if symptoms require emergency alert
     * @param {Array} symptoms - Array of symptom objects
     * @returns {boolean} - Whether emergency alert is needed
     */
    isEmergencyAlert(symptoms) {
        return symptoms.some(symptom => {
            // Check severity level
            if (symptom.severity >= this.emergencyThreshold) {
                return true;
            }
            
            // Check for critical symptoms
            return this.criticalSymptoms.some(critical => 
                symptom.name.toLowerCase().includes(critical.toLowerCase())
            );
        });
    }

    /**
     * Generate emergency message content
     * @param {Object} userProfile - User profile with name and details
     * @param {Array} symptoms - Array of symptoms
     * @returns {string} - Formatted emergency message
     */
    generateEmergencyMessage(userProfile, symptoms) {
        const timestamp = new Date().toLocaleString('en-IN');
        const highSeveritySymptoms = symptoms.filter(s => s.severity >= this.emergencyThreshold);
        const otherSymptoms = symptoms.filter(s => s.severity < this.emergencyThreshold);
        
        let message = `🚨 *HEALTH EMERGENCY ALERT* 🚨\n\n`;
        message += `👤 *Patient:* ${userProfile.name}\n`;
        message += `📅 *Time:* ${timestamp}\n\n`;
        
        // High severity symptoms
        if (highSeveritySymptoms.length > 0) {
            message += `⚠️ *Critical Symptoms:*\n`;
            highSeveritySymptoms.forEach(symptom => {
                const symptomName = this.formatSymptomName(symptom.type);
                message += `• ${symptomName} (Severity: ${symptom.severity}/10)\n`;
                if (symptom.notes) {
                    message += `  Notes: ${symptom.notes}\n`;
                }
            });
            message += `\n`;
        }
        
        // Other current symptoms
        if (otherSymptoms.length > 0) {
            message += `📋 *Other Current Symptoms:*\n`;
            otherSymptoms.forEach(symptom => {
                const symptomName = this.formatSymptomName(symptom.type);
                message += `• ${symptomName} (Severity: ${symptom.severity}/10)\n`;
                if (symptom.notes) {
                    message += `  Notes: ${symptom.notes}\n`;
                }
            });
            message += `\n`;
        }
        
        message += `🏥 *Recommendation:* Immediate medical attention required\n`;
        message += `📱 *Tracked via:* Healthcare Track Pro\n\n`;
        message += `Please contact emergency services if needed: 108 (Ambulance)`;
        
        return encodeURIComponent(message);
    }

    /**
     * Send WhatsApp message using web API
     * @param {string} phoneNumber - WhatsApp number (with country code)
     * @param {string} message - Message to send
     */
    sendWhatsAppMessage(phoneNumber, message) {
        // Clean phone number (remove spaces, dashes, etc.)
        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
        
        // Create WhatsApp URL
        const whatsappUrl = `${this.apiEndpoint}?phone=${cleanNumber}&text=${message}`;
        
        // Open WhatsApp in new window/tab
        window.open(whatsappUrl, '_blank');
        
        // Log the emergency alert
        this.logEmergencyAlert(phoneNumber, message);
    }

    /**
     * Send emergency alert via WhatsApp
     * @param {Object} userProfile - User profile
     * @param {Array} symptoms - Symptoms array
     */
    sendEmergencyAlert(userProfile, symptoms) {
        // If profile missing number, try to hydrate from localStorage once (no re-prompt)
        if (!userProfile.whatsappNumber) {
            const stored = localStorage.getItem('whatsappNumber');
            if (stored) {
                userProfile.whatsappNumber = stored;
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
            }
        }

        if (!userProfile.whatsappNumber) {
            // WhatsApp number not provided - showing setup prompt
            this.showWhatsAppSetupPrompt();
            return;
        }

        if (this.isEmergencyAlert(symptoms)) {
            const message = this.generateEmergencyMessage(userProfile, symptoms);
            this.sendWhatsAppMessage(userProfile.whatsappNumber, message);
            
            // Show confirmation to user
            this.showEmergencyAlertConfirmation();
        }
    }

    /**
     * Show prompt to setup WhatsApp number - REDESIGNED SIMPLE VERSION
     */
    showWhatsAppSetupPrompt() {
        // Remove any existing modal
        const existingModal = document.querySelector('.whatsapp-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create enhanced modal HTML with professional styling
        const modalHTML = `
            <div class="whatsapp-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(5px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                animation: fadeIn 0.3s ease-out;
            ">
                <div style="
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    padding: 40px;
                    border-radius: 20px;
                    max-width: 450px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.15);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    position: relative;
                    animation: slideUp 0.4s ease-out;
                ">
                    <!-- Header with WhatsApp branding -->
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 25px;
                        gap: 12px;
                    ">
                        <div style="
                            width: 50px;
                            height: 50px;
                            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            color: white;
                            box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
                        ">📱</div>
                        <div>
                            <h3 style="
                                color: #2c3e50;
                                margin: 0;
                                font-size: 24px;
                                font-weight: 600;
                                letter-spacing: -0.5px;
                            ">WhatsApp Setup</h3>
                            <p style="
                                color: #7f8c8d;
                                margin: 5px 0 0 0;
                                font-size: 14px;
                                font-weight: 400;
                            ">Emergency Alert Configuration</p>
                        </div>
                    </div>

                    <!-- Description -->
                    <p style="
                        color: #34495e;
                        margin-bottom: 30px;
                        font-size: 16px;
                        line-height: 1.5;
                        font-weight: 400;
                    ">Enter your WhatsApp number to receive critical emergency alerts and health notifications</p>

                    <!-- Input Section -->
                    <div style="margin-bottom: 30px;">
                        <input 
                            type="tel" 
                            id="whatsapp-input" 
                            placeholder="Enter phone number (e.g., 9876543210)"
                            style="
                                width: 100%;
                                padding: 16px 20px;
                                border: 2px solid #e1e8ed;
                                border-radius: 12px;
                                font-size: 16px;
                                box-sizing: border-box;
                                transition: all 0.3s ease;
                                background: #ffffff;
                                color: #2c3e50;
                                font-weight: 500;
                                outline: none;
                            "
                            onfocus="this.style.borderColor='#25D366'; this.style.boxShadow='0 0 0 3px rgba(37, 211, 102, 0.1)'"
                            onblur="this.style.borderColor='#e1e8ed'; this.style.boxShadow='none'"
                        />
                        <div style="
                            margin-top: 8px;
                            font-size: 13px;
                            color: #7f8c8d;
                            text-align: left;
                        ">
                            💡 Supported formats: 9876543210, +91 9876543210, +1 2345678901
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="
                        display: flex; 
                        gap: 15px; 
                        justify-content: center;
                        flex-wrap: wrap;
                    ">
                        <button 
                            onclick="closeWhatsAppModal()" 
                            style="
                                padding: 14px 28px;
                                background: #ecf0f1;
                                color: #7f8c8d;
                                border: none;
                                border-radius: 10px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: 600;
                                transition: all 0.3s ease;
                                min-width: 120px;
                            "
                            onmouseover="this.style.background='#d5dbdb'; this.style.transform='translateY(-2px)'"
                            onmouseout="this.style.background='#ecf0f1'; this.style.transform='translateY(0px)'"
                        >Cancel</button>
                        <button 
                            onclick="saveWhatsAppNumber()" 
                            style="
                                padding: 14px 28px;
                                background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                                color: white;
                                border: none;
                                border-radius: 10px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: 600;
                                transition: all 0.3s ease;
                                box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
                                min-width: 140px;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(37, 211, 102, 0.4)'"
                            onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 4px 15px rgba(37, 211, 102, 0.3)'"
                        >💾 Save Number</button>
                    </div>

                    <!-- Security Note -->
                    <div style="
                        margin-top: 25px;
                        padding: 15px;
                        background: rgba(52, 152, 219, 0.1);
                        border-radius: 10px;
                        border-left: 4px solid #3498db;
                    ">
                        <p style="
                            margin: 0;
                            font-size: 13px;
                            color: #2980b9;
                            line-height: 1.4;
                        ">
                            🔒 Your number is stored securely and only used for emergency notifications
                        </p>
                    </div>
                </div>
            </div>

            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0px) scale(1);
                    }
                }
                @media (max-width: 480px) {
                    .whatsapp-modal > div {
                        padding: 30px 20px !important;
                        margin: 20px !important;
                        width: calc(100% - 40px) !important;
                    }
                    .whatsapp-modal button {
                        width: 100% !important;
                        margin-bottom: 10px !important;
                    }
                    .whatsapp-modal > div > div:last-child {
                        flex-direction: column !important;
                    }
                }
            </style>
        `;

        // Add to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus on input
        setTimeout(() => {
            document.getElementById('whatsapp-input').focus();
        }, 100);
    }

    /**
     * Format and validate phone number with flexible country code handling
     * @param {string} phoneNumber - Raw phone number input
     * @returns {Object} - {isValid: boolean, formattedNumber: string, error: string}
     */
    formatPhoneNumber(phoneNumber) {
        // Remove all non-digit characters except +
        let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
        
        // If number doesn't start with +, check if it needs country code
        if (!cleanNumber.startsWith('+')) {
            // If it's a 10-digit number (Indian format without country code)
            if (/^\d{10}$/.test(cleanNumber)) {
                cleanNumber = '+91' + cleanNumber;
            }
            // If it's already 12+ digits, assume it has country code
            else if (/^\d{12,15}$/.test(cleanNumber)) {
                cleanNumber = '+' + cleanNumber;
            }
            // If it's 11 digits and starts with 91 (India without +)
            else if (/^91\d{10}$/.test(cleanNumber)) {
                cleanNumber = '+' + cleanNumber;
            }
        }
        
        // Validate final format
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        const isValid = phoneRegex.test(cleanNumber);
        
        let error = '';
        if (!isValid) {
            if (cleanNumber.length < 10) {
                error = 'फोन नंबर बहुत छोटा है / Phone number too short';
            } else if (cleanNumber.length > 16) {
                error = 'फोन नंबर बहुत लंबा है / Phone number too long';
            } else {
                error = 'अवैध फोन नंबर प्रारूप / Invalid phone number format';
            }
        }
        
        return {
            isValid,
            formattedNumber: cleanNumber,
            error
        };
    }

    /**
     * Show custom notification that works on deployed websites
     * @param {string} message - Notification message
     * @param {string} type - Notification type: 'success', 'error', 'info'
     */
    showCustomNotification(message, type = 'info') {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.custom-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'custom-notification';
        
        // Set colors based on type
        let backgroundColor, borderColor, textColor, icon;
        switch (type) {
            case 'success':
                backgroundColor = '#d4edda';
                borderColor = '#c3e6cb';
                textColor = '#155724';
                icon = '✅';
                break;
            case 'error':
                backgroundColor = '#f8d7da';
                borderColor = '#f5c6cb';
                textColor = '#721c24';
                icon = '❌';
                break;
            default:
                backgroundColor = '#d1ecf1';
                borderColor = '#bee5eb';
                textColor = '#0c5460';
                icon = 'ℹ️';
        }

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: ${textColor};
            border: 1px solid ${borderColor};
            border-radius: 12px;
            padding: 16px 20px;
            max-width: 400px;
            min-width: 300px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.4;
            animation: slideInRight 0.4s ease-out;
            cursor: pointer;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <span style="font-size: 16px; flex-shrink: 0;">${icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">
                        ${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Information'}
                    </div>
                    <div>${message}</div>
                </div>
                <button style="
                    background: none;
                    border: none;
                    color: ${textColor};
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                    opacity: 0.7;
                    line-height: 1;
                " onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add CSS animation
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
                .custom-notification:hover {
                    transform: translateY(-2px);
                    transition: transform 0.2s ease;
                }
                @media (max-width: 480px) {
                    .custom-notification {
                        right: 10px !important;
                        left: 10px !important;
                        max-width: none !important;
                        min-width: auto !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);

        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        });
    }

    /**
     * Save WhatsApp number to user profile - SIMPLIFIED VERSION
     */
    saveWhatsAppNumber() {
        const numberInput = document.getElementById('whatsapp-input');
        
        if (!numberInput) {
            this.showCustomNotification('Input field not found', 'error');
            return;
        }

        const phoneNumber = numberInput.value.trim();
        
        if (!phoneNumber) {
            this.showCustomNotification('Please enter a WhatsApp number', 'error');
            return;
        }

        // Simple validation - just check if it's a number
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        if (cleanNumber.length < 10) {
            this.showCustomNotification('Please enter a valid phone number (at least 10 digits)', 'error');
            return;
        }

        // Format number (add +91 if it's 10 digits)
        let formattedNumber = cleanNumber;
        if (cleanNumber.length === 10) {
            formattedNumber = '+91' + cleanNumber;
        } else if (!cleanNumber.startsWith('91') && cleanNumber.length === 12) {
            formattedNumber = '+' + cleanNumber;
        } else if (cleanNumber.length > 10) {
            formattedNumber = '+' + cleanNumber;
        }

        try {
            // Save to localStorage
            localStorage.setItem('whatsappNumber', formattedNumber);
            
            // Update user profile
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            userProfile.whatsappNumber = formattedNumber;
            // Capture name from AuthManager if not present
            try {
                if ((!userProfile.name || userProfile.name === 'Healthcare User') && window.AuthManager) {
                    const authUser = window.AuthManager.getCurrentUser && window.AuthManager.getCurrentUser();
                    if (authUser?.username) {
                        userProfile.name = authUser.username;
                    }
                }
            } catch (e) {}
            // Mark emergency setup completed
            userProfile.emergencySetup = true;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));

            // Also mirror into a simple settings object for Settings screen linkage
            const settings = JSON.parse(localStorage.getItem('settings') || '{}');
            settings.whatsappNumber = formattedNumber;
            settings.name = userProfile.name || settings.name;
            settings.emergencySetup = true;
            localStorage.setItem('settings', JSON.stringify(settings));
            
            // Close modal
            closeWhatsAppModal();
            
            // Show success
            this.showCustomNotification(`✅ WhatsApp number saved successfully: ${formattedNumber}`, 'success');
            
        } catch (error) {
            // Error saving WhatsApp number - showing user error message
            this.showCustomNotification('❌ Failed to save WhatsApp number. Please try again.', 'error');
        }
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="error-icon">❌</span>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    /**
     * Show emergency alert confirmation
     */
    showEmergencyAlertConfirmation() {
        const notification = document.createElement('div');
        notification.className = 'emergency-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="emergency-icon">🚨</span>
                <span>Emergency alert sent via WhatsApp!</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="success-icon">✅</span>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Format symptom type to readable name
     * @param {string} symptomType - Symptom type identifier
     * @returns {string} - Formatted symptom name
     */
    formatSymptomName(symptomType) {
        const symptomNames = {
            'headache': 'सिरदर्द / Headache',
            'fever': 'बुखार / Fever',
            'cough': 'खांसी / Cough',
            'fatigue': 'थकान / Fatigue',
            'nausea': 'मतली / Nausea',
            'dizziness': 'चक्कर आना / Dizziness',
            'chest-pain': 'छाती में दर्द / Chest Pain',
            'shortness-of-breath': 'सांस लेने में कठिनाई / Shortness of Breath',
            'stomach-pain': 'पेट दर्द / Stomach Pain',
            'back-pain': 'कमर दर्द / Back Pain',
            'joint-pain': 'जोड़ों का दर्द / Joint Pain',
            'muscle-pain': 'मांसपेशियों में दर्द / Muscle Pain',
            'sore-throat': 'गले में खराश / Sore Throat',
            'runny-nose': 'नाक बहना / Runny Nose',
            'loss-of-appetite': 'भूख न लगना / Loss of Appetite',
            'difficulty-sleeping': 'नींद न आना / Difficulty Sleeping',
            'anxiety': 'चिंता / Anxiety',
            'depression': 'अवसाद / Depression',
            'skin-rash': 'त्वचा पर चकत्ते / Skin Rash',
            'eye-irritation': 'आंखों में जलन / Eye Irritation'
        };
        
        return symptomNames[symptomType] || symptomType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Log emergency alert for tracking
     */
    logEmergencyAlert(phoneNumber, message) {
        const alertLog = {
            timestamp: new Date().toISOString(),
            phoneNumber: phoneNumber,
            message: decodeURIComponent(message),
            type: 'emergency_alert'
        };
        
        // Save to localStorage (in real app, save to database)
        const logs = JSON.parse(localStorage.getItem('emergencyLogs') || '[]');
        logs.push(alertLog);
        localStorage.setItem('emergencyLogs', JSON.stringify(logs));
        
        // Emergency alert logged successfully
    }

    /**
     * Get emergency alert history
     */
    getEmergencyHistory() {
        return JSON.parse(localStorage.getItem('emergencyLogs') || '[]');
    }
}

// Initialize WhatsApp service
const whatsappService = new WhatsAppEmergencyService();

// Global functions for modal buttons
function closeWhatsAppModal() {
    const modal = document.querySelector('.whatsapp-modal');
    if (modal) {
        modal.remove();
    }
}

function saveWhatsAppNumber() {
    whatsappService.saveWhatsAppNumber();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppEmergencyService;
}