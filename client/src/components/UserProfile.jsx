import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, Shield, Crown, 
  Settings, Save, Edit3, Camera, BarChart3, 
  MessageSquare, Heart, Globe, Eye 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = ({ darkMode }) => {
  const { user, preferences, updateProfile, updatePreferences, getUserStats } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    phone_number: ''
  });

  const [preferencesData, setPreferencesData] = useState({
    theme: 'dark',
    sidebar_collapsed: false,
    dashboard_layout: 'grid',
    charts_per_row: 2,
    auto_save_chats: true,
    chat_suggestions: true,
    voice_input_enabled: true,
    default_chart_type: 'auto',
    max_rows_display: 100,
    export_format: 'csv',
    email_notifications: true,
    sms_notifications: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        full_name: user.full_name || '',
        phone_number: user.phone_number || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (preferences) {
      setPreferencesData(preferences);
    }
  }, [preferences]);

  useEffect(() => {
    const loadStats = async () => {
      const result = await getUserStats();
      if (result.success) {
        setUserStats(result.data);
      }
    };
    loadStats();
  }, [getUserStats]);

  const handleProfileSave = async () => {
    setIsSaving(true);
    const result = await updateProfile(profileData);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    
    setIsSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handlePreferencesSave = async () => {
    setIsSaving(true);
    const result = await updatePreferences(preferencesData);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    
    setIsSaving(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'stats', label: 'Statistics', icon: BarChart3 }
  ];

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl p-6 mb-6 ${
          darkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <button className={`absolute bottom-0 right-0 p-2 rounded-full ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } transition-colors`}>
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.full_name || user.email}
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {user.email}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                {user.is_premium && (
                  <span className="flex items-center space-x-1 text-yellow-500">
                    <Crown className="w-4 h-4" />
                    <span className="text-sm font-medium">Premium</span>
                  </span>
                )}
                {user.is_email_verified && (
                  <span className="flex items-center space-x-1 text-green-500">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Verified</span>
                  </span>
                )}
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className={`rounded-2xl ${
          darkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? darkMode
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-blue-600 border-b-2 border-blue-600'
                      : darkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Profile Information
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isEditing
                        ? 'bg-gray-500 hover:bg-gray-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Username
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="Enter username"
                      />
                    ) : (
                      <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {user.username || 'Not set'}
                      </p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {user.full_name || 'Not set'}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Email Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {user.email}
                      </p>
                      {user.is_email_verified && (
                        <Shield className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone_number}
                        onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="+1234567890"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {user.phone_number || 'Not set'}
                        </p>
                        {user.is_phone_verified && (
                          <Shield className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleProfileSave}
                      disabled={isSaving}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  User Preferences
                </h2>

                {/* UI Preferences */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Interface
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Theme
                      </label>
                      <select
                        value={preferencesData.theme}
                        onChange={(e) => setPreferencesData({...preferencesData, theme: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Dashboard Layout
                      </label>
                      <select
                        value={preferencesData.dashboard_layout}
                        onChange={(e) => setPreferencesData({...preferencesData, dashboard_layout: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Chat Preferences */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Chat Features
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'auto_save_chats', label: 'Auto-save chat sessions' },
                      { key: 'chat_suggestions', label: 'Show query suggestions' },
                      { key: 'voice_input_enabled', label: 'Enable voice input' }
                    ].map((pref) => (
                      <label key={pref.key} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={preferencesData[pref.key]}
                          onChange={(e) => setPreferencesData({
                            ...preferencesData, 
                            [pref.key]: e.target.checked
                          })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {pref.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notification Preferences */}
                <div>
                  <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'email_notifications', label: 'Email notifications' },
                      { key: 'sms_notifications', label: 'SMS notifications' }
                    ].map((pref) => (
                      <label key={pref.key} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={preferencesData[pref.key]}
                          onChange={(e) => setPreferencesData({
                            ...preferencesData, 
                            [pref.key]: e.target.checked
                          })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {pref.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePreferencesSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Your Statistics
                </h2>

                {userStats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { 
                        icon: MessageSquare, 
                        label: 'Total Chats', 
                        value: userStats.total_chats,
                        color: 'blue'
                      },
                      { 
                        icon: BarChart3, 
                        label: 'Dashboards', 
                        value: userStats.total_dashboards,
                        color: 'green'
                      },
                      { 
                        icon: Heart, 
                        label: 'Favorites', 
                        value: userStats.favorite_chats + userStats.favorite_dashboards,
                        color: 'red'
                      },
                      { 
                        icon: Globe, 
                        label: 'Public Dashboards', 
                        value: userStats.public_dashboards,
                        color: 'purple'
                      }
                    ].map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <div key={index} className={`p-4 rounded-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <Icon className={`w-8 h-8 text-${stat.color}-500`} />
                            <div>
                              <p className={`text-2xl font-bold ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {stat.value}
                              </p>
                              <p className={`text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {stat.label}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Loading statistics...
                    </p>
                  </div>
                )}

                {userStats?.last_activity && (
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Last activity: {new Date(userStats.last_activity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
