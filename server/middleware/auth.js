const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

const requirePermission = (action, resource) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Define role permissions
        const permissions = {
            admin: {
                actions: ['create', 'read', 'update', 'delete', 'approve', 'reject'],
                resources: ['all']
            },
            finance_manager: {
                actions: ['create', 'read', 'update', 'approve', 'reject'],
                resources: ['budgets', 'revenue', 'expenses', 'funds', 'reports', 'requests']
            },
            accountant: {
                actions: ['create', 'read', 'update'],
                resources: ['revenue', 'expenses', 'payables', 'receivables']
            },
            auditor: {
                actions: ['read'],
                resources: ['all']
            }
        };

        const userPermissions = permissions[req.user.role];
        if (!userPermissions) {
            return res.status(403).json({ error: 'Invalid role' });
        }

        // Check if user has permission for this action and resource
        const hasAction = userPermissions.actions.includes(action) || userPermissions.actions.includes('all');
        const hasResource = userPermissions.resources.includes(resource) || userPermissions.resources.includes('all');

        if (!hasAction || !hasResource) {
            return res.status(403).json({ error: 'Insufficient permissions for this action' });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission
};