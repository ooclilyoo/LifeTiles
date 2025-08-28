# LifeTiles - Progressive Web App

A beautiful, minimalist PWA for iPhone that combines Daily Challenges, To-Do Lists, and Books & Films tracking in one elegant interface.

## ✨ Features

- **Progressive Web App (PWA)** - Installable on iPhone home screen
- **Full-screen experience** - No browser UI when installed
- **Nordic minimal design** - Clean, light, and airy aesthetic
- **Offline functionality** - Works without internet connection
- **Local data persistence** - All data stored locally on your device
- **Dark mode support** - Automatically adapts to system preferences

## 🎯 Three Main Sections

1. **Daily Challenge** - Get inspired with daily tasks and track your streaks
2. **To-Do List** - Organize your day with categorized tasks
3. **Books & Films** - Track what you're reading, watching, and want to explore

## 📱 Installation on iPhone

### Method 1: Safari Browser
1. Open Safari on your iPhone
2. Navigate to the LifeTiles app URL
3. Tap the **Share** button (square with arrow up)
4. Select **"Add to Home Screen"**
5. Tap **"Add"** to install

### Method 2: Chrome Browser
1. Open Chrome on your iPhone
2. Navigate to the LifeTiles app URL
3. Tap the **Menu** button (three dots)
4. Select **"Add to Home Screen"**
5. Tap **"Add"** to install

## 🚀 Development

### Project Structure
```
LifeTiles/
├── index.html          # Main HTML file
├── styles.css          # Nordic minimal CSS styles
├── script.js           # JavaScript functionality
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
├── icon.svg           # App icon source
├── icons/             # PNG icons for different sizes
└── README.md          # This file
```

### Local Development
1. Clone or download the project
2. Open `index.html` in a web browser
3. For PWA testing, use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

### PWA Testing
- Use Chrome DevTools > Application tab to test PWA features
- Test "Add to Home Screen" functionality
- Verify offline capabilities
- Check service worker registration

## 🎨 Design Philosophy

**Nordic Minimalism**: Clean lines, plenty of white space, subtle shadows, and a focus on typography and usability. The design emphasizes:

- **Simplicity** - Only essential elements
- **Clarity** - Easy to read and navigate
- **Elegance** - Sophisticated color palette
- **Accessibility** - High contrast and readable fonts

## 🔧 Technical Details

- **HTML5** - Semantic markup
- **CSS3** - Modern layout with Flexbox and Grid
- **JavaScript ES6+** - Modern JavaScript features
- **Service Worker** - Offline functionality and caching
- **Local Storage** - Data persistence
- **Responsive Design** - Works on all screen sizes

## 📱 PWA Features

- **Manifest** - App metadata and installation
- **Service Worker** - Offline support and caching
- **Full-screen mode** - Native app experience
- **Installable** - Add to home screen
- **Offline first** - Works without internet

## 🌟 Future Enhancements

- [ ] Daily challenge generation system
- [ ] Task categories and priorities
- [ ] Reading progress tracking
- [ ] Film ratings and reviews
- [ ] Data export/import
- [ ] Cloud sync (optional)
- [ ] Notifications
- [ ] Widgets for iOS

## 🤝 Contributing

This is a learning project! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share your experience

## 📄 License

This project is open source and available under the MIT License.

---

**Built with ❤️ for learning and productivity**
