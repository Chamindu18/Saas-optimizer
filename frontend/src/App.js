import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="App">
      {/* Main title for the SaaS Management Platform */}
      <h1>SaaS Management Dashboard</h1>
      
      {/* Dashboard component displays analytics and metrics */}
      <Dashboard />
    </div>
  );
}

export default App;
