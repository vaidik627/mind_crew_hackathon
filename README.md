# HealthTracker Pro - Intelligent Symptom Logger

## 🏥 Healthcare Hackathon Project

A comprehensive web application for logging symptoms and receiving intelligent health suggestions based on a rules-based system.

## ✨ Unique Features

1. **Smart Symptom Timeline** - Visual timeline showing symptom progression
2. **Severity Heat Map** - Color-coded severity tracking over time  
3. **Pattern Recognition** - Identifies recurring symptom patterns
4. **Emergency Alert System** - Flags critical symptom combinations
5. **Wellness Score** - Daily wellness scoring based on logged symptoms
6. **Data Visualization** - Interactive charts for symptom analysis
7. **Rules-Based Suggestions** - Personalized health recommendations

## 🚀 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: LocalStorage API
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Styling**: Modern CSS Grid/Flexbox

## 📋 Testing Instructions

### Step 1: Start the Application
```bash
# Navigate to project directory
cd crew_mind_hackathon

# Start local server
python -m http.server 8000
```

### Step 2: Open in Browser
Visit: `http://localhost:8000`

### Step 3: Test Features

#### A. Log Symptoms
1. Click "Log Symptoms" tab
2. Select a symptom type (e.g., "Headache")
3. Adjust severity slider (1-10)
4. Choose duration
5. Add optional notes
6. Click "Log Symptom"
7. ✅ Verify success message appears

#### B. Test Emergency Alerts
1. Log a symptom with severity 8+ OR
2. Log "Chest Pain" or "Shortness of Breath"
3. ✅ Verify emergency alert appears

#### C. View History
1. Click "History" tab
2. ✅ Verify logged symptoms appear in timeline
3. Test filter options (Today, This Week, This Month)

#### D. Check Insights
1. Click "Insights" tab
2. ✅ Verify charts display:
   - Symptom frequency (doughnut chart)
   - Severity trends (line chart)
   - Pattern analysis

#### E. Review Suggestions
1. Click "Suggestions" tab
2. ✅ Verify personalized suggestions appear based on logged symptoms

#### F. Test Responsive Design
1. Resize browser window
2. ✅ Verify layout adapts to different screen sizes

## 🧪 Demo Data (Optional)

To test with sample data, uncomment the last line in `script.js`:
```javascript
// addDemoData();
```

## 🏆 Hackathon Highlights

### Problem Solved
- Users can easily log symptoms with detailed tracking
- Intelligent suggestions help users understand next steps
- Pattern recognition identifies health trends
- Emergency detection for critical symptoms

### Innovation Points
- Real-time wellness scoring algorithm
- Visual symptom timeline with severity mapping
- Rules-based medical suggestion engine
- Responsive healthcare-focused UI design
- Local data persistence for privacy

### Technical Excellence
- Clean, modular JavaScript architecture
- Responsive CSS Grid/Flexbox layout
- Interactive data visualizations
- Form validation and error handling
- Modern web standards compliance

## 🔒 Privacy & Security

- All data stored locally in browser
- No external data transmission
- HIPAA-conscious design principles
- User-controlled data management

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Prerequisites**
   - GitHub account
   - Vercel account (free)

2. **Deploy Steps**
   ```bash
   # Push to GitHub repository
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

3. **Vercel Setup**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect the configuration from `vercel.json`
   - Deploy with default settings

4. **Configuration**
   - The project includes `vercel.json` with optimized settings
   - Static file serving with security headers
   - Proper routing for SPA functionality

### Local Development
```bash
# Clone repository
git clone <repository-url>
cd crew_mind_hackathon

# Start development server
python -m http.server 8000
# OR
npx serve .
```

## 🎯 Future Enhancements

- Integration with wearable devices
- Machine learning pattern detection
- Healthcare provider integration
- Medication tracking
- Appointment scheduling
- WhatsApp emergency alerts integration
- Multi-language support

## 📱 Mobile Responsive

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

---

**Built for Healthcare Innovation Hackathon**  
*Empowering users to take control of their health through intelligent symptom tracking*

## 🏆 Project Status: Production Ready ✅

- ✅ Core functionality implemented
- ✅ Mobile responsive design
- ✅ Emergency alert system
- ✅ Data visualization
- ✅ Vercel deployment ready
- ✅ Security headers configured
- ✅ Performance optimized