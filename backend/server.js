const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Mock Database (In production, use MongoDB/PostgreSQL)
let users = [
    {
        id: 1,
        name: 'Alexander Johnson',
        email: 'alex@internhub.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        referralCode: 'ALEX2025',
        totalDonations: 2850,
        monthlyGoal: 2500,
        joinDate: '2024-12-01',
        isActive: true
    },
    {
        id: 2,
        name: 'Sarah Chen',
        email: 'sarah@internhub.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        referralCode: 'SARAH2025',
        totalDonations: 3240,
        monthlyGoal: 3000,
        joinDate: '2024-11-15',
        isActive: true
    },
    {
        id: 3,
        name: 'Michael Rodriguez',
        email: 'michael@internhub.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        referralCode: 'MIKE2025',
        totalDonations: 1890,
        monthlyGoal: 2000,
        joinDate: '2024-12-10',
        isActive: true
    },
    {
        id: 4,
        name: 'Emily Davis',
        email: 'emily@internhub.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        referralCode: 'EMILY2025',
        totalDonations: 4120,
        monthlyGoal: 4000,
        joinDate: '2024-10-20',
        isActive: true
    },
    {
        id: 5,
        name: 'David Thompson',
        email: 'david@internhub.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        referralCode: 'DAVID2025',
        totalDonations: 1560,
        monthlyGoal: 1500,
        joinDate: '2024-12-05',
        isActive: true
    }
];

const rewardTiers = [
    { id: 1, title: 'First Steps', icon: '🥉', threshold: 100, description: 'Complete your first donation' },
    { id: 2, title: 'Rising Star', icon: '⭐', threshold: 500, description: 'Reach $500 in donations' },
    { id: 3, title: 'Goal Crusher', icon: '🎯', threshold: 1000, description: 'Hit your first $1K milestone' },
    { id: 4, title: 'Silver Champion', icon: '🥈', threshold: 2500, description: 'Raise $2,500 for the cause' },
    { id: 5, title: 'Gold Legend', icon: '🥇', threshold: 5000, description: 'Achieve $5,000 in donations' },
    { id: 6, title: 'Diamond Elite', icon: '💎', threshold: 10000, description: 'Ultimate achievement: $10K+' }
];

// Utility Functions
const generateReferralCode = (name) => {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const namePrefix = cleanName.substring(0, Math.min(cleanName.length, 6));
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(Math.random() * 99) + 1;
    return `${namePrefix}${year}${randomSuffix}`;
};

const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'InternHub API is running',
        timestamp: new Date().toISOString()
    });
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'No account found with this email address.'
            });
        }

        // Verify password (simplified for demo - accepts any password 6+ chars)
        if (password.length < 6) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password. Please try again.'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Return user data (exclude password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long.'
            });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address.'
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        // Check if user exists
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            referralCode: generateReferralCode(name),
            totalDonations: Math.floor(Math.random() * 300) + 50,
            monthlyGoal: 1000,
            joinDate: new Date().toISOString().split('T')[0],
            isActive: true
        };

        users.push(newUser);

        // Generate token
        const token = generateToken(newUser.id);

        // Return user data (exclude password)
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            success: true,
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Dashboard Routes
app.get('/api/dashboard', verifyToken, (req, res) => {
    try {
        const user = users.find(u => u.id === req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Calculate progress percentage
        const progressPercent = Math.min(
            Math.round((user.totalDonations / user.monthlyGoal) * 100),
            100
        );

        // Calculate user rank
        const sortedUsers = [...users].sort((a, b) => b.totalDonations - a.totalDonations);
        const userRank = sortedUsers.findIndex(u => u.id === user.id) + 1;

        // Get unlocked rewards
        const unlockedRewards = rewardTiers.filter(
            reward => user.totalDonations >= reward.threshold
        );

        // Generate recent activity
        const recentActivity = [
            'Received donation from referral link',
            'Monthly goal progress updated',
            'New achievement unlocked',
            'Leaderboard position improved'
        ].slice(0, 3).map((activity, index) => ({
            id: index + 1,
            message: activity,
            timestamp: new Date(Date.now() - (index * 3600000)).toISOString(),
            type: 'success'
        }));

        // Return user data (exclude password)
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                progressPercent,
                userRank,
                totalUsers: users.length,
                unlockedRewards: unlockedRewards.length,
                nextReward: rewardTiers.find(
                    reward => user.totalDonations < reward.threshold
                ),
                recentActivity
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Leaderboard Route
app.get('/api/leaderboard', verifyToken, (req, res) => {
    try {
        const sortedUsers = [...users]
            .filter(user => user.isActive)
            .sort((a, b) => b.totalDonations - a.totalDonations)
            .map((user, index) => ({
                rank: index + 1,
                id: user.id,
                name: user.name,
                totalDonations: user.totalDonations,
                monthlyGoal: user.monthlyGoal,
                referralCode: user.referralCode,
                progressPercent: Math.min(
                    Math.round((user.totalDonations / user.monthlyGoal) * 100),
                    100
                ),
                isCurrentUser: user.id === req.userId
            }));

        res.json({
            success: true,
            data: sortedUsers
        });

    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Rewards Route
app.get('/api/rewards', verifyToken, (req, res) => {
    try {
        const user = users.find(u => u.id === req.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const rewardsWithStatus = rewardTiers.map(reward => ({
            ...reward,
            isUnlocked: user.totalDonations >= reward.threshold,
            progress: Math.min((user.totalDonations / reward.threshold) * 100, 100)
        }));

        res.json({
            success: true,
            data: rewardsWithStatus
        });

    } catch (error) {
        console.error('Rewards error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update donations (simulate donation increase)
app.post('/api/donations/update', verifyToken, (req, res) => {
    try {
        const userIndex = users.findIndex(u => u.id === req.userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Simulate random donation increase
        const increase = Math.floor(Math.random() * 100) + 25;
        users[userIndex].totalDonations += increase;

        res.json({
            success: true,
            data: {
                newAmount: users[userIndex].totalDonations,
                increase: increase
            }
        });

    } catch (error) {
        console.error('Update donations error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all users (admin route - for testing)
app.get('/api/users', (req, res) => {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json({
        success: true,
        data: usersWithoutPasswords
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 InternHub API Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`👥 Test users: http://localhost:${PORT}/api/users`);
    console.log('');
    console.log('Demo Accounts:');
    console.log('- alex@internhub.com (password: any 6+ chars)');
    console.log('- sarah@internhub.com (password: any 6+ chars)');
    console.log('- Or create a new account via signup!');
});

module.exports = app;