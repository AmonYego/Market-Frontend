import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "./components/Navbar";
import { ProductCard } from "./components/ProductCard";
import { User, Product, Category, Condition } from "./types";
import { getStoredUser, saveUser } from "./store";
import { productService, authService } from "./Services/dbService";
import { generateProductDescription } from "./Services/geminiService";
import { validateAndLogImageState } from "./utils/imageValidation";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const loadProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productService.fetchAll();
      setProducts(data);
    } catch (err: any) {
      setError(
        "Unable to connect to the marketplace server.Please try again later.",
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Sync user to storage for session persistence
  useEffect(() => {
    saveUser(user);
  }, [user]);

  // Derived state
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => !p.isSold || currentPage === "dashboard")
      .filter((p) => {
        const title = p.title || "";
        const description = p.description || "";
        const matchesSearch =
          title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          activeCategory === "All" || p.category === activeCategory;
        return matchesSearch && matchesCategory;
      });
  }, [products, searchQuery, activeCategory, currentPage]);

  const handleLogout = () => {
    setUser(null);
    setCurrentPage("home");
  };

  const navigateToProduct = (id: string) => {
    setSelectedProductId(id);
    setCurrentPage("product-detail");
    window.scrollTo(0, 0);
  };

  const handleMarkAsSold = async (id: string) => {
    const success = await productService.markAsSold(id);
    if (success) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isSold: true } : p)),
      );
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      const success = await productService.delete(id);
      if (success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        if (currentPage === "product-detail") setCurrentPage("dashboard");
      }
    }
  };

  const renderPage = () => {
    if (isLoading && currentPage === "home") {
      return (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="spinner mb-4"></div>
          <p className="text-gray-500 font-medium">Loading listings please wait...</p>
        </div>
      );
    }

    if (error && currentPage === "home") {
      return (
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto bg-red-50 border border-red-100 p-8 rounded-2xl shadow-sm">
            <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">
              Connection Error
            </h2>
            <p className="text-red-600 mb-6 text-sm">{error}</p>
            <button
              onClick={loadProducts}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case "home":
        return (
          <div className="container mx-auto px-4 py-8">
            <header className="mb-10 text-center max-w-2xl mx-auto">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                Marketplace
              </h1>
              <p className="text-gray-600">
                The safest place to buy and sell second-hand gear within Dedan
                Kimathi University.
              </p>

              <div className="mt-8 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search for books, laptops, hoodies..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#044414] focus:outline-none transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["All", ...Object.values(Category)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-[#044414] text-white shadow-lg"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => navigateToProduct(product.id)}
                />
              ))}
              {!isLoading && filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-500">
                  <p className="text-xl">
                    No products found matching your search.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("All");
                    }}
                    className="mt-4 text-[#044414] font-bold underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case "login":
        return (
          <LoginPage
            onLogin={(u) => {
              setUser(u);
              setCurrentPage("home");
            }}
            onSwitch={() => setCurrentPage("register")}
          />
        );

      case "register":
        return (
          <RegisterPage
            onRegister={(u) => {
              setUser(u);
              setCurrentPage("home");
            }}
            onSwitch={() => setCurrentPage("login")}
          />
        );

      case "create":
        return (
          <CreateListingPage
            user={user!}
            onCreated={async (p) => {
              setIsLoading(true);
              const result = await productService.create(p, user!);
              if (result) {
                await loadProducts();
                setCurrentPage("home");
              }
              setIsLoading(false);
            }}
          />
        );

      case "product-detail":
        const selectedProduct = products.find(
          (p) => p.id === selectedProductId,
        );
        if (!selectedProduct)
          return <div className="p-20 text-center">Product not found.</div>;
        return (
          <ProductDetailPage
            product={selectedProduct}
            isOwner={user?.id === selectedProduct.userId}
            onMarkAsSold={handleMarkAsSold}
            onDelete={handleDeleteProduct}
            onBack={() => setCurrentPage("home")}
          />
        );

      case "dashboard":
        return (
          <DashboardPage
            user={user!}
            products={products.filter((p) => p.userId === user?.id)}
            onProductClick={navigateToProduct}
          />
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={handleLogout} onNavigate={setCurrentPage} />
      <main className="flex-grow pb-12">{renderPage()}</main>
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="bg-yellow-400 p-1 rounded">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#044414]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <span className="font-bold">DeKUT Marketplace</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2026 Dedan Kimathi University Students. Comrade Power.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage("requirements")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Requirements
            </button>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Safety Tips
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- SUB-PAGES COMPONENTS ---

const RequirementsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-[#044414] mb-4">
          Requirements & Guidelines
        </h1>
        <p className="text-gray-600 text-lg">
          Everything you need to know about joining and using the DeKUT student
          marketplace.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#044414]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Account Prerequisites
          </h3>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>
                Valid student email ending with{" "}
                <strong>@students.dkut.ac.ke</strong>
              </span>
            </li>
          </ul>
        </section>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Safety Protocols
          </h3>
          <p className="text-red-600 font-bold mb-2">
            CRITICAL: Only meet in public areas.
          </p>
          <ul className="text-gray-600 space-y-1 text-sm italic">
            <li>- DeKUT Mess / Dining Hall</li>
            <li>- Library Square</li>
            <li>- Freedom Square</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

const LoginPage: React.FC<{
  onLogin: (u: User) => void;
  onSwitch: () => void;
}> = ({ onLogin, onSwitch }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith("@students.dkut.ac.ke")) {
      setError("Please use a valid DeKUT student email");
      return;
    }

    setLoading(true);
    try {
      const profile = await authService.login(normalizedEmail, password);
      if (profile) {
        onLogin(profile);
      } else {
        setError("Invalid credentials or account does not exist.");
      }
    } catch (err) {
      setError("Connection failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-bold text-[#044414] mb-2">Sign In</h2>
      <p className="text-gray-500 mb-8">Login with your university email.</p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 font-semibold border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Student Email
          </label>
          <input
            type="email"
            placeholder="john.doe@students.dkut.ac.ke"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#044414] text-white py-3 rounded-xl font-bold hover:bg-green-900 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="spinner border-white border-left-transparent w-4 h-4"></div>
          )}
          Sign In
        </button>
      </form>
      <div className="mt-8 text-center pt-6 border-t border-gray-100">
        <p className="text-gray-500">
          No account?{" "}
          <button
            onClick={onSwitch}
            className="text-[#044414] font-bold hover:underline"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};

const RegisterPage: React.FC<{
  onRegister: (u: User) => void;
  onSwitch: () => void;
}> = ({ onRegister, onSwitch }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = formData.email.toLowerCase().trim();

    if (!normalizedEmail.endsWith("@students.dkut.ac.ke")) {
      setError(
        "Registration is restricted to @students.dkut.ac.ke emails only.",
      );
      return;
    }

    // Password validation: minimum 6 characters, must include letters and numbers
    const pwd = formData.password;
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!pwdRegex.test(pwd)) {
      setError(
        "Password must be at least 6 characters and include letters and numbers.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const existing = await authService.getProfileByEmail(normalizedEmail);
      if (existing) {
        setError("An account with this email already exists.");
        setLoading(false);
        return;
      }

      const newUser: User & { password?: string } = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        fullName: formData.fullName,
        phone: formData.phone.startsWith("0")
          ? "254" + formData.phone.substring(1)
          : formData.phone,
        createdAt: new Date().toISOString(),
        password: formData.password,
      };

      const success = await authService.upsertProfile(newUser);
      if (success) {
        const publicUser: User = {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          phone: newUser.phone,
          createdAt: newUser.createdAt,
        };
        onRegister(publicUser);
      } else setError("Could not save your profile. Please try again.");
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-bold text-[#044414] mb-2">Create Account</h2>
      <p className="text-gray-500 mb-8">Join the marketplace community.</p>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Jane Doe"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
            required
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Student Email
          </label>
          <input
            type="email"
            placeholder="name@students.dkut.ac.ke"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            WhatsApp Number
          </label>
          <input
            type="tel"
            placeholder="07xxxxxxxx"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
            required
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="At least 6 chars, include letters and numbers"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="md:col-span-2 bg-[#044414] text-white py-3 rounded-xl font-bold hover:bg-green-900 transition-all flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="spinner border-white border-left-transparent w-4 h-4"></div>
          )}
          Create Account
        </button>
      </form>
      <div className="mt-8 text-center pt-6 border-t border-gray-100">
        <p className="text-gray-500">
          Already have an account?{" "}
          <button
            onClick={onSwitch}
            className="text-[#044414] font-bold hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};
const CreateListingPage: React.FC<{
  user: User;
  onCreated: (p: any) => void;
}> = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category>(Category.Other);
  const [condition, setCondition] = useState<Condition>(Condition.UsedGood);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    setImageFiles((prev) => {
      const combined = [...prev, ...incoming].slice(0, 3); // limit to 3
      return combined;
    });
    // reset input so the same file can be selected again later
    e.currentTarget.value = "";
  };

  const handleAIDescription = async () => {
    if (!title) {
      alert("Please enter a title first.");
      return;
    }
    setIsGenerating(true);
    const aiDesc = await generateProductDescription(title, category, condition);
    setDescription(aiDesc);
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newProductPayload = {
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        images: imageFiles.length > 0 ? imageFiles : [],
      };
      await onCreated(newProductPayload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-bold text-[#044414] mb-2">Sell an Item</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Title
          </label>
          <input
            type="text"
            placeholder="e.g. MacBook Pro"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price (KSh)
            </label>
            <input
              type="number"
              placeholder="e.g. 950"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              disabled={isSubmitting}
            >
              {Object.values(Category).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Condition
          </label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none"
            value={condition}
            onChange={(e) => setCondition(e.target.value as Condition)}
            disabled={isSubmitting}
          >
            {Object.values(Condition).map((cond) => (
              <option key={cond} value={cond}>
                {cond}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              Description
            </label>
            <button
              type="button"
              onClick={handleAIDescription}
              disabled={isGenerating || isSubmitting}
              className="text-xs font-bold text-[#044414] flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-100 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "✨ AI Write"}
            </button>
          </div>
          <textarea
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#044414] focus:outline-none disabled:opacity-50"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photos (Max 3)
          </label>
          <div className="grid grid-cols-3 gap-4">
            {imageFiles.map((file, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl overflow-hidden relative group"
              >
                <img
                  src={URL.createObjectURL(file)}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setImageFiles(imageFiles.filter((_, idx) => idx !== i))
                  }
                  disabled={isSubmitting}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                >
                  X
                </button>
              </div>
            ))}
            {imageFiles.length < 3 && (
              <label
                className={`aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center ${isSubmitting ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <span className="text-xs text-gray-400 font-medium">
                  Add Photo
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </label>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#044414] text-white py-4 rounded-xl font-bold hover:bg-green-900 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting && (
            <div className="spinner border-white border-left-transparent w-5 h-5"></div>
          )}
          {isSubmitting ? "Publishing..." : "Post Listing"}
        </button>
      </form>
    </div>
  );
};
const ProductDetailPage: React.FC<{
  product: Product;
  isOwner: boolean;
  onMarkAsSold: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}> = ({ product, isOwner, onMarkAsSold, onDelete, onBack }) => {
  const [activeImage, setActiveImage] = React.useState(0);
  const whatsappLink = `https://wa.me/${product.sellerPhone}?text=Hi, I'm interested in your ${product.title}`;

  // Validate and filter images array
  const validImages = React.useMemo(() => {
    if (!Array.isArray(product.images)) {
      console.warn("Product.images is not an array:", product.images);
      return [];
    }
    return product.images.filter(
      (url) => typeof url === "string" && url.trim() !== "",
    );
  }, [product.images]);

  // Reset active image if it exceeds valid images length
  React.useEffect(() => {
    if (activeImage >= validImages.length) {
      setActiveImage(0);
    }
  }, [validImages.length]);

  // Debug logging
  React.useEffect(() => {
    validateAndLogImageState(product);
  }, [product]);

  // Handle image load errors
  const handleImageError = (index: number) => {
    console.error(
      `✗ Image ${index + 1} failed to load for "${product.title}"`,
      {
        url: validImages[index],
      },
    );
  };

  // Handle navigation to next/previous image
  const goToNextImage = () => {
    setActiveImage((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const goToPreviousImage = () => {
    setActiveImage((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const displayImage = validImages[activeImage];

  return (
    <div className="container mx-auto px-4 py-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 font-medium mb-8"
      >
        ← Back
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          {validImages.length > 0 && displayImage ? (
            <>
              {/* Main image with navigation */}
              <div className="relative">
                <img
                  key={displayImage}
                  src={displayImage}
                  alt={`${product.title} - Image ${activeImage + 1}`}
                  className="w-full aspect-video object-cover rounded-3xl shadow-sm"
                  crossOrigin="anonymous"
                  onLoad={() => {
                    console.log(
                      `✓ Detail image ${activeImage + 1} loaded: "${product.title}"`,
                    );
                  }}
                  onError={() => {
                    handleImageError(activeImage);
                  }}
                />

                {/* Navigation arrows (only if multiple images) */}
                {validImages.length > 1 && (
                  <>
                    <button
                      onClick={goToPreviousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all"
                      aria-label="Previous image"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={goToNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all"
                      aria-label="Next image"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </>
                )}

                {/* Image counter */}
                {validImages.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {activeImage + 1}/{validImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail gallery */}
              {validImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {validImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImage === i
                          ? "border-[#044414] ring-2 ring-[#044414]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      aria-label={`View image ${i + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={() => {
                          console.warn(`Thumbnail ${i + 1} failed to load`);
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Fallback placeholder */
            <div className="w-full aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex flex-col items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-gray-500 text-lg font-medium">
                No images available
              </span>
            </div>
          )}
        </div>
        <div>
          <h1 className="text-4xl font-extrabold mb-2">{product.title}</h1>
          <p className="text-3xl font-bold text-[#044414] mb-8">
            KSh {product.price.toLocaleString()}
          </p>
          <p className="text-gray-600 mb-10">{product.description}</p>
          {isOwner ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onMarkAsSold(product.id)}
                disabled={product.isSold}
                className={`py-4 rounded-xl font-bold ${product.isSold ? "bg-gray-100 text-gray-400" : "bg-[#044414] text-white"}`}
              >
                {product.isSold ? "Sold" : "Mark as Sold"}
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="border border-red-200 text-red-600 py-4 rounded-xl font-bold"
              >
                Delete
              </button>
            </div>
          ) : (
            <a
              href={whatsappLink}
              target="_blank"
              className="bg-[#25D366] text-white py-4 rounded-xl font-bold w-full flex justify-center"
            >
              Chat on WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardPage: React.FC<{
  user: User;
  products: Product[];
  onProductClick: (id: string) => void;
}> = ({ products, onProductClick }) => {
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold mb-10">My Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-gray-500">Listed</p>
          <p className="text-3xl font-bold">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <p className="text-gray-500">Sold</p>
          <p className="text-3xl font-bold text-green-600">
            {products.filter((p) => p.isSold).length}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => onProductClick(p.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
