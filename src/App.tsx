import Home from './pages/Home';
import About from './pages/About';
import Cast from './pages/Cast';
import Map from './pages/Map';
import CompanyPortal from './pages/CompanyPortal';
import Admin from './pages/Admin';
import Header from './components/Header';
import Footer from './components/Footer';
// import ProtectedRoute from './components/ProtectedRoute';
// import Sponsors from './components/Sponsors';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/cast" element={<Cast />} />
        <Route path="/map" element={<Map />} />
        <Route path="/company-portal" element={<CompanyPortal />} />
        {/* <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        /> */}
        <Route path="/admin" element={<Admin />} />
      </Routes>
      {/* <Sponsors /> */}
      <Footer />
    </div>
  );
}

export default App;
