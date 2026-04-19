import './App.css';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';

function App() {
  // Main app layout: Sidebar on left, main content on right
  // Sidebar is fixed, main content scrolls
  return (
    <div style={appStyles.appContainer}>
      {/* Fixed left sidebar with navigation */}
      <Sidebar activeLink="dashboard" />

      {/* Main content area */}
      <div style={appStyles.mainContent}>
        {/* Top navbar with page title */}
        <Navbar title="Dashboard" />

        {/* Dashboard component with metrics and data */}
        <Dashboard />
      </div>
    </div>
  );
}

// Styles for the main app layout
const appStyles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  mainContent: {
    marginLeft: '250px', // Account for fixed sidebar width
    flex: 1,
    overflowY: 'auto',
  },
};

export default App;
