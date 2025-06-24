import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Save,
  Shield,
  Smartphone,
  Moon,
  Sun,
  Globe,
  Bell as BellIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { userDetails, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'appearance'>('profile');
  
  const [profileForm, setProfileForm] = useState({
    fullName: userDetails?.fullName || '',
    email: userDetails?.email || '',
    department: userDetails?.department || '',
    role: userDetails?.role || 'student'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    lowStockAlerts: true,
    overdueReminders: true,
    reservationUpdates: true,
    maintenanceAlerts: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordLastChanged: '2025-01-15'
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC'
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await updateUserProfile({
        fullName: profileForm.fullName,
        email: profileForm.email,
        department: profileForm.department,
      });

      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Update form when userDetails changes
  React.useEffect(() => {
    if (userDetails) {
      setProfileForm({
        fullName: userDetails.fullName || '',
        email: userDetails.email || '',
        department: userDetails.department || '',
        role: userDetails.role || 'student'
      });
    }
  }, [userDetails]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Settings</h1>
        <p className="text-neutral-500">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'profile'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <User size={16} className="mr-3" />
              Profile Settings
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'notifications'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Bell size={16} className="mr-3" />
              Notifications
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'security'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Lock size={16} className="mr-3" />
              Security
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'appearance'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <Sun size={16} className="mr-3" />
              Appearance
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-neutral-200"
          >
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Profile Settings</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="input w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-neutral-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        id="department"
                        value={profileForm.department}
                        onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                        className="input w-full"
                        placeholder="Enter your department"
                      />
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-1">
                        Role
                      </label>
                      <select
                        id="role"
                        value={profileForm.role}
                        onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                        className="input w-full"
                        disabled
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                      </select>
                      <p className="text-xs text-neutral-500 mt-1">Contact an administrator to change your role</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Notification Settings</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Mail size={20} className="text-neutral-400 mr-3" />
                        <div>
                          <p className="font-medium text-neutral-800">Email Notifications</p>
                          <p className="text-sm text-neutral-500">Receive notifications via email</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            emailNotifications: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Smartphone size={20} className="text-neutral-400 mr-3" />
                        <div>
                          <p className="font-medium text-neutral-800">Push Notifications</p>
                          <p className="text-sm text-neutral-500">Receive push notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            pushNotifications: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BellIcon size={20} className="text-neutral-400 mr-3" />
                        <div>
                          <p className="font-medium text-neutral-800">Low Stock Alerts</p>
                          <p className="text-sm text-neutral-500">Get notified when items are running low</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.lowStockAlerts}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            lowStockAlerts: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-200">
                    <button className="btn btn-primary">
                      <Save size={16} className="mr-2" />
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Security Settings</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield size={20} className="text-neutral-400 mr-3" />
                        <div>
                          <p className="font-medium text-neutral-800">Two-Factor Authentication</p>
                          <p className="text-sm text-neutral-500">Add an extra layer of security</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securitySettings.twoFactorAuth}
                          onChange={(e) => setSecuritySettings({
                            ...securitySettings,
                            twoFactorAuth: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div>
                      <label htmlFor="sessionTimeout" className="block text-sm font-medium text-neutral-700 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <select
                        id="sessionTimeout"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          sessionTimeout: e.target.value
                        })}
                        className="input w-full"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>

                    <div>
                      <button className="btn btn-outline">
                        <Lock size={16} className="mr-2" />
                        Change Password
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-200">
                    <button className="btn btn-primary">
                      <Save size={16} className="mr-2" />
                      Save Security Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-800 mb-4">Appearance Settings</h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="theme" className="block text-sm font-medium text-neutral-700 mb-1">
                        Theme
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setAppearanceSettings({
                            ...appearanceSettings,
                            theme: 'light'
                          })}
                          className={`p-4 border rounded-lg flex items-center justify-center ${
                            appearanceSettings.theme === 'light'
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-neutral-200'
                          }`}
                        >
                          <Sun size={20} className="mr-2" />
                          Light Mode
                        </button>
                        <button
                          onClick={() => setAppearanceSettings({
                            ...appearanceSettings,
                            theme: 'dark'
                          })}
                          className={`p-4 border rounded-lg flex items-center justify-center ${
                            appearanceSettings.theme === 'dark'
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-neutral-200'
                          }`}
                        >
                          <Moon size={20} className="mr-2" />
                          Dark Mode
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-neutral-700 mb-1">
                        Language
                      </label>
                      <select
                        id="language"
                        value={appearanceSettings.language}
                        onChange={(e) => setAppearanceSettings({
                          ...appearanceSettings,
                          language: e.target.value
                        })}
                        className="input w-full"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="timezone" className="block text-sm font-medium text-neutral-700 mb-1">
                        Timezone
                      </label>
                      <select
                        id="timezone"
                        value={appearanceSettings.timezone}
                        onChange={(e) => setAppearanceSettings({
                          ...appearanceSettings,
                          timezone: e.target.value
                        })}
                        className="input w-full"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-200">
                    <button className="btn btn-primary">
                      <Save size={16} className="mr-2" />
                      Save Appearance Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;