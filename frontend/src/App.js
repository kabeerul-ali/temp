import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/home";

import ProductPage from "./pages/product.detail/product.jsx";
import OfferPage from "./pages/product.detail/offer.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="product/:id" element={<ProductPage />} />
        <Route path="offer/:id" element={<OfferPage />} />
        </Routes>

        
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
