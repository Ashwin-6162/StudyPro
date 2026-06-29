import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings as SettingsIcon, Bell, HardDrive, Shield, 
  Lock, BrainCircuit, Upload, Trash2, Smartphone, Monitor,
  Download, CheckCircle2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ToggleSwitch, Select } from '../../components/ui/FormControls';
import useStore from '../../store/useStore';
import './SettingsView.css';

export default function SettingsView() {
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const user = useStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const lastName = user?.name?.split(' ').slice(1).join(' ') || '';
  const email = user?.email || 'student@examgpt.com';
  const picture = user?.picture || null;

  const [profileData, setProfileData] = useState({ firstName, lastName });
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const fontSize = useStore((s) => s.fontSize);
  const setFontSize = useStore((s) => s.setFontSize);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const aiModel = useStore((s) => s.aiModel);
  const setAiModel = useStore((s) => s.setAiModel);
  const answerLength = useStore((s) => s.answerLength);
  const setAnswerLength = useStore((s) => s.setAnswerLength);
  const citationStyle = useStore((s) => s.citationStyle);
  const setCitationStyle = useStore((s) => s.setCitationStyle);
  const notifications = useStore((s) => s.notifications);
  const setNotification = useStore((s) => s.setNotification);
  const updateUser = useStore((s) => s.updateUser);
  const logout = useStore((s) => s.logout);

  const fileInputRef = useRef(null);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  // Save name changes back to the store so the profile menu updates too
  const handleSaveProfile = () => {
    const newName = `${profileData.firstName} ${profileData.lastName}`.trim();
    updateUser({ name: newName });
    showSaved();
  };

  // Profile photo upload — reads the image as base64 and stores it
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => updateUser({ picture: reader.result });
    reader.readAsDataURL(file);
  };

  // Export the user's data (their document list) as a downloadable JSON file
  const handleExportData = async () => {
    try {
      const { getFiles } = await import('../../services/api');
      const res = await getFiles();
      const payload = {
        user: { name: user?.name, email },
        exported_at: new Date().toISOString(),
        documents: res.data || [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'examgpt-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + (e.message || 'Unknown error'));
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'ai', label: 'AI Settings', icon: BrainCircuit },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
            <div className="settings-section-header">
              <h2 className="text-display" style={{ fontSize: '24px' }}>Profile</h2>
              <p className="text-muted">Manage your personal information and Google account connection.</p>
            </div>
            
            <div className="card settings-card">
              <h3 className="text-body-large font-medium mb-2">Profile Picture</h3>
              <div className="profile-picture-container">
                <div className="profile-avatar" style={picture ? { backgroundImage: `url(${picture})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                  {!picture && firstName.charAt(0)}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoSelect}
                  />
                  <Button variant="outline" icon={Upload} onClick={() => fileInputRef.current?.click()}>Upload New</Button>
                  {picture && (
                    <Button variant="ghost" className="text-error" icon={Trash2} onClick={() => updateUser({ picture: null })}>Remove</Button>
                  )}
                </div>
              </div>
            </div>

            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: 'var(--spacing-12)', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius-8)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                <span className="text-small" style={{ color: 'var(--color-success)' }}>Changes saved</span>
              </div>
            )}

            <div className="card settings-card">
              <h3 className="text-body-large font-medium mb-2">Personal Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input label="First Name" value={profileData.firstName} onChange={e => setProfileData(p => ({...p, firstName: e.target.value}))} />
                  <Input label="Last Name" value={profileData.lastName} onChange={e => setProfileData(p => ({...p, lastName: e.target.value}))} />
                </div>
                <Input label="Email Address" defaultValue={email} disabled />
                <Button variant="primary" style={{ alignSelf: 'flex-start' }} onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </div>

            <div className="card settings-card">
              <div className="settings-row">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Google Account</h3>
                  <p className="text-caption text-muted">Connected to {email}</p>
                </div>
                <Button variant="outline" onClick={() => alert('Disconnect functionality coming soon.')}>Disconnect Google</Button>
              </div>
            </div>
          </motion.div>
        );

      case 'preferences':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
            <div className="settings-section-header">
              <h2 className="text-display" style={{ fontSize: '24px' }}>Preferences</h2>
              <p className="text-muted">Customize your interface and accessibility settings.</p>
            </div>
            
            <div className="card settings-card">
              <div className="settings-row">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Theme</h3>
                  <p className="text-caption text-muted">Choose your preferred visual mode.</p>
                </div>
                <div className="settings-row-action">
                  <Select 
                    options={[{value:'system', label:'System Default'}, {value:'dark', label:'Dark Mode'}, {value:'light', label:'Light Mode'}]} 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="settings-row mt-4 pt-4 border-t border-border">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Language</h3>
                  <p className="text-caption text-muted">Set the primary language for the UI. (Translation coming soon)</p>
                </div>
                <div className="settings-row-action">
                  <Select 
                    options={[{value:'en', label:'English (US)'}, {value:'uk', label:'English (UK)'}, {value:'ta', label:'Tamil'}]} 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-row mt-4 pt-4 border-t border-border">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Font Size</h3>
                  <p className="text-caption text-muted">Adjust the scale of text across the platform.</p>
                </div>
                <div className="settings-row-action">
                  <Select 
                    options={[{value:'sm', label:'Small'}, {value:'md', label:'Medium'}, {value:'lg', label:'Large'}]} 
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'ai':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
            <div className="settings-section-header">
              <h2 className="text-display" style={{ fontSize: '24px' }}>AI Settings</h2>
              <p className="text-muted">Configure how the AI interacts and generates content.</p>
            </div>
            
            <div className="card settings-card">
              <div className="settings-row">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Preferred AI Model</h3>
                  <p className="text-caption text-muted">Select the underlying engine for generation.</p>
                </div>
                <div className="settings-row-action">
                  <Select 
                    options={[{value:'gemini', label:'Google Gemini'}, {value:'grok', label:'Grok'}]} 
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-row mt-4 pt-4 border-t border-border">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Default Answer Length</h3>
                  <p className="text-caption text-muted">Default target length for generated answers.</p>
                </div>
                <div className="settings-row-action">
                  <Select 
                    options={[{value:'concise', label:'Concise (200w)'}, {value:'detailed', label:'Detailed (600w)'}]} 
                    value={answerLength}
                    onChange={(e) => setAnswerLength(e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-row mt-4 pt-4 border-t border-border">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Citation Style</h3>
                  <p className="text-caption text-muted">How references appear in generated text.</p>
                </div>
                <div className="settings-row-action">
                  <Select 
                    options={[{value:'inline', label:'Inline [1]'}, {value:'apa', label:'APA Style'}, {value:'hidden', label:'Hidden'}]} 
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
            <div className="settings-section-header">
              <h2 className="text-display" style={{ fontSize: '24px' }}>Notifications</h2>
              <p className="text-muted">Manage your alerts across devices.</p>
            </div>
            
            <div className="card settings-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
              <ToggleSwitch label="Email Notifications" checked={notifications.email} onChange={() => setNotification('email', !notifications.email)} />
              <ToggleSwitch label="Browser Push Notifications" checked={notifications.browser} onChange={() => setNotification('browser', !notifications.browser)} />
              <ToggleSwitch label="Mobile Push Notifications" checked={notifications.mobile} onChange={() => setNotification('mobile', !notifications.mobile)} />
              <ToggleSwitch label="Product Updates & Announcements" checked={notifications.updates} onChange={() => setNotification('updates', !notifications.updates)} />
            </div>
          </motion.div>
        );

      case 'storage':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
            <div className="settings-section-header">
              <h2 className="text-display" style={{ fontSize: '24px' }}>Storage</h2>
              <p className="text-muted">Manage your documents and local cache.</p>
            </div>
            
            <div className="card settings-card">
              <div className="settings-row">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Documents Used</h3>
                  <p className="text-caption text-muted">45.2 MB / 1 GB (4.5%)</p>
                </div>
                <div className="settings-row-action">
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '4.5%', height: '100%', backgroundColor: 'var(--color-primary)' }} />
                  </div>
                </div>
              </div>

              <div className="settings-row mt-6 pt-6 border-t border-border">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Local Cache</h3>
                  <p className="text-caption text-muted">124 MB of generated previews and images.</p>
                </div>
                <Button variant="outline" onClick={() => { alert('Cache cleared.'); }}>Clear Cache</Button>
              </div>
            </div>
          </motion.div>
        );

      case 'security':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
            <div className="settings-section-header">
              <h2 className="text-display" style={{ fontSize: '24px' }}>Security</h2>
              <p className="text-muted">Protect your account and manage active sessions.</p>
            </div>
            
            <div className="card settings-card">
              <div className="settings-row">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Password</h3>
                  <p className="text-caption text-muted">Last changed 3 months ago.</p>
                </div>
                <Button variant="outline" onClick={() => alert('Password change functionality coming soon.')}>Change Password</Button>
              </div>

              <div className="settings-row mt-4 pt-4 border-t border-border">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Two-Factor Authentication (2FA)</h3>
                  <p className="text-caption text-muted">Add an extra layer of security to your account.</p>
                </div>
                <Button variant="primary" onClick={() => alert('2FA setup coming soon.')}>Enable 2FA</Button>
              </div>
            </div>

            <div className="card settings-card">
              <h3 className="text-body-large font-medium mb-4">Active Sessions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Monitor className="text-primary" />
                    <div>
                      <p className="font-medium">Windows PC - Chrome</p>
                      <p className="text-caption text-muted">Current Session • Chennai, India</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Smartphone className="text-muted" />
                    <div>
                      <p className="font-medium">iPhone 14 Pro - Safari</p>
                      <p className="text-caption text-muted">Last active 2 days ago • Chennai, India</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-error" onClick={() => alert('Session revoked.')}>Revoke</Button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'privacy':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="settings-section">
            <div className="settings-section-header">
              <h2 className="text-display" style={{ fontSize: '24px' }}>Privacy</h2>
              <p className="text-muted">Control your data and account standing.</p>
            </div>
            
            <div className="settings-card">
              <div className="settings-row">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium">Export Data</h3>
                  <p className="text-caption text-muted">Download a copy of your uploaded documents and history.</p>
                </div>
                <Button variant="outline" icon={Download} onClick={handleExportData}>Export Data</Button>
              </div>
            </div>

            <div className="card settings-card danger-zone">
              <div className="settings-row">
                <div className="settings-row-info">
                  <h3 className="text-body-large font-medium text-error">Delete Account</h3>
                  <p className="text-caption text-muted">Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <Button variant="primary" style={{ backgroundColor: 'var(--color-error)' }} onClick={() => { if (window.confirm('Are you sure? This will log you out and cannot be undone.')) { logout(); window.location.href = '/login'; } }}>Delete Account</Button>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page-container">
      <aside className="settings-sidebar hidden-scrollbar">
        {navItems.map(item => (
          <div 
            key={item.id}
            className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            <item.icon size={18} />
            {item.label}
          </div>
        ))}
      </aside>
      
      <main className="settings-content">
        <AnimatePresence mode="wait">
          <React.Fragment key={activeSection}>
            {renderContent()}
          </React.Fragment>
        </AnimatePresence>
      </main>
    </div>
  );
}
