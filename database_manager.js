// Database Manager for Health Tracker Application
// Handles JSON file-based database operations with localStorage fallback

class DatabaseManager {
    constructor() {
        this.config = null;
        this.cache = new Map();
        this.isOnline = navigator.onLine;
        this.fallbackMode = false;
        
        // Initialize database
        this.init();
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncWithDatabase();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.fallbackMode = true;
        });
    }

    async init() {
        try {
            await this.loadConfig();
            await this.validateDatabaseFiles();
            // Database Manager initialized successfully
        } catch (error) {
            // Database initialization failed, using localStorage fallback
            this.fallbackMode = true;
        }
    }

    async loadConfig() {
        try {
            const response = await fetch('./database/config.json');
            if (!response.ok) throw new Error('Config file not found');
            this.config = await response.json();
        } catch (error) {
            // Use default config if file not found
            this.config = {
                fallback: { useLocalStorage: true, localStoragePrefix: 'healthtracker_' },
                settings: { autoSave: true }
            };
            throw error;
        }
    }

    async validateDatabaseFiles() {
        const files = ['symptoms.json', 'users.json', 'symptom_definitions.json'];
        for (const file of files) {
            try {
                const response = await fetch(`./database/${file}`);
                if (!response.ok) throw new Error(`${file} not accessible`);
            } catch (error) {
                // Database file not accessible - using fallback
                throw error;
            }
        }
    }

    // Symptom Operations
    async saveSymptoms(symptoms, userId = 'default') {
        if (this.fallbackMode) {
            return this.saveToLocalStorage('symptoms', symptoms);
        }

        try {
            const data = await this.loadDatabaseFile('symptoms.json');
            
            // Add user ID to each symptom
            const symptomsWithUser = symptoms.map(symptom => ({
                ...symptom,
                userId: userId
            }));

            data.symptoms = symptomsWithUser;
            data.metadata.lastModified = new Date().toISOString();
            data.metadata.totalRecords = symptomsWithUser.length;

            // Update indexes
            this.updateIndexes(data, symptomsWithUser);

            // In a real implementation, this would save to the server
            // For now, we'll use localStorage as the primary storage
            this.saveToLocalStorage('symptoms', symptoms);
            
            // Symptoms saved to database
            return true;
        } catch (error) {
            // Failed to save symptoms to database - using localStorage fallback
            return this.saveToLocalStorage('symptoms', symptoms);
        }
    }

    async loadSymptoms(userId = 'default') {
        if (this.fallbackMode) {
            return this.loadFromLocalStorage('symptoms') || [];
        }

        try {
            // Try to load from localStorage first (faster)
            const localData = this.loadFromLocalStorage('symptoms');
            if (localData && localData.length > 0) {
                return localData;
            }

            // Fallback to database file
            const data = await this.loadDatabaseFile('symptoms.json');
            const userSymptoms = data.symptoms.filter(symptom => symptom.userId === userId);
            
            // Cache in localStorage for faster access
            this.saveToLocalStorage('symptoms', userSymptoms);
            
            return userSymptoms;
        } catch (error) {
            // Failed to load symptoms from database - using localStorage fallback
            return this.loadFromLocalStorage('symptoms') || [];
        }
    }

    // User Operations
    async saveUser(userData) {
        if (this.fallbackMode) {
            return this.saveToLocalStorage('user', userData);
        }

        try {
            const data = await this.loadDatabaseFile('users.json');
            
            // Check if user exists
            const existingUserIndex = data.users.findIndex(user => user.id === userData.id);
            
            if (existingUserIndex >= 0) {
                data.users[existingUserIndex] = userData;
            } else {
                data.users.push(userData);
            }

            data.metadata.lastModified = new Date().toISOString();
            data.metadata.totalUsers = data.users.length;

            // Update indexes
            data.indexes.byUsername[userData.username] = userData.id;
            data.indexes.byEmail[userData.email] = userData.id;

            // Save to localStorage as primary storage
            this.saveToLocalStorage('user', userData);
            
            // User data saved to database
            return true;
        } catch (error) {
            // Failed to save user to database - using localStorage fallback
            return this.saveToLocalStorage('user', userData);
        }
    }

    async loadUser(userId) {
        if (this.fallbackMode) {
            return this.loadFromLocalStorage('user') || null;
        }

        try {
            // Try localStorage first
            const localUser = this.loadFromLocalStorage('user');
            if (localUser && localUser.id === userId) {
                return localUser;
            }

            // Fallback to database file
            const data = await this.loadDatabaseFile('users.json');
            const user = data.users.find(user => user.id === userId);
            
            if (user) {
                this.saveToLocalStorage('user', user);
            }
            
            return user;
        } catch (error) {
            // Failed to load user from database - using localStorage fallback
            return this.loadFromLocalStorage('user') || null;
        }
    }

    // Symptom Definitions Operations
    async loadSymptomDefinitions() {
        if (this.cache.has('symptom_definitions')) {
            return this.cache.get('symptom_definitions');
        }

        try {
            const data = await this.loadDatabaseFile('symptom_definitions.json');
            this.cache.set('symptom_definitions', data);
            return data;
        } catch (error) {
            // Failed to load symptom definitions - using default fallback
            return this.getDefaultSymptomDefinitions();
        }
    }

    // Session Management
    async saveSession(sessionData) {
        if (this.fallbackMode) {
            return this.saveToLocalStorage('session', sessionData);
        }

        try {
            const data = await this.loadDatabaseFile('users.json');
            
            // Remove expired sessions
            data.sessions = data.sessions.filter(session => 
                new Date(session.expiresAt) > new Date()
            );

            // Add new session
            data.sessions.push(sessionData);
            data.indexes.bySession[sessionData.sessionId] = sessionData.userId;

            // Save to localStorage
            this.saveToLocalStorage('session', sessionData);
            
            return true;
        } catch (error) {
            // Failed to save session - using localStorage fallback
            return false;
        }
    }

    async validateSession(sessionId) {
        try {
            const localSession = this.loadFromLocalStorage('session');
            if (localSession && localSession.sessionId === sessionId) {
                return new Date(localSession.expiresAt) > new Date();
            }

            if (!this.fallbackMode) {
                const data = await this.loadDatabaseFile('users.json');
                const session = data.sessions.find(s => s.sessionId === sessionId);
                return session && new Date(session.expiresAt) > new Date();
            }

            return false;
        } catch (error) {
            // Error loading database file - using fallback
            throw error;
        }
    }

    // Utility Methods
    async loadDatabaseFile(filename) {
        try {
            const response = await fetch(`./database/${filename}`);
            if (!response.ok) throw new Error(`Failed to load ${filename}`);
            return await response.json();
        } catch (error) {
            // Error loading database file - using fallback
            throw error;
        }
    }

    updateIndexes(data, symptoms) {
        // Reset indexes
        data.indexes = { byDate: {}, byType: {}, byUser: {}, byGroup: {} };

        symptoms.forEach(symptom => {
            // Index by date
            const date = symptom.date;
            if (!data.indexes.byDate[date]) data.indexes.byDate[date] = [];
            data.indexes.byDate[date].push(symptom.id);

            // Index by type
            const type = symptom.type;
            if (!data.indexes.byType[type]) data.indexes.byType[type] = [];
            data.indexes.byType[type].push(symptom.id);

            // Index by user
            const userId = symptom.userId;
            if (!data.indexes.byUser[userId]) data.indexes.byUser[userId] = [];
            data.indexes.byUser[userId].push(symptom.id);

            // Index by group
            if (symptom.groupId) {
                if (!data.indexes.byGroup[symptom.groupId]) data.indexes.byGroup[symptom.groupId] = [];
                data.indexes.byGroup[symptom.groupId].push(symptom.id);
            }
        });
    }

    saveToLocalStorage(key, data) {
        try {
            const prefix = this.config?.fallback?.localStoragePrefix || 'healthtracker_';
            localStorage.setItem(prefix + key, JSON.stringify(data));
            return true;
        } catch (error) {
            // Failed to save to localStorage
            return false;
        }
    }

    loadFromLocalStorage(key) {
        try {
            const prefix = this.config?.fallback?.localStoragePrefix || 'healthtracker_';
            const data = localStorage.getItem(prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            // Failed to load from localStorage
            return null;
        }
    }

    async syncWithDatabase() {
        if (this.fallbackMode || !this.isOnline) return;

        try {
            // Syncing local data with database...
            // In a real implementation, this would sync with server
            // For now, we'll just validate local data integrity
            
            const symptoms = this.loadFromLocalStorage('symptoms');
            const user = this.loadFromLocalStorage('user');
            
            if (symptoms && user) {
                // Database sync completed
            }
        } catch (error) {
            // Database sync failed - continuing with local data
        }
    }

    getDefaultSymptomDefinitions() {
        return {
            categories: [
                { id: "pain_discomfort", name: "Pain & Discomfort", color: "#ff6b6b" },
                { id: "respiratory", name: "Respiratory", color: "#4ecdc4" },
                { id: "general_symptoms", name: "General Symptoms", color: "#45b7d1" },
                { id: "mental_health", name: "Mental Health", color: "#96ceb4" },
                { id: "digestive", name: "Digestive", color: "#feca57" },
                { id: "skin_external", name: "Skin & External", color: "#ff9ff3" },
                { id: "neurological", name: "Neurological", color: "#a8e6cf" }
            ],
            symptoms: [],
            smartSuggestions: { combinations: {}, partialMatches: {} }
        };
    }

    // Database Statistics
    async getDatabaseStats() {
        try {
            const symptomsData = await this.loadDatabaseFile('symptoms.json');
            const usersData = await this.loadDatabaseFile('users.json');
            
            return {
                totalSymptoms: symptomsData.metadata.totalRecords,
                totalUsers: usersData.metadata.totalUsers,
                lastModified: symptomsData.metadata.lastModified,
                databaseSize: await this.calculateDatabaseSize(),
                isOnline: this.isOnline,
                fallbackMode: this.fallbackMode
            };
        } catch (error) {
            return {
                totalSymptoms: 0,
                totalUsers: 0,
                lastModified: new Date().toISOString(),
                databaseSize: 0,
                isOnline: this.isOnline,
                fallbackMode: this.fallbackMode
            };
        }
    }

    async calculateDatabaseSize() {
        try {
            let totalSize = 0;
            const files = ['symptoms.json', 'users.json', 'symptom_definitions.json', 'config.json'];
            
            for (const file of files) {
                const response = await fetch(`./database/${file}`);
                if (response.ok) {
                    const text = await response.text();
                    totalSize += text.length;
                }
            }
            
            return totalSize;
        } catch (error) {
            return 0;
        }
    }
}

// Global database manager instance
window.dbManager = new DatabaseManager();