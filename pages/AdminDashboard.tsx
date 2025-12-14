import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { User, PlanType, UserRole } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';
import { ConfirmModal } from '../components/ConfirmModal';
import { showToast } from '../components/Toast';
import { Users, Monitor, HardDrive, DollarSign, Shield, Activity, CheckCircle, XCircle, Clock, RefreshCw, Eye, X, AlertTriangle, Ban, UserPlus, Trash2, Edit, UserCircle, Settings, Search, Filter, Download, TrendingUp, TrendingDown, BarChart3, FileText, Zap, Server, Database, Globe, Mail, Calendar, ArrowUpRight, ArrowDownRight, Building2, Tv, Image as ImageIcon, Power, Key, Lock, Unlock, Play, Pause, AlertCircle, History, Heart, Wifi, WifiOff, Send, Check, X as XIcon, Loader2, PieChart, Menu, Lightbulb } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ActivityLog {
    id: string;
    action: string;
    details: string;
    timestamp: number;
    icon?: React.ReactNode;
}

type AdminTab = 'dashboard' | 'restaurants' | 'users' | 'screens' | 'media' | 'player-controls' | 'email' | 'audit' | 'system-health' | 'admins' | 'user-requests';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine active tab from URL
    const getTabFromPath = (pathname: string): AdminTab => {
        if (pathname === '/admin' || pathname === '/admin/dashboard') return 'dashboard';
        if (pathname === '/admin/restaurants') return 'restaurants';
        if (pathname === '/admin/users') return 'users';
        if (pathname === '/admin/screens') return 'screens';
        if (pathname === '/admin/media') return 'media';
        if (pathname === '/admin/player-controls') return 'player-controls';
        if (pathname === '/admin/email') return 'email';
        if (pathname === '/admin/audit') return 'audit';
        if (pathname === '/admin/system-health') return 'system-health';
        if (pathname === '/admin/admins') return 'admins';
        if (pathname === '/admin/user-requests') return 'user-requests';
        return 'dashboard'; // Default
    };
    
    const [activeTab, setActiveTab] = useState<AdminTab>(getTabFromPath(location.pathname));
    
    // Update active tab when route changes
    useEffect(() => {
        const tab = getTabFromPath(location.pathname);
        setActiveTab(tab);
    }, [location.pathname]);
    
    // Function to handle tab navigation
    const handleTabChange = (tab: AdminTab) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false); // Close mobile menu on tab change
        const tabRoutes: Record<AdminTab, string> = {
            'dashboard': '/admin/dashboard',
            'restaurants': '/admin/restaurants',
            'users': '/admin/users',
            'screens': '/admin/screens',
            'media': '/admin/media',
            'player-controls': '/admin/player-controls',
            'email': '/admin/email',
            'audit': '/admin/audit',
            'system-health': '/admin/system-health',
            'admins': '/admin/admins',
            'user-requests': '/admin/user-requests'
        };
        navigate(tabRoutes[tab]);
    };
    const [stats, setStats] = useState<any>({
        totalUsers: 0,
        totalScreens: 0,
        activeScreens: 0,
        totalStorageMB: 0,
        totalFiles: 0,
        estimatedRevenue: 0
    });
    const [users, setUsers] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
    const [isWarnModalOpen, setIsWarnModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPlan, setFilterPlan] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    
    // New data states
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [allScreens, setAllScreens] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [featureRequests, setFeatureRequests] = useState<any[]>([]);
    
    // Add user form state
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', plan: PlanType.FREE });
    
    // Add admin form state
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
    
    // Warn/Ban form state
    const [warningData, setWarningData] = useState({ warningType: 'warning', reason: '', expiresAt: '' });
    
    // Restaurant control modals
    const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
    const [isRestaurantStatusModalOpen, setIsRestaurantStatusModalOpen] = useState(false);
    const [isRestaurantLimitsModalOpen, setIsRestaurantLimitsModalOpen] = useState(false);
    const [isRestaurantDeleteModalOpen, setIsRestaurantDeleteModalOpen] = useState(false);
    const [isClearStorageModalOpen, setIsClearStorageModalOpen] = useState(false);
    const [isRevokeCodeModalOpen, setIsRevokeCodeModalOpen] = useState(false);
    const [revokeScreenAction, setRevokeScreenAction] = useState<any>(null);
    
    // User management modals
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [resetPasswordData, setResetPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [isChangeMyPasswordModalOpen, setIsChangeMyPasswordModalOpen] = useState(false);
    const [changeMyPasswordData, setChangeMyPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
    
    // Player controls modals
    const [isGlobalDisableModalOpen, setIsGlobalDisableModalOpen] = useState(false);
    const [isRestaurantPlaybackModalOpen, setIsRestaurantPlaybackModalOpen] = useState(false);
    const [restaurantPlaybackAction, setRestaurantPlaybackAction] = useState<{rest: any, enabled: boolean} | null>(null);
    const [isScreenDisableModalOpen, setIsScreenDisableModalOpen] = useState(false);
    const [screenDisableAction, setScreenDisableAction] = useState<{screen: any, disabled: boolean} | null>(null);
    
    // Email Control state
    const [emailSettings, setEmailSettings] = useState<any>(null);
    const [emailLogs, setEmailLogs] = useState<any[]>([]);
    const [isEmailSettingsModalOpen, setIsEmailSettingsModalOpen] = useState(false);
    const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);
    const [emailSettingsForm, setEmailSettingsForm] = useState({
        smtpEnabled: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpEncryption: 'TLS',
        smtpUser: '',
        smtpPass: '',
        fromName: 'MENUPI',
        fromEmail: 'support@menupi.com',
        replyTo: 'support@menupi.com',
        supportEmail: 'support@menupi.com'
    });
    
    useEffect(() => {
        const u = StorageService.getUser();
        if (u?.role !== UserRole.SUPER_ADMIN) {
            navigate('/dashboard');
            return;
        }
        
        setCurrentAdmin(u);
        
        // Redirect /admin to /admin/dashboard
        if (location.pathname === '/admin') {
            navigate('/admin/dashboard', { replace: true });
            return;
        }
        
        // Initial load based on current tab
        loadAdminData();
        loadAdmins();
        if (activeTab === 'screens') loadAllScreens();
        if (activeTab === 'users') loadAllUsers();
        if (activeTab === 'system-health') loadSystemHealth();
        if (activeTab === 'email') {
            loadEmailSettings();
            loadEmailLogs();
        }
        if (activeTab === 'audit') {
            loadFeatureRequests();
        }
        
        // Set up auto-refresh every 120 seconds (2 minutes) to reduce server load
        refreshIntervalRef.current = setInterval(() => {
            loadAdminData(false); // Silent refresh
            loadAdmins();
            if (activeTab === 'screens') loadAllScreens();
            if (activeTab === 'users') loadAllUsers();
            if (activeTab === 'system-health') loadSystemHealth();
            if (activeTab === 'email') {
                loadEmailSettings();
                loadEmailLogs();
            }
            if (activeTab === 'audit') {
                loadAdminData(false);
                loadFeatureRequests();
            }
        }, 60000); // 60 seconds (reduced frequency)
        
        // Cleanup on unmount
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [activeTab, location.pathname, navigate]);

    const loadAdminData = async (showLoading = true) => {
        if (showLoading) {
            setIsLoading(true);
        } else {
            setIsRefreshing(true);
        }
        
        try {
            const [statsData, usersData, activitiesData] = await Promise.all([
                StorageService.getSystemStats(),
                StorageService.getAllRestaurants(),
                StorageService.getActivities()
            ]);
            setStats(statsData || {});
            setUsers(usersData || []);
            setRestaurants(usersData || []); // Same data, different name for clarity
            setLastUpdated(new Date());
            
            // Process activities from database
            if (activitiesData && activitiesData.length > 0) {
                const processedActivities = activitiesData.map((activity: any) => {
                    // Map action types to icons
                    let icon = <Activity className="w-4 h-4 text-slate-400" />;
                    if (activity.action === 'New Registration') {
                        icon = <Users className="w-4 h-4 text-indigo-600" />;
                    } else if (activity.action === 'Screen Created') {
                        icon = <Monitor className="w-4 h-4 text-blue-600" />;
                    } else if (activity.action === 'Media Uploaded') {
                        icon = <HardDrive className="w-4 h-4 text-purple-600" />;
                    } else if (activity.action.includes('Revenue') || activity.action.includes('Plan')) {
                        icon = <DollarSign className="w-4 h-4 text-emerald-600" />;
                    }
                    
                    return {
                        id: activity.id,
                        action: activity.action,
                        details: activity.details || '',
                        timestamp: activity.timestamp || Date.now(),
                        icon: icon
                    };
                });
                setActivities(processedActivities);
            } else {
                setActivities([]);
            }
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const loadAllScreens = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            
            const res = await fetch(`${API_URL}/admin/screens`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setAllScreens(data || []);
            }
        } catch (err) {
            console.error('Failed to load screens:', err);
        }
    };

    const loadAllUsers = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            
            const res = await fetch(`${API_URL}/admin/users/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setAllUsers(data || []);
            }
        } catch (err) {
            console.error('Failed to load all users:', err);
        }
    };

    const loadSystemHealth = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            
            const res = await fetch(`${API_URL}/admin/health`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setSystemHealth(data);
            }
        } catch (err) {
            console.error('Failed to load system health:', err);
            setSystemHealth({ backend: 'offline', database: 'unknown' });
        }
    };

    const loadEmailSettings = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            
            const res = await fetch(`${API_URL}/admin/email/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setEmailSettings(data);
                setEmailSettingsForm({
                    smtpEnabled: data.smtpEnabled,
                    smtpHost: data.smtpHost,
                    smtpPort: data.smtpPort,
                    smtpEncryption: data.smtpEncryption,
                    smtpUser: data.smtpUser,
                    smtpPass: '',
                    fromName: data.fromName,
                    fromEmail: data.fromEmail,
                    replyTo: data.replyTo,
                    supportEmail: data.supportEmail
                });
            }
        } catch (err) {
            console.error('Failed to load email settings:', err);
        }
    };

    const loadEmailLogs = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            
            const res = await fetch(`${API_URL}/admin/email/logs?limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setEmailLogs(data);
            }
        } catch (err) {
            console.error('Failed to load email logs:', err);
        }
    };

    const loadFeatureRequests = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            
            const res = await fetch(`${API_URL}/admin/feature-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setFeatureRequests(data || []);
            }
        } catch (err) {
            console.error('Failed to load feature requests:', err);
        }
    };

    const handleManualRefresh = () => {
        loadAdminData(true);
        loadAdmins();
        if (activeTab === 'screens') loadAllScreens();
        if (activeTab === 'restaurants') loadAdminData(true);
        if (activeTab === 'users') loadAllUsers();
        if (activeTab === 'system-health') loadSystemHealth();
    };

    const loadAdmins = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            
            const res = await fetch(`${API_URL}/admin/admins`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                setAdmins(data || []);
            }
        } catch (err) {
            console.error('Failed to load admins:', err);
        }
    };

    const handleAddAdmin = async () => {
        // Only super admin can create admins
        if (currentAdmin?.role !== UserRole.SUPER_ADMIN) {
            showToast('Only super admins can create new admin accounts', 'error');
            return;
        }

        if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (newAdmin.password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            
            const res = await fetch(`${API_URL}/admin/admins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newAdmin)
            });

            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || 'Failed to create admin', 'error');
                return;
            }

            setIsAddAdminModalOpen(false);
            setNewAdmin({ name: '', email: '', password: '' });
            loadAdmins();
            showToast('Admin created successfully', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to create admin', 'error');
        }
    };

    const handleViewDetails = (user: any) => {
        setSelectedUser(user);
        setIsDetailModalOpen(true);
    };

    const handleAddUser = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            
            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });

            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || 'Failed to create user', 'error');
                return;
            }

            setIsAddUserModalOpen(false);
            setNewUser({ name: '', email: '', password: '', plan: PlanType.FREE });
            loadAdminData(false);
            showToast('User created successfully', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to create user', 'error');
        }
    };

    const handleWarnUser = async () => {
        if (!selectedUser || !warningData.reason) {
            showToast('Please provide a reason', 'warning');
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            // Use restaurantId if available (from allUsers), otherwise use id (from users/restaurants array)
            const restaurantId = selectedUser.restaurantId || selectedUser.id;
            
            if (!restaurantId) {
                showToast('Invalid user data: missing restaurant ID', 'error');
                return;
            }
            
            // Format expiresAt if provided
            let expiresAtValue = null;
            if (warningData.expiresAt) {
                // Convert datetime-local format to ISO string
                const date = new Date(warningData.expiresAt);
                if (!isNaN(date.getTime())) {
                    expiresAtValue = date.toISOString().slice(0, 19).replace('T', ' ');
                }
            }
            
            const res = await fetch(`${API_URL}/admin/users/${restaurantId}/warn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    warningType: warningData.warningType,
                    reason: warningData.reason,
                    expiresAt: expiresAtValue
                })
            });

            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || 'Failed to warn user', 'error');
                return;
            }

            setIsWarnModalOpen(false);
            setWarningData({ warningType: 'warning', reason: '', expiresAt: '' });
            loadAdminData(false);
            // Trigger user update event for affected user
            window.dispatchEvent(new Event('menupi-user-updated'));
            showToast('User warned successfully', 'success');
        } catch (err: any) {
            console.error('Error warning user:', err);
            showToast(err.message || 'Failed to warn user', 'error');
        }
    };
    
    const handleDeleteUser = () => {
        if (!selectedUser) return;
        setIsDeleteConfirmOpen(true);
    };
    
    const confirmDeleteUser = async () => {
        if (!selectedUser) return;
        setIsDeleteConfirmOpen(false);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            // Use restaurantId if available (from allUsers), otherwise use id (from users/restaurants array)
            const restaurantId = selectedUser.restaurantId || selectedUser.id;
            
            if (!restaurantId) {
                showToast('Invalid user data: missing restaurant ID', 'error');
                return;
            }
            
            const res = await fetch(`${API_URL}/admin/users/${restaurantId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || 'Failed to delete user', 'error');
                return;
            }

            setIsDeleteModalOpen(false);
            setSelectedUser(null);
            loadAdminData(false);
            showToast('User deleted successfully', 'success');
        } catch (err: any) {
            console.error('Error deleting user:', err);
            showToast(err.message || 'Failed to delete user', 'error');
        }
    };

    const handleUpdatePlan = async () => {
        if (!selectedUser) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
            // Use restaurantId if available (from allUsers), otherwise use id (from users/restaurants array)
            const restaurantId = selectedUser.restaurantId || selectedUser.id;
            
            if (!restaurantId) {
                showToast('Invalid user data: missing restaurant ID', 'error');
                return;
            }
            
            if (!selectedUser.plan) {
                showToast('Please select a plan', 'warning');
                return;
            }
            
            // Ensure plan is lowercase to match backend expectations
            const planValue = selectedUser.plan.toLowerCase();
            if (!['free', 'basic', 'pro'].includes(planValue)) {
                showToast('Invalid plan selected', 'error');
                return;
            }
            
            const res = await fetch(`${API_URL}/admin/users/${restaurantId}/subscription`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan: planValue })
            });

            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || 'Failed to update plan', 'error');
                return;
            }

            setIsPlanModalOpen(false);
            loadAdminData(false);
            // Trigger user update event for affected user
            window.dispatchEvent(new Event('menupi-user-updated'));
            showToast('Plan updated successfully', 'success');
        } catch (err: any) {
            console.error('Error updating plan:', err);
            showToast(err.message || 'Failed to update plan', 'error');
        }
    };

    const formatStorage = (mb: number) => {
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(1)} GB`;
        }
        return `${mb.toFixed(0)} MB`;
    };

    const formatStoragePercentage = (used: number) => {
        // Assuming 100GB total capacity (adjust based on your server)
        const totalGB = 100;
        const usedGB = used / 1024;
        const percentage = Math.min((usedGB / totalGB) * 100, 100);
        return `${percentage.toFixed(0)}% of capacity`;
    };

    const getPlanBadgeColor = (plan: PlanType) => {
        switch (plan) {
            case PlanType.FREE:
                return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border border-slate-300/50 shadow-sm';
            case PlanType.BASIC:
                return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300/50 shadow-sm';
            case PlanType.PRO:
                return 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300/50 shadow-sm';
            default:
                return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border border-slate-300/50 shadow-sm';
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'active') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30 border border-emerald-400/50">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Active
                </span>
            );
        } else if (status === 'suspended') {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/30 border border-red-400/50">
                    <XCircle className="w-3.5 h-3.5" />
                    Suspended
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-md shadow-slate-400/30 border border-slate-300/50">
                <Clock className="w-3.5 h-3.5" />
                {status || 'Unknown'}
            </span>
        );
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    // Filter users based on search and filters
    const filteredUsers = users.filter((user) => {
        const matchesSearch = 
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
        const matchesStatus = filterStatus === 'all' || user.accountStatus === filterStatus;
        return matchesSearch && matchesPlan && matchesStatus;
    });

    // Calculate plan distribution
    const planDistribution = users.reduce((acc, user) => {
        const plan = user.plan || 'free';
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Export users to CSV
    const handleExportUsers = () => {
        const headers = ['Name', 'Email', 'Plan', 'Status', 'Screens', 'Media', 'Storage (MB)', 'Created'];
        const rows = filteredUsers.map(user => [
            user.name || '',
            user.email || '',
            user.plan || 'free',
            user.accountStatus || 'active',
            user.stats?.screenCount || 0,
            user.stats?.mediaCount || 0,
            user.stats?.storageMB || 0,
            user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `menupi-users-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Get recent registrations (last 7 days)
    const recentRegistrations = users.filter(user => {
        if (!user.createdAt) return false;
        const daysAgo = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
    }).length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col md:flex-row overflow-hidden">
            {/* Mobile Header */}
            <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-40">
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-indigo-600" />
                    <h1 className="text-lg font-bold text-slate-900">Admin Panel</h1>
                </div>
                <div className="w-8"></div>
            </header>

            {/* Left Sidebar Navigation */}
            <aside className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:static inset-y-0 left-0 z-50 md:z-auto w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-xl shadow-slate-200/20 flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out md:transition-none pt-14 md:pt-0`}>
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute inset-0 bg-black/50 -z-10" onClick={() => setIsMobileMenuOpen(false)}></div>
                )}
                <div className="p-6 border-b border-slate-200/60 flex-shrink-0 bg-gradient-to-r from-indigo-50/50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Admin Panel</h1>
                            <p className="text-xs text-slate-500">Control Center</p>
                        </div>
                    </div>
                </div>
                
                <nav className="p-4 space-y-1 flex-shrink-0 flex-1 overflow-y-auto">
                    <button
                        onClick={() => handleTabChange('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'dashboard'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <Shield className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-white' : ''}`} />
                        Dashboard
                    </button>
                    <button
                        onClick={() => { handleTabChange('restaurants'); loadAdminData(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'restaurants'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <Building2 className={`w-5 h-5 ${activeTab === 'restaurants' ? 'text-white' : ''}`} />
                        Restaurants
                    </button>
                    <button
                        onClick={() => { handleTabChange('users'); loadAllUsers(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'users'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <Users className={`w-5 h-5 ${activeTab === 'users' ? 'text-white' : ''}`} />
                        User Management
                    </button>
                    <button
                        onClick={() => { handleTabChange('screens'); loadAllScreens(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'screens'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <Tv className={`w-5 h-5 ${activeTab === 'screens' ? 'text-white' : ''}`} />
                        Screen Oversight
                    </button>
                    <button
                        onClick={() => handleTabChange('media')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'media'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <ImageIcon className={`w-5 h-5 ${activeTab === 'media' ? 'text-white' : ''}`} />
                        Media & Storage
                    </button>
                    <button
                        onClick={() => handleTabChange('player-controls')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'player-controls'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <Power className={`w-5 h-5 ${activeTab === 'player-controls' ? 'text-white' : ''}`} />
                        Player Controls
                    </button>
                    <button
                        onClick={() => { handleTabChange('email'); loadEmailSettings(); loadEmailLogs(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'email'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <Mail className={`w-5 h-5 ${activeTab === 'email' ? 'text-white' : ''}`} />
                        Email Control
                    </button>
                    <button
                        onClick={() => { handleTabChange('audit'); loadAdminData(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'audit'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <History className={`w-5 h-5 ${activeTab === 'audit' ? 'text-white' : ''}`} />
                        Audit Logs
                    </button>
                    <button
                        onClick={() => { handleTabChange('system-health'); loadSystemHealth(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'system-health'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <Heart className={`w-5 h-5 ${activeTab === 'system-health' ? 'text-white' : ''}`} />
                        System Health
                    </button>
                    <button
                        onClick={() => { handleTabChange('user-requests'); loadFeatureRequests(); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'user-requests'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <Send className={`w-5 h-5 ${activeTab === 'user-requests' ? 'text-white' : ''}`} />
                        User Requests
                    </button>
                    <button
                        onClick={() => handleTabChange('admins')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === 'admins'
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                                : 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 hover:scale-[1.01]'
                        }`}
                    >
                        <Shield className={`w-5 h-5 ${activeTab === 'admins' ? 'text-white' : ''}`} />
                        Admin Accounts
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-8 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-white via-indigo-50/30 to-white p-6 rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/20 backdrop-blur-sm">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
                                {activeTab === 'dashboard' ? 'Admin Control Tower' : 
                                 activeTab === 'restaurants' ? 'Restaurant Control' :
                                 activeTab === 'users' ? 'User Management' : 
                                 activeTab === 'screens' ? 'Screen Oversight' :
                                 activeTab === 'media' ? 'Media & Storage' :
                                 activeTab === 'player-controls' ? 'Player Safety Controls' :
                                 activeTab === 'email' ? 'Email Control' :
                                 activeTab === 'audit' ? 'Audit & Activity Logs' :
                                 activeTab === 'system-health' ? 'System Health' :
                                 activeTab === 'user-requests' ? 'User Requests' :
                                 'Admin Accounts'}
                            </h1>
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-slate-600">
                                    {activeTab === 'dashboard' ? 'System overview and monitoring' : 
                                     activeTab === 'restaurants' ? 'Manage restaurants, plans, and billing' :
                                     activeTab === 'users' ? 'Manage users, roles, and permissions' : 
                                     activeTab === 'screens' ? 'Monitor and control all screens' :
                                     activeTab === 'media' ? 'Oversee storage usage and media files' :
                                     activeTab === 'player-controls' ? 'Control public player access and safety' :
                                     activeTab === 'email' ? 'Manage email delivery and triggers' :
                                     activeTab === 'audit' ? 'View system activity and audit logs' :
                                     activeTab === 'system-health' ? 'Monitor system status and health' :
                                     activeTab === 'user-requests' ? 'Review upgrade and feature requests' :
                                     'Manage admin accounts and permissions'}
                                </p>
                                {lastUpdated && (
                                    <div className="flex items-center gap-2">
                                        {isRefreshing && (
                                            <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
                                        )}
                                        <span className="text-xs text-slate-500">
                                            Last updated: {lastUpdated.toLocaleTimeString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>

                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <>
                            {/* Enhanced Metric Cards (KPIs) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {/* Total Users */}
                                <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border border-slate-200 transform hover:scale-105 group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 mb-2">Total Users</p>
                                            <p className="text-4xl font-bold text-slate-900 mb-2">{stats.totalUsers || 0}</p>
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <TrendingUp className="w-4 h-4 text-slate-500" />
                                                <p className="text-xs text-slate-600 font-semibold">+{recentRegistrations} this week</p>
                                            </div>
                                        </div>
                                        <div className="w-16 h-16 bg-slate-200/50 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Users className="w-8 h-8 text-slate-700" />
                                        </div>
                                    </div>
                                </Card>

                                {/* Active Screens */}
                                <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border border-slate-200 transform hover:scale-105 group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 mb-2">Active Screens</p>
                                            <p className="text-4xl font-bold text-slate-900 mb-2">{stats.activeScreens || 0}</p>
                                            <p className="text-xs text-slate-600 mt-2">of {stats.totalScreens || 0} total</p>
                                        </div>
                                        <div className="w-16 h-16 bg-slate-200/50 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Monitor className="w-8 h-8 text-slate-700" />
                                        </div>
                                    </div>
                                </Card>

                                {/* System Storage */}
                                <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border border-slate-200 transform hover:scale-105 group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 mb-2">System Storage</p>
                                            <p className="text-4xl font-bold text-slate-900 mb-2">{formatStorage(stats.totalStorageMB || 0)}</p>
                                            <p className="text-xs text-slate-600 mt-2">{formatStoragePercentage(stats.totalStorageMB || 0)}</p>
                                        </div>
                                        <div className="w-16 h-16 bg-slate-200/50 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <HardDrive className="w-8 h-8 text-slate-700" />
                                        </div>
                                    </div>
                                </Card>

                                {/* MRR (Revenue) */}
                                <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 border border-slate-200 transform hover:scale-105 group overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-600 mb-2">MRR</p>
                                            <p className="text-4xl font-bold text-slate-900 mb-2">${stats.estimatedRevenue || 0}</p>
                                            <p className="text-xs text-slate-600 mt-2">Monthly Recurring</p>
                                        </div>
                                        <div className="w-16 h-16 bg-slate-200/50 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <DollarSign className="w-8 h-8 text-slate-700" />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Additional Statistics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Total Media Files */}
                                <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-600 mb-1">Total Media Files</p>
                                            <p className="text-2xl font-bold text-slate-900">{stats.totalFiles || 0}</p>
                                        </div>
                                        <ImageIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                </Card>

                                {/* Plan Distribution */}
                                <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <div>
                                        <p className="text-xs font-medium text-slate-600 mb-2">Plan Distribution</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-slate-600">Free</span>
                                                    <span className="font-semibold">{planDistribution.free || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-slate-600">Basic</span>
                                                    <span className="font-semibold">{planDistribution.basic || 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-600">Pro</span>
                                                    <span className="font-semibold">{planDistribution.pro || 0}</span>
                                                </div>
                                            </div>
                                            <PieChart className="w-8 h-8 text-indigo-400" />
                                        </div>
                                    </div>
                                </Card>

                                {/* Recent Activity Count */}
                                <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-600 mb-1">Recent Activity</p>
                                            <p className="text-2xl font-bold text-slate-900">{activities.length}</p>
                                            <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
                                        </div>
                                        <Activity className="w-8 h-8 text-indigo-400" />
                                    </div>
                                </Card>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* User Management Table */}
                                <div className="lg:col-span-2">
                                    <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">Recent Users</h2>
                                                <p className="text-sm text-slate-500 mt-1">{users.length} total organizations</p>
                                            </div>
                                            <Button
                                                onClick={() => handleTabChange('users')}
                                                variant="secondary"
                                                size="sm"
                                                className="flex items-center gap-2"
                                            >
                                                View All
                                                <ArrowUpRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        
                                        <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-inner">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Organization</th>
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Screens</th>
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Media</th>
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Storage</th>
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Plan</th>
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.slice(0, 10).map((user) => (
                                                        <tr 
                                                            key={user.id} 
                                                            className="border-b border-slate-100/60 hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-blue-50/50 transition-all duration-200 cursor-pointer group"
                                                            onClick={() => handleViewDetails(user)}
                                                        >
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-3">
                                                                    {user.avatarUrl ? (
                                                                        <img 
                                                                            src={user.avatarUrl} 
                                                                            alt={user.name}
                                                                            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center ring-2 ring-slate-200">
                                                                            <span className="text-sm font-semibold text-white">
                                                                                {getInitials(user.name || 'U')}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-semibold text-slate-900">{user.name}</p>
                                                                        <p className="text-sm text-slate-500">{user.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Monitor className="w-4 h-4 text-blue-600" />
                                                                    <span className="text-sm font-semibold text-slate-900">
                                                                        {user.stats?.screenCount || 0}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <HardDrive className="w-4 h-4 text-purple-600" />
                                                                    <span className="text-sm font-semibold text-slate-900">
                                                                        {user.stats?.mediaCount || 0}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="text-sm font-semibold text-slate-900">
                                                                    {formatStorage(user.stats?.storageMB || 0)}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(user.plan || PlanType.FREE)}`}>
                                                                    {user.plan || 'Free'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                {getStatusBadge(user.accountStatus || 'active')}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <Button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleViewDetails(user);
                                                                    }}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="flex items-center gap-1"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Card>
                                </div>

                                {/* Enhanced Activity Feed Sidebar */}
                                <div className="lg:col-span-1">
                                    <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/30">
                                                    <Activity className="w-4 h-4 text-white" />
                                                </div>
                                                Activity Feed
                                            </h2>
                                            <span className="text-xs font-semibold text-emerald-600 bg-gradient-to-r from-emerald-50 to-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200/50 shadow-sm flex items-center gap-1.5">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                Live
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                                            {activities.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                    <p className="text-sm text-slate-500">No recent activity</p>
                                                </div>
                                            ) : (
                                                activities.map((activity) => (
                                                    <div 
                                                        key={activity.id} 
                                                        className="flex gap-3 p-4 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-blue-50/50 transition-all duration-200 border-l-4 border-indigo-500 shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="flex-shrink-0 mt-0.5">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                                                {activity.icon || <Activity className="w-4 h-4 text-indigo-600" />}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-slate-900">{activity.action}</p>
                                                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{activity.details}</p>
                                                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTimeAgo(activity.timestamp)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </>
                    )}

                    {/* User Management Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            {/* Enhanced Header with Search and Filters */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">User Management</h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {filteredUsers.length} of {users.length} users
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={handleExportUsers}
                                            variant="secondary"
                                            size="sm"
                                            className="flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Export CSV
                                        </Button>
                                        <Button
                                            onClick={() => setIsAddUserModalOpen(true)}
                                            className="flex items-center gap-2"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Add User
                                        </Button>
                                    </div>
                                </div>

                                {/* Search and Filter Bar */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                        />
                                    </div>
                                    <Select
                                        value={filterPlan}
                                        onChange={(e) => setFilterPlan(e.target.value)}
                                        options={[
                                            { value: 'all', label: 'All Plans' },
                                            { value: 'free', label: 'Free' },
                                            { value: 'basic', label: 'Basic' },
                                            { value: 'pro', label: 'Pro' }
                                        ]}
                                        className="text-sm"
                                    />
                                    <Select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        options={[
                                            { value: 'all', label: 'All Status' },
                                            { value: 'active', label: 'Active' },
                                            { value: 'suspended', label: 'Suspended' },
                                            { value: 'expired', label: 'Expired' }
                                        ]}
                                        className="text-sm"
                                    />
                                </div>
                            </Card>

                            {/* Users Table */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                            <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-inner">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Organization</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Screens</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Media</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Storage</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Plan</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Search className="w-12 h-12 text-slate-300" />
                                                        <p className="text-slate-500 font-medium">No users found</p>
                                                        <p className="text-sm text-slate-400">
                                                            {searchQuery || filterPlan !== 'all' || filterStatus !== 'all' 
                                                                ? 'Try adjusting your search or filters' 
                                                                : 'No users in the system'}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr 
                                                    key={user.id} 
                                                    className="border-b border-slate-100/60 hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-blue-50/50 transition-all duration-200 group"
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            {user.avatarUrl ? (
                                                                <img 
                                                                    src={user.avatarUrl} 
                                                                    alt={user.name}
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                    <span className="text-sm font-semibold text-indigo-600">
                                                                        {getInitials(user.name || 'U')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-slate-900">{user.name}</p>
                                                                <p className="text-sm text-slate-500">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="w-4 h-4 text-blue-600" />
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {user.stats?.screenCount || 0}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <HardDrive className="w-4 h-4 text-purple-600" />
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {user.stats?.mediaCount || 0}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className="text-sm font-semibold text-slate-900">
                                                            {formatStorage(user.stats?.storageMB || 0)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getPlanBadgeColor(user.plan || PlanType.FREE)}`}>
                                                            {user.plan || 'Free'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {getStatusBadge(user.accountStatus || 'active')}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setIsPlanModalOpen(true);
                                                                }}
                                                                variant="secondary"
                                                                size="sm"
                                                                className="flex items-center gap-1"
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                                Plan
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setIsWarnModalOpen(true);
                                                                }}
                                                                variant="secondary"
                                                                size="sm"
                                                                className="flex items-center gap-1"
                                                            >
                                                                <AlertTriangle className="w-3 h-3" />
                                                                Warn
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                                variant="secondary"
                                                                size="sm"
                                                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            </Card>
                        </div>
                    )}

                    {/* Restaurants Tab */}
                    {activeTab === 'restaurants' && (
                        <div className="space-y-6">
                            {/* Summary Statistics */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-blue-700 mb-1">Total Restaurants</p>
                                            <p className="text-2xl font-bold text-blue-900">{restaurants.length}</p>
                                        </div>
                                        <Building2 className="w-8 h-8 text-blue-600 opacity-60" />
                                    </div>
                                </Card>
                                <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-emerald-700 mb-1">Active Accounts</p>
                                            <p className="text-2xl font-bold text-emerald-900">
                                                {restaurants.filter(r => r.accountStatus === 'active').length}
                                            </p>
                                        </div>
                                        <CheckCircle className="w-8 h-8 text-emerald-600 opacity-60" />
                                    </div>
                                </Card>
                                <Card className="p-5 bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-amber-700 mb-1">Pro Plans</p>
                                            <p className="text-2xl font-bold text-amber-900">
                                                {restaurants.filter(r => r.plan === 'pro').length}
                                            </p>
                                        </div>
                                        <Zap className="w-8 h-8 text-amber-600 opacity-60" />
                                    </div>
                                </Card>
                                <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-purple-700 mb-1">Total Screens</p>
                                            <p className="text-2xl font-bold text-purple-900">
                                                {restaurants.reduce((sum, r) => sum + (r.stats?.screenCount || 0), 0)}
                                            </p>
                                        </div>
                                        <Monitor className="w-8 h-8 text-purple-600 opacity-60" />
                                    </div>
                                </Card>
                            </div>

                            {/* Search and Filter Bar */}
                            <Card className="p-5 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-lg">
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    <div className="flex-1 w-full md:w-auto">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                type="text"
                                                placeholder="Search restaurants by name or email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Select
                                            value={filterPlan}
                                            onChange={(e) => setFilterPlan(e.target.value)}
                                            className="w-full md:w-auto"
                                        >
                                            <option value="all">All Plans</option>
                                            <option value="free">Free</option>
                                            <option value="basic">Basic</option>
                                            <option value="pro">Pro</option>
                                        </Select>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleManualRefresh}
                                            disabled={isRefreshing}
                                            className="flex items-center gap-2"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Restaurants Table */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                            <Building2 className="w-6 h-6 text-slate-700" />
                                            Restaurant Control
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">Manage all restaurants, plans, and billing</p>
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                                                <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Restaurant</th>
                                                <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Owner</th>
                                                <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Plan</th>
                                                <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Status</th>
                                                <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Screens</th>
                                                <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Storage</th>
                                                <th className="text-left py-4 px-4 text-sm font-bold text-slate-700">Media</th>
                                                <th className="text-center py-4 px-4 text-sm font-bold text-slate-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {restaurants.filter(rest => {
                                                const matchesSearch = searchQuery === '' || 
                                                    rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    rest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    (rest.ownerName && rest.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));
                                                const matchesPlan = filterPlan === 'all' || rest.plan?.toLowerCase() === filterPlan.toLowerCase();
                                                return matchesSearch && matchesPlan;
                                            }).length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="py-12 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Building2 className="w-12 h-12 text-slate-300" />
                                                            <p className="text-slate-500 font-medium">No restaurants found</p>
                                                            <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                restaurants.filter(rest => {
                                                    const matchesSearch = searchQuery === '' || 
                                                        rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        rest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        (rest.ownerName && rest.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));
                                                    const matchesPlan = filterPlan === 'all' || rest.plan?.toLowerCase() === filterPlan.toLowerCase();
                                                    return matchesSearch && matchesPlan;
                                                }).map((rest) => (
                                                    <tr key={rest.id} className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-150 group">
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
                                                                    <Building2 className="w-5 h-5 text-slate-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-900 group-hover:text-slate-700">{rest.name}</p>
                                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                                        <Mail className="w-3 h-3" />
                                                                        {rest.email || 'No email'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                {rest.avatarUrl ? (
                                                                    <img src={rest.avatarUrl} alt={rest.ownerName} className="w-6 h-6 rounded-full" />
                                                                ) : (
                                                                    <UserCircle className="w-6 h-6 text-slate-400" />
                                                                )}
                                                                <span className="text-sm text-slate-700">{rest.ownerName || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getPlanBadgeColor(rest.plan || PlanType.FREE)}`}>
                                                                {rest.plan === 'pro' && <Zap className="w-3 h-3" />}
                                                                {rest.plan === 'basic' && <CheckCircle className="w-3 h-3" />}
                                                                {rest.plan || 'Free'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">{getStatusBadge(rest.accountStatus || 'active')}</td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <Monitor className="w-4 h-4 text-slate-400" />
                                                                <span className="font-medium text-slate-700">{rest.stats?.screenCount || 0}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <HardDrive className="w-4 h-4 text-slate-400" />
                                                                <span className="text-sm font-medium text-slate-700">{formatStorage(rest.stats?.storageMB || 0)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                                                <span className="text-sm font-medium text-slate-700">{rest.stats?.mediaCount || 0}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button
                                                                    onClick={() => { setSelectedRestaurant(rest); setIsRestaurantStatusModalOpen(true); }}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
                                                                    title="Manage Status"
                                                                >
                                                                    <Settings className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => { setSelectedRestaurant(rest); setIsRestaurantLimitsModalOpen(true); }}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="flex items-center gap-1.5 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                                                    title="Edit Limits"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => { setSelectedRestaurant(rest); setIsRestaurantDeleteModalOpen(true); }}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                                                    title="Delete Restaurant"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Screens Tab */}
                    {activeTab === 'screens' && (
                        <div className="space-y-6">
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Screen Oversight</h2>
                                        <p className="text-sm text-slate-500 mt-1">Real-time monitoring and control of all screens</p>
                                    </div>
                                    <Button
                                        onClick={loadAllScreens}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Screen</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Code</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Restaurant</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Last Active</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Device Info</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allScreens.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center text-slate-500">
                                                        No screens found
                                                    </td>
                                                </tr>
                                            ) : (
                                                allScreens.map((screen: any) => {
                                                    const getStatusBadge = () => {
                                                        switch (screen.status) {
                                                            case 'online':
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                        <CheckCircle className="w-3 h-3" />
                                                                        Online
                                                                    </span>
                                                                );
                                                            case 'idle':
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                                                        <Clock className="w-3 h-3" />
                                                                        Idle
                                                                    </span>
                                                                );
                                                            case 'error':
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                                        <AlertTriangle className="w-3 h-3" />
                                                                        Error
                                                                    </span>
                                                                );
                                                            case 'disabled':
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                                        <Ban className="w-3 h-3" />
                                                                        Disabled
                                                                    </span>
                                                                );
                                                            default:
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                                        <XCircle className="w-3 h-3" />
                                                                        Offline
                                                                    </span>
                                                                );
                                                        }
                                                    };
                                                    
                                                    return (
                                                        <tr key={screen.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                            <td className="py-4 px-4">
                                                                <p className="font-semibold text-slate-900">{screen.name}</p>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                {screen.code || screen.screenCode ? (
                                                                    <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono">
                                                                        {screen.code || screen.screenCode}
                                                                    </code>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400 italic">No code</span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <p className="text-sm text-slate-700">{screen.restaurantName || 'N/A'}</p>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                {getStatusBadge()}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="text-sm text-slate-600">
                                                                    {screen.lastSeenAt ? formatTimeAgo(screen.lastSeenAt) : 'Never'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                {screen.deviceBrowser || screen.deviceOS ? (
                                                                    <div className="text-xs text-slate-600">
                                                                        <p>{screen.deviceBrowser || 'Unknown'} / {screen.deviceOS || 'Unknown'}</p>
                                                                        {screen.screenResolution && (
                                                                            <p className="text-slate-500">{screen.screenResolution}</p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-slate-400">No data</span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        onClick={async () => {
                                                                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                                                            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                                                            const res = await fetch(`${API_URL}/admin/screens/${screen.id}/disable`, {
                                                                                method: 'PUT',
                                                                                headers: { 
                                                                                    'Content-Type': 'application/json',
                                                                                    'Authorization': `Bearer ${token}` 
                                                                                },
                                                                                body: JSON.stringify({ disabled: !screen.isDisabled })
                                                                            });
                                                                            if (res.ok) loadAllScreens();
                                                                        }}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className={screen.isDisabled ? "text-green-600" : "text-red-600"}
                                                                        title={screen.isDisabled ? "Enable Screen" : "Disable Screen"}
                                                                    >
                                                                        {screen.isDisabled ? <Play className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                                                    </Button>
                                                                    <Button
                                                                        onClick={async () => {
                                                                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                                                            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                                                            await fetch(`${API_URL}/admin/screens/${screen.id}/refresh`, {
                                                                                method: 'POST',
                                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                                            });
                                                                            showToast('Screen will refresh on next heartbeat', 'info');
                                                                        }}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        title="Force Refresh"
                                                                    >
                                                                        <RefreshCw className="w-3 h-3" />
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => {
                                                                            setRevokeScreenAction(screen);
                                                                            setIsRevokeCodeModalOpen(true);
                                                                        }}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        title="Revoke Code"
                                                                    >
                                                                        <Key className="w-3 h-3" />
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => {
                                                                            const screenCode = screen.code || screen.screenCode || (screen as any).code;
                                                                            if (!screenCode) {
                                                                                showToast('Screen code not available', 'error');
                                                                                return;
                                                                            }
                                                                            const publicUrl = `${window.location.origin}/tv/${screenCode}`;
                                                                            window.open(publicUrl, '_blank');
                                                                            showToast('Opening public player in new tab', 'info');
                                                                        }}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        title="View Public Link"
                                                                        disabled={!(screen.code || screen.screenCode || (screen as any).code)}
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Media & Storage Tab */}
                    {activeTab === 'media' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-700 mb-1">Total Storage</p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {formatStorage(stats.totalStorageMB || 0)}
                                            </p>
                                        </div>
                                        <HardDrive className="w-8 h-8 text-slate-600 opacity-50" />
                                    </div>
                                </Card>
                                <Card className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-700 mb-1">Total Files</p>
                                            <p className="text-2xl font-bold text-slate-900">{stats.totalFiles || 0}</p>
                                        </div>
                                        <ImageIcon className="w-8 h-8 text-slate-600 opacity-50" />
                                    </div>
                                </Card>
                                <Card className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-700 mb-1">Restaurants</p>
                                            <p className="text-2xl font-bold text-slate-900">{restaurants.length}</p>
                                        </div>
                                        <Building2 className="w-8 h-8 text-slate-600 opacity-50" />
                                    </div>
                                </Card>
                                <Card className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-slate-700 mb-1">Avg per Restaurant</p>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {restaurants.length > 0 
                                                    ? formatStorage((stats.totalStorageMB || 0) / restaurants.length)
                                                    : '0 MB'}
                                            </p>
                                        </div>
                                        <BarChart3 className="w-8 h-8 text-slate-600 opacity-50" />
                                    </div>
                                </Card>
                            </div>

                            {/* Storage Overview by Restaurant */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <HardDrive className="w-5 h-5 text-indigo-600" />
                                        Storage Overview by Restaurant
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <Search className="w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search restaurants..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Restaurant</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Plan</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Storage Used</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Files</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Screens</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {restaurants
                                                .filter(rest => 
                                                    searchQuery === '' || 
                                                    rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    (rest.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .map((rest) => {
                                                    const storageUsed = rest.stats?.storageMB || 0;
                                                    const planConfig = rest.plan === 'free' ? 15 : rest.plan === 'basic' ? 50 : 200;
                                                    const usagePercent = (storageUsed / planConfig) * 100;
                                                    
                                                    return (
                                                        <tr key={rest.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-3">
                                                                    {rest.avatarUrl ? (
                                                                        <img src={rest.avatarUrl} alt={rest.name} className="w-8 h-8 rounded-full" />
                                                                    ) : (
                                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                            <span className="text-xs font-semibold text-indigo-600">
                                                                                {rest.name.charAt(0).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-semibold text-slate-900">{rest.name}</p>
                                                                        <p className="text-xs text-slate-500">{rest.email || rest.ownerEmail}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                    rest.plan === 'pro' ? 'bg-purple-100 text-purple-700' :
                                                                    rest.plan === 'basic' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                    {rest.plan?.toUpperCase() || 'FREE'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-1 min-w-[120px]">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className="text-sm font-semibold text-slate-900">
                                                                                {formatStorage(storageUsed)}
                                                                            </span>
                                                                            <span className={`text-xs font-medium ${
                                                                                usagePercent > 90 ? 'text-red-600' :
                                                                                usagePercent > 70 ? 'text-amber-600' :
                                                                                'text-slate-600'
                                                                            }`}>
                                                                                {usagePercent.toFixed(0)}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full transition-all ${
                                                                                    usagePercent > 90 ? 'bg-red-500' :
                                                                                    usagePercent > 70 ? 'bg-amber-500' :
                                                                                    'bg-indigo-500'
                                                                                }`}
                                                                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                                            of {formatStorage(planConfig)} limit
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="text-sm font-semibold text-slate-900">
                                                                    {rest.stats?.mediaCount || 0}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="text-sm font-semibold text-slate-900">
                                                                    {rest.stats?.screenCount || 0}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <Button
                                                                    onClick={() => {
                                                                        setSelectedRestaurant(rest);
                                                                        setIsClearStorageModalOpen(true);
                                                                    }}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    title="Clear Storage"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            {restaurants.filter(rest => 
                                                searchQuery === '' || 
                                                rest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                (rest.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                                            ).length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                                        No restaurants found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* Storage Breakdown */}
                            {restaurants.some(r => r.stats?.storageBreakdown && Object.keys(r.stats.storageBreakdown).length > 0) && (
                                <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <PieChart className="w-5 h-5 text-indigo-600" />
                                        Storage Breakdown by Type
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {['image', 'video', 'pdf', 'other'].map((type) => {
                                            const totalForType = restaurants.reduce((sum, r) => {
                                                const breakdown = r.stats?.storageBreakdown || {};
                                                return sum + (breakdown[type]?.total_mb || 0);
                                            }, 0);
                                            const totalFiles = restaurants.reduce((sum, r) => {
                                                const breakdown = r.stats?.storageBreakdown || {};
                                                return sum + (breakdown[type]?.count || 0);
                                            }, 0);
                                            
                                            return (
                                                <div key={type} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-slate-700 capitalize">{type}</span>
                                                        <span className="text-xs text-slate-500">{totalFiles} files</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-slate-900">{formatStorage(totalForType)}</p>
                                                    <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                                                        <div
                                                            className="bg-indigo-500 h-1.5 rounded-full"
                                                            style={{ width: `${stats.totalStorageMB > 0 ? (totalForType / stats.totalStorageMB) * 100 : 0}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Player Controls Tab */}
                    {activeTab === 'player-controls' && (
                        <div className="space-y-6">
                            {/* 1️⃣ GLOBAL SYSTEM CONTROL */}
                            <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                                            <Power className="w-5 h-5 text-red-600" />
                                            Public Player System Status
                                        </h2>
                                        <p className="text-sm text-slate-600">Emergency kill switch for all public players</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">🟢</span>
                                            <span className="text-lg font-bold text-green-700">Enabled</span>
                                        </div>
                                        <p className="text-xs text-slate-600">
                                            Active screens: {allScreens.filter((s: any) => s.status === 'online' || s.status === 'idle').length}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Last activity: {allScreens.length > 0 && allScreens[0]?.lastSeenAt 
                                                ? formatTimeAgo(allScreens[0].lastSeenAt) 
                                                : 'No activity'}
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-red-200">
                                    <Button
                                        onClick={() => setIsGlobalDisableModalOpen(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <Power className="w-4 h-4 mr-2" />
                                        ⛔ Disable All Public Players
                                    </Button>
                                </div>
                            </Card>

                            {/* 2️⃣ RESTAURANT-LEVEL CONTROL */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-indigo-600" />
                                            Restaurant-Level Control
                                        </h2>
                                        <p className="text-sm text-slate-500">Control public player access per restaurant</p>
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Restaurant</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Public Player</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Active Screens</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Last Active</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {restaurants.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                                        No restaurants found
                                                    </td>
                                                </tr>
                                            ) : (
                                                restaurants.map((rest: any) => {
                                                    // Calculate active screens for this restaurant
                                                    const restaurantId = rest.restaurantId || rest.id;
                                                    const restaurantScreens = allScreens.filter((s: any) => s.restaurantId === restaurantId || s.restaurantId === rest.id);
                                                    const activeScreens = restaurantScreens.filter((s: any) => s.status === 'online' || s.status === 'idle');
                                                    const lastActiveScreen = restaurantScreens
                                                        .filter((s: any) => s.lastSeenAt)
                                                        .sort((a: any, b: any) => b.lastSeenAt - a.lastSeenAt)[0];
                                                    
                                                    const isEnabled = rest.accountStatus !== 'suspended' && rest.accountStatus !== 'deleted';
                                                    
                                                    return (
                                                        <tr key={rest.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                            <td className="py-4 px-4">
                                                                <p className="font-semibold text-slate-900">{rest.name}</p>
                                                                <p className="text-xs text-slate-500">{rest.email || rest.ownerEmail}</p>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                {isEnabled ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                        <span>🟢</span>
                                                                        Public Player Enabled
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                                        <span>🔴</span>
                                                                        Public Player Disabled
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Monitor className="w-4 h-4 text-slate-600" />
                                                                    <span className="text-sm font-semibold text-slate-900">
                                                                        {activeScreens.length} / {restaurantScreens.length}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <span className="text-sm text-slate-600">
                                                                    {lastActiveScreen?.lastSeenAt 
                                                                        ? formatTimeAgo(lastActiveScreen.lastSeenAt)
                                                                        : '—'}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        onClick={() => {
                                                                            setRestaurantPlaybackAction({ rest, enabled: !isEnabled });
                                                                            setIsRestaurantPlaybackModalOpen(true);
                                                                        }}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className={isEnabled ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                                                                    >
                                                                        {isEnabled ? (
                                                                            <>
                                                                                <Pause className="w-3 h-3 mr-1" />
                                                                                Disable
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Play className="w-3 h-3 mr-1" />
                                                                                Enable
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => {
                                                                            setSelectedRestaurant(rest);
                                                                            // Could open a modal showing all screens for this restaurant
                                                                            handleTabChange('screens');
                                                                        }}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        title="View Screens"
                                                                    >
                                                                        <Eye className="w-3 h-3" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* 3️⃣ SCREEN-LEVEL OVERRIDE (Quick View) */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                                            <Monitor className="w-5 h-5 text-indigo-600" />
                                            Screen-Level Override
                                        </h2>
                                        <p className="text-sm text-slate-500">Individual screen controls (see Screens tab for full details)</p>
                                    </div>
                                    <Button
                                        onClick={() => handleTabChange('screens')}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View All Screens
                                    </Button>
                                </div>
                                
                                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                    {allScreens.slice(0, 10).map((screen: any) => {
                                        const getStatusEmoji = () => {
                                            switch (screen.status) {
                                                case 'online': return '🟢';
                                                case 'idle': return '🟡';
                                                case 'error': return '⚠️';
                                                case 'disabled': return '🔴';
                                                default: return '⚪';
                                            }
                                        };
                                        
                                        return (
                                            <div key={screen.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg">{getStatusEmoji()}</span>
                                                        <p className="font-semibold text-slate-900">{screen.name}</p>
                                                        <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{screen.code}</code>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-slate-600 ml-7">
                                                        <span>Status: {screen.status === 'online' ? 'Online' : screen.status === 'idle' ? 'Idle' : screen.status === 'error' ? 'Error' : screen.status === 'disabled' ? 'Disabled by Admin' : 'Offline'}</span>
                                                        <span>Last seen: {screen.lastSeenAt ? formatTimeAgo(screen.lastSeenAt) : 'Never'}</span>
                                                        <span>Public Access: {screen.isDisabled ? '🔴 Disabled' : '🟢 Enabled'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => {
                                                            setScreenDisableAction({ screen, disabled: !screen.isDisabled });
                                                            setIsScreenDisableModalOpen(true);
                                                        }}
                                                        variant="secondary"
                                                        size="sm"
                                                        className={screen.isDisabled ? "text-green-600" : "text-red-600"}
                                                    >
                                                        {screen.isDisabled ? <Play className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {allScreens.length === 0 && (
                                        <div className="text-center py-8 text-slate-500">
                                            <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No screens found</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Email Control Tab */}
                    {activeTab === 'email' && (
                        <div className="space-y-6">
                            {/* SMTP Health & Safety */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-indigo-600" />
                                        SMTP Health & Safety
                                    </h2>
                                    <Button 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={() => setIsEmailSettingsModalOpen(true)}
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Configure SMTP
                                    </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700">SMTP Status</span>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                emailSettings?.smtpEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {emailSettings?.smtpEnabled ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        Enabled
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3" />
                                                        Disabled
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {emailSettings?.smtpHost || 'Not configured'}
                                        </p>
                                    </div>
                                    
                                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700">Email Queue</span>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                emailSettings?.emailQueueStatus === 'idle' ? 'bg-green-100 text-green-700' :
                                                emailSettings?.emailQueueStatus === 'sending' ? 'bg-blue-100 text-blue-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {emailSettings?.emailQueueStatus || 'idle'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {emailSettings?.lastSuccessfulSend 
                                                ? `Last sent: ${formatTimeAgo(emailSettings.lastSuccessfulSend)}`
                                                : 'No emails sent yet'}
                                        </p>
                                    </div>
                                    
                                    {emailSettings?.lastFailureReason && (
                                        <div className="md:col-span-2 p-4 bg-red-50 rounded-lg border border-red-200">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-red-900">Last Failure</p>
                                                    <p className="text-xs text-red-700 mt-1">{emailSettings.lastFailureReason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4">
                                    <Button
                                        onClick={async () => {
                                            setIsTestEmailLoading(true);
                                            try {
                                                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                                const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                                const res = await fetch(`${API_URL}/admin/email/test`, {
                                                    method: 'POST',
                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    alert('Test email sent successfully!');
                                                    loadEmailSettings();
                                                    loadEmailLogs();
                                                } else {
                                                    alert(data.error || 'Failed to send test email');
                                                }
                                            } catch (err: any) {
                                                alert(err.message || 'Failed to send test email');
                                            } finally {
                                                setIsTestEmailLoading(false);
                                            }
                                        }}
                                        disabled={isTestEmailLoading || !emailSettings?.smtpEnabled}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        {isTestEmailLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                Test SMTP Connection
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>

                            {/* Email Type Toggles */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-indigo-600" />
                                    Email Type Controls
                                </h2>
                                <p className="text-sm text-slate-600 mb-4">Enable or disable specific email types</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {emailSettings?.emailTypes && Object.entries(emailSettings.emailTypes).map(([type, enabled]: [string, any]) => (
                                        <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 capitalize">
                                                    {type.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {type.includes('plan') ? 'Billing & Subscription' :
                                                     type.includes('account') ? 'Account Management' :
                                                     type.includes('password') ? 'Security' : 'General'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const newEmailTypes = { ...emailSettings.emailTypes, [type]: !enabled };
                                                    try {
                                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                                        const res = await fetch(`${API_URL}/admin/email/types`, {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ emailTypes: newEmailTypes })
                                                        });
                                                        if (res.ok) {
                                                            setEmailSettings({ ...emailSettings, emailTypes: newEmailTypes });
                                                        }
                                                    } catch (err) {
                                                        console.error('Failed to update email type:', err);
                                                    }
                                                }}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                    enabled ? 'bg-indigo-600' : 'bg-slate-300'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                        enabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Email Logs */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                        <History className="w-5 h-5 text-indigo-600" />
                                        Email Logs
                                    </h2>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={loadEmailLogs}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                                
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {emailLogs.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">
                                            <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No email logs yet</p>
                                        </div>
                                    ) : (
                                        emailLogs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                            log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {log.status}
                                                        </span>
                                                        <span className="text-sm font-medium text-slate-900 capitalize">
                                                            {log.emailType.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1">{log.recipient}</p>
                                                    {log.errorMessage && (
                                                        <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    {formatTimeAgo(log.timestamp)}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* User Requests Tab */}
                    {activeTab === 'user-requests' && (
                        <div className="space-y-6">
                            {/* Feature Requests & Upgrade Requests */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                                            Feature Requests & Upgrade Requests
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {featureRequests.filter(r => r.status === 'pending').length} pending requests
                                        </p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => loadFeatureRequests()}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">User</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Title</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Details</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Created</th>
                                                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {featureRequests.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-12 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Lightbulb className="w-12 h-12 text-slate-300" />
                                                            <p className="text-slate-500 font-medium">No feature requests found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                featureRequests.map((request) => (
                                                    <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                request.requestType === 'upgrade' 
                                                                    ? 'bg-blue-100 text-blue-700' 
                                                                    : 'bg-purple-100 text-purple-700'
                                                            }`}>
                                                                {request.requestType === 'upgrade' ? (
                                                                    <Crown className="w-3 h-3" />
                                                                ) : (
                                                                    <Lightbulb className="w-3 h-3" />
                                                                )}
                                                                {request.requestType === 'upgrade' ? 'Upgrade' : 'Feature'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900">{request.userName || 'N/A'}</p>
                                                                <p className="text-xs text-slate-500">{request.userEmail || ''}</p>
                                                                {request.restaurantName && (
                                                                    <p className="text-xs text-slate-400">{request.restaurantName}</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <p className="text-sm font-medium text-slate-900">{request.title}</p>
                                                            {request.requestedPlan && (
                                                                <p className="text-xs text-slate-500 mt-1">
                                                                    {request.currentPlan} → {request.requestedPlan}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <p className="text-xs text-slate-600 line-clamp-2">{request.description}</p>
                                                            {request.category && (
                                                                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                                                                    {request.category}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                request.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                                request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-700'
                                                            }`}>
                                                                {request.status === 'pending' && <Clock className="w-3 h-3" />}
                                                                {request.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                                                {request.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                                                {request.status === 'completed' && <Check className="w-3 h-3" />}
                                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="text-xs text-slate-500">
                                                                {request.createdAt ? formatTimeAgo(new Date(request.createdAt).getTime()) : 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button
                                                                    onClick={async () => {
                                                                        const newStatus = request.status === 'pending' ? 'approved' : 
                                                                                         request.status === 'approved' ? 'completed' : 'pending';
                                                                        try {
                                                                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                                                            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                                                            const res = await fetch(`${API_URL}/admin/feature-requests/${request.id}/status`, {
                                                                                method: 'PUT',
                                                                                headers: {
                                                                                    'Content-Type': 'application/json',
                                                                                    'Authorization': `Bearer ${token}`
                                                                                },
                                                                                body: JSON.stringify({ 
                                                                                    status: newStatus,
                                                                                    adminNotes: request.adminNotes || ''
                                                                                })
                                                                            });
                                                                            if (res.ok) {
                                                                                loadFeatureRequests();
                                                                                loadAdminData(false);
                                                                                if (newStatus === 'approved' && request.requestType === 'upgrade') {
                                                                                    window.dispatchEvent(new Event('menupi-user-updated'));
                                                                                }
                                                                                showToast(`Request ${newStatus} successfully`, 'success');
                                                                            } else {
                                                                                const err = await res.json();
                                                                                showToast(err.error || 'Failed to update request', 'error');
                                                                            }
                                                                        } catch (err: any) {
                                                                            showToast(err.message || 'Failed to update request', 'error');
                                                                        }
                                                                    }}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="flex items-center gap-1"
                                                                    title={request.status === 'pending' ? 'Approve' : request.status === 'approved' ? 'Mark Complete' : 'Reopen'}
                                                                >
                                                                    {request.status === 'pending' ? (
                                                                        <CheckCircle className="w-3 h-3" />
                                                                    ) : request.status === 'approved' ? (
                                                                        <Check className="w-3 h-3" />
                                                                    ) : (
                                                                        <RefreshCw className="w-3 h-3" />
                                                                    )}
                                                                </Button>
                                                                {request.status !== 'rejected' && (
                                                                    <Button
                                                                        onClick={async () => {
                                                                            try {
                                                                                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                                                                const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                                                                const res = await fetch(`${API_URL}/admin/feature-requests/${request.id}/status`, {
                                                                                    method: 'PUT',
                                                                                    headers: {
                                                                                        'Content-Type': 'application/json',
                                                                                        'Authorization': `Bearer ${token}`
                                                                                    },
                                                                                    body: JSON.stringify({ 
                                                                                        status: 'rejected',
                                                                                        adminNotes: request.adminNotes || ''
                                                                                    })
                                                                                });
                                                                                if (res.ok) {
                                                                                    loadFeatureRequests();
                                                                                    showToast('Request rejected', 'success');
                                                                                } else {
                                                                                    const err = await res.json();
                                                                                    showToast(err.error || 'Failed to reject request', 'error');
                                                                                }
                                                                            } catch (err: any) {
                                                                                showToast(err.message || 'Failed to reject request', 'error');
                                                                            }
                                                                        }}
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                                                        title="Reject"
                                                                    >
                                                                        <XCircle className="w-3 h-3" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* Activity Logs */}
                            <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <History className="w-5 h-5 text-indigo-600" />
                                            Audit & Activity Logs
                                        </h2>
                                        <p className="text-sm text-slate-500 mt-1">System-wide activity and audit trail</p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => loadAdminData(false)}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                                
                                {activities.length === 0 ? (
                                    <div className="text-center py-12">
                                        <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">No activity logs found</p>
                                        <p className="text-sm text-slate-400 mt-1">Activity will appear here as users interact with the system</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                        {activities.map((activity) => (
                                            <div key={activity.id} className="flex gap-3 p-4 rounded-lg border-l-4 border-indigo-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                                    {activity.icon || <Activity className="w-5 h-5 text-indigo-600" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900">{activity.action}</p>
                                                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{activity.details}</p>
                                                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimeAgo(activity.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* System Health Tab */}
                    {activeTab === 'system-health' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Heart className="w-5 h-5 text-indigo-600" />
                                        System Status
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Server className="w-5 h-5 text-slate-600" />
                                                <span className="text-sm font-medium text-slate-700">Backend</span>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                systemHealth?.backend === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {systemHealth?.backend === 'online' ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        Online
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3" />
                                                        Offline
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Database className="w-5 h-5 text-slate-600" />
                                                <span className="text-sm font-medium text-slate-700">Database</span>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                systemHealth?.database === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {systemHealth?.database === 'connected' ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        Connected
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3" />
                                                        Disconnected
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="w-5 h-5 text-slate-600" />
                                                <span className="text-sm font-medium text-slate-700">Active Screens</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">
                                                {systemHealth?.activeScreens || 0} / {systemHealth?.totalScreens || 0}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card className="p-6 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl">
                                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-indigo-600" />
                                        Quick Stats
                                    </h2>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">Total Users</span>
                                            <span className="text-sm font-bold text-slate-900">{stats.totalUsers || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">Total Screens</span>
                                            <span className="text-sm font-bold text-slate-900">{stats.totalScreens || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">Total Storage</span>
                                            <span className="text-sm font-bold text-slate-900">{formatStorage(stats.totalStorageMB || 0)}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Admin Accounts Tab */}
                    {activeTab === 'admins' && (
                        <div className="space-y-6">
                            {/* Current Admin Info Card */}
                            {currentAdmin && (
                                <Card className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {currentAdmin.avatarUrl ? (
                                                <img 
                                                    src={currentAdmin.avatarUrl} 
                                                    alt={currentAdmin.name}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-300"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center border-2 border-indigo-300">
                                                    <span className="text-2xl font-bold text-indigo-700">
                                                        {getInitials(currentAdmin.name || 'A')}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xl font-bold text-slate-900">{currentAdmin.name}</h3>
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Super Admin
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1">{currentAdmin.email}</p>
                                                <p className="text-xs text-slate-500 mt-1">You are currently logged in as this admin account</p>
                                            </div>
                                        </div>
                                        <div>
                                            <Button
                                                onClick={() => setIsChangeMyPasswordModalOpen(true)}
                                                variant="secondary"
                                                className="flex items-center gap-2"
                                            >
                                                <Key className="w-4 h-4" />
                                                Change My Password
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* All Admins List */}
                            <Card className="p-6 bg-white">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">All Admin Accounts</h2>
                                        <p className="text-sm text-slate-500 mt-1">Manage super admin accounts with full system access</p>
                                    </div>
                                    {currentAdmin?.role === UserRole.SUPER_ADMIN && (
                                        <Button
                                            onClick={() => setIsAddAdminModalOpen(true)}
                                            className="flex items-center gap-2"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Add Admin
                                        </Button>
                                    )}
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Admin</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Role</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Created</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                                                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {admins.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-slate-500">
                                                        No admins found
                                                    </td>
                                                </tr>
                                            ) : (
                                                admins.map((admin) => (
                                                    <tr 
                                                        key={admin.id} 
                                                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                                            currentAdmin?.id === admin.id ? 'bg-indigo-50' : ''
                                                        }`}
                                                    >
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                {admin.avatarUrl ? (
                                                                    <img 
                                                                        src={admin.avatarUrl} 
                                                                        alt={admin.name}
                                                                        className="w-10 h-10 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                                        <span className="text-sm font-semibold text-indigo-600">
                                                                            {getInitials(admin.name || 'A')}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="font-semibold text-slate-900">{admin.name}</p>
                                                                    {currentAdmin?.id === admin.id && (
                                                                        <p className="text-xs text-indigo-600 font-medium">(You)</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="text-sm text-slate-700">{admin.email}</span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                                                <Shield className="w-3 h-3 mr-1" />
                                                                Super Admin
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="text-sm text-slate-600">
                                                                {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Active
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {currentAdmin?.role === UserRole.SUPER_ADMIN && (
                                                                <Button
                                                                    onClick={() => {
                                                                        setSelectedUser(admin);
                                                                        setIsResetPasswordModalOpen(true);
                                                                    }}
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    title="Change Password"
                                                                >
                                                                    <Key className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Add Admin Modal */}
            {isAddAdminModalOpen && (
                <Modal
                    isOpen={isAddAdminModalOpen}
                    onClose={() => setIsAddAdminModalOpen(false)}
                    title="Add New Admin"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700">
                                <strong>Warning:</strong> New admins will have full system access including the ability to manage all users, view all data, and create additional admins.
                            </p>
                        </div>
                        <Input
                            label="Name"
                            value={newAdmin.name}
                            onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={newAdmin.email}
                            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={newAdmin.password}
                            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                            required
                            placeholder="Minimum 8 characters"
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleAddAdmin}
                                className="flex-1"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Create Admin
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsAddAdminModalOpen(false);
                                    setNewAdmin({ name: '', email: '', password: '' });
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

            {/* User Detail Modal */}
            {isDetailModalOpen && selectedUser && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="User Details"
                >
                    <div className="space-y-6">
                        {/* User Info */}
                        <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                            {selectedUser.avatarUrl ? (
                                <img 
                                    src={selectedUser.avatarUrl} 
                                    alt={selectedUser.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-xl font-semibold text-indigo-600">
                                        {getInitials(selectedUser.name || 'U')}
                                    </span>
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedUser.name}</h3>
                                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(selectedUser.plan || PlanType.FREE)}`}>
                                        {selectedUser.plan || 'Free'}
                                    </span>
                                    {getStatusBadge(selectedUser.accountStatus || 'active')}
                                </div>
                            </div>
                        </div>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card className="p-4 bg-blue-50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Monitor className="w-5 h-5 text-blue-600" />
                                    <p className="text-sm font-medium text-slate-600">Screens</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {selectedUser.stats?.screenCount || 0}
                                </p>
                            </Card>

                            <Card className="p-4 bg-purple-50">
                                <div className="flex items-center gap-2 mb-2">
                                    <HardDrive className="w-5 h-5 text-purple-600" />
                                    <p className="text-sm font-medium text-slate-600">Media Files</p>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">
                                    {selectedUser.stats?.mediaCount || 0}
                                </p>
                            </Card>

                            <Card className="p-4 bg-indigo-50">
                                <div className="flex items-center gap-2 mb-2">
                                    <HardDrive className="w-5 h-5 text-indigo-600" />
                                    <p className="text-sm font-medium text-slate-600">Storage Used</p>
                                </div>
                                <p className="text-2xl font-bold text-indigo-600">
                                    {formatStorage(selectedUser.stats?.storageMB || 0)}
                                </p>
                            </Card>
                        </div>

                        {/* Storage Breakdown */}
                        {selectedUser.stats?.storageBreakdown && Object.keys(selectedUser.stats.storageBreakdown).length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Storage Breakdown</h4>
                <div className="space-y-2">
                                    {Object.entries(selectedUser.stats.storageBreakdown).map(([type, data]: [string, any]) => (
                                        <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="w-4 h-4 text-slate-600" />
                                                <span className="text-sm font-medium text-slate-700 capitalize">
                                                    {type}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {formatStorage(data.totalMB || 0)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {data.count || 0} file{(data.count || 0) !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                        </div>
                    ))}
                </div>
                            </div>
                        )}

                        {/* Account Info */}
                        <div className="pt-4 border-t border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Account Information</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Restaurant ID:</span>
                                    <span className="font-medium text-slate-900">{selectedUser.restaurantId || selectedUser.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Role:</span>
                                    <span className="font-medium text-slate-900 capitalize">{selectedUser.role || 'Owner'}</span>
                                </div>
                                {selectedUser.createdAt && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Created:</span>
                                        <span className="font-medium text-slate-900">
                                            {new Date(selectedUser.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Email Actions */}
                        <div className="pt-4 border-t border-slate-200">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Email Actions</h4>
                            <div className="grid grid-cols-1 gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={async () => {
                                        try {
                                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                            const res = await fetch(`${API_URL}/admin/email/send`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({
                                                    emailType: 'password_reset',
                                                    recipient: selectedUser.email,
                                                    subject: 'Password Reset Request',
                                                    body: 'Your password has been reset. Please check your email for the new password.'
                                                })
                                            });
                                            if (res.ok) {
                                                alert('Password reset email sent successfully');
                                                loadEmailLogs();
                                            } else {
                                                const err = await res.json();
                                                alert(err.error || 'Failed to send email');
                                            }
                                        } catch (err: any) {
                                            alert(err.message || 'Failed to send email');
                                        }
                                    }}
                                    className="w-full justify-start"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Password Reset Email
                                </Button>
                                
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={async () => {
                                        try {
                                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                            const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                            const res = await fetch(`${API_URL}/admin/email/send`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({
                                                    emailType: 'user_invitation',
                                                    recipient: selectedUser.email,
                                                    subject: 'Welcome to MENUPI',
                                                    body: 'You have been invited to join MENUPI. Please check your email for login instructions.'
                                                })
                                            });
                                            if (res.ok) {
                                                alert('Invitation email sent successfully');
                                                loadEmailLogs();
                                            } else {
                                                const err = await res.json();
                                                alert(err.error || 'Failed to send email');
                                            }
                                        } catch (err: any) {
                                            alert(err.message || 'Failed to send email');
                                        }
                                    }}
                                    className="w-full justify-start"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Resend Invitation Email
                                </Button>
                                
                                {selectedUser.isVerified === false && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                                const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                                const res = await fetch(`${API_URL}/admin/email/send`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({
                                                        emailType: 'account_created',
                                                        recipient: selectedUser.email,
                                                        subject: 'Verify Your MENUPI Account',
                                                        body: 'Please verify your email address to activate your account.'
                                                    })
                                                });
                                                if (res.ok) {
                                                    alert('Account activation email sent successfully');
                                                    loadEmailLogs();
                                                } else {
                                                    const err = await res.json();
                                                    alert(err.error || 'Failed to send email');
                                                }
                                            } catch (err: any) {
                                                alert(err.message || 'Failed to send email');
                                            }
                                        }}
                                        className="w-full justify-start"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Resend Account Activation Email
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Add User Modal */}
            {isAddUserModalOpen && (
                <Modal
                    isOpen={isAddUserModalOpen}
                    onClose={() => setIsAddUserModalOpen(false)}
                    title="Add New User"
                >
                    <div className="space-y-4">
                        <Input
                            label="Name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            required
                        />
                        <Select
                            label="Plan"
                            value={newUser.plan}
                            onChange={(e) => setNewUser({ ...newUser, plan: e.target.value as PlanType })}
                            options={[
                                { value: PlanType.FREE, label: 'Free' },
                                { value: PlanType.BASIC, label: 'Basic' },
                                { value: PlanType.PRO, label: 'Pro' }
                            ]}
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleAddUser}
                                className="flex-1"
                            >
                                Create User
                            </Button>
                            <Button
                                onClick={() => setIsAddUserModalOpen(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Warn/Ban User Modal */}
            {isWarnModalOpen && selectedUser && (
                <Modal
                    isOpen={isWarnModalOpen}
                    onClose={() => setIsWarnModalOpen(false)}
                    title={`${warningData.warningType === 'ban' ? 'Ban' : warningData.warningType === 'suspension' ? 'Suspend' : 'Warn'} User`}
                >
                    <div className="space-y-4">
                        <Select
                            label="Action Type"
                            value={warningData.warningType}
                            onChange={(e) => setWarningData({ ...warningData, warningType: e.target.value })}
                            options={[
                                { value: 'warning', label: 'Warning' },
                                { value: 'suspension', label: 'Suspension' },
                                { value: 'ban', label: 'Ban' }
                            ]}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                            <textarea
                                value={warningData.reason}
                                onChange={(e) => setWarningData({ ...warningData, reason: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                rows={4}
                                placeholder="Enter reason for warning/ban..."
                                required
                            />
                        </div>
                        <Input
                            label="Expires At (Optional)"
                            type="datetime-local"
                            value={warningData.expiresAt}
                            onChange={(e) => setWarningData({ ...warningData, expiresAt: e.target.value })}
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleWarnUser}
                                className={`flex-1 ${
                                    warningData.warningType === 'ban' 
                                        ? 'bg-red-600 hover:bg-red-700' 
                                        : warningData.warningType === 'suspension'
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : ''
                                }`}
                            >
                                {warningData.warningType === 'ban' ? 'Ban User' : warningData.warningType === 'suspension' ? 'Suspend User' : 'Warn User'}
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsWarnModalOpen(false);
                                    setWarningData({ warningType: 'warning', reason: '', expiresAt: '' });
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

            {/* Delete User Modal */}
            {isDeleteModalOpen && selectedUser && (
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="Delete User"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                                <strong>Warning:</strong> This will permanently delete {selectedUser.name} and all associated data including screens, media, and schedules. This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleDeleteUser}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Permanently
                            </Button>
                            <Button
                                onClick={() => setIsDeleteModalOpen(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Update Plan Modal */}
            {isPlanModalOpen && selectedUser && (
                <Modal
                    isOpen={isPlanModalOpen}
                    onClose={() => setIsPlanModalOpen(false)}
                    title="Update Subscription Plan"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600 mb-2">Current Plan:</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanBadgeColor(selectedUser.plan || PlanType.FREE)}`}>
                                {selectedUser.plan || 'Free'}
                            </span>
                        </div>
                        <Select
                            label="New Plan"
                            value={selectedUser.plan}
                            onChange={(e) => setSelectedUser({ ...selectedUser, plan: e.target.value as PlanType })}
                            options={[
                                { value: PlanType.FREE, label: 'Free' },
                                { value: PlanType.BASIC, label: 'Basic' },
                                { value: PlanType.PRO, label: 'Pro' }
                            ]}
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleUpdatePlan}
                                className="flex-1"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Update Plan
                            </Button>
                            <Button
                                onClick={() => setIsPlanModalOpen(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Reset Password Modal */}
            {isResetPasswordModalOpen && selectedUser && (
                <Modal
                    isOpen={isResetPasswordModalOpen}
                    onClose={() => setIsResetPasswordModalOpen(false)}
                    title="Reset User Password"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700">
                                <strong>Warning:</strong> This will reset the password for {selectedUser.name || selectedUser.email}. They will need to use this new password to log in.
                            </p>
                        </div>
                        <Input
                            label="New Password"
                            type="password"
                            value={resetPasswordData.newPassword}
                            onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                            required
                            placeholder="Minimum 8 characters"
                        />
                        <Input
                            label="Confirm Password"
                            type="password"
                            value={resetPasswordData.confirmPassword}
                            onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                            required
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={async () => {
                                    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
                                        showToast('Passwords do not match', 'error');
                                        return;
                                    }
                                    if (resetPasswordData.newPassword.length < 8) {
                                        showToast('Password must be at least 8 characters', 'error');
                                        return;
                                    }
                                    // Only super admin can reset passwords
                                    if (currentAdmin?.role !== UserRole.SUPER_ADMIN) {
                                        showToast('Only super admins can reset passwords', 'error');
                                        return;
                                    }
                                    try {
                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                        const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}/reset-password`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({ newPassword: resetPasswordData.newPassword })
                                        });
                                        if (!res.ok) {
                                            const err = await res.json();
                                            showToast(err.error || 'Failed to reset password', 'error');
                                            return;
                                        }
                                        setIsResetPasswordModalOpen(false);
                                        setResetPasswordData({ newPassword: '', confirmPassword: '' });
                                        showToast('Password reset successfully', 'success');
                                        loadAllUsers();
                                    } catch (err: any) {
                                        showToast(err.message || 'Failed to reset password', 'error');
                                    }
                                }}
                                className="flex-1"
                            >
                                <Key className="w-4 h-4 mr-2" />
                                Reset Password
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsResetPasswordModalOpen(false);
                                    setResetPasswordData({ newPassword: '', confirmPassword: '' });
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

            {/* Update Role Modal */}
            {isRoleModalOpen && selectedUser && (
                <Modal
                    isOpen={isRoleModalOpen}
                    onClose={() => setIsRoleModalOpen(false)}
                    title="Update User Role"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600 mb-2">Current Role:</p>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-700 capitalize">
                                {selectedUser.role || 'owner'}
                            </span>
                        </div>
                        <Select
                            label="New Role"
                            value={selectedUser.role || 'owner'}
                            onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                            options={[
                                { value: 'owner', label: 'Owner' },
                                { value: 'member', label: 'Member' },
                                { value: 'super_admin', label: 'Super Admin' }
                            ]}
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={async () => {
                                    try {
                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                        const res = await fetch(`${API_URL}/admin/users/${selectedUser.id}/role`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({ role: selectedUser.role })
                                        });
                                        if (!res.ok) {
                                            const err = await res.json();
                                            alert(err.error || 'Failed to update role');
                                            return;
                                        }
                                        setIsRoleModalOpen(false);
                                        loadAllUsers();
                                        alert('Role updated successfully');
                                    } catch (err: any) {
                                        alert(err.message || 'Failed to update role');
                                    }
                                }}
                                className="flex-1"
                            >
                                <UserCircle className="w-4 h-4 mr-2" />
                                Update Role
                            </Button>
                            <Button
                                onClick={() => setIsRoleModalOpen(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Restaurant Status Modal */}
            {isRestaurantStatusModalOpen && selectedRestaurant && (
                <Modal
                    isOpen={isRestaurantStatusModalOpen}
                    onClose={() => setIsRestaurantStatusModalOpen(false)}
                    title="Change Restaurant Status"
                >
                    <div className="space-y-4">
                        <Select
                            label="Status"
                            value={selectedRestaurant.accountStatus || 'active'}
                            onChange={(e) => setSelectedRestaurant({ ...selectedRestaurant, accountStatus: e.target.value })}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'suspended', label: 'Suspended' },
                                { value: 'expired', label: 'Expired' }
                            ]}
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={async () => {
                                    try {
                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                        const res = await fetch(`${API_URL}/admin/restaurants/${selectedRestaurant.restaurantId}/status`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({ status: selectedRestaurant.accountStatus })
                                        });
                                        if (!res.ok) {
                                            const err = await res.json();
                                            alert(err.error || 'Failed to update status');
                                            return;
                                        }
                                        setIsRestaurantStatusModalOpen(false);
                                        loadAdminData(false);
                                        // Trigger user update event for affected user
                                        window.dispatchEvent(new Event('menupi-user-updated'));
                                    } catch (err: any) {
                                        alert(err.message || 'Failed to update status');
                                    }
                                }}
                                className="flex-1"
                            >
                                Update Status
                            </Button>
                            <Button
                                onClick={() => setIsRestaurantStatusModalOpen(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Restaurant Limits Modal */}
            {isRestaurantLimitsModalOpen && selectedRestaurant && (
                <Modal
                    isOpen={isRestaurantLimitsModalOpen}
                    onClose={() => setIsRestaurantLimitsModalOpen(false)}
                    title="Update Plan Limits"
                >
                    <div className="space-y-4">
                        <Input
                            label="Max Screens"
                            type="number"
                            value={selectedRestaurant.maxScreens || ''}
                            onChange={(e) => setSelectedRestaurant({ ...selectedRestaurant, maxScreens: parseInt(e.target.value) })}
                            placeholder="-1 for unlimited"
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={async () => {
                                    try {
                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                        const res = await fetch(`${API_URL}/admin/restaurants/${selectedRestaurant.restaurantId}/limits`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({ maxScreens: selectedRestaurant.maxScreens })
                                        });
                                        if (!res.ok) {
                                            const err = await res.json();
                                            alert(err.error || 'Failed to update limits');
                                            return;
                                        }
                                        setIsRestaurantLimitsModalOpen(false);
                                        loadAdminData(false);
                                    } catch (err: any) {
                                        alert(err.message || 'Failed to update limits');
                                    }
                                }}
                                className="flex-1"
                            >
                                Update Limits
                            </Button>
                            <Button
                                onClick={() => setIsRestaurantLimitsModalOpen(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Email Settings Modal */}
            {isEmailSettingsModalOpen && (
                <Modal
                    isOpen={isEmailSettingsModalOpen}
                    onClose={() => setIsEmailSettingsModalOpen(false)}
                    title="Configure SMTP Settings"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700">
                                <strong>Note:</strong> In production, configure these settings with your actual SMTP provider credentials (Gmail, SendGrid, AWS SES, etc.)
                            </p>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <label className="text-sm font-medium text-slate-700">Enable SMTP</label>
                            <button
                                onClick={() => setEmailSettingsForm({ ...emailSettingsForm, smtpEnabled: !emailSettingsForm.smtpEnabled })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    emailSettingsForm.smtpEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        emailSettingsForm.smtpEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        
                        <Input
                            label="SMTP Host"
                            value={emailSettingsForm.smtpHost}
                            onChange={(e) => setEmailSettingsForm({ ...emailSettingsForm, smtpHost: e.target.value })}
                            placeholder="smtp.gmail.com"
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="SMTP Port"
                                type="number"
                                value={emailSettingsForm.smtpPort}
                                onChange={(e) => setEmailSettingsForm({ ...emailSettingsForm, smtpPort: parseInt(e.target.value) })}
                                placeholder="587"
                            />
                            
                            <Select
                                label="Encryption"
                                value={emailSettingsForm.smtpEncryption}
                                onChange={(e) => setEmailSettingsForm({ ...emailSettingsForm, smtpEncryption: e.target.value })}
                                options={[
                                    { value: 'TLS', label: 'TLS' },
                                    { value: 'SSL', label: 'SSL' },
                                    { value: 'None', label: 'None' }
                                ]}
                            />
                        </div>
                        
                        <Input
                            label="SMTP Username"
                            value={emailSettingsForm.smtpUser}
                            onChange={(e) => setEmailSettingsForm({ ...emailSettingsForm, smtpUser: e.target.value })}
                            placeholder="your-email@gmail.com"
                        />
                        
                        <Input
                            label="SMTP Password"
                            type="password"
                            value={emailSettingsForm.smtpPass}
                            onChange={(e) => setEmailSettingsForm({ ...emailSettingsForm, smtpPass: e.target.value })}
                            placeholder="Leave blank to keep current"
                        />
                        
                        <div className="border-t border-slate-200 pt-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">Sender Information</h3>
                            
                            <Input
                                label="From Name"
                                value={emailSettingsForm.fromName}
                                onChange={(e) => setEmailSettingsForm({ ...emailSettingsForm, fromName: e.target.value })}
                                placeholder="MENUPI"
                            />
                            
                            <Input
                                label="From Email"
                                type="email"
                                value={emailSettingsForm.fromEmail}
                                onChange={(e) => setEmailSettingsForm({ ...emailSettingsForm, fromEmail: e.target.value })}
                                placeholder="support@menupi.com"
                            />
                            
                            <Input
                                label="Reply-To Email"
                                type="email"
                                value={emailSettingsForm.replyTo}
                                onChange={(e) => setEmailSettingsForm({ ...emailSettingsForm, replyTo: e.target.value })}
                                placeholder="support@menupi.com"
                            />
                            
                            <Input
                                label="Support Email"
                                type="email"
                                value={emailSettingsForm.supportEmail}
                                onChange={(e) => setEmailSettingsForm({ ...emailSettingsForm, supportEmail: e.target.value })}
                                placeholder="support@menupi.com"
                            />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={async () => {
                                    try {
                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                        const res = await fetch(`${API_URL}/admin/email/settings`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify(emailSettingsForm)
                                        });
                                        if (res.ok) {
                                            setIsEmailSettingsModalOpen(false);
                                            loadEmailSettings();
                                            alert('SMTP settings updated successfully');
                                        } else {
                                            const err = await res.json();
                                            alert(err.error || 'Failed to update settings');
                                        }
                                    } catch (err: any) {
                                        alert(err.message || 'Failed to update settings');
                                    }
                                }}
                                className="flex-1"
                            >
                                Save Settings
                            </Button>
                            <Button
                                onClick={() => setIsEmailSettingsModalOpen(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Restaurant Delete Modal */}
            {isRestaurantDeleteModalOpen && selectedRestaurant && (
                <Modal
                    isOpen={isRestaurantDeleteModalOpen}
                    onClose={() => setIsRestaurantDeleteModalOpen(false)}
                    title="Delete Restaurant"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                                <strong>Warning:</strong> This will soft delete {selectedRestaurant.name} and all associated data. This action can be reversed.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={async () => {
                                    try {
                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                        const res = await fetch(`${API_URL}/admin/restaurants/${selectedRestaurant.restaurantId}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        });
                                        if (!res.ok) {
                                            const err = await res.json();
                                            showToast(err.error || 'Failed to delete restaurant', 'error');
                                            return;
                                        }
                                        setIsRestaurantDeleteModalOpen(false);
                                        loadAdminData(false);
                                        showToast('Restaurant deleted successfully', 'success');
                                    } catch (err: any) {
                                        showToast(err.message || 'Failed to delete restaurant', 'error');
                                    }
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Restaurant
                            </Button>
                            <Button
                                onClick={() => setIsRestaurantDeleteModalOpen(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
            
            {/* Delete User Confirmation Modal */}
            <ConfirmModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Global Disable Player Modal */}
            <ConfirmModal
                isOpen={isGlobalDisableModalOpen}
                onClose={() => setIsGlobalDisableModalOpen(false)}
                onConfirm={async () => {
                    setIsGlobalDisableModalOpen(false);
                    showToast('Global disable feature - Backend implementation needed', 'warning');
                }}
                title="⚠️ EMERGENCY ACTION"
                message="This will blank ALL screens immediately across all restaurants. Are you sure you want to disable all public players?"
                confirmText="Disable All Players"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Restaurant Playback Control Modal */}
            <ConfirmModal
                isOpen={isRestaurantPlaybackModalOpen}
                onClose={() => {
                    setIsRestaurantPlaybackModalOpen(false);
                    setRestaurantPlaybackAction(null);
                }}
                onConfirm={async () => {
                    if (!restaurantPlaybackAction) return;
                    try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                        const restaurantId = restaurantPlaybackAction.rest.restaurantId || restaurantPlaybackAction.rest.id;
                        await fetch(`${API_URL}/admin/restaurants/${restaurantId}/playback`, {
                            method: 'PUT',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({ enabled: restaurantPlaybackAction.enabled })
                        });
                        loadAdminData(false);
                        loadAllScreens();
                        showToast(`Public player ${restaurantPlaybackAction.enabled ? 'enabled' : 'disabled'} successfully`, 'success');
                    } catch (err) {
                        showToast('Failed to update restaurant playback status', 'error');
                    }
                    setIsRestaurantPlaybackModalOpen(false);
                    setRestaurantPlaybackAction(null);
                }}
                title={restaurantPlaybackAction?.enabled ? 'Enable Public Player' : 'Disable Public Player'}
                message={restaurantPlaybackAction?.enabled 
                    ? `Enable public player for "${restaurantPlaybackAction.rest.name}"?\n\nThis will:\n• Restore playback on all screens\n• Allow public access`
                    : `Disable public player for "${restaurantPlaybackAction?.rest.name}"?\n\nThis will:\n• Blank all screens\n• Stop all playback\n• Can be re-enabled anytime`}
                confirmText={restaurantPlaybackAction?.enabled ? 'Enable' : 'Disable'}
                cancelText="Cancel"
                variant={restaurantPlaybackAction?.enabled ? 'info' : 'danger'}
            />

            {/* Screen Disable Modal */}
            <ConfirmModal
                isOpen={isScreenDisableModalOpen}
                onClose={() => {
                    setIsScreenDisableModalOpen(false);
                    setScreenDisableAction(null);
                }}
                onConfirm={async () => {
                    if (!screenDisableAction) return;
                    try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                        await fetch(`${API_URL}/admin/screens/${screenDisableAction.screen.id}/disable`, {
                            method: 'PUT',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}` 
                            },
                            body: JSON.stringify({ disabled: screenDisableAction.disabled })
                        });
                        loadAllScreens();
                        showToast(`Screen ${screenDisableAction.disabled ? 'disabled' : 'enabled'} successfully`, 'success');
                    } catch (err) {
                        showToast('Failed to update screen status', 'error');
                    }
                    setIsScreenDisableModalOpen(false);
                    setScreenDisableAction(null);
                }}
                title={screenDisableAction?.disabled ? 'Disable Screen' : 'Enable Screen'}
                message={screenDisableAction?.disabled
                    ? `Disable screen "${screenDisableAction?.screen.name}"?\n\nThis will:\n• Stop playback immediately\n• Show disabled message\n• Can be re-enabled anytime`
                    : `Enable screen "${screenDisableAction?.screen.name}"?\n\nThis will restore playback on this screen.`}
                confirmText={screenDisableAction?.disabled ? 'Disable' : 'Enable'}
                cancelText="Cancel"
                variant={screenDisableAction?.disabled ? 'danger' : 'info'}
            />

            {/* Clear Storage Modal */}
            <ConfirmModal
                isOpen={isClearStorageModalOpen}
                onClose={() => {
                    setIsClearStorageModalOpen(false);
                    setSelectedRestaurant(null);
                }}
                onConfirm={async () => {
                    if (!selectedRestaurant) return;
                    try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                        await fetch(`${API_URL}/admin/restaurants/${selectedRestaurant.restaurantId || selectedRestaurant.id}/clear-storage`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        loadAdminData(false);
                        showToast('Storage cleared successfully', 'success');
                    } catch (err) {
                        showToast('Failed to clear storage', 'error');
                    }
                    setIsClearStorageModalOpen(false);
                    setSelectedRestaurant(null);
                }}
                title="Clear Storage"
                message={`Are you sure you want to clear all storage for "${selectedRestaurant?.name}"? This action will delete all media files and cannot be undone.`}
                confirmText="Clear Storage"
                cancelText="Cancel"
                variant="danger"
            />

            {/* Revoke Code Modal */}
            <ConfirmModal
                isOpen={isRevokeCodeModalOpen}
                onClose={() => {
                    setIsRevokeCodeModalOpen(false);
                    setRevokeScreenAction(null);
                }}
                onConfirm={async () => {
                    if (!revokeScreenAction) return;
                    try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                        const res = await fetch(`${API_URL}/admin/screens/${revokeScreenAction.id}/revoke`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            const data = await res.json();
                            showToast(`New code generated: ${data.newCode}`, 'success');
                            loadAllScreens();
                        } else {
                            showToast('Failed to revoke code', 'error');
                        }
                    } catch (err) {
                        showToast('Failed to revoke code', 'error');
                    }
                    setIsRevokeCodeModalOpen(false);
                    setRevokeScreenAction(null);
                }}
                title="Revoke Pairing Code"
                message={`Revoke pairing code for "${revokeScreenAction?.name}"? A new code will be generated automatically.`}
                confirmText="Revoke Code"
                cancelText="Cancel"
                variant="warning"
            />

            {/* Change My Password Modal */}
            {isChangeMyPasswordModalOpen && currentAdmin && (
                <Modal
                    isOpen={isChangeMyPasswordModalOpen}
                    onClose={() => {
                        setIsChangeMyPasswordModalOpen(false);
                        setChangeMyPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    title="Change My Password"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                                <strong>Security:</strong> You must enter your current password to change it. If you've forgotten your password, use the "Forgot Password" option below.
                            </p>
                        </div>
                        <Input
                            label="Current Password"
                            type="password"
                            value={changeMyPasswordData.oldPassword}
                            onChange={(e) => setChangeMyPasswordData({ ...changeMyPasswordData, oldPassword: e.target.value })}
                            required
                            placeholder="Enter your current password"
                        />
                        <Input
                            label="New Password"
                            type="password"
                            value={changeMyPasswordData.newPassword}
                            onChange={(e) => setChangeMyPasswordData({ ...changeMyPasswordData, newPassword: e.target.value })}
                            required
                            placeholder="Minimum 8 characters"
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={changeMyPasswordData.confirmPassword}
                            onChange={(e) => setChangeMyPasswordData({ ...changeMyPasswordData, confirmPassword: e.target.value })}
                            required
                            placeholder="Re-enter new password"
                        />
                        <div className="flex items-center justify-between pt-2">
                            <button
                                onClick={() => {
                                    setIsChangeMyPasswordModalOpen(false);
                                    setForgotPasswordEmail(currentAdmin.email || '');
                                    setIsForgotPasswordModalOpen(true);
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Forgot Password?
                            </button>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={async () => {
                                    if (!changeMyPasswordData.oldPassword || !changeMyPasswordData.newPassword || !changeMyPasswordData.confirmPassword) {
                                        showToast('Please fill in all fields', 'error');
                                        return;
                                    }
                                    if (changeMyPasswordData.newPassword !== changeMyPasswordData.confirmPassword) {
                                        showToast('New passwords do not match', 'error');
                                        return;
                                    }
                                    if (changeMyPasswordData.newPassword.length < 8) {
                                        showToast('Password must be at least 8 characters', 'error');
                                        return;
                                    }
                                    try {
                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                        const token = localStorage.getItem('menupi_user') ? JSON.parse(localStorage.getItem('menupi_user')!).token : '';
                                        const res = await fetch(`${API_URL}/admin/change-password`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                oldPassword: changeMyPasswordData.oldPassword,
                                                newPassword: changeMyPasswordData.newPassword
                                            })
                                        });
                                        if (!res.ok) {
                                            const err = await res.json();
                                            showToast(err.error || 'Failed to change password', 'error');
                                            return;
                                        }
                                        setIsChangeMyPasswordModalOpen(false);
                                        setChangeMyPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                        showToast('Password changed successfully', 'success');
                                    } catch (err: any) {
                                        showToast(err.message || 'Failed to change password', 'error');
                                    }
                                }}
                                className="flex-1"
                            >
                                <Key className="w-4 h-4 mr-2" />
                                Change Password
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsChangeMyPasswordModalOpen(false);
                                    setChangeMyPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
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

            {/* Forgot Password Modal */}
            {isForgotPasswordModalOpen && (
                <Modal
                    isOpen={isForgotPasswordModalOpen}
                    onClose={() => {
                        setIsForgotPasswordModalOpen(false);
                        setForgotPasswordEmail('');
                    }}
                    title="Forgot Password"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-700">
                                <strong>Reset Link:</strong> Enter your admin email address and we'll send you a password reset link.
                            </p>
                        </div>
                        <Input
                            label="Admin Email"
                            type="email"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            required
                            placeholder="admin@example.com"
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={async () => {
                                    if (!forgotPasswordEmail) {
                                        showToast('Please enter your email address', 'error');
                                        return;
                                    }
                                    setIsForgotPasswordLoading(true);
                                    try {
                                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                                        const res = await fetch(`${API_URL}/admin/forgot-password`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ email: forgotPasswordEmail })
                                        });
                                        if (!res.ok) {
                                            const err = await res.json();
                                            showToast(err.error || 'Failed to send reset email', 'error');
                                            return;
                                        }
                                        setIsForgotPasswordModalOpen(false);
                                        setForgotPasswordEmail('');
                                        showToast('Password reset email sent! Please check your inbox.', 'success');
                                    } catch (err: any) {
                                        showToast(err.message || 'Failed to send reset email', 'error');
                                    } finally {
                                        setIsForgotPasswordLoading(false);
                                    }
                                }}
                                className="flex-1"
                                disabled={isForgotPasswordLoading}
                            >
                                {isForgotPasswordLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Reset Link
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsForgotPasswordModalOpen(false);
                                    setForgotPasswordEmail('');
                                }}
                                variant="secondary"
                                className="flex-1"
                                disabled={isForgotPasswordLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminDashboard;
