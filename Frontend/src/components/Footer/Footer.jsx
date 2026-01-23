import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <h2 className="text-xl font-bold text-orange-500 mb-3">PujaPath</h2>
          <p className="text-sm">
            Your trusted platform for Puja services and spiritual products.
          </p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Products</h3>
          <Link className="block hover:text-orange-400" to="/products">
            All Products
          </Link>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Puja</h3>
          <Link className="block hover:text-orange-400" to="/puja">
            Book Puja
          </Link>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-3">Account</h3>
          <Link className="block hover:text-orange-400" to="/login">
            Login
          </Link>
          <Link className="block hover:text-orange-400" to="/register">
            Register
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-sm">
        © {new Date().getFullYear()} PujaPath. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
