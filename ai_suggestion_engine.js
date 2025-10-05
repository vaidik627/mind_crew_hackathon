/**
 * Advanced AI-Powered Suggestion Engine
 * Provides intelligent health recommendations with reasoning and comprehensive information
 */
class AISuggestionEngine {
    constructor() {
        this.healthKnowledge = null;
        this.loadHealthKnowledge();
    }

    async loadHealthKnowledge() {
        try {
            const response = await fetch('./database/health_knowledge.json');
            this.healthKnowledge = await response.json();
        } catch (error) {
            // Failed to load health knowledge - using default fallback
            this.healthKnowledge = this.getDefaultKnowledge();
        }
    }

    /**
     * Generate intelligent suggestions based on user symptoms
     * @param {Array} symptoms - Array of user symptoms
     * @param {Array} recentSymptoms - Recent symptom history
     * @returns {Array} Enhanced suggestions with reasoning
     */
    generateIntelligentSuggestions(symptoms, recentSymptoms = []) {
        if (!this.healthKnowledge) {
            return this.getBasicSuggestions();
        }

        const suggestions = [];
        const allSymptoms = [...symptoms, ...recentSymptoms];
        
        // 1. Emergency Assessment
        const emergencySuggestions = this.assessEmergencySymptoms(allSymptoms);
        suggestions.push(...emergencySuggestions);

        // 2. Disease Prediction Analysis
        const diseasePredictions = this.predictPotentialConditions(allSymptoms).filter(s => (s.confidence || 0) >= 60);
        suggestions.push(...diseasePredictions);

        // 3. Symptom Pattern Analysis
        const patternSuggestions = this.analyzeSymptomPatterns(allSymptoms);
        suggestions.push(...patternSuggestions);

        // 4. Individual Symptom Management
        const managementSuggestions = this.generateSymptomManagement(symptoms).filter(s => s.priority !== 'low' || (s.confidence || 0) >= 70);
        suggestions.push(...managementSuggestions);

        // 5. Preventive Care Recommendations
        const preventiveSuggestions = this.generatePreventiveCare(allSymptoms);
        suggestions.push(...preventiveSuggestions);

        // 6. Medication Recommendations
        const medicationSuggestions = this.generateMedicationSuggestions(symptoms);
        suggestions.push(...medicationSuggestions);

        // Remove duplicates by id and re-sort
        return this.prioritizeAndFormat(suggestions);
    }

    /**
     * Assess for emergency symptoms requiring immediate attention
     */
    assessEmergencySymptoms(symptoms) {
        const suggestions = [];
        const emergencySymptoms = symptoms.filter(s => 
            s.severity >= 8 || 
            ['chest-pain', 'shortness-breath', 'severe-headache'].includes(s.type)
        );

        if (emergencySymptoms.length > 0) {
            suggestions.push({
                id: 'emergency_care',
                title: '🚨 Seek Immediate Medical Attention',
                description: 'You have symptoms that may require urgent medical care.',
                reasoning: this.getEmergencyReasoning(emergencySymptoms),
                priority: 'critical',
                category: 'emergency',
                actions: [
                    'Call emergency services if severe',
                    'Visit emergency room',
                    'Contact your healthcare provider immediately'
                ],
                timeframe: 'Immediate',
                confidence: 95
            });
        }

        return suggestions;
    }

    /**
     * Predict potential conditions based on symptom patterns
     */
    predictPotentialConditions(symptoms) {
        const suggestions = [];
        const symptomTypes = symptoms.map(s => s.type);
        const recentSymptoms = symptoms.filter(s => {
            const date = new Date(s.timestamp);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 7);
            return date >= cutoff;
        });

        // Disease pattern matching
        const diseasePatterns = this.getDiseasePatterns();
        
        for (const [disease, pattern] of Object.entries(diseasePatterns)) {
            const matchScore = this.calculatePatternMatch(symptomTypes, pattern.symptoms);
            const matchedCount = this.countMatches(symptomTypes, pattern.symptoms);
            
            // Require at least 2 concrete matches to reduce noise
            if (matchScore >= pattern.threshold && matchedCount >= 2) {
                const confidence = Math.min(95, matchScore * pattern.confidenceMultiplier);
                
                suggestions.push({
                    id: `disease_prediction_${disease}`,
                    title: `🔍 Potential Condition: ${pattern.displayName}`,
                    description: `Your symptoms suggest you may be experiencing ${pattern.displayName.toLowerCase()}.`,
                    reasoning: this.getDiseaseReasoning(disease, symptomTypes, pattern),
                    priority: pattern.severity === 'high' ? 'high' : 'medium',
                    category: 'prediction',
                    actions: pattern.recommendedActions,
                    healthInfo: {
                        description: pattern.description,
                        commonCauses: pattern.causes,
                        earlySymptoms: pattern.earlySymptoms,
                        progression: pattern.progression,
                        prevention: pattern.prevention,
                        warningSigns: pattern.warningSigns
                    },
                    diseaseInfo: {
                        stage: this.determineStage(symptomTypes, pattern),
                        riskFactors: pattern.riskFactors,
                        complications: pattern.complications,
                        prognosis: pattern.prognosis
                    },
                    timeframe: pattern.timeframe,
                    confidence: Math.round(confidence)
                });
            }
        }

        // Early symptom detection
        const earlySymptomSuggestions = this.detectEarlySymptoms(symptoms);
        suggestions.push(...earlySymptomSuggestions);

        return suggestions;
    }

    countMatches(userSymptoms, diseaseSymptoms) {
        return userSymptoms.filter(symptom => 
            diseaseSymptoms.some(diseaseSymptom => 
                symptom.includes(diseaseSymptom) || diseaseSymptom.includes(symptom)
            )
        ).length;
    }

    /**
     * Define disease patterns for matching
     */
    getDiseasePatterns() {
        return {
            flu: {
                displayName: 'Influenza (Flu)',
                symptoms: ['fever', 'headache', 'muscle-aches', 'fatigue', 'cough'],
                threshold: 0.6,
                confidenceMultiplier: 85,
                severity: 'medium',
                description: 'A viral infection that affects the respiratory system and causes systemic symptoms.',
                causes: ['Influenza virus types A, B, or C'],
                earlySymptoms: ['fatigue', 'mild-headache', 'body-aches'],
                progression: 'Symptoms typically worsen over 1-2 days, peak around day 3-4, then gradually improve',
                prevention: ['Annual flu vaccination', 'Hand hygiene', 'Avoid close contact with sick individuals'],
                warningSigns: ['Difficulty breathing', 'Persistent high fever', 'Severe dehydration'],
                recommendedActions: [
                    'Rest and stay hydrated',
                    'Take antiviral medication if prescribed within 48 hours',
                    'Monitor symptoms and seek care if worsening'
                ],
                timeframe: '7-10 days',
                riskFactors: ['Age >65 or <5', 'Chronic conditions', 'Pregnancy', 'Immunocompromised'],
                complications: ['Pneumonia', 'Bronchitis', 'Sinus infections'],
                prognosis: 'Most people recover completely within 1-2 weeks'
            },
            cold: {
                displayName: 'Common Cold',
                symptoms: ['runny-nose', 'sneezing', 'sore-throat', 'mild-headache', 'cough'],
                threshold: 0.5,
                confidenceMultiplier: 80,
                severity: 'low',
                description: 'A viral upper respiratory tract infection causing mild symptoms.',
                causes: ['Rhinovirus', 'Coronavirus', 'Adenovirus'],
                earlySymptoms: ['scratchy-throat', 'sneezing', 'runny-nose'],
                progression: 'Symptoms develop gradually over 1-3 days and peak around day 2-3',
                prevention: ['Hand washing', 'Avoid touching face', 'Maintain distance from sick individuals'],
                warningSigns: ['High fever', 'Severe headache', 'Difficulty swallowing'],
                recommendedActions: [
                    'Rest and drink plenty of fluids',
                    'Use saline nasal rinses',
                    'Consider over-the-counter symptom relief'
                ],
                timeframe: '7-10 days',
                riskFactors: ['Stress', 'Poor sleep', 'Close contact with infected individuals'],
                complications: ['Secondary bacterial infections', 'Sinusitis', 'Ear infections'],
                prognosis: 'Complete recovery expected within 1-2 weeks'
            },
            migraine: {
                displayName: 'Migraine Headache',
                symptoms: ['severe-headache', 'nausea', 'light-sensitivity', 'sound-sensitivity'],
                threshold: 0.7,
                confidenceMultiplier: 90,
                severity: 'medium',
                description: 'A neurological condition causing severe, recurring headaches with associated symptoms.',
                causes: ['Genetic factors', 'Hormonal changes', 'Environmental triggers'],
                earlySymptoms: ['mild-headache', 'mood-changes', 'food-cravings', 'neck-stiffness'],
                progression: 'May have prodrome phase, followed by severe headache phase lasting 4-72 hours',
                prevention: ['Identify and avoid triggers', 'Regular sleep schedule', 'Stress management'],
                warningSigns: ['Sudden severe headache', 'Headache with fever', 'Changes in vision'],
                recommendedActions: [
                    'Rest in dark, quiet room',
                    'Apply cold or warm compress',
                    'Take prescribed migraine medication early'
                ],
                timeframe: '4-72 hours per episode',
                riskFactors: ['Family history', 'Female gender', 'Age 20-50', 'Hormonal changes'],
                complications: ['Chronic migraine', 'Medication overuse headache', 'Status migrainosus'],
                prognosis: 'Manageable with proper treatment and lifestyle modifications'
            },
            gastroenteritis: {
                displayName: 'Gastroenteritis (Stomach Bug)',
                symptoms: ['nausea', 'vomiting', 'diarrhea', 'abdominal-pain', 'fever'],
                threshold: 0.6,
                confidenceMultiplier: 85,
                severity: 'medium',
                description: 'Inflammation of the stomach and intestines causing digestive symptoms.',
                causes: ['Viral infection', 'Bacterial infection', 'Food poisoning', 'Parasites'],
                earlySymptoms: ['mild-nausea', 'loss-of-appetite', 'mild-abdominal-discomfort'],
                progression: 'Symptoms typically develop rapidly and may worsen over 24-48 hours',
                prevention: ['Hand hygiene', 'Food safety', 'Avoid contaminated water'],
                warningSigns: ['Severe dehydration', 'Blood in stool', 'High fever', 'Severe abdominal pain'],
                recommendedActions: [
                    'Stay hydrated with clear fluids',
                    'Follow BRAT diet when tolerated',
                    'Rest and avoid dairy/fatty foods'
                ],
                timeframe: '1-3 days for viral, longer for bacterial',
                riskFactors: ['Travel', 'Contaminated food/water', 'Close contact with infected individuals'],
                complications: ['Dehydration', 'Electrolyte imbalance', 'Secondary infections'],
                prognosis: 'Most cases resolve without treatment within a few days'
            }
        };
    }

    /**
     * Calculate how well symptoms match a disease pattern
     */
    calculatePatternMatch(userSymptoms, diseaseSymptoms) {
        const matches = userSymptoms.filter(symptom => 
            diseaseSymptoms.some(diseaseSymptom => 
                symptom.includes(diseaseSymptom) || diseaseSymptom.includes(symptom)
            )
        ).length;
        
        return matches / diseaseSymptoms.length;
    }

    /**
     * Generate reasoning for disease prediction
     */
    getDiseaseReasoning(disease, symptoms, pattern) {
        const matchedSymptoms = symptoms.filter(symptom => 
            pattern.symptoms.some(diseaseSymptom => 
                symptom.includes(diseaseSymptom) || diseaseSymptom.includes(symptom)
            )
        );

        return `Based on your symptoms (${matchedSymptoms.join(', ')}), there's a pattern consistent with ${pattern.displayName}. ${pattern.description} This assessment is based on symptom correlation analysis and medical knowledge patterns.`;
    }

    /**
     * Determine disease stage based on symptoms
     */
    determineStage(symptoms, pattern) {
        const earlySymptomCount = symptoms.filter(s => 
            pattern.earlySymptoms && pattern.earlySymptoms.includes(s)
        ).length;
        
        const totalSymptomCount = symptoms.filter(s => 
            pattern.symptoms.includes(s)
        ).length;

        if (earlySymptomCount > 0 && totalSymptomCount <= 2) {
            return 'Early stage - symptoms just beginning';
        } else if (totalSymptomCount >= pattern.symptoms.length * 0.7) {
            return 'Active stage - full symptom presentation';
        } else {
            return 'Developing stage - symptoms progressing';
        }
    }

    /**
     * Detect early symptoms that might indicate developing conditions
     */
    detectEarlySymptoms(symptoms) {
        const suggestions = [];
        const recentSymptoms = symptoms.filter(s => {
            const date = new Date(s.timestamp);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 3);
            return date >= cutoff;
        });

        // Check for early warning patterns
        const earlyPatterns = {
            'respiratory_infection': {
                symptoms: ['scratchy-throat', 'mild-cough', 'runny-nose'],
                warning: 'Early signs of respiratory infection',
                prevention: ['Increase fluid intake', 'Get extra rest', 'Consider zinc supplements']
            },
            'digestive_issues': {
                symptoms: ['mild-nausea', 'loss-of-appetite', 'mild-abdominal-discomfort'],
                warning: 'Early digestive system disturbance',
                prevention: ['Eat bland foods', 'Stay hydrated', 'Avoid dairy and spicy foods']
            },
            'stress_response': {
                symptoms: ['mild-headache', 'fatigue', 'muscle-tension'],
                warning: 'Early stress-related symptoms',
                prevention: ['Practice relaxation techniques', 'Ensure adequate sleep', 'Consider stress management']
            }
        };

        for (const [pattern, info] of Object.entries(earlyPatterns)) {
            const matches = recentSymptoms.filter(s => 
                info.symptoms.some(early => s.type.includes(early) || early.includes(s.type))
            );

            if (matches.length >= 2) {
                suggestions.push({
                    id: `early_warning_${pattern}`,
                    title: `⚠️ Early Warning: ${info.warning}`,
                    description: 'Your recent symptoms suggest the early stages of a developing condition.',
                    reasoning: `The combination of ${matches.map(m => m.type).join(', ')} in recent days suggests ${info.warning}. Early intervention can help prevent progression.`,
                    priority: 'medium',
                    category: 'early_warning',
                    actions: info.prevention,
                    timeframe: 'Next 24-48 hours',
                    confidence: 70
                });
            }
        }

        return suggestions;
    }

    /**
     * Analyze patterns in symptom combinations
     */
    analyzeSymptomPatterns(symptoms) {
        const suggestions = [];
        const symptomTypes = symptoms.map(s => s.type);
        
        // Check for common combinations
        if (symptomTypes.includes('fever') && symptomTypes.includes('headache')) {
            suggestions.push({
                id: 'infection_pattern',
                title: '🦠 Possible Infection Detected',
                description: 'The combination of fever and headache suggests a possible infection.',
                reasoning: 'Fever with headache is commonly associated with viral or bacterial infections. Your immune system is responding to a potential pathogen.',
                priority: 'high',
                category: 'diagnosis',
                actions: [
                    'Monitor temperature regularly',
                    'Stay hydrated and rest',
                    'Consider seeing a healthcare provider if symptoms worsen'
                ],
                healthInfo: {
                    commonCauses: ['Viral infection', 'Bacterial infection', 'Flu', 'Cold'],
                    expectedDuration: '3-7 days for viral infections',
                    warningSigns: ['Temperature >103°F', 'Severe headache', 'Neck stiffness']
                },
                timeframe: '24-48 hours for improvement',
                confidence: 85
            });
        }

        if (symptomTypes.includes('cough') && symptomTypes.includes('fever')) {
            suggestions.push({
                id: 'respiratory_pattern',
                title: '🫁 Respiratory Infection Likely',
                description: 'Cough with fever indicates a respiratory system infection.',
                reasoning: 'The respiratory system is showing signs of inflammation and infection. The cough is your body\'s way of clearing irritants while fever indicates immune response.',
                priority: 'high',
                category: 'diagnosis',
                actions: [
                    'Use humidifier or steam inhalation',
                    'Drink warm liquids',
                    'Avoid smoke and irritants',
                    'Consider medical evaluation if persistent'
                ],
                healthInfo: {
                    commonCauses: ['Bronchitis', 'Pneumonia', 'Upper respiratory infection'],
                    expectedDuration: '1-2 weeks',
                    warningSigns: ['Difficulty breathing', 'Chest pain', 'Blood in cough']
                },
                timeframe: '3-5 days for improvement',
                confidence: 80
            });
        }

        return suggestions;
    }

    /**
     * Generate management suggestions for individual symptoms
     */
    generateSymptomManagement(symptoms) {
        const suggestions = [];

        symptoms.forEach(symptom => {
            const knowledge = this.healthKnowledge.symptoms[symptom.type];
            if (knowledge) {
                const severity = this.categorizeSeverity(symptom.severity);
                
                suggestions.push({
                    id: `manage_${symptom.type}`,
                    title: `💊 ${this.formatSymptomName(symptom.type)} Management`,
                    description: `Targeted treatment for your ${severity} ${symptom.type}.`,
                    reasoning: this.getManagementReasoning(symptom, knowledge),
                    priority: severity === 'severe' ? 'high' : 'medium',
                    category: 'treatment',
                    actions: knowledge.treatments.immediate,
                    healthInfo: {
                        description: knowledge.description,
                        commonCauses: knowledge.commonCauses,
                        prevention: knowledge.treatments.prevention
                    },
                    medications: this.getRelevantMedications(symptom.type),
                    timeframe: this.getExpectedTimeframe(symptom.type, severity),
                    confidence: 75
                });
            }
        });

        return suggestions;
    }

    /**
     * Generate preventive care recommendations
     */
    generatePreventiveCare(symptoms) {
        const suggestions = [];
        const symptomTypes = [...new Set(symptoms.map(s => s.type))];

        if (symptomTypes.length > 0) {
            suggestions.push({
                id: 'preventive_care',
                title: '🛡️ Prevention Strategy',
                description: 'Prevent future occurrences of your symptoms.',
                reasoning: 'Based on your symptom history, these preventive measures can help reduce the likelihood of recurrence and improve your overall health.',
                priority: 'low',
                category: 'prevention',
                actions: this.getPreventiveActions(symptomTypes),
                healthInfo: {
                    benefits: 'Reduces symptom frequency and severity',
                    timeline: 'Benefits typically seen within 2-4 weeks',
                    lifestyle: this.getLifestyleRecommendations(symptomTypes)
                },
                timeframe: 'Ongoing',
                confidence: 70
            });
        }

        return suggestions;
    }

    /**
     * Generate medication suggestions with detailed information
     */
    generateMedicationSuggestions(symptoms) {
        const suggestions = [];
        const medicationMap = {
            'headache': ['acetaminophen', 'ibuprofen'],
            'fever': ['acetaminophen', 'ibuprofen'],
            'cough': ['dextromethorphan'],
            'nausea': ['ginger', 'ondansetron']
        };

        symptoms.forEach(symptom => {
            const recommendedMeds = medicationMap[symptom.type];
            if (recommendedMeds) {
                recommendedMeds.forEach(medName => {
                    const medInfo = this.healthKnowledge.medications[medName];
                    if (medInfo) {
                        suggestions.push({
                            id: `medication_${medName}_${symptom.type}`,
                            title: `💊 ${medInfo.brandNames[0]} (${medInfo.genericName})`,
                            description: `Over-the-counter medication for ${symptom.type} relief.`,
                            reasoning: `${medInfo.genericName} is effective for ${symptom.type} because it ${this.getMedicationMechanism(medName, symptom.type)}.`,
                            priority: 'medium',
                            category: 'medication',
                            actions: [
                                `Take ${medInfo.dosage}`,
                                'Follow package instructions',
                                'Do not exceed recommended dose'
                            ],
                            healthInfo: {
                                uses: medInfo.uses,
                                sideEffects: medInfo.sideEffects,
                                contraindications: medInfo.contraindications,
                                brandNames: medInfo.brandNames
                            },
                            timeframe: '30-60 minutes for effect',
                            confidence: 85
                        });
                    }
                });
            }
        });

        return suggestions;
    }

    /**
     * Helper methods
     */
    getEmergencyReasoning(symptoms) {
        const reasons = symptoms.map(s => {
            if (s.severity >= 8) return `Severity level ${s.severity}/10 indicates significant distress`;
            if (s.type === 'chest-pain') return 'Chest pain can indicate serious cardiac or pulmonary conditions';
            if (s.type === 'shortness-breath') return 'Breathing difficulties require immediate evaluation';
            return 'High-risk symptom requiring professional assessment';
        });
        return reasons.join('. ');
    }

    getManagementReasoning(symptom, knowledge) {
        const severity = this.categorizeSeverity(symptom.severity);
        return `Your ${severity} ${symptom.type} (${knowledge.description.toLowerCase()}) can be managed with targeted interventions. The recommended treatments address the underlying causes and provide symptom relief.`;
    }

    getMedicationMechanism(medication, symptomType) {
        const mechanisms = {
            'acetaminophen': {
                'headache': 'blocks pain signals in the brain',
                'fever': 'affects the brain\'s temperature control center'
            },
            'ibuprofen': {
                'headache': 'reduces inflammation and blocks pain signals',
                'fever': 'reduces inflammation and affects temperature regulation'
            }
        };
        return mechanisms[medication]?.[symptomType] || 'provides therapeutic benefit';
    }

    categorizeSeverity(severity) {
        if (severity <= 3) return 'mild';
        if (severity <= 6) return 'moderate';
        return 'severe';
    }

    formatSymptomName(symptom) {
        return symptom.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    getRelevantMedications(symptomType) {
        const medMap = {
            'headache': ['Acetaminophen (Tylenol)', 'Ibuprofen (Advil)'],
            'fever': ['Acetaminophen (Tylenol)', 'Ibuprofen (Advil)'],
            'cough': ['Dextromethorphan (Robitussin)', 'Honey'],
            'nausea': ['Ginger', 'Dramamine']
        };
        return medMap[symptomType] || [];
    }

    getPreventiveActions(symptomTypes) {
        const actions = new Set();
        symptomTypes.forEach(type => {
            const knowledge = this.healthKnowledge.symptoms[type];
            if (knowledge?.treatments?.prevention) {
                knowledge.treatments.prevention.forEach(action => actions.add(action));
            }
        });
        return Array.from(actions);
    }

    getLifestyleRecommendations(symptomTypes) {
        return [
            'Maintain regular sleep schedule (7-9 hours)',
            'Stay hydrated (8-10 glasses water daily)',
            'Exercise regularly (30 minutes, 5 days/week)',
            'Manage stress through relaxation techniques',
            'Eat balanced, nutritious meals',
            'Avoid known triggers'
        ];
    }

    getExpectedTimeframe(symptomType, severity) {
        const timeframes = {
            'headache': { mild: '30-60 minutes', moderate: '1-2 hours', severe: '2-4 hours' },
            'fever': { mild: '24-48 hours', moderate: '2-3 days', severe: '3-5 days' },
            'cough': { mild: '3-5 days', moderate: '1-2 weeks', severe: '2-3 weeks' },
            'fatigue': { mild: '1-2 days', moderate: '3-5 days', severe: '1-2 weeks' }
        };
        return timeframes[symptomType]?.[severity] || '1-3 days';
    }

    prioritizeAndFormat(suggestions) {
        // Remove duplicates and sort by priority
        const unique = suggestions.filter((item, index, self) => 
            index === self.findIndex(s => s.id === item.id)
        );

        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return unique.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    getBasicSuggestions() {
        return [{
            id: 'loading',
            title: 'Loading Health Knowledge...',
            description: 'Please wait while we load the health information database.',
            priority: 'low',
            category: 'system'
        }];
    }

    getDefaultKnowledge() {
        return {
            symptoms: {
                headache: {
                    description: "Pain in the head or neck area",
                    treatments: {
                        immediate: ["rest", "hydration", "pain reliever"],
                        prevention: ["regular sleep", "stress management"]
                    }
                }
            },
            medications: {
                acetaminophen: {
                    genericName: "acetaminophen",
                    brandNames: ["Tylenol"],
                    uses: ["pain relief"],
                    dosage: "500mg every 4-6 hours"
                }
            }
        };
    }
}

// Export for use in main application
window.AISuggestionEngine = AISuggestionEngine;