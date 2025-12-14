import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StorageService, PLAN_CONFIGS } from '../services/storage';
import { User, UserRole, PlanType, PlanLimits } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { showToast } from '../components/Toast';
import { UserPlus, Trash2, Mail, Shield, Crown, Check, X, Edit2, Save, Upload, Camera, Settings as SettingsIcon, Users, CreditCard, Sparkles, Lightbulb, Send, CheckCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'team' | 'billing'>('team');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileEmail, setEditProfileEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [isFeatureRequestModalOpen, setIsFeatureRequestModalOpen] = useState(false);
  const [featureRequest, setFeatureRequest] = useState({ title: '', description: '', category: 'feature' });
  const [isUpgradeRequestModalOpen, setIsUpgradeRequestModalOpen] = useState(false);
  const [upgradeRequestData, setUpgradeRequestData] = useState({ planName: '', success: false });
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'billing') {
      setActiveTab('billing');
    }
    loadData();
    // Listen for user updates from admin actions
    const handleUserUpdate = () => {
      loadData();
    };
    window.addEventListener('menupi-user-updated', handleUserUpdate);
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('menupi-user-updated', handleUserUpdate);
    };
  }, [location]);

  const loadData = async () => {
    // Refresh user data to get latest from server
    const user = await StorageService.refreshUserData();
    setCurrentUser(user);
    if (user) {
      setEditProfileName(user.name);
      setEditProfileEmail(user.email);
      setAvatarPreview(user.avatarUrl || null);
    }
    await loadTeamMembers();
    await loadWarnings();
  };

  const loadWarnings = async () => {
    try {
      const userWarnings = await StorageService.getUserWarnings();
      setWarnings(userWarnings);
    } catch (err) {
      console.error('Failed to load warnings:', err);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    
    setIsUploadingAvatar(true);
    try {
      const avatarUrl = await StorageService.uploadAvatar(avatarFile);
      const user = StorageService.getUser();
      setCurrentUser({ ...user, avatarUrl });
      setAvatarFile(null);
    } catch (err: any) {
      alert(err.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const members = await StorageService.getTeamMembers();
      setTeamMembers(members);
    } catch (err) {
      console.error('Failed to load team members:', err);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      alert('Please fill in both name and email');
      return;
    }
    
    setIsLoading(true);
    try {
      await StorageService.inviteUser(inviteEmail, inviteName);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      await loadTeamMembers();
      alert('Invitation sent successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to invite user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (id: string) => {
    if (confirm('Remove user?')) {
      try {
        await StorageService.removeUser(id);
        await loadTeamMembers();
      } catch (err: any) {
        alert(err.message || 'Failed to remove user');
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProfileName.trim() || !editProfileEmail.trim()) {
      alert('Please fill in both name and email');
      return;
    }
    
    setIsSavingProfile(true);
    try {
      const updatedUser = await StorageService.updateUserProfile({
        name: editProfileName.trim(),
        email: editProfileEmail.trim()
      });
      setCurrentUser(updatedUser);
      setIsEditProfileModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const canInviteMembers = () => {
    if (!currentUser) return false;
    const plan = PLAN_CONFIGS[currentUser.plan || PlanType.FREE];
    // Free plan allows only 1 user (the owner), so can't invite
    if (plan.maxUsers === 1) return false;
    // Check if current team count is below limit
    return teamMembers.length < plan.maxUsers;
  };

  const handleTabChange = (tab: 'team' | 'billing') => {
    setActiveTab(tab);
    navigate(`/settings?tab=${tab}`, { replace: true });
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'owner': 'Owner',
      'member': 'Member',
      'super_admin': 'Super Admin'
    };
    return roleMap[role] || role;
  };

  const getRoleIcon = (role: string) => {
    if (role === 'owner' || role === 'super_admin') {
      return <Crown className="w-4 h-4 text-amber-500" />;
    }
    return <Shield className="w-4 h-4 text-slate-400" />;
  };

  if (!currentUser) {
    return <div className="max-w-5xl mx-auto p-8">Loading...</div>;
  }

  const currentPlan = PLAN_CONFIGS[currentUser.plan || PlanType.FREE];

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="relative">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-slate-500 mt-1 text-base">Manage your account, team, and billing</p>
          </div>
        </div>
      </div>

      {/* Warnings and Account Status Alerts */}
      {(warnings.length > 0 || currentUser?.accountStatus !== 'active') && (
        <Card className="p-5 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <div className="space-y-3">
            {currentUser?.accountStatus !== 'active' && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Account {currentUser?.accountStatus === 'suspended' ? 'Suspended' : 'Inactive'}</p>
                  <p className="text-sm text-red-700 mt-1">Your account has been {currentUser?.accountStatus === 'suspended' ? 'suspended' : 'deactivated'}. Please contact support for assistance.</p>
                </div>
              </div>
            )}
            {warnings.map((warning) => (
              <div key={warning.id} className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  warning.warningType === 'ban' ? 'text-red-600' :
                  warning.warningType === 'suspension' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">
                    {warning.warningType === 'ban' ? 'Account Banned' :
                     warning.warningType === 'suspension' ? 'Account Suspended' :
                     'Warning'}
                  </p>
                  <p className="text-sm text-slate-700 mt-1">{warning.reason}</p>
                  {warning.adminName && (
                    <p className="text-xs text-slate-500 mt-1">Issued by: {warning.adminName}</p>
                  )}
                  {warning.expiresAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      Expires: {new Date(warning.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm rounded-t-2xl p-2">
        <button
          onClick={() => handleTabChange('team')}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-300 relative rounded-xl flex items-center gap-2 ${
            activeTab === 'team'
              ? 'text-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className={`w-4 h-4 ${activeTab === 'team' ? 'text-indigo-600' : ''}`} />
          Team
          {activeTab === 'team' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => handleTabChange('billing')}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-300 relative rounded-xl flex items-center gap-2 ${
            activeTab === 'billing'
              ? 'text-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-md shadow-indigo-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className={`w-4 h-4 ${activeTab === 'billing' ? 'text-indigo-600' : ''}`} />
          Billing
          {activeTab === 'billing' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6 animate-fade-in">
          {/* Profile Card */}
          <Card className="p-8 bg-gradient-to-br from-white via-indigo-50/30 to-white border-indigo-100/60">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
                      Your Profile
                    </h2>
                    <p className="text-sm text-slate-500">Manage your personal information</p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="shadow-md hover:shadow-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                </div>
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative group">
                    <div className={`w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-105 ${
                      currentUser.avatarUrl ? 'bg-white border-2 border-slate-200' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
                    }`}>
                      {currentUser.avatarUrl ? (
                        <img 
                          src={currentUser.avatarUrl} 
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-white">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center cursor-pointer hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-110 active:scale-95">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(currentUser.role)}
                        <p className="text-2xl font-bold text-slate-900">
                          {currentUser.name}
                        </p>
                      </div>
                      <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-200/50">
                        {getRoleDisplay(currentUser.role)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4" />
                      <p className="text-base">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
                {avatarFile && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-medium text-indigo-900">New profile picture ready to upload</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(currentUser.avatarUrl || null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUploadAvatar}
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Team Members Card */}
          <Card className="overflow-hidden border-slate-100/60">
            <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-white to-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Team Members
                </h2>
                <p className="text-sm text-slate-500">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</p>
              </div>
              {canInviteMembers() ? (
                <Button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Invite Member
                </Button>
              ) : (
                <Button
                  disabled
                  variant="secondary"
                  className="shadow-sm"
                  title={currentPlan.maxUsers === 1 ? "Free plan allows only 1 user. Upgrade to add team members." : "Team member limit reached"}
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Invite
                </Button>
              )}
            </div>
            
            {teamMembers.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Mail className="w-10 h-10 text-indigo-400" />
                </div>
                <p className="text-lg font-semibold text-slate-700 mb-2">No team members yet</p>
                <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                  {canInviteMembers() 
                    ? "Start building your team by inviting members to collaborate on your digital signage"
                    : currentPlan.maxUsers === 1
                    ? "Free plan allows only 1 user. Upgrade to add team members and collaborate."
                    : "Team member limit reached. Upgrade your plan to add more members."}
                </p>
                {canInviteMembers() && (
                  <Button onClick={() => setIsInviteModalOpen(true)} className="shadow-lg">
                    <UserPlus className="w-4 h-4 mr-2" /> Invite First Member
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100/60">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-5 flex justify-between items-center hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 ${
                        member.avatarUrl ? 'bg-white border-2 border-slate-200' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      }`}>
                        {member.avatarUrl ? (
                          <img 
                            src={member.avatarUrl} 
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-base">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-slate-900">{member.name}</p>
                          {getRoleIcon(member.role)}
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                            {getRoleDisplay(member.role)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Mail className="w-3.5 h-3.5" />
                          <p className="text-sm">{member.email}</p>
                        </div>
                      </div>
                    </div>
                    {currentUser.role === 'owner' && member.id !== currentUser.id && (
                      <button
                        onClick={() => handleRemoveUser(member.id)}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Remove user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-fade-in">
          {/* Current Plan Summary */}
          <Card className="p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-0 shadow-2xl shadow-indigo-500/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl"></div>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Crown className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white/90 mb-1">Current Plan</h2>
                    <h3 className="text-3xl font-bold text-white">
                      {currentPlan.name}
                    </h3>
                  </div>
                </div>
                <p className="text-white/80 mb-6 text-base max-w-md">{currentPlan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{currentPlan.price}</span>
                  {currentPlan.priceAmount > 0 && (
                    <span className="text-white/70 text-base">/month</span>
                  )}
                </div>
              </div>
              <div className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-bold border border-white/30 shadow-lg">
                ✓ Active
              </div>
            </div>
          </Card>

          {/* Plan Comparison Grid */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
                Available Plans
              </h2>
              <p className="text-slate-500">Choose the plan that fits your needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.values(PLAN_CONFIGS).map((plan) => {
                const isCurrentPlan = plan.id === currentUser.plan;
                const isUpgrade = plan.priceAmount > currentPlan.priceAmount;
                
                return (
                  <Card
                    key={plan.id}
                    className={`p-6 flex flex-col h-full transition-all duration-300 ${
                      isCurrentPlan
                        ? 'ring-2 ring-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-xl shadow-indigo-100 border-indigo-200 scale-105'
                        : 'hover:shadow-xl hover:-translate-y-1 border-slate-100/60'
                    }`}
                  >
                    {/* Plan Header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                        {isCurrentPlan && (
                          <div className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold rounded-full shadow-md">
                            Current
                          </div>
                        )}
                      </div>
                      <div className="mb-3">
                        <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                        {plan.priceAmount > 0 && (
                          <span className="text-slate-500 text-base ml-1">/month</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{plan.description}</p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600 font-bold" />
                          </div>
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Action Button */}
                    <Button
                      className="w-full mt-auto"
                      disabled={isCurrentPlan}
                      variant={isCurrentPlan ? 'secondary' : 'primary'}
                      onClick={async () => {
                        if (isCurrentPlan) return;
                        try {
                          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                          const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                          const user = StorageService.getUser();
                          const restaurantId = user?.restaurantId || user?.id;
                          
                          if (!restaurantId) {
                            showToast('Unable to identify your account. Please contact support.', 'error');
                            return;
                          }
                          
                          // Request plan upgrade
                          const res = await fetch(`${API_URL}/users/upgrade-request`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ 
                              requestedPlan: plan.id,
                              currentPlan: currentUser.plan
                            })
                          });
                          
                          if (!res.ok) {
                            const err = await res.json();
                            showToast(err.error || 'Failed to submit upgrade request', 'error');
                            return;
                          }
                          
                          // Show success modal
                          setUpgradeRequestData({ planName: plan.name, success: true });
                          setIsUpgradeRequestModalOpen(true);
                        } catch (err: any) {
                          showToast(err.message || 'Failed to submit upgrade request', 'error');
                        }
                      }}
                    >
                      {isCurrentPlan ? (
                        <>
                          <Check className="w-4 h-4 mr-2" /> Current Plan
                        </>
                      ) : (
                        <>
                          {isUpgrade ? 'Request Upgrade' : 'Request Plan Change'}
                        </>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Feature Request Section */}
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-indigo-600" />
                  Request a Feature
                </h3>
                <p className="text-sm text-slate-600 mt-1">Have an idea? Let us know what features you'd like to see!</p>
              </div>
              <Button
                onClick={() => setIsFeatureRequestModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Request Feature
              </Button>
            </div>
          </Card>

          {/* Account Deletion Section */}
          <Card className="p-6 border-red-200 bg-red-50/50">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Delete Account
              </h3>
              <p className="text-sm text-slate-600">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">⚠️ Warning: This will permanently delete:</p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>Your restaurant account</li>
                <li>All screens and playlists</li>
                <li>All media files</li>
                <li>All public links</li>
                <li>All team members</li>
                <li>All schedules and settings</li>
              </ul>
            </div>
            <Button
              onClick={() => setIsDeleteAccountModalOpen(true)}
              variant="secondary"
              className="w-full bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          </Card>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteAccountModalOpen && (
        <Modal
          isOpen={isDeleteAccountModalOpen}
          onClose={() => {
            setIsDeleteAccountModalOpen(false);
            setDeletePassword('');
          }}
          title="Delete Account"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ This action is permanent and cannot be undone.
              </p>
              <p className="text-xs text-red-700">
                All your data, screens, media, and settings will be permanently deleted.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password to confirm"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                For security, please enter your password to confirm account deletion.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={async () => {
                  if (!deletePassword) {
                    showToast('Please enter your password', 'error');
                    return;
                  }
                  setIsDeletingAccount(true);
                  try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                    const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                    
                    const res = await fetch(`${API_URL}/users/me/account`, {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ password: deletePassword })
                    });
                    
                    if (!res.ok) {
                      const err = await res.json();
                      showToast(err.error || 'Failed to delete account', 'error');
                      setIsDeletingAccount(false);
                      return;
                    }
                    
                    // Account deleted successfully - clear storage and redirect
                    localStorage.removeItem('menupi_user');
                    showToast('Account deleted successfully', 'success');
                    setTimeout(() => {
                      window.location.href = '/login';
                    }, 1500);
                  } catch (err: any) {
                    showToast(err.message || 'Failed to delete account', 'error');
                    setIsDeletingAccount(false);
                  }
                }}
                disabled={isDeletingAccount}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeletingAccount ? 'Deleting...' : 'Delete Account Permanently'}
              </Button>
              <Button
                onClick={() => {
                  setIsDeleteAccountModalOpen(false);
                  setDeletePassword('');
                }}
                variant="secondary"
                className="flex-1"
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Upgrade Request Success Modal */}
      {isUpgradeRequestModalOpen && (
        <Modal
          isOpen={isUpgradeRequestModalOpen}
          onClose={() => {
            setIsUpgradeRequestModalOpen(false);
            setUpgradeRequestData({ planName: '', success: false });
          }}
          title=""
        >
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted Successfully!</h3>
            <p className="text-slate-600 mb-1">
              Your upgrade request for <span className="font-semibold text-indigo-600">{upgradeRequestData.planName}</span> has been sent.
            </p>
            <p className="text-sm text-slate-500">
              Our team will review and process your request shortly. You'll be notified once it's approved.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => {
                  setIsUpgradeRequestModalOpen(false);
                  setUpgradeRequestData({ planName: '', success: false });
                }}
                className="min-w-[120px]"
              >
                Got it
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Feature Request Modal */}
      {isFeatureRequestModalOpen && (
        <Modal
          isOpen={isFeatureRequestModalOpen}
          onClose={() => {
            setIsFeatureRequestModalOpen(false);
            setFeatureRequest({ title: '', description: '', category: 'feature' });
          }}
          title="Request a Feature"
        >
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Your feature request will be reviewed by our team and may be considered for future updates.
              </p>
            </div>
            <Input
              label="Feature Title"
              value={featureRequest.title}
              onChange={(e) => setFeatureRequest({ ...featureRequest, title: e.target.value })}
              placeholder="e.g., Add support for animated GIFs"
              required
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
              <select
                value={featureRequest.category}
                onChange={(e) => setFeatureRequest({ ...featureRequest, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="feature">New Feature</option>
                <option value="improvement">Improvement</option>
                <option value="integration">Integration</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={featureRequest.description}
                onChange={(e) => setFeatureRequest({ ...featureRequest, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={5}
                placeholder="Describe the feature you'd like to see and how it would help you..."
                required
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={async () => {
                  if (!featureRequest.title || !featureRequest.description) {
                    showToast('Please fill in all fields', 'error');
                    return;
                  }
                  try {
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                    const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                    const user = StorageService.getUser();
                    const restaurantId = user?.restaurantId || user?.id;
                    
                    const res = await fetch(`${API_URL}/users/feature-request`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        title: featureRequest.title,
                        description: featureRequest.description,
                        category: featureRequest.category,
                        restaurantId: restaurantId
                      })
                    });
                    
                    if (!res.ok) {
                      const err = await res.json();
                      showToast(err.error || 'Failed to submit feature request', 'error');
                      return;
                    }
                    
                    setIsFeatureRequestModalOpen(false);
                    setFeatureRequest({ title: '', description: '', category: 'feature' });
                    showToast('Feature request submitted successfully! Thank you for your feedback.', 'success');
                  } catch (err: any) {
                    showToast(err.message || 'Failed to submit feature request', 'error');
                  }
                }}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
              <Button
                onClick={() => {
                  setIsFeatureRequestModalOpen(false);
                  setFeatureRequest({ title: '', description: '', category: 'feature' });
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteEmail('');
          setInviteName('');
        }}
        title="Invite Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          {!canInviteMembers() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-900">
                {currentPlan.maxUsers === 1 
                  ? "Free plan allows only 1 user. Please upgrade to add team members."
                  : `Team member limit reached (${currentPlan.maxUsers} members). Please upgrade to add more.`}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Name
            </label>
            <Input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Enter team member's name"
              required
              disabled={!canInviteMembers()}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Enter team member's email"
              required
              disabled={!canInviteMembers()}
            />
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
            <p>An invitation email will be sent to this address with login instructions.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isLoading || !canInviteMembers()}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteEmail('');
                setInviteName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditProfileModalOpen}
        onClose={() => {
          setIsEditProfileModalOpen(false);
          if (currentUser) {
            setEditProfileName(currentUser.name);
            setEditProfileEmail(currentUser.email);
            setAvatarPreview(currentUser.avatarUrl || null);
            setAvatarFile(null);
          }
        }}
        title="Edit Profile"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center ${
                avatarPreview ? 'bg-white border-2 border-slate-200' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}>
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {editProfileName.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            {avatarFile && (
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">New profile picture selected</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleUploadAvatar}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? 'Uploading...' : 'Upload Picture'}
                </Button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Name
            </label>
            <Input
              value={editProfileName}
              onChange={(e) => setEditProfileName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={editProfileEmail}
              onChange={(e) => setEditProfileEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
            <p>Your email is used for login and account notifications.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={isSavingProfile}>
              {isSavingProfile ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsEditProfileModalOpen(false);
                if (currentUser) {
                  setEditProfileName(currentUser.name);
                  setEditProfileEmail(currentUser.email);
                  setAvatarPreview(currentUser.avatarUrl || null);
                  setAvatarFile(null);
                }
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
