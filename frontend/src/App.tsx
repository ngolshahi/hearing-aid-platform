import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import BookPage from "./pages/BookPage";
import ContactPage from "./pages/ContactPage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import LoginPage from "./pages/LoginPage";
import TryOnARPage from "./pages/TryOnARPage";
import ScrollToTop from './components/ScrollToTop';
import HearingTestPage from "./pages/HearingTestPage";
import ProfilePage from "./pages/ProfilePage";

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
      <ScrollToTop />
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/product/:id" element={<ProductPage />} />
          <Route path="/try-on/:productId" element={<TryOnARPage />} />
          <Route path="/hearing-test" element={<HearingTestPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage/>}/>
        </Routes>
        <Footer />
      </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
