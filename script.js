// HealthTracker Pro - Main JavaScript File
class HealthTracker {
    constructor() {
        this.dbManager = window.dbManager; // Reference to global database manager
        this.symptoms = [];
        this.currentTab = 'log';
        this.charts = {};
        this.selectedSymptoms = []; // Changed to array for multiple symptoms
        this.symptomDatabase = this.initializeSymptomDatabase();
        this.smartSuggestions = this.initializeSmartSuggestions();
        
        // Initialize AI suggestion engine
        this.aiEngine = null;
        this.initializeAIEngine();
        
        this.init();
        
        // Check if new user setup is needed
        this.checkNewUserSetup();
    }

    async init() {
        // Apply persisted theme early
        this.applyPersistedTheme();
        this.setupEventListeners();
        await this.loadSymptoms(); // Load symptoms from database
        
        this.renderHistory();
        this.renderInsights();
        this.generateSuggestions();
    }





    applyPersistedTheme() {
        try {
            const theme = localStorage.getItem('healthtracker_theme') || 'light';
            document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {
            // ignore
        }
    }

    processAdditionalSymptoms(input) {
        // Split input by common delimiters and process each part
        const delimiters = /[,;]+/;
        const parts = input.split(delimiters).map(part => part.trim()).filter(part => part.length > 0);
        
        parts.forEach(part => {
            // Try to match with existing symptoms in database
            const matchedSymptom = this.findBestSymptomMatch(part);
            
            if (matchedSymptom) {
                // Add matched symptom if not already selected
                if (!this.selectedSymptoms.some(s => s.toLowerCase() === matchedSymptom.name.toLowerCase())) {
                    this.selectedSymptoms.push(matchedSymptom.name);
                }
            } else {
                // Add as custom symptom if it seems valid
                if (this.isValidSymptomInput(part)) {
                    const formattedSymptom = this.formatSymptomName(part);
                    if (!this.selectedSymptoms.some(s => s.toLowerCase() === formattedSymptom.toLowerCase())) {
                        this.selectedSymptoms.push(formattedSymptom);
                    }
                }
            }
        });
        
        this.updateSelectedSymptomsDisplay();
    }

    findBestSymptomMatch(input) {
        const query = input.toLowerCase();
        
        // First try exact name match
        let match = this.symptomDatabase.find(symptom => 
            symptom.name.toLowerCase() === query
        );
        
        if (match) return match;
        
        // Then try partial name match
        match = this.symptomDatabase.find(symptom => 
            symptom.name.toLowerCase().includes(query) || query.includes(symptom.name.toLowerCase())
        );
        
        if (match) return match;
        
        // Finally try keyword match
        match = this.symptomDatabase.find(symptom => 
            symptom.keywords.some(keyword => 
                keyword.includes(query) || query.includes(keyword)
            )
        );
        
        return match;
    }

    isValidSymptomInput(input) {
        // Basic validation for symptom input
        const minLength = 2;
        const maxLength = 50;
        const validPattern = /^[a-zA-Z\s\-']+$/;
        
        return input.length >= minLength && 
               input.length <= maxLength && 
               validPattern.test(input) &&
               !this.isCommonStopWord(input.toLowerCase());
    }

    isCommonStopWord(word) {
        const stopWords = ['and', 'or', 'the', 'a', 'an', 'with', 'have', 'has', 'feel', 'feeling'];
        return stopWords.includes(word);
    }

    resetForm(form) {
        try {
            form.reset();
            const severityValue = document.getElementById('severityValue');
            if (severityValue) {
                severityValue.textContent = '5';
            }
            
            const symptomInput = document.getElementById('symptomInput');
            if (symptomInput) {
                symptomInput.value = '';
                symptomInput.placeholder = 'Describe your symptoms or add additional details...';
            }
            
            // Clear selected symptoms
            this.selectedSymptoms = [];
        } catch (error) {
            // Silent error handling for production
        }
        this.updateSelectedSymptomsDisplay();
        
        // Clear selected tags
        document.querySelectorAll('.symptom-tag').forEach(tag => {
            tag.classList.remove('selected');
        });
        
        // Hide suggestions (fix incorrect ID reference)
        const suggestions = document.getElementById('symptomSuggestions');
        if (suggestions) {
            suggestions.classList.remove('show');
        }
     }

    setupEventListeners() {
        try {
            // Tab navigation
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.switchTab(btn.dataset.tab);
                });
            });

            // Symptom form
            const form = document.getElementById('symptomForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.logSymptom();
                });
            }

            // Enhanced symptom input
            this.setupSymptomInput();

            // Severity slider with smooth sliding
            const severitySlider = document.getElementById('severity');
            const severityValue = document.getElementById('severityValue');
            
            if (severitySlider && severityValue) {
                severitySlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    severityValue.textContent = value;
                });
            }

            // History filter
            const historyFilter = document.getElementById('historyFilter');
            if (historyFilter) {
                historyFilter.addEventListener('change', (e) => {
                    this.filterHistory(e.target.value);
                });
            }

            // Theme toggle (global function is bound at bottom)
        } catch (error) {
            // Silent error handling for production
        }
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Refresh content based on tab
        if (tabName === 'history') {
            this.renderHistory();
        } else if (tabName === 'insights') {
            this.renderInsights();
        } else if (tabName === 'suggestions') {
            this.generateSuggestions();
        }
    }

    toggleCustomSymptom(value) {
        const customGroup = document.getElementById('customSymptomGroup');
        const customInput = document.getElementById('customSymptom');
        
        if (value === 'other') {
            customGroup.style.display = 'block';
            customInput.required = true;
        } else {
            customGroup.style.display = 'none';
            customInput.required = false;
            customInput.value = '';
        }
    }

    initializeSymptomDatabase() {
        return [
            // Pain & Discomfort
            { name: 'Headache', category: 'pain', icon: 'fas fa-head-side-cough', keywords: ['head', 'migraine', 'tension'] },
            { name: 'Chest Pain', category: 'pain', icon: 'fas fa-heart', keywords: ['chest', 'heart', 'cardiac'] },
            { name: 'Stomach Pain', category: 'pain', icon: 'fas fa-stomach', keywords: ['stomach', 'abdominal', 'belly'] },
            { name: 'Joint Pain', category: 'pain', icon: 'fas fa-bone', keywords: ['joint', 'arthritis', 'knee', 'elbow'] },
            { name: 'Back Pain', category: 'pain', icon: 'fas fa-spine', keywords: ['back', 'spine', 'lower back'] },
            { name: 'Muscle Pain', category: 'pain', icon: 'fas fa-dumbbell', keywords: ['muscle', 'sore', 'ache'] },
            { name: 'Neck Pain', category: 'pain', icon: 'fas fa-head-side-cough', keywords: ['neck', 'stiff neck'] },
            { name: 'Tooth Pain', category: 'pain', icon: 'fas fa-tooth', keywords: ['tooth', 'dental', 'toothache'] },

            // Respiratory
            { name: 'Cough', category: 'respiratory', icon: 'fas fa-lungs', keywords: ['cough', 'dry cough', 'wet cough'] },
            { name: 'Shortness of Breath', category: 'respiratory', icon: 'fas fa-wind', keywords: ['breath', 'breathing', 'dyspnea'] },
            { name: 'Sore Throat', category: 'respiratory', icon: 'fas fa-head-side-cough', keywords: ['throat', 'sore', 'scratchy'] },
            { name: 'Runny Nose', category: 'respiratory', icon: 'fas fa-head-side-virus', keywords: ['nose', 'runny', 'congestion'] },
            { name: 'Sneezing', category: 'respiratory', icon: 'fas fa-head-side-mask', keywords: ['sneeze', 'sneezing'] },
            { name: 'Wheezing', category: 'respiratory', icon: 'fas fa-lungs-virus', keywords: ['wheeze', 'wheezing', 'asthma'] },

            // General Symptoms
            { name: 'Fever', category: 'general', icon: 'fas fa-thermometer-half', keywords: ['fever', 'temperature', 'hot'] },
            { name: 'Fatigue', category: 'general', icon: 'fas fa-bed', keywords: ['tired', 'exhausted', 'fatigue', 'weakness'] },
            { name: 'Nausea', category: 'general', icon: 'fas fa-dizzy', keywords: ['nausea', 'sick', 'queasy'] },
            { name: 'Dizziness', category: 'general', icon: 'fas fa-dizzy', keywords: ['dizzy', 'lightheaded', 'vertigo'] },
            { name: 'Chills', category: 'general', icon: 'fas fa-snowflake', keywords: ['chills', 'cold', 'shivering'] },
            { name: 'Sweating', category: 'general', icon: 'fas fa-tint', keywords: ['sweat', 'sweating', 'perspiration'] },
            { name: 'Loss of Appetite', category: 'general', icon: 'fas fa-utensils', keywords: ['appetite', 'hunger', 'eating'] },
            { name: 'Weight Loss', category: 'general', icon: 'fas fa-weight', keywords: ['weight', 'loss', 'thin'] },

            // Mental Health
            { name: 'Anxiety', category: 'mental', icon: 'fas fa-brain', keywords: ['anxiety', 'worry', 'nervous'] },
            { name: 'Depression', category: 'mental', icon: 'fas fa-sad-tear', keywords: ['depression', 'sad', 'mood'] },
            { name: 'Insomnia', category: 'mental', icon: 'fas fa-moon', keywords: ['sleep', 'insomnia', 'sleepless'] },
            { name: 'Stress', category: 'mental', icon: 'fas fa-brain', keywords: ['stress', 'pressure', 'overwhelmed'] },
            { name: 'Confusion', category: 'mental', icon: 'fas fa-question', keywords: ['confusion', 'confused', 'memory'] },
            { name: 'Mood Swings', category: 'mental', icon: 'fas fa-theater-masks', keywords: ['mood', 'emotional', 'irritable'] },

            // Digestive
            { name: 'Vomiting', category: 'digestive', icon: 'fas fa-stomach', keywords: ['vomit', 'throwing up', 'sick'] },
            { name: 'Diarrhea', category: 'digestive', icon: 'fas fa-toilet', keywords: ['diarrhea', 'loose stool', 'bowel'] },
            { name: 'Constipation', category: 'digestive', icon: 'fas fa-toilet-paper', keywords: ['constipation', 'blocked', 'bowel'] },
            { name: 'Heartburn', category: 'digestive', icon: 'fas fa-fire', keywords: ['heartburn', 'acid', 'reflux'] },
            { name: 'Bloating', category: 'digestive', icon: 'fas fa-expand', keywords: ['bloating', 'gas', 'swollen'] },

            // Skin
            { name: 'Rash', category: 'skin', icon: 'fas fa-hand-dots', keywords: ['rash', 'skin', 'red'] },
            { name: 'Itching', category: 'skin', icon: 'fas fa-hand-sparkles', keywords: ['itch', 'itchy', 'scratch'] },
            { name: 'Bruising', category: 'skin', icon: 'fas fa-band-aid', keywords: ['bruise', 'bruising', 'purple'] },
            { name: 'Swelling', category: 'skin', icon: 'fas fa-expand-arrows-alt', keywords: ['swelling', 'swollen', 'inflammation'] },

            // Neurological
            { name: 'Migraine', category: 'neurological', icon: 'fas fa-head-side-virus', keywords: ['migraine', 'severe headache', 'throbbing'] },
            { name: 'Numbness', category: 'neurological', icon: 'fas fa-hand-paper', keywords: ['numbness', 'numb', 'tingling'] },
            { name: 'Tingling', category: 'neurological', icon: 'fas fa-hand-sparkles', keywords: ['tingling', 'pins needles', 'sensation'] },
            { name: 'Confusion', category: 'neurological', icon: 'fas fa-question-circle', keywords: ['confusion', 'disoriented', 'memory'] }
        ];
    }

    initializeSmartSuggestions() {
        return {
            // Common symptom combinations
            combinations: {
                'fever': ['headache', 'fatigue', 'chills', 'muscle pain'],
                'headache': ['nausea', 'dizziness', 'fatigue'],
                'nausea': ['vomiting', 'dizziness', 'stomach pain'],
                'cough': ['sore throat', 'runny nose', 'fever'],
                'fatigue': ['headache', 'muscle pain', 'weakness'],
                'anxiety': ['insomnia', 'stress', 'heart palpitations'],
                'stomach pain': ['nausea', 'bloating', 'heartburn']
            },
            
            // Intelligent suggestions based on incomplete input
            partialMatches: {
                'head': ['headache', 'migraine', 'dizziness'],
                'stomach': ['stomach pain', 'nausea', 'bloating'],
                'chest': ['chest pain', 'shortness of breath', 'cough'],
                'throat': ['sore throat', 'cough', 'swallowing difficulty'],
                'tired': ['fatigue', 'weakness', 'exhaustion'],
                'pain': ['headache', 'back pain', 'joint pain', 'muscle pain'],
                'sick': ['nausea', 'fever', 'vomiting'],
                'cold': ['runny nose', 'cough', 'sore throat', 'chills']
            }
        };
    }

    async initializeAIEngine() {
        try {
            if (window.AISuggestionEngine) {
                this.aiEngine = new window.AISuggestionEngine();
                // AI Suggestion Engine initialized successfully
            } else {
                // AI Suggestion Engine not available, using fallback suggestions
            }
        } catch (error) {
            // Failed to initialize AI Suggestion Engine - using fallback
            this.aiEngine = null;
        }
    }

    setupSymptomInput() {
        const input = document.getElementById('symptomInput');
        const suggestionsContainer = document.getElementById('symptomSuggestions');
        const symptomTags = document.querySelectorAll('.symptom-tag');
        const addBtn = document.getElementById('addSymptomBtn');
        
        let currentSuggestionIndex = -1;
        
        // Input event for real-time search
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            this.showSuggestions(query, suggestionsContainer);
            currentSuggestionIndex = -1;
        });

        // Focus event to show suggestions
        input.addEventListener('focus', (e) => {
            const query = e.target.value.toLowerCase().trim();
            this.showSuggestions(query, suggestionsContainer);
        });

        // Blur event to hide suggestions (with delay for clicks)
        input.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionsContainer.classList.remove('show');
            }, 200);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, suggestions.length - 1);
                this.highlightSuggestion(suggestions, currentSuggestionIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1);
                this.highlightSuggestion(suggestions, currentSuggestionIndex);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                
                if (currentSuggestionIndex >= 0) {
                    // Select highlighted suggestion
                    suggestions[currentSuggestionIndex].click();
                } else {
                    // Add symptom directly from input
                    const inputValue = e.target.value.trim();
                    
                    if (inputValue) {
                        this.addSymptomDirectly(inputValue);
                        e.target.value = '';
                        suggestionsContainer.classList.remove('show');
                    }
                }
            } else if (e.key === 'Escape') {
                suggestionsContainer.classList.remove('show');
                currentSuggestionIndex = -1;
            }
        });

        // Click Add button to add current input
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const value = (input.value || '').trim();
                if (value) {
                    this.addSymptomDirectly(value);
                    input.value = '';
                    suggestionsContainer.classList.remove('show');
                    input.focus();
                }
            });
        }

        // Symptom tag clicks - now supports multiple selection
        symptomTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const symptom = tag.dataset.symptom;
                this.toggleSymptomSelection(symptom, tag);
            });
        });
    }

    toggleSymptomSelection(symptom, tagElement) {
        const symptomName = this.formatSymptomName(symptom);
        const existingIndex = this.selectedSymptoms.findIndex(s => s.toLowerCase() === symptomName.toLowerCase());
        
        if (existingIndex >= 0) {
            // Remove symptom
            this.selectedSymptoms.splice(existingIndex, 1);
            tagElement.classList.remove('selected');
        } else {
            // Add symptom
            this.selectedSymptoms.push(symptomName);
            tagElement.classList.add('selected');
            
            // Add smart suggestions based on selected symptom
            this.addSmartSuggestions(symptom.toLowerCase());
        }
        
        this.updateSelectedSymptomsDisplay();
    }

    addSmartSuggestions(selectedSymptom) {
        const suggestions = this.smartSuggestions.combinations[selectedSymptom];
        if (suggestions) {
            // Add intelligent suggestions to the input
            const input = document.getElementById('symptomInput');
            const currentValue = input.value.toLowerCase();
            
            // Only suggest if not already selected
            const newSuggestions = suggestions.filter(suggestion => 
                !this.selectedSymptoms.some(selected => 
                    selected.toLowerCase().includes(suggestion.toLowerCase())
                )
            );
            
            if (newSuggestions.length > 0 && !currentValue) {
                input.placeholder = `Consider adding: ${newSuggestions.slice(0, 2).join(', ')}...`;
            }
        }
    }

    updateSelectedSymptomsDisplay() {
        const container = document.getElementById('selectedSymptoms');
        const list = document.getElementById('selectedSymptomsList');
        
        if (this.selectedSymptoms.length === 0) {
            container.classList.remove('has-symptoms');
            list.innerHTML = '';
            return;
        }
        
        container.classList.add('has-symptoms');
        list.innerHTML = this.selectedSymptoms.map(symptom => `
            <div class="selected-symptom-item">
                <span>${symptom}</span>
                <button type="button" class="remove-symptom" onclick="healthTracker.removeSelectedSymptom('${symptom}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeSelectedSymptom(symptom) {
        const index = this.selectedSymptoms.findIndex(s => s === symptom);
        if (index >= 0) {
            this.selectedSymptoms.splice(index, 1);
            
            // Update tag visual state - convert symptom name to kebab-case to match data-symptom
            const kebabCase = symptom.toLowerCase().replace(/\s+/g, '-');
            const tag = document.querySelector(`[data-symptom="${kebabCase}"]`);
            if (tag) {
                tag.classList.remove('selected');
            }
            
            this.updateSelectedSymptomsDisplay();
        }
    }

    showSuggestions(query, container) {
        if (query.length === 0) {
            container.classList.remove('show');
            return;
        }

        // Filter symptoms excluding already selected ones
        const filteredSymptoms = this.symptomDatabase.filter(symptom => {
            const isMatch = symptom.name.toLowerCase().includes(query) ||
                           symptom.keywords.some(keyword => keyword.includes(query)) ||
                           symptom.category.toLowerCase().includes(query);
            
            const isNotSelected = !this.selectedSymptoms.some(selected => 
                selected.toLowerCase() === symptom.name.toLowerCase()
            );
            
            return isMatch && isNotSelected;
        });

        // Add smart suggestions based on current selection
        const smartSuggestions = this.getSmartSuggestionsForQuery(query);
        const allSuggestions = [...filteredSymptoms, ...smartSuggestions].slice(0, 8);

        if (allSuggestions.length === 0) {
            container.classList.remove('show');
            return;
        }

        const html = allSuggestions.map(symptom => `
            <div class="suggestion-item ${symptom.isSmart ? 'smart-suggestion' : ''}" 
                 data-symptom="${symptom.name.toLowerCase().replace(/\s+/g, '-')}">
                <i class="${symptom.icon} suggestion-icon"></i>
                <span class="suggestion-text">${symptom.name}</span>
                <span class="suggestion-category">${symptom.category}</span>
                ${symptom.isSmart ? '<span class="smart-badge">Smart</span>' : ''}
            </div>
        `).join('');

        container.innerHTML = html;
        container.classList.add('show');

        // Add click handlers to suggestions
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const symptom = item.dataset.symptom;
                const input = document.getElementById('symptomInput');
                // Add and reflect the chosen value in the input (do not clear)
                this.addSymptomFromSuggestion(symptom);
                input.value = this.formatSymptomName(symptom);
                container.classList.remove('show');
                input.focus();
            });
        });
    }

    getSmartSuggestionsForQuery(query) {
        if (this.selectedSymptoms.length === 0 || query.length < 2) {
            return [];
        }

        const suggestions = [];
        
        // Get combinations based on selected symptoms
        this.selectedSymptoms.forEach(selectedSymptom => {
            const key = selectedSymptom.toLowerCase();
            const combinations = this.smartSuggestions.combinations[key];
            if (combinations) {
                combinations.forEach(suggestion => {
                    if (suggestion.toLowerCase().includes(query) && 
                        !this.selectedSymptoms.some(s => s.toLowerCase() === suggestion.toLowerCase())) {
                        
                        // Find the symptom in database or create a smart suggestion
                        const dbSymptom = this.symptomDatabase.find(s => 
                            s.name.toLowerCase() === suggestion.toLowerCase()
                        );
                        
                        if (dbSymptom) {
                            suggestions.push({
                                ...dbSymptom,
                                isSmart: true
                            });
                        } else {
                            suggestions.push({
                                name: suggestion,
                                category: 'Related',
                                icon: 'fas fa-lightbulb',
                                keywords: [suggestion.toLowerCase()],
                                isSmart: true
                            });
                        }
                    }
                });
            }
        });

        // Remove duplicates
        return suggestions.filter((suggestion, index, self) => 
            index === self.findIndex(s => s.name.toLowerCase() === suggestion.name.toLowerCase())
        );
    }

    addSymptomFromSuggestion(symptom) {
        const symptomName = this.formatSymptomName(symptom);
        
        // Check if already selected
        if (this.selectedSymptoms.some(s => s.toLowerCase() === symptomName.toLowerCase())) {
            const input = document.getElementById('symptomInput');
            input.value = symptomName;
            return;
        }
        
        this.selectedSymptoms.push(symptomName);
        this.updateSelectedSymptomsDisplay();
        
        // Update tag visual state if it exists
        const tag = document.querySelector(`[data-symptom="${symptom}"]`);
        if (tag) {
            tag.classList.add('selected');
        }
        
        // Add smart suggestions for the newly selected symptom
        this.addSmartSuggestions(symptom);
        const input = document.getElementById('symptomInput');
        input.value = symptomName;
    }

    addSymptomDirectly(input) {
        // Process the input - could be multiple symptoms separated by commas
        const symptoms = input.split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 0);
        
        symptoms.forEach(symptomText => {
            // Try to find a matching symptom in the database first
            const matchedSymptom = this.findBestSymptomMatch(symptomText.toLowerCase());
            
            if (matchedSymptom) {
                // Use the matched symptom name
                const symptomName = matchedSymptom.name;
                
                if (!this.selectedSymptoms.some(s => s.toLowerCase() === symptomName.toLowerCase())) {
                    this.selectedSymptoms.push(symptomName);
                    
                    // Update tag visual state if it exists
                    const kebabCase = symptomName.toLowerCase().replace(/\s+/g, '-');
                    const tag = document.querySelector(`[data-symptom="${kebabCase}"]`);
                    if (tag) {
                        tag.classList.add('selected');
                    }
                }
            } else {
                // Add as custom symptom if it's valid
                if (this.isValidSymptomInput(symptomText)) {
                    const formattedSymptom = this.formatSymptomName(symptomText);
                    
                    if (!this.selectedSymptoms.some(s => s.toLowerCase() === formattedSymptom.toLowerCase())) {
                        this.selectedSymptoms.push(formattedSymptom);
                    }
                }
            }
        });
        
        this.updateSelectedSymptomsDisplay();
    }

    highlightSuggestion(suggestions, index) {
        suggestions.forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });
    }

    selectSymptom(symptom) {
        const input = document.getElementById('symptomInput');
        const symptomName = this.formatSymptomName(symptom);
        
        input.value = symptomName;
        this.selectedSymptom = symptom;
        
        // Clear any selected tags
        document.querySelectorAll('.symptom-tag').forEach(tag => {
            tag.classList.remove('selected');
        });
        
        // Highlight matching tag if exists
        const matchingTag = document.querySelector(`[data-symptom="${symptom}"]`);
        if (matchingTag) {
            matchingTag.classList.add('selected');
        }
    }

    async logSymptom() {
        const form = document.getElementById('symptomForm');
        const symptomInput = document.getElementById('symptomInput').value.trim();
        const severity = parseInt(document.getElementById('severity').value);
        const duration = document.getElementById('duration').value;
        const notes = document.getElementById('notes').value;

        // Process additional symptoms from input
        if (symptomInput) {
            this.processAdditionalSymptoms(symptomInput);
        }

        // Validate that we have at least one symptom
        if (this.selectedSymptoms.length === 0) {
            this.showErrorMessage('Please select or enter at least one symptom');
            return;
        }

        // Create symptom entries for each selected symptom
        const timestamp = new Date().toISOString();
        const date = new Date().toLocaleDateString();
        const baseId = Date.now();

        this.selectedSymptoms.forEach((symptomName, index) => {
            const symptom = {
                id: baseId + index,
                type: symptomName.toLowerCase().replace(/\s+/g, '-'),
                displayName: symptomName,
                severity: severity,
                duration: duration,
                notes: notes,
                timestamp: timestamp,
                date: date,
                isMultiple: this.selectedSymptoms.length > 1,
                groupId: this.selectedSymptoms.length > 1 ? baseId : null
            };

            this.symptoms.push(symptom);
            
            // Check for emergency conditions
            this.checkEmergencyConditions(symptom);
        });

        try {
            await this.saveSymptoms();
            
            // Show success message
            const message = this.selectedSymptoms.length === 1 
                ? 'Symptom logged successfully!' 
                : `${this.selectedSymptoms.length} symptoms logged successfully!`;
            this.showSuccessMessage(message);
        } catch (error) {
            // Failed to save symptoms - showing user error message
            this.showErrorMessage('Failed to save symptoms. Please try again.');
            return;
        }
        
        // Reset form and selections
        this.resetForm(form);
        this.selectedSymptom = null;
        
        // Clear selected tags
        document.querySelectorAll('.symptom-tag').forEach(tag => {
            tag.classList.remove('selected');
        });
        
        // Update displays
        this.renderHistory();
        this.renderInsights();
        this.generateSuggestions();
    }

    checkEmergencyConditions(symptom) {
        // Standardized keys use hyphenation of full names (e.g., shortness-of-breath)
        const emergencySymptoms = ['chest-pain', 'shortness-of-breath', 'difficulty-breathing', 'severe-headache', 'loss-of-consciousness', 'severe-abdominal-pain', 'high-fever'];
        const highSeverityThreshold = 8;
        
        const emergencyAlert = document.getElementById('emergencyAlert');
        
        if (emergencySymptoms.includes(symptom.type) || symptom.severity >= highSeverityThreshold) {
            // Show emergency alert on screen
            emergencyAlert.style.display = 'flex';
            setTimeout(() => {
                emergencyAlert.style.display = 'none';
            }, 10000);
            
            // Check for WhatsApp alert redirection for severity 8+
            if (symptom.severity >= highSeverityThreshold) {
                this.handleWhatsAppEmergencyAlert(symptom);
            }
        }
    }

    handleWhatsAppEmergencyAlert(symptom) {
        // Get user profile from localStorage
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        // Check if user has WhatsApp number configured
        if (userProfile.whatsappNumber) {
            // Initialize WhatsApp service if not already done
            if (typeof window.whatsappService === 'undefined') {
                window.whatsappService = new WhatsAppEmergencyService();
            }
            
            // Send emergency alert via WhatsApp
            window.whatsappService.sendEmergencyAlert(userProfile, [symptom]);
            
            // Show confirmation message
            this.showMessage('Emergency alert sent via WhatsApp!', 'success');
        } else {
            // Show WhatsApp setup prompt for emergency alerts
            this.showWhatsAppEmergencySetup(symptom);
        }
    }

    showWhatsAppEmergencySetup(symptom) {
        // Create emergency WhatsApp setup modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 style="color: #e74c3c;"><i class="fas fa-exclamation-triangle"></i> Emergency Alert Setup</h2>
                </div>
                <div class="modal-body">
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #856404;"><strong>High Severity Detected:</strong> ${symptom.displayName} (Severity: ${symptom.severity}/10)</p>
                    </div>
                    
                    <p style="margin-bottom: 20px;">For symptoms with severity 8 or higher, we recommend setting up WhatsApp emergency alerts to notify your emergency contacts.</p>
                    
                    <div class="form-group">
                        <label for="emergencyWhatsAppNumber">WhatsApp Number for Emergency Alerts:</label>
                        <input type="tel" id="emergencyWhatsAppNumber" placeholder="Enter phone number (e.g., 9876543210)" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; margin-top: 5px;" />
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="healthTracker.saveEmergencyWhatsApp('${symptom.id}')" class="btn-primary" style="width: 100%;">
                            <i class="fas fa-save"></i> Save & Send Alert
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Store modal reference for cleanup
        this.emergencyWhatsAppModal = modal;
        
        // Focus on input
        setTimeout(() => {
            document.getElementById('emergencyWhatsAppNumber').focus();
        }, 100);
    }

    saveEmergencyWhatsApp(symptomId) {
        const phoneNumber = document.getElementById('emergencyWhatsAppNumber').value.trim();
        
        if (!phoneNumber) {
            this.showMessage('Please enter a valid phone number', 'error');
            return;
        }
        
        // Save to user profile
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        userProfile.whatsappNumber = phoneNumber;
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        // Find the symptom and send alert
        const symptom = this.symptoms.find(s => s.id == symptomId);
        if (symptom) {
            // Initialize WhatsApp service if not already done
            if (typeof window.whatsappService === 'undefined') {
                window.whatsappService = new WhatsAppEmergencyService();
            }
            
            // Send emergency alert
            window.whatsappService.sendEmergencyAlert(userProfile, [symptom]);
        }
        
        // Close modal and show success
        this.closeEmergencyWhatsAppModal();
        this.showMessage('WhatsApp number saved and emergency alert sent!', 'success');
    }

    closeEmergencyWhatsAppModal() {
        if (this.emergencyWhatsAppModal) {
            this.emergencyWhatsAppModal.remove();
            this.emergencyWhatsAppModal = null;
        }
    }



    getUserProfile() {
        // Get user profile from localStorage or create default
        let userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        // Set default values if not exists
        if (!userProfile.name) {
            userProfile.name = 'Healthcare User';
        }
        
        return userProfile;
    }

    showSuccessMessage(message) {
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.getElementById('log').appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showErrorMessage(message) {
        const existingMessage = document.querySelector('.error-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.getElementById('log').appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }





    getRecentSymptoms(days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return this.symptoms.filter(symptom => {
            return new Date(symptom.timestamp) >= cutoffDate;
        });
    }

    renderHistory() {
        const timeline = document.getElementById('symptomTimeline');
        const filter = document.getElementById('historyFilter').value;
        
        let filteredSymptoms = [...this.symptoms];
        
        // Apply filter
        if (filter === 'today') {
            const today = new Date().toLocaleDateString();
            filteredSymptoms = filteredSymptoms.filter(s => s.date === today);
        } else if (filter === 'week') {
            filteredSymptoms = this.getRecentSymptoms(7);
        } else if (filter === 'month') {
            filteredSymptoms = this.getRecentSymptoms(30);
        }
        
        // Group symptoms by timestamp (within 5 minutes of each other)
        const groupedSymptoms = this.groupSymptomsByTime(filteredSymptoms);
        
        // Sort by timestamp (newest first)
        groupedSymptoms.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (groupedSymptoms.length === 0) {
            timeline.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No symptoms logged yet.</p>';
            return;
        }
        
        timeline.innerHTML = groupedSymptoms.map(group => {
            const date = new Date(group.timestamp);
            const avgSeverity = Math.round(group.symptoms.reduce((sum, s) => sum + s.severity, 0) / group.symptoms.length);
            const severityClass = this.getSeverityClass(avgSeverity);
            
            // Create symptom list with individual severities
            const symptomList = group.symptoms.map(symptom => {
                const individualSeverityClass = this.getSeverityClass(symptom.severity);
                return `
                    <div class="grouped-symptom">
                        <span class="symptom-name">${this.formatSymptomName(symptom)}</span>
                        <span class="individual-severity ${individualSeverityClass}">${symptom.severity}/10</span>
                    </div>
                `;
            }).join('');
            
            // Get unique durations and notes
            const durations = [...new Set(group.symptoms.map(s => s.duration))];
            const notes = group.symptoms.filter(s => s.notes).map(s => s.notes);
            
            return `
                <div class="timeline-item grouped">
                    <div class="timeline-header">
                        <div class="timeline-date">${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</div>
                        <div class="symptom-count">${group.symptoms.length} symptom${group.symptoms.length > 1 ? 's' : ''}</div>
                    </div>
                    <div class="timeline-symptoms">
                        ${symptomList}
                    </div>
                    <div class="timeline-summary">
                        <span class="timeline-severity ${severityClass}">Average Severity: ${avgSeverity}/10</span>
                        <div class="timeline-duration">Duration: ${durations.map(d => this.formatDuration(d)).join(', ')}</div>
                    </div>
                    ${notes.length > 0 ? `<div class="timeline-notes">
                        ${notes.map(note => `<div class="note-item">"${note}"</div>`).join('')}
                    </div>` : ''}
                </div>
            `;
        }).join('');
    }

    groupSymptomsByTime(symptoms) {
        if (symptoms.length === 0) return [];
        
        // Sort symptoms by timestamp
        const sortedSymptoms = [...symptoms].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const groups = [];
        let currentGroup = {
            timestamp: sortedSymptoms[0].timestamp,
            symptoms: [sortedSymptoms[0]]
        };
        
        for (let i = 1; i < sortedSymptoms.length; i++) {
            const currentTime = new Date(sortedSymptoms[i].timestamp);
            const groupTime = new Date(currentGroup.timestamp);
            
            // If symptoms are within 5 minutes of each other, group them
            const timeDiff = Math.abs(currentTime - groupTime) / (1000 * 60); // difference in minutes
            
            if (timeDiff <= 5) {
                currentGroup.symptoms.push(sortedSymptoms[i]);
            } else {
                groups.push(currentGroup);
                currentGroup = {
                    timestamp: sortedSymptoms[i].timestamp,
                    symptoms: [sortedSymptoms[i]]
                };
            }
        }
        
        // Add the last group
        groups.push(currentGroup);
        
        return groups;
    }

    filterHistory(filter) {
        this.renderHistory();
    }

    getSeverityClass(severity) {
        if (severity <= 3) return 'severity-low';
        if (severity <= 6) return 'severity-medium';
        return 'severity-high';
    }



    formatSymptomName(symptom) {
        // Handle both old format (string) and new format (object with displayName)
        if (typeof symptom === 'string') {
            return symptom.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
        
        // New format: use displayName if available, otherwise format the type
        return symptom.displayName || symptom.type.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    formatDuration(duration) {
        const durationMap = {
            'less-than-hour': 'Less than 1 hour',
            '1-6-hours': '1-6 hours',
            '6-24-hours': '6-24 hours',
            '1-3-days': '1-3 days',
            'more-than-3-days': 'More than 3 days'
        };
        return durationMap[duration] || duration;
    }

    renderInsights() {
        this.renderFrequencyChart();
        this.renderSeverityChart();
        this.renderPatternAnalysis();
        this.renderWellnessTrend();
        this.renderRealTimeStats();
    }

    renderFrequencyChart() {
        const ctx = document.getElementById('frequencyChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.frequency) {
            this.charts.frequency.destroy();
        }
        
        const symptomCounts = {};
        this.symptoms.forEach(symptom => {
            const name = this.formatSymptomName(symptom.type);
            symptomCounts[name] = (symptomCounts[name] || 0) + 1;
        });
        
        const labels = Object.keys(symptomCounts);
        const data = Object.values(symptomCounts);
        
        this.charts.frequency = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
                        '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderSeverityChart() {
        const ctx = document.getElementById('severityChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.severity) {
            this.charts.severity.destroy();
        }
        
        const last30Days = this.getRecentSymptoms(30);
        const dailyData = {};
        
        // Group by date and calculate average severity
        last30Days.forEach(symptom => {
            const date = symptom.date;
            if (!dailyData[date]) {
                dailyData[date] = { total: 0, count: 0 };
            }
            dailyData[date].total += symptom.severity;
            dailyData[date].count += 1;
        });
        
        const labels = Object.keys(dailyData).sort();
        const data = labels.map(date => 
            Math.round(dailyData[date].total / dailyData[date].count)
        );
        
        this.charts.severity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Severity',
                    data: data,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Severity Level'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    renderPatternAnalysis() {
        const container = document.getElementById('patternAnalysis');
        const patterns = this.analyzeAdvancedPatterns();
        
        if (patterns.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-chart-line"></i>
                    <p>Start logging symptoms to see intelligent pattern analysis</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="pattern-insights">
                ${patterns.map(pattern => `
                    <div class="pattern-card ${pattern.priority}">
                        <div class="pattern-header">
                            <i class="${pattern.icon}"></i>
                            <h4>${pattern.title}</h4>
                            <span class="pattern-badge ${pattern.priority}">${pattern.priority.toUpperCase()}</span>
                        </div>
                        <p class="pattern-description">${pattern.description}</p>
                        ${pattern.recommendation ? `<div class="pattern-recommendation">
                            <i class="fas fa-lightbulb"></i>
                            <span>${pattern.recommendation}</span>
                        </div>` : ''}
                        <div class="pattern-meta">
                            <span class="confidence">Confidence: ${pattern.confidence}%</span>
                            <span class="timeframe">${pattern.timeframe}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    analyzeAdvancedPatterns() {
        if (this.symptoms.length === 0) return [];
        
        const patterns = [];
        const recentSymptoms = this.getRecentSymptoms(30);
        const todaySymptoms = this.symptoms.filter(s => s.date === new Date().toLocaleDateString());
        const weekSymptoms = this.getRecentSymptoms(7);
        
        // Real-time symptom frequency analysis
        const symptomCounts = {};
        recentSymptoms.forEach(symptom => {
            const name = this.formatSymptomName(symptom.type);
            symptomCounts[name] = (symptomCounts[name] || 0) + 1;
        });
        
        const sortedSymptoms = Object.entries(symptomCounts).sort(([,a], [,b]) => b - a);
        
        if (sortedSymptoms.length > 0 && sortedSymptoms[0][1] > 1) {
            const [symptom, count] = sortedSymptoms[0];
            const percentage = Math.round((count / recentSymptoms.length) * 100);
            patterns.push({
                title: 'Dominant Symptom Pattern',
                description: `${symptom} represents ${percentage}% of your recent symptoms (${count} occurrences)`,
                recommendation: count > 5 ? 'Consider consulting a healthcare provider for persistent symptoms' : 'Monitor frequency and triggers',
                icon: 'fas fa-chart-pie',
                priority: count > 5 ? 'high' : count > 3 ? 'medium' : 'low',
                confidence: Math.min(95, 60 + (count * 5)),
                timeframe: 'Last 30 days'
            });
        }
        
        // Severity trend analysis
        const avgSeverity = recentSymptoms.reduce((sum, s) => sum + s.severity, 0) / recentSymptoms.length;
        const recentAvgSeverity = weekSymptoms.reduce((sum, s) => sum + s.severity, 0) / weekSymptoms.length;
        
        if (recentSymptoms.length > 3) {
            const trend = recentAvgSeverity > avgSeverity ? 'increasing' : 'decreasing';
            const trendIcon = trend === 'increasing' ? 'fas fa-arrow-trend-up' : 'fas fa-arrow-trend-down';
            const priority = recentAvgSeverity > 6 ? 'high' : recentAvgSeverity > 4 ? 'medium' : 'low';
            
            patterns.push({
                title: `Severity Trend: ${trend.charAt(0).toUpperCase() + trend.slice(1)}`,
                description: `Average severity ${trend} from ${avgSeverity.toFixed(1)} to ${recentAvgSeverity.toFixed(1)} this week`,
                recommendation: trend === 'increasing' && recentAvgSeverity > 6 ? 
                    'Consider medical consultation for worsening symptoms' : 
                    'Continue monitoring and maintain current care routine',
                icon: trendIcon,
                priority: priority,
                confidence: 85,
                timeframe: 'Weekly trend'
            });
        }
        
        // Symptom clustering analysis
        if (todaySymptoms.length > 1) {
            const severitySum = todaySymptoms.reduce((sum, s) => sum + s.severity, 0);
            const avgTodaySeverity = severitySum / todaySymptoms.length;
            
            patterns.push({
                title: 'Multiple Symptoms Today',
                description: `${todaySymptoms.length} symptoms logged today with average severity ${avgTodaySeverity.toFixed(1)}`,
                recommendation: todaySymptoms.length > 3 || avgTodaySeverity > 6 ? 
                    'Rest and monitor closely - consider medical advice if symptoms persist' : 
                    'Stay hydrated and get adequate rest',
                icon: 'fas fa-exclamation-circle',
                priority: todaySymptoms.length > 3 || avgTodaySeverity > 6 ? 'high' : 'medium',
                confidence: 90,
                timeframe: 'Today'
            });
        }
        
        // Emergency pattern detection
        const emergencySymptoms = recentSymptoms.filter(s => 
            s.severity >= 8 || 
            ['chest-pain', 'shortness-of-breath', 'severe-headache'].includes(s.type)
        );
        
        if (emergencySymptoms.length > 0) {
            patterns.push({
                title: 'High-Priority Symptoms Detected',
                description: `${emergencySymptoms.length} high-severity or emergency symptoms in recent history`,
                recommendation: 'Seek immediate medical attention for severe symptoms',
                icon: 'fas fa-exclamation-triangle',
                priority: 'high',
                confidence: 95,
                timeframe: 'Recent'
            });
        }
        
        // Wellness improvement pattern
        if (recentSymptoms.length > 5) {
            const oldSymptoms = this.symptoms.filter(s => {
                const date = new Date(s.timestamp);
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - 60);
                return date < cutoff;
            });
            
            if (oldSymptoms.length > 0) {
                const oldAvgSeverity = oldSymptoms.reduce((sum, s) => sum + s.severity, 0) / oldSymptoms.length;
                const improvement = oldAvgSeverity - avgSeverity;
                
                if (Math.abs(improvement) > 0.5) {
                    patterns.push({
                        title: improvement > 0 ? 'Health Improvement Trend' : 'Health Decline Pattern',
                        description: `${Math.abs(improvement).toFixed(1)} point ${improvement > 0 ? 'improvement' : 'decline'} in average severity over time`,
                        recommendation: improvement > 0 ? 
                            'Great progress! Continue current health practices' : 
                            'Consider reviewing lifestyle factors and consult healthcare provider',
                        icon: improvement > 0 ? 'fas fa-heart' : 'fas fa-heart-crack',
                        priority: improvement > 0 ? 'low' : 'medium',
                        confidence: 80,
                        timeframe: 'Long-term trend'
                    });
                }
            }
        }
        
        return patterns.slice(0, 5); // Limit to top 5 patterns
    }

    renderWellnessTrend() {
        // This will be rendered in a new insight card
        const wellnessData = this.calculateWellnessTrend();
        // Implementation will be added to HTML structure
    }

    renderRealTimeStats() {
        // This will show real-time statistics
        const stats = this.calculateRealTimeStats();
        // Implementation will be added to HTML structure
    }

    calculateWellnessTrend() {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString();
            
            const daySymptoms = this.symptoms.filter(s => s.date === dateStr);
            let score = 100;
            daySymptoms.forEach(symptom => {
                score -= symptom.severity * 2;
            });
            score = Math.max(0, Math.min(100, score));
            
            last7Days.push({
                date: dateStr,
                score: score,
                symptomCount: daySymptoms.length
            });
        }
        return last7Days;
    }

    calculateRealTimeStats() {
        const today = new Date().toLocaleDateString();
        const todaySymptoms = this.symptoms.filter(s => s.date === today);
        const weekSymptoms = this.getRecentSymptoms(7);
        const monthSymptoms = this.getRecentSymptoms(30);
        
        return {
            todayCount: todaySymptoms.length,
            weekCount: weekSymptoms.length,
            monthCount: monthSymptoms.length,
            avgSeverityToday: todaySymptoms.length > 0 ? 
                (todaySymptoms.reduce((sum, s) => sum + s.severity, 0) / todaySymptoms.length).toFixed(1) : 0,
            avgSeverityWeek: weekSymptoms.length > 0 ? 
                (weekSymptoms.reduce((sum, s) => sum + s.severity, 0) / weekSymptoms.length).toFixed(1) : 0,
            mostCommonSymptom: this.getMostCommonSymptom(monthSymptoms)
        };
    }

    getMostCommonSymptom(symptoms) {
        if (symptoms.length === 0) return 'None';
        
        const counts = {};
        symptoms.forEach(symptom => {
            const name = this.formatSymptomName(symptom.type);
            counts[name] = (counts[name] || 0) + 1;
        });
        
        const sorted = Object.entries(counts).sort(([,a], [,b]) => b - a);
        return sorted.length > 0 ? sorted[0][0] : 'None';
    }



    async generateSuggestions() {
        const container = document.getElementById('suggestionsContainer');
        
        // Get current and recent symptoms
        const todaySymptoms = this.symptoms.filter(s => s.date === new Date().toLocaleDateString());
        const recentSymptoms = this.getRecentSymptoms(7);
        
        // Generate AI-powered suggestions
        let aiSuggestions = [];
        if (this.aiEngine) {
            aiSuggestions = this.aiEngine.generateIntelligentSuggestions(todaySymptoms, recentSymptoms);
        }
        
        // Fallback to rule-based suggestions if AI engine not available
        const fallbackSuggestions = this.getRuleBasedSuggestions();
        const suggestions = aiSuggestions.length > 0 ? aiSuggestions : fallbackSuggestions;
        
        let html = '<h3><i class="fas fa-brain"></i> AI-Powered Health Insights</h3>';
        
        if (suggestions.length === 0) {
            html += `
                <div class="no-suggestions">
                    <i class="fas fa-smile"></i>
                    <h4>Great Health Status!</h4>
                    <p>No specific recommendations at this time. Keep maintaining your healthy lifestyle!</p>
                </div>
            `;
        } else {
            html += '<div class="ai-suggestions-container">';
            
            suggestions.forEach(suggestion => {
                const priorityClass = this.getPriorityClass(suggestion.priority);
                const categoryIcon = this.getCategoryIcon(suggestion.category);
                
                html += `
                    <div class="ai-suggestion-card ${priorityClass}" data-category="${suggestion.category}">
                        <div class="suggestion-header">
                            <div class="suggestion-title-row">
                                <span class="category-icon">${categoryIcon}</span>
                                <h4 class="suggestion-title">${suggestion.title}</h4>
                                <span class="confidence-badge">
                                    <i class="fas fa-chart-line"></i> ${suggestion.confidence || 75}%
                                </span>
                            </div>
                            <div class="suggestion-meta">
                                <span class="priority-badge priority-${suggestion.priority}">${suggestion.priority?.toUpperCase()}</span>
                                <span class="timeframe-badge">
                                    <i class="fas fa-clock"></i> ${suggestion.timeframe || 'Ongoing'}
                                </span>
                            </div>
                        </div>
                        
                        <div class="suggestion-content">
                            <p class="suggestion-description">${suggestion.description}</p>
                            
                            ${suggestion.reasoning ? `
                                <div class="reasoning-section">
                                    <h5><i class="fas fa-lightbulb"></i> Why This Matters</h5>
                                    <p class="reasoning-text">${suggestion.reasoning}</p>
                                </div>
                            ` : ''}
                            
                            ${suggestion.actions && suggestion.actions.length > 0 ? `
                                <div class="actions-section">
                                    <h5><i class="fas fa-tasks"></i> Recommended Actions</h5>
                                    <ul class="action-list">
                                        ${suggestion.actions.map(action => `<li>${action}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            
                            ${suggestion.healthInfo ? `
                                <div class="health-info-section">
                                    <h5><i class="fas fa-info-circle"></i> Health Information</h5>
                                    <div class="health-info-grid">
                                        ${suggestion.healthInfo.description ? `
                                            <div class="info-item">
                                                <strong>About:</strong> ${suggestion.healthInfo.description}
                                            </div>
                                        ` : ''}
                                        ${suggestion.healthInfo.commonCauses ? `
                                            <div class="info-item">
                                                <strong>Common Causes:</strong> ${suggestion.healthInfo.commonCauses.join(', ')}
                                            </div>
                                        ` : ''}
                                        ${suggestion.healthInfo.prevention ? `
                                            <div class="info-item">
                                                <strong>Prevention:</strong> ${suggestion.healthInfo.prevention.join(', ')}
                                            </div>
                                        ` : ''}
                                        ${suggestion.healthInfo.warningSigns ? `
                                            <div class="info-item warning-signs">
                                                <strong>⚠️ Warning Signs:</strong> ${suggestion.healthInfo.warningSigns.join(', ')}
                                            </div>
                                        ` : ''}
                                        ${suggestion.healthInfo.earlySymptoms ? `
                                            <div class="info-item early-symptoms">
                                                <strong>🔍 Early Symptoms:</strong> ${suggestion.healthInfo.earlySymptoms.join(', ')}
                                            </div>
                                        ` : ''}
                                        ${suggestion.healthInfo.progression ? `
                                            <div class="info-item progression">
                                                <strong>📈 Typical Progression:</strong> ${suggestion.healthInfo.progression}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${suggestion.diseaseInfo ? `
                                <div class="disease-info-section">
                                    <h5><i class="fas fa-stethoscope"></i> Condition Analysis</h5>
                                    <div class="disease-info-grid">
                                        ${suggestion.diseaseInfo.stage ? `
                                            <div class="info-item stage-info">
                                                <strong>🎯 Current Stage:</strong> 
                                                <span class="stage-badge">${suggestion.diseaseInfo.stage}</span>
                                            </div>
                                        ` : ''}
                                        ${suggestion.diseaseInfo.riskFactors ? `
                                            <div class="info-item risk-factors">
                                                <strong>⚠️ Risk Factors:</strong> ${suggestion.diseaseInfo.riskFactors.join(', ')}
                                            </div>
                                        ` : ''}
                                        ${suggestion.diseaseInfo.complications ? `
                                            <div class="info-item complications">
                                                <strong>🚨 Potential Complications:</strong> ${suggestion.diseaseInfo.complications.join(', ')}
                                            </div>
                                        ` : ''}
                                        ${suggestion.diseaseInfo.prognosis ? `
                                            <div class="info-item prognosis">
                                                <strong>📊 Prognosis:</strong> ${suggestion.diseaseInfo.prognosis}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${suggestion.medications && suggestion.medications.length > 0 ? `
                                <div class="medications-section">
                                    <h5><i class="fas fa-pills"></i> Medication Options</h5>
                                    <div class="medication-list">
                                        ${suggestion.medications.map(med => `
                                            <span class="medication-tag">${med}</span>
                                        `).join('')}
                                    </div>
                                    <p class="medication-disclaimer">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        Always consult healthcare provider before taking medications
                                    </p>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="suggestion-footer">
                            <button class="suggestion-action-btn" onclick="healthTracker.markSuggestionHelpful('${suggestion.id}')">
                                <i class="fas fa-thumbs-up"></i> Helpful
                            </button>
                            <button class="suggestion-action-btn secondary" onclick="healthTracker.dismissSuggestion('${suggestion.id}')">
                                <i class="fas fa-times"></i> Dismiss
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        if (container) {
            container.innerHTML = html;
        }
    }

    // New ML Prediction Engine
    getSymptomPredictions() {
        if (this.symptoms.length < 5) {
            return []; // Need at least 5 symptoms for meaningful predictions
        }

        const predictions = [];
        const patterns = this.analyzeSymptomPatterns();
        const seasonalFactors = this.getSeasonalFactors();
        const personalFactors = this.getPersonalFactors();

        // Analyze each potential symptom
        const potentialSymptoms = [
            'headache', 'fever', 'cough', 'fatigue', 'nausea', 
            'dizziness', 'chest-pain', 'shortness-breath', 'stomach-pain', 'joint-pain'
        ];

        potentialSymptoms.forEach(symptom => {
            const prediction = this.calculateSymptomProbability(symptom, patterns, seasonalFactors, personalFactors);
            if (prediction.probability > 15) { // Only show predictions above 15%
                predictions.push(prediction);
            }
        });

        // Sort by probability and return top 3
        return predictions.sort((a, b) => b.probability - a.probability).slice(0, 3);
    }

    analyzeSymptomPatterns() {
        const patterns = {
            frequency: {},
            sequences: {},
            timePatterns: {},
            severityTrends: {}
        };

        // Analyze frequency patterns
        this.symptoms.forEach(symptom => {
            const name = symptom.type;
            patterns.frequency[name] = (patterns.frequency[name] || 0) + 1;
        });

        // Analyze symptom sequences (what follows what)
        for (let i = 0; i < this.symptoms.length - 1; i++) {
            const current = this.symptoms[i].type;
            const next = this.symptoms[i + 1].type;
            const key = `${current}->${next}`;
            patterns.sequences[key] = (patterns.sequences[key] || 0) + 1;
        }

        // Analyze time patterns (day of week, time of day)
        this.symptoms.forEach(symptom => {
            const date = new Date(symptom.timestamp);
            const dayOfWeek = date.getDay();
            const hour = date.getHours();
            
            if (!patterns.timePatterns[symptom.type]) {
                patterns.timePatterns[symptom.type] = { days: {}, hours: {} };
            }
            
            patterns.timePatterns[symptom.type].days[dayOfWeek] = 
                (patterns.timePatterns[symptom.type].days[dayOfWeek] || 0) + 1;
            patterns.timePatterns[symptom.type].hours[hour] = 
                (patterns.timePatterns[symptom.type].hours[hour] || 0) + 1;
        });

        return patterns;
    }

    calculateSymptomProbability(symptom, patterns, seasonalFactors, personalFactors) {
        let probability = 0;
        let timeframe = 'Next 7 days';
        let prevention = 'Monitor symptoms and maintain healthy habits';

        // Base frequency score (0-40%)
        const frequency = patterns.frequency[symptom] || 0;
        const maxFrequency = Math.max(...Object.values(patterns.frequency));
        if (maxFrequency > 0) {
            probability += (frequency / maxFrequency) * 40;
        }

        // Sequence pattern score (0-25%)
        const recentSymptoms = this.getRecentSymptoms(7);
        if (recentSymptoms.length > 0) {
            const lastSymptom = recentSymptoms[recentSymptoms.length - 1].type;
            const sequenceKey = `${lastSymptom}->${symptom}`;
            const sequenceCount = patterns.sequences[sequenceKey] || 0;
            const maxSequence = Math.max(...Object.values(patterns.sequences));
            if (maxSequence > 0) {
                probability += (sequenceCount / maxSequence) * 25;
            }
        }

        // Time pattern score (0-20%)
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();
        
        if (patterns.timePatterns[symptom]) {
            const dayScore = patterns.timePatterns[symptom].days[currentDay] || 0;
            const hourScore = patterns.timePatterns[symptom].hours[currentHour] || 0;
            const maxDayScore = Math.max(...Object.values(patterns.timePatterns[symptom].days));
            const maxHourScore = Math.max(...Object.values(patterns.timePatterns[symptom].hours));
            
            if (maxDayScore > 0) probability += (dayScore / maxDayScore) * 10;
            if (maxHourScore > 0) probability += (hourScore / maxHourScore) * 10;
        }

        // Seasonal factors (0-10%)
        probability += seasonalFactors[symptom] || 0;

        // Personal factors (0-5%)
        probability += personalFactors[symptom] || 0;

        // Adjust timeframe based on probability
        if (probability > 60) {
            timeframe = 'Next 1-2 days';
        } else if (probability > 40) {
            timeframe = 'Next 3-5 days';
        }

        // Generate prevention advice
        prevention = this.getPreventionAdvice(symptom, probability);

        return {
            symptom: this.formatSymptomName(symptom),
            probability: Math.min(Math.round(probability), 95), // Cap at 95%
            timeframe,
            prevention
        };
    }

    getSeasonalFactors() {
        const month = new Date().getMonth();
        const factors = {};

        // Winter months (Dec, Jan, Feb) - higher respiratory symptoms
        if ([11, 0, 1].includes(month)) {
            factors.cough = 8;
            factors.fever = 6;
            factors['shortness-of-breath'] = 4;
        }
        // Spring months (Mar, Apr, May) - allergies
        else if ([2, 3, 4].includes(month)) {
            factors.headache = 5;
            factors.cough = 4;
            factors.fatigue = 3;
        }
        // Summer months (Jun, Jul, Aug) - heat-related
        else if ([5, 6, 7].includes(month)) {
            factors.headache = 6;
            factors.dizziness = 5;
            factors.fatigue = 4;
        }
        // Fall months (Sep, Oct, Nov) - seasonal transition
        else {
            factors.fatigue = 4;
            factors.headache = 3;
        }

        return factors;
    }

    getPersonalFactors() {
        const factors = {};
        const recentSymptoms = this.getRecentSymptoms(30);
        
        // If user has been logging frequently, they're health-conscious
        if (recentSymptoms.length > 10) {
            // Slightly reduce all probabilities for health-conscious users
            Object.keys(factors).forEach(key => {
                factors[key] = (factors[key] || 0) - 2;
            });
        }

        return factors;
    }

    getPreventionAdvice(symptom, probability) {
        const advice = {
            headache: 'Stay hydrated, manage stress, ensure adequate sleep, and limit screen time',
            fever: 'Boost immunity with vitamin C, get adequate rest, and avoid crowded places',
            cough: 'Stay hydrated, avoid irritants, consider throat lozenges, and practice good hygiene',
            fatigue: 'Maintain regular sleep schedule, eat balanced meals, and manage stress levels',
            nausea: 'Eat small frequent meals, avoid strong odors, and stay hydrated',
            dizziness: 'Stay hydrated, avoid sudden movements, and ensure adequate nutrition',
            'chest-pain': 'Avoid strenuous activity, practice relaxation techniques, and monitor closely',
            'shortness-breath': 'Avoid allergens, practice breathing exercises, and stay in well-ventilated areas',
            'stomach-pain': 'Eat bland foods, avoid spicy/fatty foods, and stay hydrated',
            'joint-pain': 'Stay active with gentle exercise, apply heat/cold therapy, and maintain healthy weight'
        };

        return advice[symptom] || 'Maintain healthy lifestyle habits and monitor symptoms';
    }

    getRuleBasedSuggestions() {
        const suggestions = [];
        const recentSymptoms = this.getRecentSymptoms(7);
        const todaySymptoms = this.symptoms.filter(s => s.date === new Date().toLocaleDateString());
        
        // Emergency symptoms
        const emergencySymptoms = recentSymptoms.filter(s => 
            ['chest-pain', 'shortness-of-breath'].includes(s.type) || s.severity >= 8
        );
        
        if (emergencySymptoms.length > 0) {
            suggestions.push({
                title: 'Seek Medical Attention',
                content: 'You have logged high-severity symptoms or symptoms that may require immediate medical attention. Consider contacting your healthcare provider or visiting an emergency room.',
                priority: 'high',
                icon: 'fas fa-exclamation-triangle'
            });
        }
        
        // Frequent headaches
        const headaches = recentSymptoms.filter(s => s.type === 'headache');
        if (headaches.length >= 3) {
            suggestions.push({
                title: 'Headache Pattern Detected',
                content: 'You\'ve logged multiple headaches recently. Consider tracking triggers like stress, sleep, diet, or screen time. Stay hydrated and maintain regular sleep patterns.',
                priority: 'medium',
                icon: 'fas fa-brain'
            });
        }
        
        // Fever management
        const fever = recentSymptoms.find(s => s.type === 'fever');
        if (fever) {
            suggestions.push({
                title: 'Fever Management',
                content: 'Monitor your temperature regularly, stay hydrated, get plenty of rest, and consider over-the-counter fever reducers if appropriate. Contact a healthcare provider if fever persists or worsens.',
                priority: 'medium',
                icon: 'fas fa-thermometer-half'
            });
        }
        
        // Fatigue suggestions
        const fatigue = recentSymptoms.filter(s => s.type === 'fatigue');
        if (fatigue.length >= 2) {
            suggestions.push({
                title: 'Combat Fatigue',
                content: 'Persistent fatigue may indicate need for better sleep hygiene, stress management, or nutritional support. Ensure 7-9 hours of sleep, regular exercise, and balanced nutrition.',
                priority: 'low',
                icon: 'fas fa-bed'
            });
        }
        
        // Multiple symptoms today
        if (todaySymptoms.length > 2) {
            suggestions.push({
                title: 'Rest and Recovery',
                content: 'You\'ve logged multiple symptoms today. Consider taking it easy, staying hydrated, and monitoring your condition. If symptoms worsen or persist, consult a healthcare provider.',
                priority: 'medium',
                icon: 'fas fa-heart'
            });
        }
        
        // General wellness
        if (recentSymptoms.length === 0) {
            suggestions.push({
                title: 'Maintain Wellness',
                content: 'Great job staying healthy! Continue with regular exercise, balanced nutrition, adequate sleep, and stress management to maintain your well-being.',
                priority: 'low',
                icon: 'fas fa-smile'
            });
        }
        
        // Digestive issues
        const digestiveSymptoms = recentSymptoms.filter(s => 
            ['nausea', 'stomach-pain'].includes(s.type)
        );
        if (digestiveSymptoms.length >= 2) {
            suggestions.push({
                title: 'Digestive Health',
                content: 'Consider dietary modifications: eat smaller, frequent meals, avoid spicy or fatty foods, stay hydrated, and consider probiotics. If symptoms persist, consult a healthcare provider.',
                priority: 'medium',
                icon: 'fas fa-apple-alt'
            });
        }
        
        return suggestions;
    }

    // Helper methods for AI suggestions
    getPriorityClass(priority) {
        const classes = {
            'critical': 'priority-critical',
            'high': 'priority-high',
            'medium': 'priority-medium',
            'low': 'priority-low'
        };
        return classes[priority] || 'priority-medium';
    }

    getCategoryIcon(category) {
        const icons = {
            'emergency': '🚨',
            'prediction': '🔍',
            'early_warning': '⚠️',
            'diagnosis': '🩺',
            'treatment': '💊',
            'prevention': '🛡️',
            'medication': '💉',
            'lifestyle': '🏃‍♂️',
            'system': '⚙️'
        };
        return icons[category] || '💡';
    }

    markSuggestionHelpful(suggestionId) {
        // Track helpful suggestions for learning
        const helpfulSuggestions = JSON.parse(localStorage.getItem('helpful_suggestions') || '[]');
        if (!helpfulSuggestions.includes(suggestionId)) {
            helpfulSuggestions.push(suggestionId);
            localStorage.setItem('helpful_suggestions', JSON.stringify(helpfulSuggestions));
        }
        
        // Visual feedback
        const suggestionCard = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);
        if (suggestionCard) {
            suggestionCard.classList.add('marked-helpful');
            setTimeout(() => {
                suggestionCard.style.opacity = '0.7';
            }, 1000);
        }
        
        this.showNotification('Thank you for your feedback!', 'success');
    }

    dismissSuggestion(suggestionId) {
        // Track dismissed suggestions
        const dismissedSuggestions = JSON.parse(localStorage.getItem('dismissed_suggestions') || '[]');
        if (!dismissedSuggestions.includes(suggestionId)) {
            dismissedSuggestions.push(suggestionId);
            localStorage.setItem('dismissed_suggestions', JSON.stringify(dismissedSuggestions));
        }
        
        // Hide the suggestion
        const suggestionCard = document.querySelector(`[data-suggestion-id="${suggestionId}"]`);
        if (suggestionCard) {
            suggestionCard.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                suggestionCard.remove();
            }, 300);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    async loadSymptoms() {
        try {
            if (this.dbManager) {
                this.symptoms = await this.dbManager.loadSymptoms();
            } else {
                // Fallback to localStorage if database manager not available
                const stored = localStorage.getItem('healthtracker_symptoms');
                this.symptoms = stored ? JSON.parse(stored) : [];
            }
        } catch (error) {
            // Failed to load symptoms - using localStorage fallback
            const stored = localStorage.getItem('healthtracker_symptoms');
            this.symptoms = stored ? JSON.parse(stored) : [];
        }
    }

    async saveSymptoms() {
        try {
            if (this.dbManager) {
                await this.dbManager.saveSymptoms(this.symptoms);
            } else {
                // Fallback to localStorage
                localStorage.setItem('healthtracker_symptoms', JSON.stringify(this.symptoms));
            }
        } catch (error) {
            // Failed to save symptoms - using localStorage fallback
            localStorage.setItem('healthtracker_symptoms', JSON.stringify(this.symptoms));
        }
    }

    // Check if new user setup is needed
    checkNewUserSetup() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        
        // Check if user has completed initial setup
        if (!userProfile.name || !userProfile.whatsappNumber) {
            this.showNewUserSetup();
        }
    }

    // Show new user setup modal
    showNewUserSetup() {
        // Remove any existing modal
        const existingModal = document.querySelector('.new-user-setup-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create the setup modal HTML
        const modalHTML = `
            <div class="new-user-setup-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                animation: fadeIn 0.4s ease-out;
            ">
                <div style="
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    padding: 50px;
                    border-radius: 24px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3), 0 10px 30px rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    position: relative;
                    animation: slideUp 0.5s ease-out;
                ">
                    <!-- Welcome Header -->
                    <div style="margin-bottom: 35px;">
                        <div style="
                            width: 80px;
                            height: 80px;
                            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 36px;
                            color: white;
                            margin: 0 auto 20px;
                            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);
                        ">🏥</div>
                        <h2 style="
                            color: #1e293b;
                            margin: 0 0 10px 0;
                            font-size: 28px;
                            font-weight: 700;
                            letter-spacing: -0.5px;
                        ">Welcome to Health Tracker</h2>
                        <p style="
                            color: #64748b;
                            margin: 0;
                            font-size: 16px;
                            line-height: 1.5;
                        ">Let's set up your profile for emergency alerts</p>
                    </div>

                    <!-- Form Fields -->
                    <div style="text-align: left; margin-bottom: 35px;">
                        <div style="margin-bottom: 25px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">Your Name *</label>
                            <input 
                                type="text" 
                                id="setupNameInput" 
                                placeholder="Enter your full name"
                                style="
                                    width: 100%;
                                    padding: 16px 20px;
                                    border: 2px solid #e5e7eb;
                                    border-radius: 12px;
                                    font-size: 16px;
                                    box-sizing: border-box;
                                    transition: all 0.3s ease;
                                    background: #ffffff;
                                    color: #1f2937;
                                    font-weight: 500;
                                    outline: none;
                                "
                                onfocus="this.style.borderColor='#4f46e5'; this.style.boxShadow='0 0 0 3px rgba(79, 70, 229, 0.1)'"
                                onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'"
                            />
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="
                                display: block;
                                margin-bottom: 8px;
                                font-weight: 600;
                                color: #374151;
                                font-size: 14px;
                            ">WhatsApp Number *</label>
                            <input 
                                type="tel" 
                                id="setupWhatsAppInput" 
                                placeholder="Enter your WhatsApp number"
                                style="
                                    width: 100%;
                                    padding: 16px 20px;
                                    border: 2px solid #e5e7eb;
                                    border-radius: 12px;
                                    font-size: 16px;
                                    box-sizing: border-box;
                                    transition: all 0.3s ease;
                                    background: #ffffff;
                                    color: #1f2937;
                                    font-weight: 500;
                                    outline: none;
                                "
                                onfocus="this.style.borderColor='#4f46e5'; this.style.boxShadow='0 0 0 3px rgba(79, 70, 229, 0.1)'"
                                onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'"
                            />
                            <small style="
                                color: #6b7280;
                                font-size: 13px;
                                margin-top: 6px;
                                display: block;
                            ">📱 Include country code (e.g., +91 9876543210)</small>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="
                        display: flex; 
                        justify-content: center;
                    ">
                        <button 
                            onclick="healthTracker.saveNewUserSetup()" 
                            style="
                                padding: 16px 32px;
                                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                                color: white;
                                border: none;
                                border-radius: 12px;
                                cursor: pointer;
                                font-size: 16px;
                                font-weight: 600;
                                transition: all 0.3s ease;
                                box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
                                min-width: 160px;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(79, 70, 229, 0.4)'"
                            onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 4px 15px rgba(79, 70, 229, 0.3)'"
                        >💾 Complete Setup</button>
                    </div>

                    <!-- Info Note -->
                    <div style="
                        margin-top: 30px;
                        padding: 20px;
                        background: rgba(59, 130, 246, 0.1);
                        border-radius: 12px;
                        border-left: 4px solid #3b82f6;
                    ">
                        <p style="
                            margin: 0;
                            font-size: 14px;
                            color: #1e40af;
                            line-height: 1.5;
                        ">
                            🔒 <strong>Privacy:</strong> Your information is stored locally and only used for emergency WhatsApp alerts when symptoms reach severity level 8 or higher.
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
                        transform: translateY(40px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0px) scale(1);
                    }
                }
                @media (max-width: 600px) {
                    .new-user-setup-modal > div {
                        padding: 30px 25px !important;
                        margin: 20px !important;
                        width: calc(100% - 40px) !important;
                    }
                    .new-user-setup-modal button {
                        width: 100% !important;
                        margin-bottom: 10px !important;
                    }
                    .new-user-setup-modal > div > div:last-child {
                        flex-direction: column !important;
                    }
                }
            </style>
        `;

        // Add to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus on name input
        setTimeout(() => {
            document.getElementById('setupNameInput').focus();
        }, 100);
    }

    // Save new user setup
    saveNewUserSetup() {
        const nameInput = document.getElementById('setupNameInput');
        const whatsappInput = document.getElementById('setupWhatsAppInput');
        
        if (!nameInput || !whatsappInput) {
            this.showErrorMessage('Setup form not found. Please try again.');
            return;
        }

        const name = nameInput.value.trim();
        const whatsappNumber = whatsappInput.value.trim();
        
        // Validate inputs
        if (!name) {
            this.showErrorMessage('कृपया अपना नाम दर्ज करें / Please enter your name');
            nameInput.focus();
            return;
        }
        
        if (!whatsappNumber) {
            this.showErrorMessage('कृपया WhatsApp नंबर दर्ज करें / Please enter WhatsApp number');
            whatsappInput.focus();
            return;
        }
        
        // Basic phone number validation
        const cleanNumber = whatsappNumber.replace(/\D/g, '');
        if (cleanNumber.length < 10) {
            this.showErrorMessage('कृपया वैध WhatsApp नंबर दर्ज करें / Please enter a valid WhatsApp number (at least 10 digits)');
            whatsappInput.focus();
            return;
        }

        // Format number (add +91 if it's 10 digits and doesn't have country code)
        let formattedNumber = whatsappNumber;
        if (cleanNumber.length === 10 && !whatsappNumber.includes('+')) {
            formattedNumber = '+91' + cleanNumber;
        } else if (cleanNumber.length > 10 && !whatsappNumber.includes('+')) {
            formattedNumber = '+' + cleanNumber;
        }

        // Save to localStorage
        const userProfile = {
            name: name,
            whatsappNumber: formattedNumber,
            setupCompleted: true,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        // Close modal
        this.closeNewUserSetupModal();
        
        // Show success message
        this.showSuccessMessage(`✅ सेटअप पूरा हो गया! / Setup completed successfully!\nName: ${name}\nWhatsApp: ${formattedNumber}`);
    }

    // Skip new user setup
    skipNewUserSetup() {
        // Save minimal profile to indicate setup was skipped
        const userProfile = {
            name: 'User',
            whatsappNumber: '',
            setupCompleted: false,
            setupSkipped: true,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        // Close modal
        this.closeNewUserSetupModal();
        
        // Show info message
        this.showInfoMessage('⚠️ सेटअप छोड़ दिया गया / Setup skipped. You can complete it later in Settings.');
    }

    // Close new user setup modal
    closeNewUserSetupModal() {
        const modal = document.querySelector('.new-user-setup-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // Helper method to show info messages
    showInfoMessage(message) {
        this.showMessage(message, 'info');
    }

    // Generic message display method
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-notification ${type}`;
        
        const colors = {
            success: { bg: '#10b981', border: '#059669' },
            error: { bg: '#ef4444', border: '#dc2626' },
            info: { bg: '#3b82f6', border: '#2563eb' }
        };
        
        const color = colors[type] || colors.info;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color.bg};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            border-left: 4px solid ${color.border};
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            z-index: 10002;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            line-height: 1.4;
            max-width: 400px;
            animation: slideInRight 0.4s ease-out;
            cursor: pointer;
        `;
        
        messageDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <div style="flex: 1; white-space: pre-line;">${message}</div>
                <button style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                    opacity: 0.8;
                    line-height: 1;
                " onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOutRight 0.4s ease-out';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 400);
            }
        }, 5000);
        
        // Add CSS animations if not already present
        if (!document.querySelector('#message-animations')) {
            const style = document.createElement('style');
            style.id = 'message-animations';
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
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Global HealthTracker instance
let healthTracker;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    healthTracker = new HealthTracker();
});

// Theme toggling helpers
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('healthtracker_theme', next); } catch (e) {}
}

// Add some demo data for testing (remove in production)
function addDemoData() {
    // Note: HealthTracker instance should already be created in DOMContentLoaded
    const demoSymptoms = [
        {
            id: Date.now() - 86400000,
            type: 'headache',
            severity: 6,
            duration: '1-6-hours',
            notes: 'Started after working on computer for long hours',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            date: new Date(Date.now() - 86400000).toLocaleDateString()
        },
        {
            id: Date.now() - 172800000,
            type: 'fatigue',
            severity: 4,
            duration: '6-24-hours',
            notes: 'Feeling tired throughout the day',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            date: new Date(Date.now() - 172800000).toLocaleDateString()
        }
    ];
    
    localStorage.setItem('healthtracker_symptoms', JSON.stringify(demoSymptoms));
    location.reload();
}

// Uncomment the line below to add demo data for testing
// addDemoData();

// Settings Modal Functions
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('show');
    
    // Load existing settings
    loadSettingsData();
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('show');
}

function loadSettingsData() {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    
    // Populate form fields
    document.getElementById('userNameInput').value = userProfile.name || '';
}

function saveSettings() {
    const userName = document.getElementById('userNameInput').value.trim();
    
    // Validate inputs
    if (!userName) {
        showErrorMessage('कृपया अपना नाम दर्ज करें / Please enter your name');
        return;
    }
    
    // Save to localStorage
    const userProfile = {
        name: userName,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    // Show success message
    showSuccessMessage('सेटिंग्स सफलतापूर्वक सेव हो गईं! / Settings saved successfully!');
    
    // Close modal after a short delay
    setTimeout(() => {
        closeSettingsModal();
    }, 1500);
}



// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('settingsModal');
    if (event.target === modal) {
        closeSettingsModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeSettingsModal();
    }
});