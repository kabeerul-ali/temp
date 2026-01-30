import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/home.jsx";
import Cart from "./pages/cart.jsx";

import ProductPage from "./pages/product.detail/product.jsx";
import OfferPage from "./pages/product.detail/offer.jsx";
import Login from "./pages/login/login.jsx";
import Signup from "./pages/login/signup.jsx";
import Forgot from "./pages/login/forgot.jsx";
import Reset from "./pages/login/reset.jsx";
import Profile from "./pages/profile.jsx";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="cart" element={<Cart />} />

          <Route path="product/:id" element={<ProductPage />} />
          <Route path="offer/:id" element={<OfferPage />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="reset" element={<Reset />} />
          <Route path="forgot" element={<Forgot />} />
          <Route path="profile" element={<Profile />} />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
