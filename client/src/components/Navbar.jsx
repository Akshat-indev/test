import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, LogOut, User, BookMarked, LayoutDashboard, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 font-bold text-brand-600 text-lg">
            <Briefcase className="h-5 w-5" />
            <span>CareerMatch</span>
          </Link>

          {/* Nav links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</NavLink>
              <NavLink to="/jobs" icon={<Search className="h-4 w-4" />}>Find Jobs</NavLink>
              <NavLink to="/saved-jobs" icon={<BookMarked className="h-4 w-4" />}>Saved</NavLink>
              <NavLink to="/applications" icon={<Briefcase className="h-4 w-4" />}>Applications</NavLink>
            </nav>
          )}

          {/* Auth controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium text-sm">
                    {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">Log in</Link>
                <Link to="/signup" className="btn-primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}

