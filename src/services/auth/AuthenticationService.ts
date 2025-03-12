import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions, AuthUserRole } from '../../lib/auth';
import { ApiResponseService } from '../api/base/ApiResponseService';
import { ConfigurationService } from '../config/ConfigurationService';
import { LoggingService } from '../logging/LoggingService';

/**
 * User session data structure
 */
export interface UserSession {
    userId: string;
    email: string;
    name?: string;
    role: AuthUserRole;
    isAuthenticated: boolean;
}

/**
 * Authentication result
 */
type AuthResult = {
    success: boolean;
    session?: UserSession;
    response?: NextResponse;
};

/**
 * Centralized authentication service
 * Handles user authentication, authorization, and session management
 */
export class AuthenticationService {
    private static instance: AuthenticationService;
    private logger: LoggingService;
    private config: ConfigurationService;
    private apiResponse: ApiResponseService;

    private constructor() {
        this.logger = LoggingService.getInstance();
        this.config = ConfigurationService.getInstance();
        this.apiResponse = ApiResponseService.getInstance();
    }

    public static getInstance(): AuthenticationService {
        if (!AuthenticationService.instance) {
            AuthenticationService.instance = new AuthenticationService();
        }
        return AuthenticationService.instance;
    }

    /**
     * Get the current user session
     * @returns The user session or null if not authenticated
     */
    public async getSession(): Promise<UserSession | null> {
        try {
            const session = await getServerSession(authOptions);

            if (!session || !session.user) {
                return null;
            }

            // Ensure we have the required fields
            if (!session.user.id || !session.user.email) {
                this.logger.warn('Session user missing required fields', 'AuthenticationService');
                return null;
            }

            return {
                userId: session.user.id,
                email: session.user.email,
                name: session.user.name || undefined,
                // Convert role string to AuthUserRole enum
                role: (session.user.role as string === 'admin'
                    ? AuthUserRole.ADMIN
                    : session.user.role as string === 'editor'
                        ? AuthUserRole.EDITOR
                        : AuthUserRole.USER),
                isAuthenticated: true,
            };
        } catch (error) {
            this.logger.error('Error getting user session', 'AuthenticationService', error);
            return null;
        }
    }

    /**
     * Check if a request is authenticated
     * @param request The Next.js request
     * @returns Authentication result with session or error response
     */
    public async authenticateRequest(request: NextRequest): Promise<AuthResult> {
        try {
            const session = await this.getSession();

            if (!session) {
                return {
                    success: false,
                    response: this.apiResponse.unauthorized('Authentication required'),
                };
            }

            return {
                success: true,
                session,
            };
        } catch (error) {
            this.logger.error('Authentication failed', 'AuthenticationService', error);

            return {
                success: false,
                response: this.apiResponse.error('Authentication error', {
                    status: 500,
                    code: 'AUTH_ERROR'
                }),
            };
        }
    }

    /**
     * Check if a user has the required role
     * @param session The user session
     * @param requiredRole The required role
     * @returns Authorization result with session or error response
     */
    public authorizeRole(session: UserSession, requiredRole: AuthUserRole): AuthResult {
        // Get role hierarchy
        const roleHierarchy = this.getRoleHierarchy();

        // Check if user's role is sufficient
        if (
            !session.isAuthenticated ||
            !roleHierarchy[session.role] ||
            roleHierarchy[session.role] < roleHierarchy[requiredRole]
        ) {
            return {
                success: false,
                response: this.apiResponse.error('Insufficient permissions', {
                    status: 403,
                    code: 'FORBIDDEN'
                }),
            };
        }

        return {
            success: true,
            session,
        };
    }

    /**
     * Authenticate and authorize a request
     * @param request The Next.js request
     * @param requiredRole The required role (optional)
     * @returns Authentication result with session or error response
     */
    public async authenticateAndAuthorize(
        request: NextRequest,
        requiredRole?: AuthUserRole
    ): Promise<AuthResult> {
        // First authenticate
        const authResult = await this.authenticateRequest(request);

        // If authentication failed, return the result
        if (!authResult.success || !authResult.session) {
            return authResult;
        }

        // If no role required, return authenticated result
        if (!requiredRole) {
            return authResult;
        }

        // Check role authorization
        return this.authorizeRole(authResult.session, requiredRole);
    }

    /**
     * Get role hierarchy for authorization checks
     * Higher numbers have more permissions
     */
    private getRoleHierarchy(): Record<AuthUserRole, number> {
        return {
            [AuthUserRole.USER]: 1,
            [AuthUserRole.EDITOR]: 2,
            [AuthUserRole.ADMIN]: 3,
        };
    }
} 