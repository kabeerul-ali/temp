import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/home";

import ProductPage from "./pages/product.detail/product.jsx";
import OfferPage from "./pages/product.detail/offer.jsx";
import Login from "./pages/login/login.jsx";
import Signup from "./pages/login/signup.jsx";
import Forgot from "./pages/login/forgot.jsx";
import Reset from "./pages/login/reset.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="offer/:id" element={<OfferPage />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="reset" element={<Reset />} />
          <Route path="forgot" element={<Forgot />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
