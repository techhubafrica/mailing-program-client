import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Users, FileText, Send, List, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: Mail, label: 'Dashboard' },
    { path: '/contacts', icon: Users, label: 'Contacts' },
    { path: '/templates', icon: FileText, label: 'Templates' },
    { path: '/campaigns/create', icon: Send, label: 'Create Campaign' },
    { path: '/campaigns-list', icon: List, label: 'Campaign List' },
    { path: '/send-email', icon: Send, label: 'Send Mail' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-50 p-2 text-white rounded-lg top-4 right-4 bg-slate-800 md:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen bg-slate-900 text-white z-40 transform transition-transform duration-300 ease-in-out",
          "w-64 md:relative md:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-xl font-bold">Tech Hub Africa</h1>
            <p className="text-sm text-slate-400">Mailing System</p>
          </div>

          <nav>
            {menuItems.map((item) => (
              <motion.button
                key={item.path}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex items-center space-x-3 w-full p-3 rounded-lg mb-2 transition-colors",
                  location.pathname === item.path
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/50"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;